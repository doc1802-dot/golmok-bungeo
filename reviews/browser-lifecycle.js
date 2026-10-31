(async () => {
  const $ = s => document.querySelector(s)
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
  const checks = []
  const check = (name, ok) => { checks.push({name, ok}); if (!ok) throw Error(name) }
  $('#modal').close()
  await wait(50)
  check('dismissed welcome retains visible start', !$('#start-shift').hidden && $('#start-shift').getBoundingClientRect().top < innerHeight)
  $('#start-shift').click()
  await wait(50)
  $('#reset').click()
  check('reset named dialog', $('#modal').getAttribute('aria-labelledby') === 'dialog-title')
  $('#modal').dispatchEvent(new Event('cancel', {cancelable:true}))
  check('Escape cancels reset and resumes', !$('#modal').open && !$('#griddle button').disabled)
  // Speed only this QA page clock up; restore the browser scheduler afterward.
  const raf = window.requestAnimationFrame
  let offset = 0
  window.requestAnimationFrame = cb => raf(t => cb(t + (offset += 650)))
  try {
    for (let i = 0; i < 100 && !$('[data-action="shop"]'); i++) await wait(100)
    check('day ends in results', !!$('[data-action="shop"]'))
  } finally { window.requestAnimationFrame = raf }
  check('record persisted', !!JSON.parse(localStorage.getItem('golmok-bungeo-v1')))
  // A stale ID 0 fixture must not survive begin() even when tomorrow reuses it.
  const stale = document.createElement('button'); stale.dataset.id = '0'; stale.textContent = 'STALE_ORDER'
  $('#customers').append(stale)
  $('[data-action="shop"]').click()
  check('end retains start action above shop', !$('#start-shift').hidden)
  check('next day button beside upgrades', !$('#next-shift').hidden && $('#next-shift').closest('.shop'))
  $('#next-shift').click()
  check('new day rebuilds customer cards', !$('#customers').textContent.includes('STALE_ORDER') && !!$('#customers [data-id="0"] .request'))
  $('#pause').click()
  check('pause remains usable after restart', !!$('[data-action="resume"]'))
  return checks
})()
