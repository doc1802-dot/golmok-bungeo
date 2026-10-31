export const RECIPES = {
 bean:{name:'클래식 팥',short:'팥',price:1000,cost:0,cook:3.4,heat:1,unlock:0,rep:0,finish:'',color:'#bc7264',desc:'기본 반죽 무료 · 정확한 뒤집기로 별 3개'},
 cream:{name:'바닐라 슈크림',short:'슈크림',price:1600,cost:180,cook:3.8,heat:0,unlock:0,rep:0,finish:'',color:'#e6bd63',desc:'약불 추천 · 섬세하게 구워 품질 보너스'},
 cheese:{name:'더블 치즈',short:'치즈',price:2400,cost:350,cook:4,heat:1,unlock:6500,rep:3,fill:true,finish:'press',color:'#d8a843',desc:'뒤집은 뒤 치즈 충전 → 익으면 압착'},
 choco:{name:'토치 초코',short:'초코',price:2800,cost:420,cook:3.6,heat:0,unlock:12000,rep:8,finish:'torch',color:'#8a5c4a',desc:'약불로 굽고 마지막에 토치 마감'},
 rice:{name:'인절미 크런치',short:'인절미',price:3300,cost:500,cook:4.5,heat:1,unlock:22000,rep:15,fill:true,finish:'dust',color:'#b8a174',desc:'떡 충전 → 뒷면 굽기 → 콩가루 마감'},
 pizza:{name:'불꽃 피자',short:'피자',price:4200,cost:700,cook:4.2,heat:2,unlock:36000,rep:25,fill:true,finish:'torch',color:'#ca7050',desc:'강불 추천 · 토핑 충전 후 토치 마감'}
}
export const UPGRADES = [
 {key:'heat',title:'열전도 동판',desc:'조리 속도 +8% / 레벨',base:6000,max:5},
 {key:'recipe',title:'반죽 숙성고',desc:'판매가 +12% / 레벨',base:8000,max:5},
 {key:'charm',title:'대기석 & 난로',desc:'손님 인내 +4초 / 레벨',base:5000,max:5},
 {key:'precision',title:'정밀 온도계',desc:'퍼펙트 뒤집기 구간 +0.25초 / 레벨',base:7000,max:4},
 {key:'tray',title:'온장 쇼케이스',desc:'보관 +4개 · 신선도 +8초 / 레벨',base:5500,max:4},
 {key:'molds',title:'확장 붕어빵 틀',desc:'화구 1개 추가 / 레벨 (최대 8개)',base:10000,max:2},
 {key:'tools',title:'전문 마감 도구',desc:'충전·마감 타이밍 구간 +0.35초 / 레벨',base:8500,max:4},
 {key:'sign',title:'골목 간판',desc:'손님 방문 간격 7% 단축 / 레벨',base:9000,max:4},
 {key:'pack',title:'선물 포장대',desc:'가족·단골·배달 판매가 +12% / 레벨',base:7500,max:4}
]
export const SUPPLIES = {
 tea:{name:'따뜻한 차',cost:700,desc:'영업 중 모든 손님 대기 +10초'},
 rush:{name:'전단지 묶음',cost:1500,desc:'25초 동안 손님 방문 2배'},
 glaze:{name:'특제 코팅',cost:1200,desc:'보관 중인 모든 붕어빵 품질 +1 · 신선도 회복'},
 insurance:{name:'안심 영업권',cost:2000,desc:'다음 영업 재료비 50% 환급 · 자동 사용'}
}
export const TYPES = {
 neighbor:{name:'동네 이웃',icon:'🧣',patience:36,mult:1,desc:'여유로운 기본 주문'},
 student:{name:'방과 후 학생',icon:'🎒',patience:30,mult:.95,desc:'초코·슈크림 선호 · 빠른 응대 보너스'},
 worker:{name:'출근길 직장인',icon:'💼',patience:19,mult:1.3,desc:'성격 급함 · 빠르게 주면 큰 팁'},
 family:{name:'주말 가족',icon:'🧤',patience:46,mult:1.15,desc:'한 번에 3~4개 · 포장대 보너스'},
 critic:{name:'골목 미식가',icon:'🧐',patience:36,mult:1.9,min:3,desc:'별 3개만 수락 · 높은 매출과 평판'},
 regular:{name:'단골 손님',icon:'💛',patience:42,mult:1.25,desc:'성공 시 평판 +2 · 포장대 보너스'},
 courier:{name:'배달 라이더',icon:'🛵',patience:28,mult:1.4,desc:'두 가지 맛 묶음 주문 · 포장대 보너스'}
}
export const WEATHER = [
 {name:'맑은 겨울',desc:'기본 조리 · 여유롭게 첫 주문을 준비하세요.',speed:1,patience:0},
 {name:'눈 오는 골목',desc:'화구 속도 -10% · 손님 인내 -3초',speed:.9,patience:-3},
 {name:'시장 장날',desc:'방문 간격 20% 단축 · 대량 주문에 대비하세요.',speed:1,patience:0,rush:.8},
 {name:'따뜻한 오후',desc:'보관 신선도 20% 빨리 감소 · 소량씩 구워보세요.',speed:1,patience:0,stale:1.2}
]
const bounded=(n,lo,hi,fallback=0)=>Number.isSafeInteger(n)?Math.max(lo,Math.min(hi,n)):fallback
export function newSave(){return {version:2,day:1,money:5000,best:0,totalServed:0,rep:0,district:0,unlocked:['bean','cream'],upgrades:Object.fromEntries(UPGRADES.map(u=>[u.key,0])),supplies:{tea:1,rush:0,glaze:1,insurance:0},achievements:[]}}
export function validateSave(s){
 const fresh=newSave();if(!s||![1,2].includes(s.version))return fresh
 for(const k of ['day','money','best','totalServed'])fresh[k]=bounded(s[k],k==='day'?1:0,k==='day'?9999:1e9,fresh[k])
 for(const u of UPGRADES)fresh.upgrades[u.key]=bounded(s.upgrades?.[u.key],0,u.max)
 if(s.version===2){fresh.rep=bounded(s.rep,0,100000);fresh.district=bounded(s.district,0,5);fresh.unlocked=[...new Set(['bean','cream',...(Array.isArray(s.unlocked)?s.unlocked.filter(k=>Object.hasOwn(RECIPES,k)):[])])];for(const k of Object.keys(SUPPLIES))fresh.supplies[k]=bounded(s.supplies?.[k],0,99);fresh.achievements=Array.isArray(s.achievements)?s.achievements.filter(k=>['first','chef','crowd','empire'].includes(k)):[]}
 return fresh
}
export function upgradeCost(s,u){return Math.round(u.base*Math.pow(1.65,s.upgrades[u.key]))}
export function buyUpgrade(s,key){const u=UPGRADES.find(x=>x.key===key);if(!u||s.upgrades[key]>=u.max||s.money<upgradeCost(s,u))return false;s.money-=upgradeCost(s,u);s.upgrades[key]++;return true}
export function unlockRecipe(s,key){const r=RECIPES[key];if(!r||s.unlocked.includes(key)||s.money<r.unlock||s.rep<r.rep)return false;s.money-=r.unlock;s.unlocked.push(key);return true}
export function buySupply(s,key){const u=SUPPLIES[key];if(!u||s.money<u.cost||s.supplies[key]>=99)return false;s.money-=u.cost;s.supplies[key]++;return true}
export function expansionCost(s){return 40000*Math.pow(2,s.district)}
export function expand(s){if(s.district>=5||s.rep<(s.district+1)*20||s.money<expansionCost(s))return false;s.money-=expansionCost(s);s.district++;return true}
export function capacity(r){return 12+4*r.upgrades.tray}
export function freshness(r){return 28+8*r.upgrades.tray}
export function startDay(s,random=Math.random){
 const r={day:s.day,left:120,target:Math.round(Math.max(12000,Math.min(s.best*.85,55000)+s.district*5000)),revenue:0,cost:0,budget:s.money,served:0,missed:0,burned:0,combo:0,bestCombo:0,perfect:0,rep:0,slots:Array.from({length:6+s.upgrades.molds},()=>({state:'empty'})),tray:Object.fromEntries(Object.keys(RECIPES).map(k=>[k,[]])),customers:[],spawn:7,nextId:0,done:false,upgrades:{...s.upgrades},unlocked:[...s.unlocked],supplies:{...s.supplies},district:s.district,weather:WEATHER[(s.day-1)%WEATHER.length],random,rush:0,insured:s.supplies.insurance>0,mission:{kind:['served','perfect','combo'][(s.day-1)%3],goal:[8,8,6][(s.day-1)%3]},settled:false}
 if(r.insured)r.supplies.insurance--;addCustomer(r,true);return r
}
export function cookTime(r,slot={type:'bean',heat:1}){return RECIPES[slot.type].cook/(1+r.upgrades.heat*.08)/[.75,1,1.35][slot.heat]/r.weather.speed}
export function windowTime(r){return .8+r.upgrades.precision*.25}
export function stageLimit(r,slot){return slot.state==='fill'||slot.state==='finish'?3+r.upgrades.tools*.35:5}
export function quality(r,slot){return Math.max(1,Math.min(3,slot.quality))}
function addCustomer(r,first=false){
 const pool=['neighbor','student',...(r.day>=2?['worker','family']:[]),...(r.day>=3?['regular','critic']:[]),...(r.unlocked.length>=3?['courier']:[])]
 const kind=first?'neighbor':pool[Math.min(pool.length-1,Math.floor(r.random()*pool.length))],t=TYPES[kind]
 let menu=r.unlocked
 if(kind==='student'){const preferred=menu.filter(k=>['cream','choco'].includes(k));if(preferred.length)menu=preferred}
 const type=first?'bean':menu[Math.min(menu.length-1,Math.floor(r.random()*menu.length))]
 const count=first?2:kind==='family'?3+Math.floor(r.random()*2):kind==='critic'?1:1+Math.floor(r.random()*2)
 const orders=[{type,count}]
 if(kind==='courier'){const other=menu.filter(k=>k!==type);if(other.length)orders.push({type:other[Math.floor(r.random()*other.length)],count:2})}
 const max=t.patience+r.upgrades.charm*4+r.weather.patience
 r.customers.push({id:r.nextId++,kind,orders,left:max,max,min:t.min||1})
}
export function tick(r,dt){
 if(r.done||!Number.isFinite(dt))return []
 const events=[];let remain=Math.max(0,Math.min(dt,r.left))
 while(remain>0){const step=Math.min(.1,remain);remain-=step;r.left=Math.max(0,r.left-step);r.rush=Math.max(0,r.rush-step)
  for(const slot of r.slots){if(['empty','burnt'].includes(slot.state))continue;slot.time+=step
   if(slot.state==='back'&&slot.time>=cookTime(r,slot)){slot.time-=cookTime(r,slot);slot.state=RECIPES[slot.type].finish?'finish':'ready';events.push('ready')}
   if((slot.state==='front'&&slot.time>cookTime(r,slot)+stageLimit(r,slot))||(['fill','finish','ready'].includes(slot.state)&&slot.time>stageLimit(r,slot))){slot.state='burnt';r.burned++;r.combo=0;events.push('burnt')}
  }
  for(const batch of Object.values(r.tray))for(const item of batch)item.age+=step*(r.weather.stale||1)
  for(const c of r.customers)c.left-=step
  const expired=r.customers.filter(c=>c.left<=0).length
  if(expired){r.missed+=expired;r.rep-=expired;r.combo=0;r.customers=r.customers.filter(c=>c.left>0);events.push('missed')}
  r.spawn-=step
  if(r.spawn<=0&&r.customers.length<4&&r.left>10){addCustomer(r);r.spawn=Math.max(3.5,9-r.district*.6)*(1-r.upgrades.sign*.07)*(r.weather.rush||1)*(r.rush>0?.5:1);events.push('customer')}
 }
 if(r.left<.001){r.left=0;r.done=true;events.push('end')}return events
}
export function touchSlot(r,index,type,heat=1,tool='press'){
 if(r.done||!r.unlocked.includes(type)||!Number.isInteger(heat)||heat<0||heat>2)return 'blocked'
 const slot=r.slots[index];if(!slot)return 'blocked';const recipe=RECIPES[type]
 if(slot.state==='empty'){if(r.budget+r.revenue-r.cost<recipe.cost)return 'money';r.cost+=recipe.cost;Object.assign(slot,{state:'front',type,heat,time:0,quality:heat===recipe.heat?3:2});return 'pour'}
 if(slot.state==='front'){if(slot.time<cookTime(r,slot))return 'early';const perfect=slot.time<=cookTime(r,slot)+windowTime(r);if(!perfect)slot.quality--;else r.perfect++;slot.state=RECIPES[slot.type].fill?'fill':'back';slot.time=0;return perfect?'perfect':'flip'}
 if(slot.state==='fill'){if(slot.time>1.2+r.upgrades.tools*.35)slot.quality--;slot.state='back';slot.time=0;return 'fill'}
 if(slot.state==='finish'){if(tool!==RECIPES[slot.type].finish)return 'tool';if(slot.time>1.2+r.upgrades.tools*.35)slot.quality--;slot.state='ready';slot.time=0;return RECIPES[slot.type].finish}
 if(slot.state==='ready'){if(Object.values(r.tray).reduce((n,a)=>n+a.length,0)>=capacity(r))return 'full';if(slot.time>2)slot.quality--;r.tray[slot.type].push({quality:quality(r,slot),age:0});slot.state='empty';return 'collect'}
 if(slot.state==='burnt'){slot.state='empty';return 'clear'}return 'wait'
}
export function itemQuality(r,item){return Math.max(1,item.quality-(item.age>freshness(r)?1:0))}
export function available(r,c,order){return r.tray[order.type].filter(i=>itemQuality(r,i)>=c.min).length}
export function canServe(r,c){return c.orders.every(o=>available(r,c,o)>=o.count)}
export function discardFish(r,type){if(r.done||!r.tray[type]?.length)return false;r.tray[type].shift();return true}
export function serve(r,id){
 if(r.done)return null;const c=r.customers.find(x=>x.id===id);if(!c||!canServe(r,c))return null
 const t=TYPES[c.kind];let base=0,stars=0,count=0
 for(const o of c.orders){const eligible=r.tray[o.type].filter(i=>itemQuality(r,i)>=c.min).sort((a,b)=>itemQuality(r,a)-itemQuality(r,b)||b.age-a.age).slice(0,o.count)
  for(const item of eligible){const q=itemQuality(r,item);stars+=q;count++;base+=RECIPES[o.type].price*(.8+q*.15);r.tray[o.type].splice(r.tray[o.type].indexOf(item),1)}
 }
 r.combo++;r.bestCombo=Math.max(r.combo,r.bestCombo)
 const tip=c.left>c.max*.5?(['worker','student'].includes(c.kind)?600:250):0,bonus=Math.min(1500,(r.combo-1)*100),pack=['family','regular','courier'].includes(c.kind)?1+r.upgrades.pack*.12:1
 const earned=Math.round(base*(1+r.upgrades.recipe*.12)*t.mult*pack*(1+r.district*.08))+tip+bonus
 r.revenue+=earned;r.served++;r.rep+=c.kind==='critic'?3:c.kind==='regular'?2:1;r.customers=r.customers.filter(x=>x.id!==id);return {earned,tip,bonus,stars:stars/count}
}
export function useSupply(r,key){
 if(r.done||!r.supplies[key]||key==='insurance')return false
 if(key==='tea'){for(const c of r.customers){c.left+=10;c.max+=10}}
 else if(key==='rush')r.rush=25
 else if(key==='glaze'){for(const batch of Object.values(r.tray))for(const i of batch){i.quality=Math.min(3,i.quality+1);i.age=0}}
 else return false
 r.supplies[key]--;return true
}
export function missionProgress(r){return r.mission.kind==='served'?r.served:r.mission.kind==='perfect'?r.perfect:r.bestCombo}
export function finishDay(s,r){
 if(!r.done||r.settled)return false
 r.settled=true;r.refund=r.insured?Math.round(r.cost*.5):0;r.missionReward=missionProgress(r)>=r.mission.goal?3500+500*r.district:0;r.goalReward=r.revenue>=r.target?2000+500*r.district:0
 s.money=Math.max(0,s.money+r.revenue-r.cost+r.refund+r.missionReward+r.goalReward);s.totalServed+=r.served;s.best=Math.max(s.best,r.revenue);s.rep=Math.max(0,s.rep+r.rep);s.supplies={...r.supplies};s.day=Math.min(9999,s.day+1);r.achievements=[]
 for(const [id,condition,reward,name] of [['first',s.totalServed>=10,4000,'첫 단골 10명'],['chef',r.perfect>=12,6000,'손끝의 장인'],['crowd',r.served>=18,8000,'골목 맛집'],['empire',s.district>=3,15000,'상권 개척자']])if(condition&&!s.achievements.includes(id)){s.achievements.push(id);s.money+=reward;r.achievements.push({name,reward})}
 return true
}
