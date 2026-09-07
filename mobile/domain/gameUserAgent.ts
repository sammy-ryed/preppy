// Emscripten mistakes Android WebView's compatibility Version/4.0 token for
// Safari's version. Preserve the real Chromium version and all other tokens.
export function gameUserAgent(userAgent: string): string {
  if (!/Android/i.test(userAgent) || !/Chrome\/[\d.]+/.test(userAgent)) return userAgent;
  return userAgent.replace(/\sVersion\/[\d.]+(?=\s|$)/g, '');
}
