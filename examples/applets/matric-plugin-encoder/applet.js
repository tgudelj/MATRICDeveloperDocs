(() => {
  'use strict';
  const canvas = document.querySelector('canvas'), context = canvas.getContext('2d'), message = document.getElementById('message');
  const controlId = location.hash.slice(1), images = new Map();
  const fadeCanvas = document.createElement('canvas'), fadeContext = fadeCanvas.getContext('2d');
  let display = null, enabled = false, parentOrigin = '*', scheduled = false, gesture = null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const number = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  function send(name, data) {
    if (name === 'touch') { name = 'input'; data = {type:'touchTap',...data}; }
    parent.postMessage({messageId: 'cce-' + controlId, payload: {EventName: name, Data: data}}, parentOrigin);
  }

  function paintSoon() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; paint(); });
  }

  function color(value, width) {
    if (typeof value !== 'string' || value.length > 256) return '#000000';
    if (!value.includes(':')) return CSS.supports('color',value) ? value : '#000000';
    const gradient = context.createLinearGradient(0, 0, width, 0);
    for (const stop of value.split(',')) {
      const separator = stop.indexOf(':'), offset = Number(stop.slice(0, separator));
      if (separator < 0 || !Number.isFinite(offset)) continue;
      try { gradient.addColorStop(clamp(offset, 0, 1), stop.slice(separator + 1)); } catch (_) { /* Ignore an invalid color stop. */ }
    }
    return gradient;
  }

  function image(value) {
    if (typeof value !== 'string' || value.length > 800000 || !/^data:image\/(png|jpeg|gif|bmp|svg\+xml);base64,[A-Za-z0-9+/=]*$/.test(value)) return null;
    if (!images.has(value)) {
      const decoded = new Image(); decoded.onload = paintSoon; decoded.onerror = paintSoon; decoded.src = value;
      images.set(value, decoded);
    }
    const decoded = images.get(value);
    return decoded.complete && decoded.naturalWidth > 0 ? decoded : null;
  }

  function text(item, width, height) {
    let value = String(item.value ?? '');
    const font = `${number(item.font?.weight, 600)} ${number(item.font?.size, 16)}px Arial,sans-serif`;
    context.font = font;
    const overflow = context.measureText(value).width > width;
    const fade = item['text-overflow'] === 'fade' && overflow;
    const scale = Math.abs(context.getTransform().a) || 1;
    let target = context;
    if (fade) {
      fadeCanvas.width = Math.max(1,Math.ceil(width * scale)); fadeCanvas.height = Math.max(1,Math.ceil(height * scale));
      target = fadeContext; target.setTransform(scale,0,0,scale,0,0); target.font = font;
    }
    target.fillStyle = color(item.color || '#ffffff', width); target.textBaseline = 'middle';
    const alignment = ['left','center','right'].includes(item.alignment) ? item.alignment : 'left';
    target.textAlign = alignment;
    if (item['text-overflow'] === 'ellipsis' && overflow) {
      let low = 0, high = value.length;
      while (low < high) { const middle = Math.ceil((low + high) / 2); if (context.measureText(value.slice(0, middle) + '…').width <= width) low = middle; else high = middle - 1; }
      value = value.slice(0, low) + '…';
    }
    target.fillText(value, alignment === 'right' ? width : alignment === 'center' ? width / 2 : 0, height / 2);
    if (fade) {
      const gradient = target.createLinearGradient(Math.max(0,width - 20),0,width,0);
      gradient.addColorStop(0,'#fff'); gradient.addColorStop(1,'transparent');
      target.globalCompositeOperation = 'destination-in'; target.fillStyle = gradient; target.fillRect(0,0,width,height);
      target.globalCompositeOperation = 'source-over'; context.drawImage(fadeCanvas,0,0,width,height);
    }
  }

  function bar(item, width, height) {
    const min = number(item.range?.min, 0), max = number(item.range?.max, 100);
    const fraction = max > min ? clamp((number(item.value, 0) - min) / (max - min), 0, 1) : 0;
    const subtype = number(item.subtype, 4), border = clamp(number(item.border_w, 0), 0, Math.min(width, height) / 2);
    const gradientBar = item.type === 'gbar', barHeight = gradientBar ? Math.min(height - 4, number(item.bar_h, 12)) : height;
    context.save();
    context.beginPath();
    if (subtype === 2 || subtype === 3) { context.moveTo(0, barHeight); context.lineTo(width, 0); context.lineTo(width, barHeight); context.closePath(); }
    else if (subtype === 4 && context.roundRect) context.roundRect(0, 0, width, barHeight, Math.min(3, barHeight / 2));
    else context.rect(0, 0, width, barHeight);
    context.clip();
    context.fillStyle = color(item.bar_bg_c || '#404040', width); context.fillRect(0, 0, width, barHeight);
    if (!gradientBar) {
      context.fillStyle = color(item.bar_fill_c || '#ffffff', width);
      if (subtype === 1 || subtype === 3) context.fillRect(Math.min(width / 2, width * fraction), 0, Math.abs(fraction - 0.5) * width, barHeight);
      else context.fillRect(0, 0, width * fraction, barHeight);
    }
    context.restore();
    if (border) { context.strokeStyle = color(item.bar_border_c || '#ffffff', width); context.lineWidth = border; context.strokeRect(border / 2, border / 2, width - border, barHeight - border); }
    if (gradientBar) {
      const x = clamp(width * fraction, 3, width - 3);
      context.fillStyle = color(item.bar_fill_c || '#ffffff', width); context.beginPath();
      context.moveTo(x, barHeight + 1); context.lineTo(x - 3, height); context.lineTo(x + 3, height); context.closePath(); context.fill();
    }
  }

  function paint() {
    const bounds = canvas.getBoundingClientRect(), ratio = Math.min(3, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(bounds.width * ratio)), height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    context.setTransform(1,0,0,1,0,0); context.clearRect(0,0,width,height);
    const scale = Math.min(width / 200, height / 100);
    context.setTransform(scale,0,0,scale,(width - scale * 200) / 2,(height - scale * 100) / 2);
    if (!display) return;
    const background = image(display.background);
    if (background) context.drawImage(background,0,0,200,100);
    for (const item of [...display.items].sort((a,b) => number(a.zOrder,0) - number(b.zOrder,0))) {
      if (item.enabled === false || !Array.isArray(item.rect) || item.rect.length !== 4) continue;
      const [x,y,w,h] = item.rect;
      if (![x,y,w,h].every(Number.isFinite) || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > 200 || y + h > 100) continue;
      context.save(); context.translate(x,y); context.globalAlpha = clamp(number(item.opacity,1),0,1);
      context.beginPath(); context.rect(0,0,w,h); context.clip();
      if (item.background) { context.fillStyle = color(item.background,w); context.fillRect(0,0,w,h); }
      if (item.type === 'text') text(item,w,h);
      else if (item.type === 'pixmap') {
        const bitmap = image(item.value);
        if (bitmap) {
          const fit = Math.min(w / bitmap.naturalWidth,h / bitmap.naturalHeight);
          const imageWidth = bitmap.naturalWidth * fit, imageHeight = bitmap.naturalHeight * fit;
          context.drawImage(bitmap,(w - imageWidth) / 2,(h - imageHeight) / 2,imageWidth,imageHeight);
        }
      }
      else if (item.type === 'bar' || item.type === 'gbar') bar(item,w,h);
      context.restore();
    }
  }

  function point(event) {
    const bounds = canvas.getBoundingClientRect(), scale = Math.min(bounds.width / 200, bounds.height / 100);
    if (!(scale > 0)) return null;
    const x = (event.clientX - bounds.left - (bounds.width - scale * 200) / 2) / scale;
    const y = (event.clientY - bounds.top - (bounds.height - scale * 100) / 2) / scale;
    return x >= 0 && x < 200 && y >= 0 && y < 100 ? [Math.floor(x),Math.floor(y)] : null;
  }

  function cancel() {
    if (!gesture) return;
    const old = gesture; gesture = null; clearTimeout(old.timer);
    if (canvas.hasPointerCapture(old.id)) canvas.releasePointerCapture(old.id);
  }

  canvas.addEventListener('pointerdown', event => {
    if (!enabled || !display || gesture || event.button !== 0 || document.visibilityState === 'hidden') return;
    const position = point(event); if (!position) return;
    event.preventDefault(); canvas.setPointerCapture(event.pointerId);
    const active = gesture = {id:event.pointerId,position,sent:false};
    active.timer = setTimeout(() => { if (gesture === active && enabled && document.visibilityState !== 'hidden') { active.sent = true; send('touch',{tapPos:active.position,hold:true}); } },500);
  });
  canvas.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const position = point(event);
    if (!position || Math.hypot(position[0] - gesture.position[0],position[1] - gesture.position[1]) > 8) cancel();
  });
  canvas.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const active = gesture;
    if (!active.sent && enabled && point(event)) send('touch',{tapPos:active.position,hold:false});
    cancel();
  });
  for (const name of ['pointercancel','lostpointercapture']) canvas.addEventListener(name,cancel);
  for (const name of ['blur','pagehide']) window.addEventListener(name,cancel);
  document.addEventListener('visibilitychange',() => { if (document.visibilityState === 'hidden') cancel(); });
  window.addEventListener('message', event => {
    if (event.source !== parent || !event.data || event.data.messageId !== 'TOUCHSTRIPUPDATE') return;
    if (event.origin && event.origin !== 'null') parentOrigin = event.origin;
    const payload = event.data.payload || {}, next = payload.display;
    enabled = payload.enabled === true; if (!enabled) cancel();
    display = next && next.version === 1 && next.width === 200 && next.height === 100 && Array.isArray(next.items) && next.items.length <= 32 ? next : null;
    if (!display) cancel();
    const currentImages = new Set((display?.items || []).filter(item => item.type === 'pixmap').map(item => item.value));
    if (display?.background) currentImages.add(display.background);
    for (const key of images.keys()) if (!currentImages.has(key)) images.delete(key);
    message.textContent = display?.message || 'Choose a plugin action in the editor.';
    message.hidden = !!display && !display.message;
    paintSoon();
  });
  new ResizeObserver(paintSoon).observe(canvas);
  send('reqvariables',{variablePrefixes:[]});
})();
