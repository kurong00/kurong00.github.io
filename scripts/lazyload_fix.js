'use strict';


// Replace the plugin runtime after injection, without editing node_modules.
hexo.extend.filter.register('after_render:html', function (html) {
  return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, function (tag, code) {
    if (!code.includes('imageLazyLoadSetting.processImages=') || !code.includes('data-original')) return tag;
    return '<script src="' + hexo.extend.helper.get('url_for').call(hexo, 'js/image-lazyload.js') + '"></script>';
  });
}, 110);

