'use strict';

// Run after the player plugin has injected its assets. Inspect actual elements,
// rather than marker strings mentioned by the theme's inline scripts.
hexo.extend.filter.register('after_render:html', function (html) {
  const hasPlayer = /<(?:div|meting-js)\b[^>]*>/gi;
  let tag;
  while ((tag = hasPlayer.exec(html))) {
    if (/^<meting-js\b/i.test(tag[0])) return html;
    const classes = tag[0].match(/\bclass\s*=\s*(["'])(.*?)\1/i);
    if (classes && classes[2].split(/\s+/).some(function (name) {
      return ['aplayer', 'aplayer-tag-marker', 'meting-tag-marker'].includes(name);
    })) return html;
  }

  return html
    .replace(/<script\b[^>]*\bsrc\s*=\s*(["'])[^"']*(?:APlayer|Meting)\.min\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script>/gi, '')
    .replace(/<link\b[^>]*\bhref\s*=\s*(["'])[^"']*\/(?:APlayer\.min|aplayer)\.css(?:\?[^"']*)?\1[^>]*>/gi, '');
}, 100);
