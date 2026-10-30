export const RECIPES = { bean: { name: '팥', price: 1000, color: '#a94d4c' }, cream: { name: '슈크림', price: 1300, color: '#edbd55' } }
export const UPGRADES = [
  { key: 'heat', title: '불맛 장인', desc: '굽는 시간 12% 단축', base: 6000, max: 3 },
  { key: 'recipe', title: '비밀 레시피', desc: '판매 가격 20% 상승', base: 8000, max: 3 },
  { key: 'charm', title: '따뜻한 손난로', desc: '손님 대기 시간 6초 증가', base: 5000, max: 3 },
]
export function newSave() { return { version: 1, day: 1, money: 0, best: 0, totalServed: 0, upgrades: { heat: 0, recipe: 0, charm: 0 } } }
export function validateSave(s) {
  const fresh = newSave()
  if (!s || s.version !== 1) return fresh
  for (const k of ['day', 'money', 'best', 'totalServed']) if (Number.isSafeInteger(s[k]) && s[k] >= (k === 'day' ? 1 : 0)) fresh[k] = Math.min(s[k], 1e9)
  for (const u of UPGRADES) if (Number.isInteger(s.upgrades?.[u.key])) fresh.upgrades[u.key] = Math.max(0, Math.min(u.max, s.upgrades[u.key]))
  return fresh
}
export function upgradeCost(save, u) { return u.base * (save.upgrades[u.key] + 1) }
export function buyUpgrade(save, key) {
  const u = UPGRADES.find(u => u.key === key)
  if (!u || save.upgrades[key] >= u.max || save.money < upgradeCost(save, u)) return false
  save.money -= upgradeCost(save, u); save.upgrades[key]++; return true
}
export function startDay(save, random = Math.random) {
  const run = { day: save.day, left: 90, target: 10000 + (save.day - 1) * 3000, revenue: 0, served: 0, missed: 0, burned: 0, combo: 0, bestCombo: 0, slots: Array.from({ length: 6 }, () => ({ state: 'empty' })), tray: { bean: 0, cream: 0 }, customers: [], spawn: 5, nextId: 0, done: false, upgrades: { ...save.upgrades }, random }
  addCustomer(run, true)
  return run
}
export function cookTime(run) { return 3.4 * (1 - run.upgrades.heat * .12) }
function addCustomer(run, first = false) {
  const type = first ? 'bean' : run.random() < .55 ? 'bean' : 'cream'
  const count = first ? 2 : 1 + Math.floor(run.random() * Math.min(3, 2 + Math.floor(run.day / 3)))
  const patience = 30 + run.upgrades.charm * 6
  run.customers.push({ id: run.nextId++, type, count, left: patience, max: patience, face: Math.floor(run.random() * 6) })
}
export function tick(run, dt) {
  if (run.done) return []
  dt = Math.max(0, Math.min(dt, .5, run.left))
  const events = []
  run.left -= dt
  for (const slot of run.slots) {
    if (!['front', 'back', 'ready'].includes(slot.state)) continue
    slot.time += dt
    if (slot.state === 'back' && slot.time >= cookTime(run)) { slot.state = 'ready'; slot.time = 0; events.push('ready') }
    else if ((slot.state === 'front' && slot.time >= cookTime(run) + 6) || (slot.state === 'ready' && slot.time >= 6)) {
      slot.state = 'burnt'; run.burned++; run.combo = 0; events.push('burnt')
    }
  }
  for (const c of run.customers) c.left -= dt
  const expired = run.customers.filter(c => c.left <= 0).length
  if (expired) { run.missed += expired; run.combo = 0; events.push('missed'); run.customers = run.customers.filter(c => c.left > 0) }
  run.spawn -= dt
  if (run.spawn <= 0 && run.customers.length < 4 && run.left > 8) { addCustomer(run); run.spawn = Math.max(5, 10 - run.day * .4); events.push('customer') }
  if (run.left <= 0) { run.done = true; events.push('end') }
  return events
}
export function touchSlot(run, index, type) {
  if (run.done || !RECIPES[type]) return 'blocked'
  const slot = run.slots[index]
  if (!slot) return 'blocked'
  if (slot.state === 'empty') { Object.assign(slot, { state: 'front', type, time: 0 }); return 'pour' }
  if (slot.state === 'front') {
    if (slot.time < cookTime(run)) return 'early'
    slot.state = 'back'; slot.time = 0; return 'flip'
  }
  if (slot.state === 'ready') {
    if (run.tray.bean + run.tray.cream >= 12) return 'full'
    run.tray[slot.type]++; slot.state = 'empty'; return 'collect'
  }
  if (slot.state === 'burnt') { slot.state = 'empty'; return 'clear' }
  return 'wait'
}
export function serve(run, id) {
  if (run.done) return null
  const c = run.customers.find(c => c.id === id)
  if (!c || run.tray[c.type] < c.count) return null
  run.tray[c.type] -= c.count
  run.combo++; run.bestCombo = Math.max(run.bestCombo, run.combo)
  const tip = c.left / c.max > .5 ? 200 : 0
  const bonus = Math.min(500, (run.combo - 1) * 100)
  const earned = Math.round(RECIPES[c.type].price * (1 + run.upgrades.recipe * .2)) * c.count + tip + bonus
  run.revenue += earned; run.served++; run.customers = run.customers.filter(x => x.id !== id)
  return { earned, tip, bonus }
}
export function finishDay(save, run) {
  if (!run.done || run.settled) return false
  run.settled = true; save.money += run.revenue; save.totalServed += run.served; save.best = Math.max(save.best, run.revenue)
  if (run.revenue >= run.target) save.day++
  return true
}
