/* No dependencies. Keep fitting and host communication when replacing the UI. */
(() => {
  'use strict';

  // Set your design dimensions HERE. The same values size the DOM and fit it.
  const DESIGN_WIDTH = 600;
  const DESIGN_HEIGHT = 400;
  const design = document.getElementById('design');
  const caption = document.getElementById('caption');
  const variableName = document.getElementById('variable-name');
  const output = document.getElementById('value');
  const button = document.getElementById('activate');
  const status = document.getElementById('status');
  const controlId = location.hash.slice(1);
  const standalone = parent === window;
  let parentOrigin = '*';
  let environment = '';
  let variables = standalone ? { hobby_temperature: 23.5 } : {};
  const params = {
    Caption: 'Your applet', VariableToDisplay: 'hobby_temperature',
    Padding: 12, AccentColor: '#91e3cb', BackgroundColor: '#101c28'
  };

  design.style.width = DESIGN_WIDTH + 'px';
  design.style.height = DESIGN_HEIGHT + 'px';

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // Same fit-within rule as the bundled clock/counter: one uniform scale,
  // a centered fixed design, and an unscaled outer inset. Never measure the
  // transformed design as input to the next fit; measure the iframe viewport.
  function fit() {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    if (width <= 0 || height <= 0) return;
    const inset = Math.min(params.Padding, Math.max(0, (Math.min(width, height) - 1) / 2));
    const scale = Math.max(0, Math.min(
      (width - 2 * inset) / DESIGN_WIDTH,
      (height - 2 * inset) / DESIGN_HEIGHT
    ));
    design.style.transform = `translate(-50%, -50%) scale(${scale})`;
    design.style.visibility = 'visible';
  }

  function render() {
    caption.textContent = params.Caption;
    caption.title = params.Caption;
    variableName.textContent = params.VariableToDisplay || 'Choose a server variable';
    variableName.title = params.VariableToDisplay;
    const value = Object.prototype.hasOwnProperty.call(variables, params.VariableToDisplay)
      ? variables[params.VariableToDisplay] : null;
    let text = 'Waiting for value';
    if (value != null) {
      // Preserve zero/false; display external data as text, never as HTML.
      try { text = isObject(value) || Array.isArray(value) ? JSON.stringify(value) : String(value); }
      catch { text = 'Value cannot be displayed'; }
    }
    output.textContent = text;
    output.title = text;
    document.body.style.setProperty('--accent', params.AccentColor);
    document.documentElement.style.backgroundColor = params.BackgroundColor;
    document.body.style.backgroundColor = params.BackgroundColor;
    button.disabled = environment === 'editor';
  }

  function applyParams(payload) {
    for (const name of ['Caption', 'VariableToDisplay']) {
      if (typeof payload[name] === 'string') params[name] = payload[name];
    }
    if (typeof payload.Padding === 'number' && Number.isFinite(payload.Padding)) {
      params.Padding = Math.min(256, Math.max(0, payload.Padding));
    }
    for (const name of ['AccentColor', 'BackgroundColor']) {
      if (typeof payload[name] === 'string' && CSS.supports('color', payload[name])) {
        params[name] = payload[name];
      }
    }
    render();
    fit();
  }

  function emitEvent(name, data) {
    if (standalone || !controlId) return;
    parent.postMessage({ messageId: 'cce-' + controlId,
      payload: { EventName: name, Data: data } }, parentOrigin);
  }

  function receive(event) {
    if (standalone || event.source !== parent || !isObject(event.data)) return;
    const message = event.data;
    if (!isObject(message.payload)) return;
    if (!['PARAMSUPDATE', 'VARIABLESUPDATE', 'RESIZE'].includes(message.messageId)) return;
    if (event.origin && event.origin !== 'null') parentOrigin = event.origin;
    if (message.messageId === 'PARAMSUPDATE') applyParams(message.payload);
    else if (message.messageId === 'VARIABLESUPDATE') {
      variables = message.payload; // Snapshots, not deltas. Order relative to params is irrelevant.
      render();
    } else {
      if (['editor', 'client'].includes(message.payload.environment)) {
        environment = message.payload.environment;
        status.textContent = environment === 'editor'
          ? 'Editor preview: test the action on a client.'
          : 'Bind Activate to a Text action in MATRIC.';
        render();
      }
      // Measure the current viewport, rather than trusting stale size messages.
      fit();
    }
  }

  button.addEventListener('click', () => {
    if (standalone) {
      status.textContent = 'Preview only: install in MATRIC to run an action.';
    } else if (environment !== 'editor' && controlId) {
      // Text uses saved configuration and has no held-input release requirement.
      emitEvent('activate', null);
      status.textContent = 'Activate event sent to MATRIC.';
    }
  });

  // Install listeners before asking the host for state. None of these handlers
  // reload the document, reset variables, or replay a previous button gesture.
  addEventListener('message', receive);
  addEventListener('resize', fit);
  addEventListener('pageshow', () => { fit(); emitEvent('reqvariables', null); });
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(fit);
    observer.observe(document.documentElement);
  }
  if (standalone) status.textContent = 'Standalone preview: showing a sample value.';
  render();
  fit();
  emitEvent('reqvariables', null);
})();
