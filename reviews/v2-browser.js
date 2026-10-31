(async()=>{
 const $=s=>document.querySelector(s),wait=ms=>new Promise(r=>setTimeout(r,ms)),checks=[]
 const check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name)}
 const until=async fn=>{for(let i=0;i<250;i++){if(fn())return;await wait(40)}throw Error('Timed out waiting for cooking stage')}
 $('#modal').close();await wait(50)
 check('welcome dismiss leaves accessible start',!$('#start-shift').hidden)
 $('#start-shift').click();await wait(100)
 check('six starting molds',document.querySelectorAll('[data-slot]').length===6)
 $('[data-slot="0"]').click();$('[data-slot="1"]').click()
 await until(()=>$('[data-slot="0"]').classList.contains('flip-ready'))
 $('[data-slot="0"]').click();$('[data-slot="1"]').click()
 await until(()=>$('[data-slot="0"]').classList.contains('ready'))
 $('[data-slot="0"]').click();$('[data-slot="1"]').click()
 check('two premium fish collected',$('#count-bean').textContent==='2'&&$('#stars-bean').textContent.includes('2'))
 $('#customers [data-id="0"]').click()
 check('order fulfilled and revenue earned',!$('#customers [data-id="0"]')&&$('#revenue').textContent!=='0원')
 $('#pause').click();const time=$('#time').textContent;await wait(250)
 check('pause freezes simulation',$('#time').textContent===time)
 $('[data-action="resume"]').click();await wait(60)
 $('[data-use="tea"]').click();check('supply consumed',$('[data-use="tea"] b').textContent==='×0')
 $('#griddle button').focus();document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true,cancelable:true}))
 check('Space pauses with mold focus',!!$('[data-action="resume"]'))
 $('[data-action="resume"]').click();await wait(60)
 check('mobile page has no horizontal overflow',document.documentElement.scrollWidth<=innerWidth)
 // Speed only this test tab's frame timestamps, without exposing app state.
 const raf=window.requestAnimationFrame;let offset=0
 window.requestAnimationFrame=cb=>raf(t=>cb(t+(offset+=1500)))
 try{await until(()=>!!$('[data-action="shop"]'))}finally{window.requestAnimationFrame=raf}
 check('round reaches settlement',!!$('[data-action="shop"]'))
 const saved=JSON.parse(localStorage.getItem('golmok-bungeo-v2'))
 check('v2 saved and day advances',saved.version===2&&saved.day>=2)
 $('[data-action="shop"]').click();await wait(100)
 $('[data-tab="research"]').click();check('six recipe cards',document.querySelectorAll('.shop-card').length===6)
 $('[data-tab="equipment"]').click();check('nine equipment cards',document.querySelectorAll('.shop-card').length===9)
 $('#next-shift').click();await wait(100)
 check('restart works',!$('#griddle button').disabled&&$('#customers [data-id="0"]'))
 $('#pause').click()
 return {checks,viewport:{width:innerWidth,document:document.documentElement.scrollWidth}}
})()
