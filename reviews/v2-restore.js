(()=>{
 const backup=sessionStorage.getItem('v2-qa-backup')
 if(backup!==null){if(backup==='null')localStorage.removeItem('golmok-bungeo-v2');else localStorage.setItem('golmok-bungeo-v2',backup);sessionStorage.removeItem('v2-qa-backup')}
 return 'Restored local save after advanced QA'
})()
