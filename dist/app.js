import {RECIPES,UPGRADES,SUPPLIES,TYPES,newSave,validateSave,startDay,cookTime,windowTime,stageLimit,tick,touchSlot,serve,finishDay,buyUpgrade,upgradeCost,discardFish,unlockRecipe,buySupply,expand,expansionCost,capacity,itemQuality,canServe,available,useSupply,missionProgress} from './engine.js'
const $=id=>document.getElementById(id),won=n=>`${Math.round(n).toLocaleString('ko-KR')}원`
const KEY='golmok-bungeo-v2',OLD='golmok-bungeo-v1',districts=['골목 노점','학교 앞 맛집','역 앞 상점','시장 명물','도심 플래그십','전국구 붕어빵']
let save=newSave(),storageOK=true
try{save=validateSave(JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(OLD)))}catch{storageOK=false}
let run=startDay(save),active=false,paused=false,flavor='bean',heat=1,tool='press',tab='equipment',mode='',previous=performance.now(),lastPaint=0,sound=false,audio,toastTimer
try{sound=localStorage.getItem('bungeo-sound')==='on'}catch{}
const fish='<svg aria-hidden="true"><use href="#fish"/></svg>'
const missionLabel=r=>({served:'손님 응대',perfect:'퍼펙트 뒤집기',combo:'최고 콤보'}[r.mission.kind])
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));storageOK=true}catch{storageOK=false;toast('저장 공간을 사용할 수 없어요. 이 창을 닫으면 기록이 사라질 수 있어요.')}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600)}
function beep(kind){if(!sound)return;try{audio ||= new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=({perfect:880,serve:1040,burnt:120,collect:650})[kind]||380;g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.2)}catch{}}
function soundLabel(){$('sound').textContent=sound?'♫':'♪';$('sound').setAttribute('aria-label',sound?'소리 끄기':'소리 켜기');$('sound').setAttribute('aria-pressed',String(sound))}
function modal(kind,title,body){mode=kind;$('modal-content').innerHTML=`<div class="eyebrow">골목 붕어빵 · 사장님의 손맛</div><h2 id="dialog-title">${title}</h2>${body}`;if(!$('modal').open)$('modal').showModal()}
function close(){mode='';$('modal').close()}
function resume(){close();paused=false;previous=performance.now();render()}
function guide(welcome=false){if(active)paused=true;modal(welcome?'welcome':'help',welcome?'손맛으로 키우는 골목 가게':'사장님의 조리 노트',`
 <p>120초 동안 굽고, 응대하고, 번 돈으로 나만의 가게를 키워요.</p>
 <div class="guide-steps"><div><b>01 · 화력과 타이밍</b><p>메뉴의 추천 화력을 고르고 빈 틀을 누르세요. 초록 표시에서 뒤집으면 퍼펙트! 강불은 빠르지만 타이밍도 빨라져요. 화력은 새 반죽에 적용돼요.</p></div><div><b>02 · 충전과 마감</b><p>치즈·인절미·피자는 뒤집은 직후 다시 눌러 속을 채워요. 마지막에는 레시피에 맞는 압착·토치·콩가루 도구를 고르고 틀을 누르세요.</p></div><div><b>03 · 별과 신선도</b><p>추천 화력 + 퍼펙트 뒤집기 + 빠른 충전·마감·수거 = ★★★. 미식가는 별 3개만 받아요. 오래 보관하면 별이 하나 줄어요.</p></div><div><b>04 · 운영 전략</b><p>재료비는 반죽을 넣을 때 발생해요. 차로 손님을 기다리게 하거나 코팅으로 품질을 회복할 수 있어요. 매출 목표·일일 미션·업적을 달성하면 추가 보상!</p></div></div>
 <p>1~8 화구 · Q/W 메뉴 순환 · Space 일시정지<br>장비와 새 메뉴는 영업 후 관리 탭에서 구매하세요.<br>첫날은 이웃·학생, 2일차 직장인·가족, 3일차 미식가·단골이 찾아와요.</p>
 <button class="primary" data-action="${welcome?'start':'resume'}">${welcome?'첫 주문은 팥 2개 · 영업 시작':'알겠어요'}</button>${welcome?'<button class="secondary" data-action="shop">먼저 가게 둘러보기</button>':''}<p class="modal-note">기존 기록 자동 이전 · 새 게임 준비금 5,000원<br>영업 중 새로고침하면 해당 영업은 저장되지 않아요.</p>`);render()}
