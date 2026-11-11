import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

// A real, isolated Chromium driven through its standard DevTools protocol.
// No production data or external browser-automation package is required.
export async function browser() {
  const root = resolve(import.meta.dirname, '..');
  const server = createServer(async (req, res) => {
    try {
      const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
      if (!path.startsWith(root + '/') && path !== root) throw new Error('Invalid path');
      const file = path === root ? join(root, 'index.html') : path;
      const body = await readFile(file);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf' };
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const profile = await mkdtemp(join(tmpdir(), 'el-guapo-tests-'));
  const proc = spawn(process.env.CHROMIUM_PATH || '/usr/bin/chromium', [
    '--headless', '--no-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=0',
    '--remote-allow-origins=*', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  proc.stderr.on('data', d => { stderr += d; });
  let socket;
  async function close() {
    socket?.close();
    if (proc.exitCode === null) {
      const exited = once(proc, 'exit');
      proc.kill();
      await exited;
    }
    await new Promise(r => server.close(r));
    await rm(profile, { recursive: true, force: true, maxRetries: 5 });
  }
  try {
    let version;
    for (let i = 0; i < 100; i++) {
      try {
        const [port] = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n');
        version = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        if (version.some(t => t.type === 'page')) break;
      } catch { /* Chromium is still starting. */ }
      if (proc.exitCode !== null) throw new Error(stderr);
      await delay(50);
    }
    const target = version?.find(t => t.type === 'page');
    if (!target) throw new Error('Chromium did not start: ' + stderr);
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await once(socket, 'open');
    let id = 0;
    const pending = new Map();
    const errors = [];
    socket.addEventListener('message', e => {
      const message = JSON.parse(e.data);
      if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails);
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push(message.params.args);
      const handler = pending.get(message.id);
      if (!handler) return;
      pending.delete(message.id);
      message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
    });
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const key = ++id;
        const timeout = setTimeout(() => { pending.delete(key); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
        pending.set(key, { resolve: r => { clearTimeout(timeout); resolve(r); }, reject: e => { clearTimeout(timeout); reject(e); } });
        socket.send(JSON.stringify({ id: key, method, params }));
      });
    }
    async function evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    }
    async function wait(expression) {
      for (let i = 0; i < 100; i++) {
        if (await evaluate(expression)) return;
        await delay(50);
      }
      throw new Error(`Condition not met: ${expression}`);
    }
    await send('Page.enable');
    await send('Runtime.enable');
    // External fonts are irrelevant to behavioral tests; never fetch the live site.
    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
    const url = `http://127.0.0.1:${server.address().port}/`;
    async function load() {
      await send('Page.navigate', { url });
      await wait('document.readyState === "complete" && !!document.querySelector(".nav-btn-shopping")');
      await evaluate(`document.documentElement.style.scrollBehavior='auto'; const style=document.createElement('style');style.textContent='*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}';document.head.append(style)`);
    }
    await load();
    return { evaluate, wait, send, load, close, errors };
  } catch (error) { await close(); throw error; }
}
