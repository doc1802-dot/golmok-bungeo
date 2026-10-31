(async()=>{
 const $=s=>document.querySelector(s),wait=ms=>new Promise(r=>setTimeout(r,ms)),checks=[]
 const check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name)}
 const until=async fn=>{for(let i=0;i<250;i++){if(fn())return;await wait(40)}throw Error('Cooking stage timeout')}
 $('[data-action="shop"]').click();await wait(60)
 $('[data-tab="research"]').click();$('[data-buy="recipe"][data-key="cheese"]').click();$('[data-buy="recipe"][data-key="choco"]').click()
 check('research spends funds and unlocks recipes',JSON.parse(localStorage.getItem('golmok-bungeo-v2')).money===181500&&document.querySelectorAll('[data-recipe]').length===4)
 $('[data-tab="equipment"]').click();$('[data-key="molds"]').click();$('[data-key="tools"]').click()
 $('[data-tab="supplies"]').click();$('[data-key="rush"]').click()
 $('[data-tab="district"]').click();$('[data-buy="expand"]').click()
 check('equipment supply and district persist',JSON.parse(localStorage.getItem('golmok-bungeo-v2')).district===1)
 $('#next-shift').click();await wait(60)
 check('upgraded seventh mold',document.querySelectorAll('[data-slot]').length===7)
 $('[data-recipe="cheese"]').click();$('[data-heat="1"]').click();$('[data-slot="0"]').click()
 await until(()=>$('[data-slot="0"]').classList.contains('flip-ready'))
 $('[data-slot="0"]').click();check('cheese requires filling',$('[data-slot="0"]').classList.contains('fill'));$('[data-slot="0"]').click()
 await until(()=>$('[data-slot="0"]').classList.contains('finish'))
 $('[data-tool="torch"]').click();$('[data-slot="0"]').click();check('wrong tool rejected',$('[data-slot="0"]').classList.contains('finish'))
 $('[data-tool="press"]').click();$('[data-slot="0"]').click();$('[data-slot="0"]').click();check('pressed cheese stored',$('#count-cheese').textContent==='1')
 $('[data-recipe="choco"]').click();$('[data-heat="0"]').click();$('[data-slot="0"]').click()
 await until(()=>$('[data-slot="0"]').classList.contains('flip-ready'));$('[data-slot="0"]').click()
 await until(()=>$('[data-slot="0"]').classList.contains('finish'));$('[data-tool="torch"]').click();$('[data-slot="0"]').click();$('[data-slot="0"]').click()
 check('torch chocolate stored',$('#count-choco').textContent==='1')
 $('[data-use="rush"]').click();check('paid promotion active',$('#rush-status').textContent.includes('전단지'))
 check('no overflow after menu expansion',document.documentElement.scrollWidth<=innerWidth)
 $('#pause').click()
 return checks
})()
