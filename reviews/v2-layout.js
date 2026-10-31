(()=>{
 const $=s=>document.querySelector(s)
 if($('#modal').open)$('#modal').close()
 if(!$('#start-shift').hidden)$('#start-shift').click()
 const host=$('#customers'),original=[...host.children]
 // Duplicate rendered order cards only to exercise a full mobile queue layout.
 while(host.children.length<4)host.append(original[0].cloneNode(true))
 const cards=[...host.children].map(e=>e.getBoundingClientRect())
 const result={width:innerWidth,documentWidth:document.documentElement.scrollWidth,horizontalQueue:innerWidth>700||cards.every(r=>Math.abs(r.top-cards[0].top)<2),slots:document.querySelectorAll('[data-slot]').length,grill:$('#griddle').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth}
 while(host.children.length>original.length)host.lastChild.remove()
 if(result.overflow||!result.horizontalQueue)throw Error(JSON.stringify(result))
 $('#pause').click();return result
})()
