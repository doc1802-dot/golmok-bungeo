import test from 'node:test'
import assert from 'node:assert/strict'
import { newSave, validateSave, startDay, touchSlot, tick, serve, finishDay, buyUpgrade, cookTime } from './dist/engine.js'
const advance = (r, seconds) => { for (let s = 0; s < seconds; s += .1) tick(r, .1) }
test('batter, flip, collect, and fulfill a two-fish order', () => {
  const r = startDay(newSave(), () => .1)
  assert.equal(touchSlot(r, 0, 'bean'), 'pour'); touchSlot(r, 1, 'bean')
  assert.equal(touchSlot(r, 0, 'bean'), 'early')
  advance(r, cookTime(r) + .1)
  assert.equal(touchSlot(r, 0, 'bean'), 'flip'); touchSlot(r, 1, 'bean')
  advance(r, cookTime(r) + .1)
  assert.equal(touchSlot(r, 0, 'bean'), 'collect'); touchSlot(r, 1, 'bean')
  assert.equal(r.tray.bean, 2)
  assert.equal(serve(r, 0).earned, 2200)
  assert.equal(r.tray.bean, 0); assert.equal(r.served, 1)
})
test('overcooking burns, clearing resets, no money for unfulfilled orders', () => {
  const r = startDay(newSave()); touchSlot(r, 0, 'cream'); advance(r, 10)
  assert.equal(r.slots[0].state, 'burnt'); assert.equal(r.burned, 1)
  assert.equal(touchSlot(r, 0, 'bean'), 'clear'); assert.equal(r.slots[0].state, 'empty')
  assert.equal(serve(r, 0), null); assert.equal(r.revenue, 0)
})
test('tray capacity and wrong flavor cannot fulfill orders', () => {
  const r = startDay(newSave()); r.tray.cream = 12
  r.slots[0] = { state: 'ready', type: 'bean', time: 0 }
  assert.equal(touchSlot(r, 0, 'bean'), 'full'); assert.equal(serve(r, 0), null)
})
test('settlement happens once, successful day advances, upgrades spend correctly', () => {
  const s = newSave(), r = startDay(s); r.revenue = 10000; r.done = true
  assert.equal(finishDay(s, r), true); assert.equal(finishDay(s, r), false)
  assert.equal(s.money, 10000); assert.equal(s.day, 2)
  assert.equal(buyUpgrade(s, 'heat'), true); assert.equal(s.money, 4000); assert.equal(s.upgrades.heat, 1)
  assert.equal(buyUpgrade(s, 'heat'), false)
})
test('failed day retains revenue and can be retried, time ends and locks actions', () => {
  const s = newSave(), r = startDay(s); r.revenue = 2000; advance(r, 91)
  assert.equal(r.done, true); assert.equal(touchSlot(r, 0, 'bean'), 'blocked')
  finishDay(s, r); assert.equal(s.day, 1); assert.equal(s.money, 2000)
})
test('expired customers leave and broken saves are sanitized', () => {
  const r = startDay(newSave()); advance(r, 31); assert.ok(r.missed > 0)
  assert.deepEqual(validateSave(null), newSave())
  const s = validateSave({version:1,day:-1,money:'x',upgrades:{heat:99}})
  assert.equal(s.day, 1); assert.equal(s.money, 0); assert.equal(s.upgrades.heat, 3)
})
