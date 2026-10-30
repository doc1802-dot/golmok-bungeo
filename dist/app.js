import { RECIPES, UPGRADES, newSave, validateSave, startDay, cookTime, tick, touchSlot, serve, finishDay, buyUpgrade, upgradeCost } from './engine.js'
const $ = id => document.getElementById(id)
const won = n => `${Math.round(n).toLocaleString('ko-KR')}원`
const KEY = 'golmok-bungeo-v1'
let save = newSave(), storageOK = true
try { save = validateSave(JSON.parse(localStorage.getItem(KEY))) } catch { storageOK = false }
let run = startDay(save), active = false, paused = false, flavor = 'bean', sound = false, audio, toastTimer, previous = performance.now(), modalMode = ''
const names = ['퇴근길 직장인', '동네 단골 학생', '산책 나온 이웃', '붕어빵 러버', '목도리 손님', '옆집 사장님']
const colors = [['#748f91','#534239','#db8c61'],['#b77b6d','#4d3a31','#e6c15d'],['#8e956b','#6d5140','#c07359'],['#b69a6f','#483b33','#7c9e98'],['#8197ac','#504d43','#c78576'],['#a68ca2','#7a6751','#d9ba7c']]
function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); storageOK = true } catch { storageOK = false; toast('브라우저 저장이 제한돼 이번 기록을 저장하지 못했어요.') } }
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2200) }
function beep(kind = 'tap') {
  if (!sound) return
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)()
    if (audio.state === 'suspended') audio.resume()
    const osc = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime
    osc.type = 'sine'; osc.frequency.setValueAtTime(({ pour: 250, flip: 460, collect: 640, serve: 880, burnt: 130, tap: 380 })[kind] || 380, now)
    osc.frequency.exponentialRampToValueAtTime(kind === 'serve' ? 1320 : 180, now + .16)
    gain.gain.setValueAtTime(.06, now); gain.gain.exponentialRampToValueAtTime(.001, now + .2)
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(now + .21)
  } catch {}
}
function pop(text, element) { const r = element.getBoundingClientRect(), el = document.createElement('div'); el.className = 'popup-number'; el.textContent = text; el.style.left = `${Math.min(window.innerWidth - 130, r.left + 20)}px`; el.style.top = `${r.top + 20}px`; document.body.append(el); setTimeout(() => el.remove(), 1300) }
const fish = '<svg aria-hidden="true"><use href="#fish"/></svg>'
$('griddle').innerHTML = run.slots.map((_, i) => `<button class="slot empty" data-slot="${i}" aria-label="${i + 1}번 틀, 반죽 넣기"><span class="slot-key">${i + 1}</span>${fish}<span class="flavor-dot" hidden></span><span class="slot-label">+ 반죽 넣기</span><span class="cook-meter"><i></i></span></button>`).join('')
function drawSlots() {
  run.slots.forEach((slot, i) => {
    const el = $('griddle').children[i], flip = slot.state === 'front' && slot.time >= cookTime(run)
    el.className = `slot ${slot.state} ${flip ? 'flip-ready' : ''}`
    const labels = { empty: '+ 반죽 넣기', front: flip ? '↻ 지금 뒤집기!' : '앞면 굽는 중', back: '뒷면 굽는 중', ready: '✓ 꺼내기!', burnt: '앗, 탔어요! 치우기' }
    el.querySelector('.slot-label').textContent = labels[slot.state]
    el.setAttribute('aria-label', `${i + 1}번 틀, ${slot.type && slot.state !== 'empty' ? RECIPES[slot.type].name + ', ' : ''}${labels[slot.state]}`)
    el.disabled = !active || paused || run.done
    const dot = el.querySelector('.flavor-dot'); dot.hidden = slot.state === 'empty'; dot.className = `flavor-dot ${slot.type || ''}`
    let ratio = 0
    if (slot.state === 'front' || slot.state === 'back') ratio = Math.min(1, slot.time / cookTime(run))
    if (slot.state === 'ready') ratio = Math.max(0, 1 - slot.time / 6)
    el.querySelector('.cook-meter i').style.width = `${ratio * 100}%`
  })
}
function drawCustomers() {
  const host = $('customers')
  if (!run.customers.length) { if (!host.querySelector('.empty-queue')) host.innerHTML = '<div class="empty-queue"><span>❄</span>곧 새로운 손님이 찾아와요.<br>미리 붕어빵을 구워둘까요?</div>'; return }
  host.querySelector('.empty-queue')?.remove()
  const ids = new Set(run.customers.map(c => String(c.id)))
  for (const el of [...host.children]) if (!ids.has(el.dataset.id)) el.remove()
  for (const c of run.customers) {
    let el = host.querySelector(`[data-id="${c.id}"]`)
    if (!el) {
      el = document.createElement('button'); el.dataset.id = c.id
      const [coat, hair, scarf] = colors[c.face]
      el.innerHTML = `<div class="avatar" aria-hidden="true" style="--coat:${coat};--hair:${hair};--scarf:${scarf}"><i class="body"></i><i class="head"></i><i class="hair"></i><i class="eyes"></i><i class="mouth"></i><i class="scarf"></i></div><div class="order"><div class="name">${names[c.face]}</div><div class="request">${RECIPES[c.type].name} <b>${c.count}개</b> 주세요!</div><div class="quote">“따뜻한 걸로 부탁해요.”</div></div><span class="serve-label"></span><span class="patience"><i></i></span>`
      host.append(el)
    }
    const can = run.tray[c.type] >= c.count
    el.className = `customer ${can ? 'can-serve' : ''} ${c.left < 10 ? 'urgent' : ''}`
    el.querySelector('.serve-label').textContent = can ? '건네주기 ↗' : '준비 중'
    el.querySelector('.patience i').style.width = `${100 * c.left / c.max}%`
    el.disabled = !active || paused || run.done
    el.setAttribute('aria-label', `${names[c.face]}, ${RECIPES[c.type].name} ${c.count}개, ${can ? '판매 가능' : '준비 중'}, 대기 ${Math.ceil(c.left)}초`)
  }
}
function drawShop() {
  $('wallet').textContent = won(save.money)
  $('upgrades').innerHTML = UPGRADES.map((u, i) => { const level = save.upgrades[u.key], max = level >= u.max, cost = upgradeCost(save, u); return `<div class="upgrade"><div class="upgrade-symbol">${['♨','✧','♡'][i]}</div><div class="upgrade-info"><b>${u.title}</b><small>LV.${level} / ${u.max}</small><p>${u.desc}</p></div><button data-upgrade="${u.key}" ${active || max || save.money < cost ? 'disabled' : ''} aria-label="${u.title} 업그레이드 ${won(cost)}">${max ? '최고 레벨' : active ? '영업 후 구매' : won(cost)}</button></div>` }).join('')
}
function render() {
  $('day').textContent = String(run.day).padStart(2, '0')
  $('revenue').innerHTML = `${run.revenue.toLocaleString('ko-KR')}<span>원</span>`
  $('target').textContent = won(run.target)
  $('goal-fill').style.width = `${Math.min(100, run.revenue / run.target * 100)}%`
  $('goal-text').textContent = run.revenue >= run.target ? '목표 달성! 조금만 더 팔아볼까요?' : `${won(Math.max(0, run.target - run.revenue))} 더 팔면 목표 달성!`
  const secs = Math.ceil(run.left)
  $('time').textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
  $('time').className = secs <= 15 ? 'time-urgent' : ''
  $('combo').innerHTML = `${run.combo} <span>콤보</span>`
  $('bean-count').textContent = run.tray.bean; $('cream-count').textContent = run.tray.cream
  $('tray-total').textContent = `보관함 ${run.tray.bean + run.tray.cream} / 12`
  $('queue-count').textContent = run.customers.length
  $('pause').disabled = !active
  drawSlots(); drawCustomers()
}
function openModal(mode, body) { modalMode = mode; $('modal-content').innerHTML = body; if (!$('modal').open) $('modal').showModal() }
function closeModal() { $('modal').close(); modalMode = '' }
const modalFish = '<svg class="modal-fish" aria-hidden="true"><use href="#fish"/></svg>'
function welcome(help = false) {
  if (active) paused = true
  openModal(help ? 'help' : 'welcome', `${modalFish}<div class="eyebrow">YOUR LITTLE WINTER SHOP</div><h2>${help ? '붕어빵 굽는 법' : '어서 와요, 사장님!'}</h2><p>바삭한 꼬리부터 달콤한 속까지.<br>작은 붕어빵 가게의 하루를 시작해 볼까요?</p><div class="steps"><div><b>01</b>재료 고르고<br>빈 틀 누르기</div><div><b>02</b>뒤집기 표시가 뜨면<br>한 번 더 누르기</div><div><b>03</b>다 구우면 꺼내고<br>손님에게 판매!</div></div><p>앞면·뒷면을 굽고 <strong>초록색일 때 꺼내세요.</strong><br>너무 오래 두면 타요. 손님의 대기 시간도 확인!</p><button class="primary" data-action="${help ? 'close-help' : 'start'}">${help ? '알겠어요!' : `DAY ${save.day} · 가게 문 열기`}</button><p class="modal-note">1~6 틀 선택 · Q/W 속 재료 · Space 일시정지<br>90초 한 판 · 무료 재료 · 영업 종료 시 자동 저장</p>`)
  render()
}
function begin() { run = startDay(save); active = true; paused = false; previous = performance.now(); closeModal(); drawShop(); render(); toast('첫 손님은 팥 2개! 빈 틀을 눌러 시작하세요.'); beep() }
function end() {
  active = false; paused = false; finishDay(save, run); persist(); drawShop()
  const success = run.revenue >= run.target
  openModal('end', `${modalFish}<div class="eyebrow">DAY ${run.day} · 영업 마감</div><h2>${success ? '오늘도 잘 구웠다!' : '내일은 더 잘될 거예요'}</h2><p>${success ? '목표 매출 달성! 골목에 소문이 나고 있어요.' : '목표에는 조금 모자랐지만, 번 돈은 모두 모았어요.'}</p><div class="results"><div>오늘 매출<b>${won(run.revenue)}</b></div><div>만난 손님<b>${run.served}명</b></div><div>최고 콤보<b>${run.bestCombo}콤보</b></div><div>가게 지갑<b>${won(save.money)}</b></div></div><p>놓친 손님 ${run.missed}명 · 태운 붕어빵 ${run.burned}개<br>최고 매출 ${won(save.best)}</p><button class="primary" data-action="shop">가게 업그레이드하기</button><button class="secondary" data-action="start">${success ? `DAY ${save.day} 영업 시작` : '같은 날 다시 도전'}</button><p class="modal-note">${storageOK ? '영업 기록을 이 브라우저에 저장했어요.' : '저장을 사용할 수 없어요. 창을 닫으면 기록이 사라질 수 있어요.'}</p>`)
}
function pauseGame() { if (!active || $('modal').open) return; paused = true; openModal('pause', `${modalFish}<h2>잠깐, 쉬어갈까요?</h2><p>불도, 손님의 시간도 잠시 멈췄어요.</p><button class="primary" data-action="resume">계속 굽기</button><button class="secondary" data-action="help">게임 방법</button>`); render() }
$('griddle').addEventListener('click', e => {
  const el = e.target.closest('[data-slot]'); if (!el || !active || paused) return
  const result = touchSlot(run, Number(el.dataset.slot), flavor)
  const messages = { early: '아직 덜 익었어요. 뒤집기 표시를 기다려주세요!', wait: '뒷면도 노릇하게 굽는 중이에요.', full: '보관함이 가득 찼어요. 손님에게 먼저 건네주세요!', clear: '괜찮아요! 새 반죽으로 다시 시작해요.' }
  if (messages[result]) toast(messages[result])
  if (result === 'collect') pop('+1', el)
  beep(result); render()
})
$('customers').addEventListener('click', e => {
  const el = e.target.closest('[data-id]'); if (!el || !active || paused) return
  const result = serve(run, Number(el.dataset.id))
  if (!result) { toast('주문한 종류와 수량만큼 먼저 구워주세요.'); return }
  pop(`+${won(result.earned)}`, el); beep('serve'); render()
})
function choose(type) { flavor = type; document.querySelectorAll('[data-recipe]').forEach(el => { const on = el.dataset.recipe === type; el.classList.toggle('selected', on); el.setAttribute('aria-pressed', on) }); beep() }
document.querySelectorAll('[data-recipe]').forEach(el => el.addEventListener('click', () => choose(el.dataset.recipe)))
$('upgrades').addEventListener('click', e => {
  const key = e.target.closest('[data-upgrade]')?.dataset.upgrade
  if (active || !key) return
  if (buyUpgrade(save, key)) { persist(); drawShop(); toast('업그레이드 완료! 다음 영업부터 적용돼요.'); beep('serve') }
})
$('modal-content').addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action
  if (action === 'start') begin()
  if (action === 'resume' || action === 'close-help') { closeModal(); if (active) { paused = false; previous = performance.now() } else if (!run.done) welcome(); render() }
  if (action === 'help') welcome(true)
  if (action === 'shop') { closeModal(); $('upgrades').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('tip').innerHTML = `<button class="primary" id="next-day">DAY ${save.day} · ${run.revenue >= run.target ? '다음 날' : '다시'} 영업 시작 →</button>`; $('next-day').onclick = () => { $('tip').innerHTML = '빨리 건네면 팁을 받을 수 있어요.<br>연속으로 주문을 맞추면 콤보 보너스!'; window.scrollTo({ top: 0, behavior: 'smooth' }); begin() } }
  if (action === 'reset-confirm') { save = newSave(); persist(); run = startDay(save); active = false; paused = false; drawShop(); render(); welcome() }
  if (action === 'reset-cancel') { closeModal(); if (active) { paused = false; previous = performance.now() } else if (!run.done) welcome() }
})
$('modal').addEventListener('cancel', e => { e.preventDefault(); if (modalMode === 'pause' || modalMode === 'help') { closeModal(); if (active) { paused = false; previous = performance.now() } else if (!run.done) welcome() } })
$('help').onclick = () => welcome(true)
$('pause').onclick = pauseGame
$('sound').onclick = () => { sound = !sound; $('sound').innerHTML = `♪<span class="sound-off">${sound ? 'ON' : 'OFF'}</span>`; $('sound').setAttribute('aria-label', sound ? '소리 끄기' : '소리 켜기'); beep() }
$('reset').onclick = () => { if (active) paused = true; openModal('reset', '<h2>새 가게를 시작할까요?</h2><p>모은 돈과 업그레이드, 영업 기록이 초기화돼요.<br>이 작업은 되돌릴 수 없어요.</p><button class="primary" data-action="reset-cancel">지금 가게 계속하기</button><button class="secondary" data-action="reset-confirm">기록 초기화하고 새로 시작</button>') }
document.addEventListener('keydown', e => {
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.code === 'Space' && active && !$('modal').open && e.target.tagName !== 'BUTTON') { e.preventDefault(); pauseGame(); return }
  if ($('modal').open) return
  if (/^[1-6]$/.test(e.key)) $('griddle').children[Number(e.key) - 1].click()
  if (e.key.toLowerCase() === 'q') choose('bean')
  if (e.key.toLowerCase() === 'w') choose('cream')
})
document.addEventListener('visibilitychange', () => { if (document.hidden && active && !paused) pauseGame() })
let lastPaint = 0
function frame(now) {
  const dt = (now - previous) / 1000; previous = now
  if (active && !paused) {
    const events = tick(run, dt)
    if (events.includes('burnt')) { toast('앗, 붕어빵이 탔어요! 눌러서 치워주세요.'); beep('burnt') }
    if (events.includes('missed')) toast('손님이 아쉬워하며 돌아갔어요. 다음 주문을 준비해요!')
    if (events.includes('end')) end()
    if (now - lastPaint > 90) { render(); lastPaint = now }
  }
  requestAnimationFrame(frame)
}
drawShop(); render(); welcome(); requestAnimationFrame(frame)
