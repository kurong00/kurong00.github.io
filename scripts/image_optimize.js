'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const cheerio = require('cheerio');
let variants = new Map();

function key(url) {
  try {
    const parsed = new URL(url, hexo.config.url);
    if (parsed.origin !== new URL(hexo.config.url).origin) return null;
    return decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  } catch (_) { return null; }
}

hexo.extend.generator.register('optimized-images', async function () {
  variants = new Map();
  const routes = [];
  const cache = path.join(hexo.base_dir, '.image-cache');
  fs.mkdirSync(cache, { recursive: true });
  const assets = hexo.model('PostAsset').toArray().concat(hexo.model('Asset').toArray());
  let converted = 0;
  for (const asset of assets) {
    if (!/\.(jpe?g|png)$/i.test(asset.path || '') || !fs.existsSync(asset.source)) continue;
    const input = fs.readFileSync(asset.source);
    if (input.length < 200 * 1024) continue;
    try {
      const metadata = await sharp(input).metadata();
      if ((metadata.pages || 1) > 1) continue;
      const rotated = metadata.orientation >= 5 && metadata.orientation <= 8;
      const width = rotated ? metadata.height : metadata.width;
      const hash = crypto.createHash('sha256').update(input).update('webp-v1-q82-' + sharp.versions.sharp).digest('hex').slice(0, 24);
      const sizes = [...new Set([Math.min(800, width), Math.min(1600, width)])];
      const outputs = [];
      for (const size of sizes) {
        const route = 'img/optimized/' + hash + '-' + size + '.webp';
        const file = path.join(cache, hash + '-' + size + '.webp');
        if (!fs.existsSync(file)) {
          const buffer = await sharp(input).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
          fs.writeFileSync(file, buffer);
          converted++;
        }
        if (!routes.some(item => item.path === route)) routes.push({ path: route, data: () => fs.createReadStream(file) });
        outputs.push({ width: size, url: hexo.extend.helper.get('url_for').call(hexo, route) });
      }
      const root = (hexo.config.root || '/').replace(/^\/+/, '');
      variants.set(root + asset.path.replace(/\\/g, '/'), outputs);
    } catch (error) {
      hexo.log.warn('Image optimization skipped %s: %s', asset.path, error.message);
    }
  }
  hexo.log.info('Image optimization: %d new variants; %d cached routes.', converted, routes.length);
  return routes;
});

// Rewrite only visible article images, after lazy-load markup is generated.
hexo.extend.filter.register('after_render:html', function (html) {
  if (!variants.size || !html.includes('post-container')) return html;
  const $ = cheerio.load(html, { decodeEntities: false });
  let changed = false;
  $('.post-container img').each(function () {
    const image = $(this);
    if (image.closest('.aplayer, .livephoto-container').length || image.attr('data-no-optimize') !== undefined) return;
    const original = image.attr('data-original') || image.attr('src');
    const options = variants.get(key(original));
    if (!options || image.attr('srcset')) return;
    changed = true;
    const srcset = options.map(item => item.url + ' ' + item.width + 'w').join(', ');
    image.attr('data-full-src', original);
    image.attr('sizes', '(max-width: 767px) calc(100vw - 40px), 750px');
    if (image.attr('data-original')) {
      image.attr('data-original', options[options.length - 1].url);
      image.attr('data-lazy-srcset', srcset);
    } else {
      image.attr('src', options[options.length - 1].url);
      image.attr('srcset', srcset);
    }
  });
  return changed ? $.html() : html;
}, 120);
