(function (window) {
  'use strict';
  var settings = window.imageLazyLoadSetting || {};
  var timer;

  function inViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.bottom >= 0 && rect.right >= 0 && rect.left <= window.innerWidth &&
      rect.top <= window.innerHeight * (settings.preloadRatio || 1);
  }

  function loadImage(el, retry) {
    var state = el.getAttribute('data-lazy-state');
    if (state === 'loading' || state === 'loaded' || (state === 'failed' && !retry)) return;
    if (el.hasAttribute('bg-lazy')) {
      el.removeAttribute('bg-lazy');
      el.setAttribute('data-lazy-state', 'loaded');
      return;
    }
    var src = el.getAttribute('data-original');
    if (!src) return;
    el.setAttribute('data-lazy-state', 'loading');
    var button = el.__lazyRetry;
    if (button) button.hidden = true;

    function cleanup() {
      el.removeEventListener('load', success);
      el.removeEventListener('error', failure);
    }
    function success() {
      cleanup();
      el.setAttribute('data-lazy-state', 'loaded');
      el.setAttribute('data-loaded', 'true');
      el.removeAttribute('data-original');
      if (button && button.parentNode) button.parentNode.removeChild(button);
      if (settings.onImageLoaded) settings.onImageLoaded(el);
    }
    function failure() {
      cleanup();
      el.setAttribute('data-lazy-state', 'failed');
      el.setAttribute('data-loaded', 'false');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.textContent = '图片加载失败，点击重试';
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          loadImage(el, true);
        });
        el.__lazyRetry = button;
        // Keep the retry control outside image links.
        var anchor = el.closest('a');
        var target = anchor || el;
        target.parentNode.insertBefore(button, target.nextSibling);
      }
      button.hidden = false;
    }
    el.addEventListener('load', success);
    el.addEventListener('error', failure);
    // Load on the visible element once, avoiding a preload plus second request.
    var srcset = el.getAttribute('data-lazy-srcset');
    if (srcset) el.setAttribute('srcset', srcset);
    el.src = src;
    if (el.complete && el.naturalWidth > 0) success();
  }

  function processImages() {
    var images = document.querySelectorAll('img[data-original], [bg-lazy]');
    for (var i = 0; i < images.length; i++) {
      if (inViewport(images[i])) loadImage(images[i], false);
    }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(processImages, 100);
  }
  settings.processImages = processImages;
  window.imageLazyLoadSetting = settings;
  // Capture scroll events from nested scrolling containers as well.
  document.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  processImages();
})(window);
