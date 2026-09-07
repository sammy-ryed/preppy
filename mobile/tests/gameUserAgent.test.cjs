const { test } = require('node:test');
const assert = require('node:assert/strict');
const { gameUserAgent } = require('../.domain-test/domain/gameUserAgent.js');

test('Android WebView no longer trips Emscripten Safari detection and keeps its actual Chrome version', () => {
  const original = 'Mozilla/5.0 (Linux; Android 14; Phone; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/152.0.7977.64 Mobile Safari/537.36';
  const normalized = gameUserAgent(original);
  // This is the Safari detection used by the exported Emscripten runtime.
  const safariVersion = ua => ua.includes('Safari/') && ua.match(/Version\/(\d+\.?\d*\.?\d*)/);
  assert.ok(safariVersion(original));
  assert.equal(safariVersion(normalized), null);
  assert.match(normalized, /Chrome\/152\.0\.7977\.64/);
  assert.equal(normalized, original.replace(' Version/4.0', ''));
});
test('real Safari, desktop browsers and older Chromium keep honest version checks', () => {
  for (const ua of ['Mozilla/5.0 (iPhone) Version/15.1 Mobile Safari/605.1.15', 'Mozilla/5.0 Chrome/152.0 Safari/537.36', 'Android Firefox/120.0']) assert.equal(gameUserAgent(ua), ua);
  assert.match(gameUserAgent('Android Version/4.0 Chrome/90.0 Safari/537.36'), /Chrome\/90\.0/);
});
