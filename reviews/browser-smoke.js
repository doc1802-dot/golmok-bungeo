(async () => {
  const $ = s => document.querySelector(s)
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
  const checks = []
  const check = (name, ok) => { checks.push({name, ok}); if (!ok) throw Error(name) }
  $('[data-action="start"]').click()
  check('day starts', !$('#modal').open && document.body.classList.contains('playing'))
  const slots = document.querySelectorAll('[data-slot]')
  slots[0].click(); slots[1].click()
  await wait(3650)
  check('front ready to flip', slots[0].classList.contains('flip-ready'))
  slots[0].click(); slots[1].click()
  await wait(3650)
  check('back cooked', slots[0].classList.contains('ready'))
  slots[0].click(); slots[1].click()
  check('two collected', $('#bean-count').textContent === '2')
  $('#customers [data-id="0"]').click()
  check('order served', Number($('#revenue').textContent.replace(/\D/g,'')) >= 2000 && $('#bean-count').textContent === '0')
  slots[0].focus()
  slots[0].dispatchEvent(new KeyboardEvent('keydown', {key:' ',code:'Space',bubbles:true,cancelable:true}))
  check('Space works with button focus', $('#modal').open && !!$('[data-action="resume"]'))
  const time = $('#time').textContent
  await wait(1100)
  check('pause freezes time', time === $('#time').textContent)
  $('[data-action="resume"]').click()
  $('#pause').click()
  const layout = {width:innerWidth, documentWidth:document.documentElement.scrollWidth, grill:$('#griddle').getBoundingClientRect().toJSON(), customers:$('#customers').getBoundingClientRect().toJSON()}
  check('no horizontal overflow', layout.documentWidth <= innerWidth)
  return {checks,layout}
})()
