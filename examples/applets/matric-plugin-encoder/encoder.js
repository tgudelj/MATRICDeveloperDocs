(() => {
  'use strict';
  const dial = document.getElementById('dial'), center = document.getElementById('center');
  const surface = document.getElementById('surface'), rotary = document.getElementById('rotary'), knobImage = document.getElementById('knob-image');
  const controlId = location.hash.slice(1), stepAngle = Math.PI / 12;
  const images = new Map();
  let enabled = false, parentOrigin = '*', drag = null, held = null, angle = 0, pulse = null;
  let parameters = {KnobSize:50,KnobGap:4}, normalImage = null, activeImage = null;

  function bounded(value, fallback, minimum, maximum) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(minimum,Math.min(maximum,value)) : fallback;
  }
  function layout() {
    const {width,height} = document.body.getBoundingClientRect(), padding = Math.min(8,width / 12,height / 12);
    const availableWidth = Math.max(0,width - 2 * padding), availableHeight = Math.max(0,height - 2 * padding);
    const stripHeight = availableWidth / 2, knobSize = availableWidth * bounded(parameters.KnobSize,50,10,100) / 100;
    // Reserve the full diagonal so rectangular artwork remains visible at every rotation angle.
    const knobBox = knobSize * Math.SQRT2, gap = availableWidth * bounded(parameters.KnobGap,4,0,100) / 100;
    const scale = Math.min(1,availableHeight / Math.max(1,stripHeight + gap + knobBox));
    const top = (height - (stripHeight + gap + knobBox) * scale) / 2;
    Object.assign(surface.style,{left:(width - availableWidth * scale) / 2 + 'px',top:top + 'px',width:availableWidth * scale + 'px',height:stripHeight * scale + 'px'});
    Object.assign(rotary.style,{left:(width - knobBox * scale) / 2 + 'px',top:top + (stripHeight + gap) * scale + 'px',width:knobBox * scale + 'px',height:knobBox * scale + 'px'});
  }
  function imageSource(value) {
    if (typeof value !== 'string' || value.length > 800000) return null;
    if (/^data:image\/(png|jpeg|gif|bmp|webp|svg\+xml);base64,/.test(value)) return value;
    try { const url = new URL(value,location.href); return value && url.origin === location.origin && ['http:','https:'].includes(url.protocol) ? url.href : null; } catch (_) { return null; }
  }
  function artwork() {
    const interacting = drag !== null || held !== null || pulse !== null;
    const ready = source => { const decoded = images.get(source); return decoded?.complete && decoded.naturalWidth > 0; };
    const source = interacting && ready(activeImage) ? activeImage : ready(normalImage) ? normalImage : null;
    knobImage.hidden = !source; dial.classList.toggle('custom-image',!!source);
    if (source && knobImage.getAttribute('src') !== source) knobImage.src = source;
  }
  function loadArtwork() {
    normalImage = imageSource(parameters.KnobImage); activeImage = imageSource(parameters.KnobImageActive);
    for (const source of images.keys()) if (source !== normalImage && source !== activeImage) images.delete(source);
    for (const source of [normalImage,activeImage]) if (source && !images.has(source)) {
      const image = new Image(); images.set(source,image); image.onload = artwork; image.onerror = artwork; image.src = source;
    }
    artwork();
  }

  function send(type, values = {}) {
    parent.postMessage({messageId:'cce-' + controlId,payload:{EventName:'input',Data:{type,...values}}},parentOrigin);
  }
  function rotate(ticks) {
    if (!enabled) return;
    angle = (angle + ticks * 15) % 360; dial.style.setProperty('--angle',angle + 'deg');
    clearTimeout(pulse); pulse = setTimeout(() => { pulse = null; artwork(); },180); artwork();
    send('dialRotate',{ticks,pressed:held !== null});
  }
  function direction(event) {
    const bounds = dial.getBoundingClientRect();
    return Math.atan2(event.clientY - bounds.top - bounds.height / 2,event.clientX - bounds.left - bounds.width / 2);
  }
  function stopDrag() {
    if (!drag) return;
    const id = drag.id; drag = null;
    if (dial.hasPointerCapture(id)) dial.releasePointerCapture(id);
    artwork();
  }
  function release() {
    if (held === null) return;
    const id = held; held = null; center.setAttribute('aria-pressed','false'); send('dialUp');
    if (typeof id === 'number' && center.hasPointerCapture(id)) center.releasePointerCapture(id);
    artwork();
  }
  function cancel() { stopDrag(); release(); clearTimeout(pulse); pulse = null; artwork(); }
  function press(id) {
    if (!enabled || held !== null) return;
    held = id; center.setAttribute('aria-pressed','true'); send('dialDown'); artwork();
  }

  dial.addEventListener('pointerdown',event => {
    if (!enabled || drag || event.target === center || event.button !== 0) return;
    event.preventDefault(); dial.focus(); dial.setPointerCapture(event.pointerId);
    drag = {id:event.pointerId,last:direction(event),remaining:0};
    artwork();
  });
  dial.addEventListener('pointermove',event => {
    if (!drag || drag.id !== event.pointerId) return;
    const next = direction(event); let delta = next - drag.last;
    if (delta > Math.PI) delta -= 2 * Math.PI; if (delta < -Math.PI) delta += 2 * Math.PI;
    drag.last = next; drag.remaining += delta;
    const count = Math.min(12,Math.floor(Math.abs(drag.remaining) / stepAngle)), sign = Math.sign(drag.remaining);
    for (let i = 0; i < count; i++) rotate(sign);
    drag.remaining -= sign * count * stepAngle;
  });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) dial.addEventListener(name,event => { if (drag?.id === event.pointerId) stopDrag(); });
  dial.addEventListener('wheel',event => {
    if (!enabled || !event.deltaY) return;
    event.preventDefault(); rotate(event.deltaY < 0 ? 1 : -1);
  },{passive:false});
  dial.addEventListener('keydown',event => {
    if (event.target !== dial || !enabled) return;
    const ticks = {ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[event.key];
    if (ticks) { event.preventDefault(); rotate(ticks); }
  });
  center.addEventListener('pointerdown',event => {
    if (!enabled || held !== null || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation(); center.setPointerCapture(event.pointerId); press(event.pointerId);
  });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) center.addEventListener(name,event => { if (held === event.pointerId) release(); });
  center.addEventListener('keydown',event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) press('keyboard'); } });
  center.addEventListener('keyup',event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (held === 'keyboard') release(); } });
  center.addEventListener('blur',() => { if (held === 'keyboard') release(); });
  for (const name of ['blur','pagehide']) window.addEventListener(name,cancel);
  document.addEventListener('visibilitychange',() => { if (document.visibilityState === 'hidden') cancel(); });
  window.addEventListener('message',event => {
    if (event.source !== parent) return;
    if (event.data?.messageId === 'PARAMSUPDATE') {
      cancel(); parameters = event.data.payload || {}; loadArtwork(); layout(); return;
    }
    if (event.data?.messageId !== 'TOUCHSTRIPUPDATE') return;
    if (event.origin && event.origin !== 'null') parentOrigin = event.origin;
    const payload = event.data.payload || {}, display = payload.display;
    const active = payload.enabled === true && display?.version === 1 && display.width === 200 && display.height === 100;
    if (!active) cancel(); enabled = active;
    document.body.classList.toggle('disabled',!enabled);
    for (const element of [dial,center]) element.setAttribute('aria-disabled',String(!enabled));
  });
  new ResizeObserver(layout).observe(document.body);
  layout();
})();
