'use strict';

// Enable CDN for images in /img/ directory
// Matches /img/... and replaces with CDN prefix
hexo.extend.filter.register('after_render:html', function(html, data){
  // Skip CDN rewrite if running in server mode (local preview)
  if (hexo.env.cmd === 'server' || hexo.env.cmd === 's') {
    return html;
  }

  var config = hexo.config;
  if (!config.cdn || !config.cdn.enable || !config.cdn.prefix) {
    return html;
  }

  var cdnPrefix = config.cdn.prefix;
  if (cdnPrefix.endsWith('/')) {
    cdnPrefix = cdnPrefix.substring(0, cdnPrefix.length - 1);
  }

  // Replace '/img/...' with 'CDN_PREFIX/img/...'
  // Only matches paths starting with /img/ to avoid replacing external URLs or other assets
  // Captures:
  // 1. Preceding quote or paren: (["'\(\s]) -> actually we want quote or paren or start of string? 
  //    Usually src="/img/..." -> " is before. url(/img/...) -> ( is before.
  //    We use ([\"\'\(]) to be safe.
  // 2. The path content after /img/
  // 3. The closing quote or paren
  
  return html.replace(/([\"\'\(])\/img\/([^\s\"\'\)]+)([\"\'\)])/g, function(match, p1, p2, p3) {
    // p1: " or ' or (
    // p2: path after /img/ (e.g. avatar.jpg)
    // p3: " or ' or )
    
    // Check if it's strictly /img/ and not //img/ (protocol relative)
    // The regex /([\"\'\(])\/img\/ matches " followed by /img/
    // If original was "//img/", it would be " followed by / followed by /img/.
    // But /img/ expects slash then i. 
    // If we have "//img/", the char before "img/" is "/".
    // My regex expects " or ' or ( before "/img/".
    // So src="//img/..." -> " is p1. / is next char. Regex expects /img/.
    // So "//img/" matches? 
    // No, because regex is `\/img\/`. It matches strictly `/img/`.
    // So `//img/` (two slashes) does NOT match `\/img\/` (one slash).
    // Wait. `//` contains `/`. 
    // If text is `src="//img/..."`.
    // `"` matches p1.
    // Next chars are `//img/`.
    // Regex expects `/img/`.
    // It sees `/`. Good.
    // It sees `/`. Bad. Expected `i`.
    // So `//img/` does NOT match.
    // `src="/img/..."` -> `"` matches p1. `/img/` matches. Good.
    
    return p1 + cdnPrefix + '/img/' + p2 + p3;
  });
});
