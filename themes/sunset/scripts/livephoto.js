'use strict';

hexo.extend.tag.register('livephoto', function(args) {
  const photoUrl = '/' + this.path + args[0];
  const videoUrl = '/' + this.path + args[1];

  if (!args[0] || !args[1]) {
    return '<p style="color: red;">Live Photo tag requires a photo URL and a video URL.</p>';
  }

  return `
    <div class="livephoto-container" data-live-photo data-photo-src="${photoUrl}" data-video-src="${videoUrl}"></div>
  `;
});