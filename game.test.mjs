import test from 'node:test'
import assert from 'node:assert/strict'
import * as E from './dist/engine.js'
const rich=()=>{const s=E.newSave();s.money=1e7;s.rep=200;return s}
function cook(r,type='bean',index=0,heat=E.RECIPES[type].heat,late=0){
 assert.equal(E.touchSlot(r,index,type,heat),'pour');const slot=r.slots[index]
 E.tick(r,E.cookTime(r,slot)+.01+late);E.touchSlot(r,index,type)
 if(slot.state==='fill')E.touchSlot(r,index,type)
 E.tick(r,E.cookTime(r,slot)+.01)
 if(slot.state==='finish')E.touchSlot(r,index,type,1,E.RECIPES[type].finish)
 assert.equal(E.touchSlot(r,index,type),'collect')
}
test('perfect timing, recommended heat and fast collection produce premium stock and paid sale',()=>{
 const r=E.startDay(E.newSave(),()=>0);cook(r);cook(r)
 assert.equal(r.tray.bean.length,2);assert.equal(r.tray.bean[0].quality,3)
 assert.ok(E.serve(r,0).earned>2000);assert.equal(r.served,1);assert.equal(r.tray.bean.length,0)
})
test('all six recipes complete their actual stages and charge ingredient costs',()=>{
 for(const key of Object.keys(E.RECIPES)){const s=rich();s.unlocked=Object.keys(E.RECIPES);const r=E.startDay(s);cook(r,key);assert.equal(r.tray[key][0].quality,3);assert.equal(r.cost,E.RECIPES[key].cost)}
})
test('wrong finishing tool cannot skip the recipe finish',()=>{
 const s=rich();s.unlocked.push('pizza');const r=E.startDay(s);E.touchSlot(r,0,'pizza',2);let slot=r.slots[0];E.tick(r,E.cookTime(r,slot)+.01);E.touchSlot(r,0,'pizza');assert.equal(slot.state,'fill');E.touchSlot(r,0,'pizza');E.tick(r,E.cookTime(r,slot)+.01);assert.equal(slot.state,'finish');assert.equal(E.touchSlot(r,0,'pizza',2,'dust'),'tool');assert.equal(slot.state,'finish');assert.equal(E.touchSlot(r,0,'pizza',2,'torch'),'torch')
})
test('wrong heat and delayed flip reduce quality; unfinished food burns exactly once',()=>{
 const r=E.startDay(rich());cook(r,'bean',0,0,1.2);assert.equal(r.tray.bean[0].quality,1)
 E.touchSlot(r,0,'bean');E.tick(r,15);assert.equal(r.slots[0].state,'burnt');assert.equal(r.burned,1);E.tick(r,3);assert.equal(r.burned,1);assert.equal(E.touchSlot(r,0,'bean'),'clear')
})
test('critic demands three stars; coating repairs stale inventory and mixed order is atomic',()=>{
 const r=E.startDay(rich());r.tray.bean=[{quality:3,age:40}];r.tray.cream=[{quality:3,age:0}]
 r.customers=[{id:90,kind:'critic',orders:[{type:'bean',count:1}],left:20,max:36,min:3}]
 assert.equal(E.serve(r,90),null);assert.equal(E.useSupply(r,'glaze'),true);assert.ok(E.serve(r,90))
 r.customers=[{id:91,kind:'courier',orders:[{type:'bean',count:1},{type:'cream',count:1}],left:20,max:28,min:1}]
 assert.equal(E.serve(r,91),null);assert.equal(r.tray.cream.length,1)
 r.tray.bean.push({quality:2,age:0});assert.ok(E.serve(r,91));assert.equal(r.tray.cream.length,0)
})
test('zero money cannot purchase ingredients but free bean prevents a soft lock',()=>{
 const s=E.newSave();s.money=0;const r=E.startDay(s)
 assert.equal(E.touchSlot(r,0,'cream',0),'money');assert.equal(E.touchSlot(r,0,'bean'),'pour');assert.equal(r.cost,0);assert.equal(E.touchSlot(r,1,'pizza',2),'blocked')
})
test('capacity, discard, storage upgrade and new slots affect actual play',()=>{
 const s=rich();E.buyUpgrade(s,'tray');E.buyUpgrade(s,'molds');const r=E.startDay(s)
 assert.equal(r.slots.length,7);assert.equal(E.capacity(r),16);assert.equal(E.freshness(r),36)
 r.tray.cream=Array.from({length:16},()=>({quality:2,age:0}));r.slots[0]={state:'ready',type:'bean',time:0,quality:3,heat:1}
 assert.equal(E.touchSlot(r,0,'bean'),'full');assert.ok(E.discardFish(r,'cream'));assert.equal(E.touchSlot(r,0,'bean'),'collect');assert.equal(E.discardFish(r,'unknown'),false)
})
test('research, equipment, supplies and expansion validate money, reputation and caps',()=>{
 const s=E.newSave();assert.equal(E.unlockRecipe(s,'pizza'),false);s.money=1e7;s.rep=200
 assert.ok(E.unlockRecipe(s,'pizza'));assert.equal(E.unlockRecipe(s,'pizza'),false)
 const before=s.money;assert.ok(E.buySupply(s,'tea'));assert.equal(s.money,before-700)
 for(const u of E.UPGRADES){for(let i=0;i<u.max;i++)assert.ok(E.buyUpgrade(s,u.key));assert.equal(E.buyUpgrade(s,u.key),false)}
 for(let i=0;i<5;i++)assert.ok(E.expand(s));assert.equal(E.expand(s),false)
})
test('settlement subtracts costs, refunds insurance, consumes stock and awards a mission once',()=>{
 const s=E.newSave();s.supplies.insurance=1;const initial=s.money,r=E.startDay(s)
 E.useSupply(r,'tea');r.revenue=15000;r.cost=1000;r.served=8;r.done=true
 assert.ok(E.finishDay(s,r));assert.equal(s.money,initial+15000-1000+500+3500+2000);assert.equal(s.supplies.insurance,0);assert.equal(s.supplies.tea,0);assert.equal(s.day,2)
 const balance=s.money;assert.equal(E.finishDay(s,r),false);assert.equal(s.money,balance)
})
test('failed revenue goal still advances the day, saves profits and grants no goal bonus',()=>{
 const s=E.newSave(),r=E.startDay(s);r.revenue=1000;E.tick(r,120);assert.equal(r.done,true);E.finishDay(s,r);assert.equal(s.day,2);assert.equal(s.money,6000);assert.equal(r.goalReward,0);assert.equal(E.touchSlot(r,0,'bean'),'blocked');assert.equal(E.serve(r,0),null)
})
test('one-time achievements cannot be farmed again; save migration preserves old progress',()=>{
 const s=E.validateSave({version:1,day:12,money:87000,best:33000,totalServed:90,upgrades:{heat:3,recipe:2,charm:1}})
 assert.equal(s.version,2);assert.equal(s.money,87000);assert.equal(s.upgrades.heat,3);assert.equal(s.upgrades.tools,0);assert.deepEqual(s.unlocked,['bean','cream'])
 let r=E.startDay(s);r.done=true;E.finishDay(s,r);assert.equal(r.achievements.length,1)
 r=E.startDay(s);r.done=true;E.finishDay(s,r);assert.equal(r.achievements.length,0)
 assert.deepEqual(E.validateSave(null),E.newSave());assert.equal(E.validateSave({version:2,unlocked:['hacked'],money:-1,upgrades:{heat:99}}).upgrades.heat,5)
})
test('full elapsed time, customer unlocks, weather and paid rush have observable effects',()=>{
 const s=rich();s.day=3;s.unlocked.push('cheese');s.supplies.rush=1
 const r=E.startDay(s,()=>.99);assert.equal(r.weather.name,'시장 장날');assert.ok(E.useSupply(r,'rush'));E.tick(r,7.1);assert.equal(r.left.toFixed(1),'112.9');assert.ok(r.customers.some(c=>c.kind==='courier'&&c.orders.length===2));assert.ok(r.spawn<4)
 E.tick(r,NaN);assert.ok(Number.isFinite(r.left));E.tick(r,130);assert.equal(r.left,0)
})
