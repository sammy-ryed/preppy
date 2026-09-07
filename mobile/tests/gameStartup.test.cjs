const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const compiled = ts.transpileModule(readFileSync(require.resolve('../components/learning/gameStartupScript.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const moduleContext = { exports: {} };
vm.runInNewContext(compiled, moduleContext);
const script = moduleContext.exports.gameStartupScript;
function harness(streaming, buffered) {
  const messages = [], listeners = {};
  const context = {
    navigator: { userAgent: 'Chrome/140.0.0.0' },
    console: { error() {} }, Date, Promise,
    WebAssembly: { instantiateStreaming: streaming, instantiate: buffered },
    document: { getElementById: () => null },
    setInterval() { return 1; }, clearInterval() {},
    ReactNativeWebView: { postMessage(raw) { messages.push(JSON.parse(raw)); } },
    addEventListener(name, callback) { listeners[name] = callback; },
  };
  context.window = context;
  vm.runInNewContext(script, context);
  return { context, messages, listeners };
}
test('WebAssembly streaming failure falls back to buffered initialization without inventing completion', async () => {
  let bufferedCalls = 0;
  const result = { instance: {}, module: {} };
  const { context, messages } = harness(async () => { throw new Error('stream failure'); }, async bytes => {
    bufferedCalls++; assert.equal(bytes, 'bytes'); return result;
  });
  const response = { clone: () => ({ arrayBuffer: async () => 'bytes' }) };
  assert.equal(await context.WebAssembly.instantiateStreaming(response, {}), result);
  assert.equal(bufferedCalls, 1);
  assert.deepEqual(messages, []);
});
test('WebAssembly failure is surfaced with stage and WebView version and still rejects', async () => {
  const { context, messages, listeners } = harness(async () => { throw new Error('stream failure'); }, async () => { throw new Error('unsupported instruction'); });
  await assert.rejects(context.WebAssembly.instantiateStreaming({ clone: () => ({ arrayBuffer: async () => 'bytes' }) }, {}), /unsupported instruction/);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].type, 'PREPPY_STARTUP_ERROR');
  assert.match(messages[0].message, /unsupported instruction/);
  assert.match(messages[0].message, /WebView Chrome 140/);
  listeners.unhandledrejection({ reason: new Error('same failure') });
  assert.equal(messages.length, 1);
});
