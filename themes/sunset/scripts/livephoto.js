'use strict';

hexo.extend.tag.register('livephoto', function(args) {
  if (!args[0] || !args[1]) {
    return '<p style="color: red;">Live Photo tag requires a photo URL and a video URL.</p>';
  }

  let path = this.path;
  path = path.replace(/index\.html$/, '');
  if (!path.endsWith('/')) {
    path += '/';
  }

  const photoUrl = '/' + path + args[0];
  const videoUrl = '/' + path + args[1];

  return `
    <div class="livephoto-container" data-live-photo data-photo-src="${photoUrl}" data-video-src="${videoUrl}"></div>
  `;
});