function buildBoard(){
 document.querySelector('.tool-picker').hidden=!run.unlocked.some(k=>RECIPES[k].finish)
 $('griddle').classList.toggle('expanded',run.slots.length>6)
 $('griddle').innerHTML=run.slots.map((_,i)=>`<button class="slot empty" data-slot="${i}"><span class="slot-key">${i+1}</span>${fish}<span class="slot-detail"></span><span class="slot-label"></span><span class="cook-meter"><i></i></span></button>`).join('')
 $('recipes').innerHTML=run.unlocked.map(k=>`<button data-recipe="${k}" style="--flavor:${RECIPES[k].color}"><span class="recipe-dot"></span>${RECIPES[k].short}<small>${RECIPES[k].cost?won(RECIPES[k].cost):'재료 무료'}</small></button>`).join('')
 $('inventory').innerHTML=run.unlocked.map(k=>`<div class="stock"><span>${RECIPES[k].short}</span><b id="count-${k}">0</b><small id="stars-${k}"></small><button data-discard="${k}" aria-label="${RECIPES[k].short} 한 개 비우기">−1</button></div>`).join('')
 $('supplies-use').innerHTML=['tea','rush','glaze'].map(k=>`<button data-use="${k}" title="${SUPPLIES[k].desc}">${SUPPLIES[k].name} <b></b><small>${SUPPLIES[k].desc}</small></button>`).join('')
 $('customers').replaceChildren();selection()
}
function selection(){
 document.querySelectorAll('[data-recipe]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.recipe===flavor)))
 document.querySelectorAll('[data-heat]').forEach(e=>e.setAttribute('aria-pressed',String(+e.dataset.heat===heat)))
 document.querySelectorAll('[data-tool]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.tool===tool)))
 const r=RECIPES[flavor];$('recipe-tip').textContent=`${r.name} · 기본 ${won(r.price)} · ${r.desc} · 추천 ${['약불','중불','강불'][r.heat]}`
}
function slotLabel(s){
 if(s.state==='front'){if(s.time<cookTime(run,s))return `앞면 ${Math.max(0,cookTime(run,s)-s.time).toFixed(1)}초`;return s.time<=cookTime(run,s)+windowTime(run)?'↻ PERFECT 뒤집기!':'↻ 지금 뒤집기'}
 if(s.state==='back')return `뒷면 ${Math.max(0,cookTime(run,s)-s.time).toFixed(1)}초`
 return ({empty:'+ 반죽 넣기',fill:'＋ 지금 속 채우기!',finish:`${{press:'▥ 압착',torch:'♨ 토치',dust:'✧ 콩가루'}[RECIPES[s.type]?.finish]} 마감!`,ready:'✓ 꺼내기!',burnt:'탄 붕어빵 치우기'})[s.state]
}
function render(){
 $('day').textContent=active?run.day:save.day;$('district').textContent=districts[save.district];$('reputation').textContent=`평판 ${save.rep} · 누적 ${save.totalServed}명`
 $('revenue').textContent=won(run.revenue);$('cost').textContent=`재료비 ${won(run.cost)} · 가용 ${won(run.budget+run.revenue-run.cost)}`
 $('target').textContent=won(run.target);$('goal-fill').style.width=`${Math.min(100,100*run.revenue/run.target)}%`;$('goal-text').textContent=run.revenue>=run.target?'보너스 확보!':'달성 보상 '+won(2000+run.district*500)
 const sec=Math.ceil(run.left);$('time').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('time').classList.toggle('time-urgent',sec<=20)
 $('combo').textContent=`${run.combo} 콤보`;$('perfect').textContent=`퍼펙트 ${run.perfect}회`;$('pause').disabled=!active
 $('weather').textContent=`${run.weather.name} · ${run.weather.desc}`;$('mission').textContent=`오늘의 미션 · ${missionLabel(run)} ${missionProgress(run)}/${run.mission.goal} · 보상 ${won(3500+500*run.district)}`
 $('start-shift').hidden=active;$('next-shift').hidden=active;$('opening-note').hidden=active;$('start-shift').textContent=`DAY ${save.day} · 영업 시작 →`;$('next-shift').textContent=`DAY ${save.day} · 다음 영업 시작 →`
 run.slots.forEach((s,i)=>{const el=$('griddle').children[i],label=slotLabel(s),flip=s.state==='front'&&s.time>=cookTime(run,s);el.className=`slot ${s.state} ${flip?'flip-ready':''}`;el.disabled=!active||paused;el.querySelector('.slot-label').textContent=label;el.querySelector('.slot-detail').textContent=s.state==='empty'?'':`${RECIPES[s.type].short} · ${['약','중','강'][s.heat]}불 · ${'★'.repeat(Math.max(1,s.quality))}`;el.setAttribute('aria-label',`${i+1}번 틀 ${s.state==='empty'?'':RECIPES[s.type].short} ${label}`);el.querySelector('svg').style.color=s.state==='empty'?'':RECIPES[s.type].color;const limit=['front','back'].includes(s.state)?cookTime(run,s):stageLimit(run,s);el.querySelector('.cook-meter i').style.width=`${s.state==='empty'?0:Math.min(100,s.time/limit*100)}%`;if(el.dataset.state!==s.state||(flip&&el.dataset.flip!=='true')){if(active&&['fill','finish','ready'].includes(s.state)||active&&flip)$('cook-announcement').textContent=`${i+1}번 틀 ${label}`;el.dataset.state=s.state;el.dataset.flip=String(flip)}})
 const host=$('customers');host.querySelector('.empty-queue')?.remove();const ids=new Set(run.customers.map(c=>String(c.id)));for(const el of [...host.children])if(!ids.has(el.dataset.id))el.remove()
 for(const c of run.customers){let el=host.querySelector(`[data-id="${c.id}"]`);const t=TYPES[c.kind]
  if(!el){el=document.createElement('button');el.dataset.id=c.id;el.innerHTML=`<span class="customer-icon" aria-hidden="true">${t.icon}</span><div class="order"><div class="name">${t.name} <span class="remaining"></span></div><div class="request"></div><div class="quote">${t.desc}</div></div><span class="serve-label"></span><span class="patience"><i></i></span>`;host.append(el)}
  const ready=canServe(run,c);el.className=`customer ${ready?'can-serve':''} ${c.left<10?'urgent':''}`;el.disabled=!active||paused;el.querySelector('.remaining').textContent=`${Math.ceil(c.left)}초`;el.querySelector('.request').textContent=c.orders.map(o=>`${RECIPES[o.type].short} ${Math.min(available(run,c,o),o.count)}/${o.count}개`).join(' + ');el.querySelector('.serve-label').textContent=ready?'판매 ↗':c.min===3?'★★★ 필요':'준비 중';el.querySelector('.patience i').style.width=`${Math.min(100,c.left/c.max*100)}%`;el.setAttribute('aria-label',`${t.name}, ${el.querySelector('.request').textContent}, ${Math.ceil(c.left)}초, ${ready?'판매 가능':c.min===3?'별 3개 품질 필요':'준비 중'}`)
 }
 if(!run.customers.length)host.innerHTML='<div class="empty-queue">새 손님을 기다리는 중<br>미리 구워두되 신선도를 챙겨주세요.</div>'
 $('queue-count').textContent=run.customers.length;$('tray-total').textContent=`${Object.values(run.tray).reduce((n,a)=>n+a.length,0)}/${capacity(run)}`
 for(const k of run.unlocked){const a=run.tray[k];$('count-'+k).textContent=a.length;$('stars-'+k).textContent=`★★★ ${a.filter(i=>itemQuality(run,i)===3).length}개`;document.querySelector(`[data-discard="${k}"]`).disabled=!active||paused||!a.length}
 for(const e of document.querySelectorAll('[data-use]')){const k=e.dataset.use;e.querySelector('b').textContent=`×${run.supplies[k]}`;e.disabled=!active||paused||!run.supplies[k]}
 $('rush-status').textContent=run.rush>0?`전단지 효과 ${Math.ceil(run.rush)}초 · 손님 유입 2배`:run.insured?'안심 영업권 적용 · 재료비 50% 환급':''
}
function shop(){
 $('wallet').textContent=won(save.money);document.querySelectorAll('[data-tab]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.tab===tab)))
 const button=(action,key,label,disabled)=>`<button data-buy="${action}" data-key="${key}" ${active||disabled?'disabled':''}>${active?'영업 후 구매':label}</button>`
 if(tab==='equipment')$('shop-content').innerHTML=UPGRADES.map((u,i)=>{const lvl=save.upgrades[u.key],max=lvl>=u.max,cost=upgradeCost(save,u);return `<article class="shop-card"><span class="card-number">EQUIPMENT ${String(i+1).padStart(2,'0')}</span><h3>${u.title} <small>Lv.${lvl}/${u.max}</small></h3><p>${u.desc}</p><div class="levels">${'●'.repeat(lvl)}${'○'.repeat(u.max-lvl)}</div>${button('upgrade',u.key,max?'최고 레벨':won(cost),max||save.money<cost)}</article>`}).join('')
 if(tab==='research')$('shop-content').innerHTML=Object.entries(RECIPES).map(([k,r])=>`<article class="shop-card"><span class="recipe-art" style="color:${r.color}">${fish}</span><h3>${r.name}</h3><p>${r.desc}</p><p>기본 판매 ${won(r.price)} · 재료 ${won(r.cost)}<br>연구 조건: 평판 ${r.rep} (현재 ${save.rep})</p>${button('recipe',k,save.unlocked.includes(k)?'연구 완료':won(r.unlock),save.unlocked.includes(k)||save.money<r.unlock||save.rep<r.rep)}</article>`).join('')
 if(tab==='supplies')$('shop-content').innerHTML=Object.entries(SUPPLIES).map(([k,u])=>`<article class="shop-card"><span class="card-number">보유 ${save.supplies[k]}개</span><h3>${u.name}</h3><p>${u.desc}</p><p>영업 중 오른쪽 비장의 수에서 사용<br>${k==='insurance'?'영업 시작 시 1개 자동 사용':'한 번 사용하면 1개 소모'}</p>${button('supply',k,won(u.cost),save.money<u.cost||save.supplies[k]>=99)}</article>`).join('')
 if(tab==='district')$('shop-content').innerHTML=`<article class="shop-card district-card"><span class="card-number">DISTRICT ${save.district+1} / 6</span><h3>${districts[save.district]} → ${districts[Math.min(5,save.district+1)]}</h3><p>상권마다 판매가 +8% · 방문 간격 단축 · 목표와 미션 보상 증가.<br>장비와 연구는 그대로 유지해요. 영업 날씨는 4일 주기로 변해요.</p><p>확장 조건: 평판 ${(save.district+1)*20} (현재 ${save.rep})</p>${button('expand','',save.district===5?'최종 상권 도달':won(expansionCost(save)),save.district===5||save.rep<(save.district+1)*20||save.money<expansionCost(save))}</article><article class="shop-card"><span class="card-number">MILESTONES</span><h3>골목 영업일지</h3>${[['first','누적 손님 10명','4,000원'],['chef','한 판 퍼펙트 12회','6,000원'],['crowd','한 판 손님 18명','8,000원'],['empire','상권 3회 확장','15,000원']].map(([k,n,reward])=>`<p>${save.achievements.includes(k)?'✓':'○'} ${n} · ${reward}</p>`).join('')}<small>업적 보상은 영업 종료 시 한 번 지급돼요.</small></article>`
}
function begin(){if(active)return;run=startDay(save);active=true;paused=false;flavor='bean';heat=1;close();buildBoard();shop();render();document.body.classList.add('playing');previous=performance.now();window.scrollTo({top:0,behavior:'instant'});toast('첫 주문은 팥 2개! 중불로 반죽을 넣어보세요.')}
function end(){active=false;paused=false;finishDay(save,run);persist();document.body.classList.remove('playing');shop();render();modal('end','오늘의 영업일지',`<p>${run.revenue>=run.target?'매출 목표 달성!':'목표는 다음에! 수익과 평판으로 한 걸음 성장했어요.'}</p><div class="results"><div>매출<b>${won(run.revenue)}</b></div><div>재료비<b>−${won(run.cost)}</b></div><div>미션 + 목표 보상<b>${won(run.missionReward+run.goalReward)}</b></div><div>보험 환급<b>${won(run.refund)}</b></div></div><p>손님 ${run.served}명 · 놓친 손님 ${run.missed}명 · 태운 빵 ${run.burned}개<br>최고 콤보 ${run.bestCombo} · 퍼펙트 ${run.perfect}회 · 평판 ${run.rep>=0?'+':''}${run.rep}</p>${run.achievements.map(a=>`<p class="achievement">🏆 ${a.name} +${won(a.reward)}</p>`).join('')}<p><strong>가게 지갑 ${won(save.money)}</strong></p><button class="primary" data-action="shop">투자하고 다음 영업 준비</button><button class="secondary" data-action="start">DAY ${save.day} 바로 시작</button><p class="modal-note">${storageOK?'영업 기록을 저장했어요.':'저장 실패 · 창을 닫으면 기록이 사라질 수 있어요.'}</p>`)}
function pause(){if(!active||$('modal').open)return;paused=true;modal('pause','잠깐 쉬어갈까요?',`<p>화구와 손님의 시간이 모두 멈췄어요.</p><button class="primary" data-action="resume">계속 굽기</button><button class="secondary" data-action="help">조리 노트 보기</button>`);render()}
$('griddle').onclick=e=>{const el=e.target.closest('[data-slot]');if(!el||!active||paused)return;const result=touchSlot(run,+el.dataset.slot,flavor,heat,tool);const messages={early:'아직 덜 익었어요. 초록색 뒤집기 표시를 기다려주세요.',wait:'뒷면을 굽고 있어요.',money:'재료비가 부족해요. 무료 팥으로 자금을 마련하세요.',full:'보관함이 가득 찼어요. 판매하거나 −1로 비워주세요.',tool:'맞는 마감 도구를 먼저 선택하세요!',perfect:'PERFECT! 정확한 뒤집기 +1',fill:'속을 채웠어요! 이제 뒷면을 구워요.',press:'바삭하게 압착 완료! 바로 꺼내주세요.',torch:'토치 마감 완료! 바로 꺼내주세요.',dust:'고소한 콩가루 마감! 바로 꺼내주세요.'};if(messages[result])toast(messages[result]);beep(result);render()}
$('recipes').onclick=e=>{const k=e.target.closest('[data-recipe]')?.dataset.recipe;if(k){flavor=k;selection()}}
document.querySelectorAll('[data-heat]').forEach(e=>e.onclick=()=>{heat=+e.dataset.heat;selection()})
document.querySelectorAll('[data-tool]').forEach(e=>e.onclick=()=>{tool=e.dataset.tool;selection()})
$('customers').onclick=e=>{const el=e.target.closest('[data-id]');if(!el||!active||paused)return;const result=serve(run,+el.dataset.id);if(result){toast(`판매 +${won(result.earned)} · ${result.stars.toFixed(1)}★ · ${run.combo}콤보`);beep('serve')}else toast('주문의 맛·수량·품질을 확인하세요. 미식가는 ★★★만 받아요.');render()}
$('inventory').onclick=e=>{const k=e.target.closest('[data-discard]')?.dataset.discard;if(k&&active&&!paused){discardFish(run,k);render()}}
$('supplies-use').onclick=e=>{const k=e.target.closest('[data-use]')?.dataset.use;if(k&&active&&!paused&&useSupply(run,k)){toast(SUPPLIES[k].desc);render()}}
document.querySelectorAll('[data-tab]').forEach(e=>e.onclick=()=>{tab=e.dataset.tab;shop()})
$('shop-content').onclick=e=>{const el=e.target.closest('[data-buy]');if(!el||active)return;const actions={upgrade:buyUpgrade,recipe:unlockRecipe,supply:buySupply,expand};if(actions[el.dataset.buy]?.(save,el.dataset.key)){persist();toast('구매 완료! 다음 영업에 적용돼요.');run=startDay(save);buildBoard();shop();render()}}
$('start-shift').onclick=begin;$('next-shift').onclick=begin;$('pause').onclick=pause;$('help').onclick=()=>guide()
$('sound').onclick=()=>{sound=!sound;try{localStorage.setItem('bungeo-sound',sound?'on':'off')}catch{}soundLabel();beep('perfect')}
$('reset').onclick=()=>{if(active)paused=true;modal('reset','새 가게를 시작할까요?','<p>돈, 장비, 레시피, 평판과 영업 기록이 초기화돼요.</p><button class="primary" data-action="resume">지금 가게 계속하기</button><button class="secondary" data-action="reset">기록 초기화</button>');render()}
$('modal-content').onclick=e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='start')begin();if(action==='resume')resume();if(action==='help')guide();if(action==='shop'){close();$('shop').scrollIntoView({behavior:'smooth'});$('shop-content').querySelector('button:not(:disabled)')?.focus({preventScroll:true})}if(action==='reset'){save=newSave();persist();active=false;paused=false;run=startDay(save);document.body.classList.remove('playing');buildBoard();shop();render();guide(true)}}
$('modal').addEventListener('cancel',e=>{e.preventDefault();resume()})
$('modal').addEventListener('close',()=>{if($('modal').open)return;mode='';if(active&&paused){paused=false;previous=performance.now()}render()})
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.code==='Space'&&active){if(!$('modal').open){e.preventDefault();pause()}else if(mode==='pause'){e.preventDefault();resume()}return}if($('modal').open)return;if(/^[1-8]$/.test(e.key))$('griddle').children[+e.key-1]?.click();if(['q','w'].includes(e.key.toLowerCase())){const n=run.unlocked.length;flavor=run.unlocked[(run.unlocked.indexOf(flavor)+(e.key.toLowerCase()==='w'?1:n-1))%n];selection()}})
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!paused)pause()})
function frame(now){const dt=Math.max(0,(now-previous)/1000);previous=now;if(active&&!paused){const events=tick(run,dt);if(events.includes('burnt')){toast('붕어빵이 탔어요. 틀을 눌러 치워주세요.');beep('burnt')}if(events.includes('end'))end();if(now-lastPaint>90){render();lastPaint=now}}requestAnimationFrame(frame)}
buildBoard();shop();render();soundLabel();guide(true);requestAnimationFrame(frame)
