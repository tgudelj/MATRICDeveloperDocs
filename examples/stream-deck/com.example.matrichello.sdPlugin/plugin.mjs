// Node 24 supplies WebSocket globally. MATRIC supplies these launch arguments.
const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}
for (const required of ['-port', '-pluginUUID', '-registerEvent']) {
  if (!args.get(required)) throw new Error('Missing launch argument ' + required);
}
const port = Number(args.get('-port'));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid host port');

const socket = new WebSocket('ws://127.0.0.1:' + port);
const counts = new Map();
const action = 'com.example.matrichello.count';

function send(message) {
  socket.send(JSON.stringify(message));
}
function show(context, count) {
  send({ event: 'setTitle', context, payload: { title: 'Count ' + count, target: 0 } });
}
socket.addEventListener('open', () => {
  // The registration identifier is issued by the host; it is not the manifest UUID.
  send({ event: args.get('-registerEvent'), uuid: args.get('-pluginUUID') });
});
socket.addEventListener('message', event => {
  let message;
  try { message = JSON.parse(event.data); }
  catch { return; }
  if (!message || message.action !== action || typeof message.context !== 'string') return;
  const context = message.context;
  if (message.event === 'willAppear') {
    counts.set(context, 0);
    show(context, 0);
  } else if (message.event === 'keyDown' && counts.has(context)) {
    const count = counts.get(context) + 1;
    counts.set(context, count);
    show(context, count);
  } else if (message.event === 'willDisappear') {
    counts.delete(context);
  }
});
socket.addEventListener('error', () => {
  console.error('Plugin connection failed. Check MATRIC backend diagnostics.');
  process.exitCode = 1;
});
socket.addEventListener('close', () => {
  counts.clear();
  process.exit();
});
