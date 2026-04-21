document.addEventListener('DOMContentLoaded', function () {
  var chips = Array.prototype.slice.call(document.querySelectorAll('.tag-chip'));
  var clearBtn = document.getElementById('tag-clear');
  var titleEl = document.getElementById('tag-posts-title');
  var listEl = document.getElementById('tag-posts');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.tag-post-row'));

  if (!clearBtn || !titleEl || !listEl) return;

  var selected = {};
  var activeCount = 0;
  var total = rows.length;

  listEl.style.minHeight = Math.ceil(listEl.getBoundingClientRect().height) + 'px';

  var rowTags = rows.map(function (r) {
    var raw = r.getAttribute('data-tags') || '';
    if (!raw) return [];
    return raw.split('|');
  });

  function update() {
    if (activeCount === 0) {
      clearBtn.style.visibility = 'hidden';
      clearBtn.style.pointerEvents = 'none';
      clearBtn.textContent = 'Clear all';
      titleEl.textContent = 'All Posts (' + total + ')';
      rows.forEach(function (r) {
        r.style.display = '';
      });
      return;
    }

    clearBtn.style.visibility = 'visible';
    clearBtn.style.pointerEvents = 'auto';
    clearBtn.textContent = 'Clear all (' + activeCount + ')';

    var shown = 0;
    rows.forEach(function (r, idx) {
      var tags = rowTags[idx];
      var ok = false;
      for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        if (tag && selected[tag]) {
          ok = true;
          break;
        }
      }
      r.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    titleEl.textContent = 'Filtered Posts (' + shown + ')';
  }

  chips.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tag = btn.getAttribute('data-tag');
      if (!tag) return;
      if (selected[tag]) {
        delete selected[tag];
        activeCount--;
        btn.classList.remove('is-active');
      } else {
        selected[tag] = true;
        activeCount++;
        btn.classList.add('is-active');
      }
      update();
    });
  });

  clearBtn.addEventListener('click', function () {
    selected = {};
    activeCount = 0;
    chips.forEach(function (btn) {
      btn.classList.remove('is-active');
    });
    update();
  });

  update();
});
