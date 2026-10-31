(async()=>{
 const E=await import('/engine.js'),s=E.newSave()
 sessionStorage.setItem('v2-qa-backup',localStorage.getItem('golmok-bungeo-v2')||'null')
 s.money=200000;s.rep=80;s.day=3
 localStorage.setItem('golmok-bungeo-v2',JSON.stringify(s))
 return 'Seeded local QA-only shop fixture'
})()
