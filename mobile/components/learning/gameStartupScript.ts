// Observe Godot's exported startup overlay; never synthesize gameplay events.
export const gameStartupScript = `
(function () {
  if (window.__preppyStartupMonitor) return;
  window.__preppyStartupMonitor = true;
  var began = Date.now(), sawOverlay = false, started = false, sent = false;
  var phase = 'initializing the page', lastError = '';
  function errorText(value) {
    return String(value && value.message ? value.message : value || 'Unknown startup failure').slice(0, 500);
  }
  function report(message) {
    if (started || sent) return;
    sent = true;
    var chrome = navigator.userAgent.match(/Chrome\\/([0-9.]+)/);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'PREPPY_STARTUP_ERROR',message:
      (message + ' [Stage: ' + phase + '; WebView Chrome ' + (chrome ? chrome[1] : 'unknown') + ']').slice(0,700)}));
  }
  window.addEventListener('error', function (event) {
    if (event.message) { lastError = errorText(event.error || event.message); report(lastError); }
  });
  window.addEventListener('unhandledrejection', function (event) { lastError = errorText(event.reason); report(lastError); });
  var originalError = console.error;
  console.error = function () {
    lastError = Array.prototype.map.call(arguments, errorText).join(' ').slice(0,500);
    originalError.apply(console, arguments);
  };
  if (typeof WebAssembly !== 'undefined' && WebAssembly.instantiateStreaming) {
    var streaming = WebAssembly.instantiateStreaming.bind(WebAssembly);
    WebAssembly.instantiateStreaming = function (source, imports) {
      phase = 'compiling WebAssembly';
      return Promise.resolve(source).then(function (response) {
        var fallback = response.clone();
        return streaming(response, imports).catch(function () {
          phase = 'compiling WebAssembly without streaming';
          return fallback.arrayBuffer().then(function (bytes) { return WebAssembly.instantiate(bytes, imports); });
        });
      }).then(function (result) {
        phase = 'initializing Godot and its filesystem';
        return result;
      }).catch(function (error) { report('WebAssembly initialization failed: ' + errorText(error)); throw error; });
    };
  }
  var timer = setInterval(function () {
    var overlay = document.getElementById('status');
    if (overlay) sawOverlay = true;
    if (sawOverlay && !overlay) { started = true; clearInterval(timer); return; }
    var notice = document.getElementById('status-notice');
    var detail = notice && notice.textContent.trim();
    if (detail && getComputedStyle(notice).display !== 'none') {
      report(detail.slice(0,500));
      clearInterval(timer);
    } else if (Date.now() - began > 90000 && overlay) {
      var progress = document.getElementById('status-progress');
      var percent = progress && progress.max > 0 ? Math.round(100 * progress.value / progress.max) : 0;
      report('Startup stalled at ' + percent + '%.' + (lastError ? ' Last error: ' + lastError : ' No JavaScript error was reported.'));
      clearInterval(timer);
    }
  }, 500);
})(); true;
`;
