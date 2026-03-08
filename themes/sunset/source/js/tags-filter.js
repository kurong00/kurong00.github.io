document.addEventListener('DOMContentLoaded', function () {
  var chips = Array.prototype.slice.call(document.querySelectorAll('.tag-chip'));
  var clearBtn = document.getElementById('tag-clear');
  var titleEl = document.getElementById('tag-posts-title');
  var listEl = document.getElementById('tag-posts');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.tag-post-row'));

  if (!clearBtn || !titleEl || !listEl) return;

  var selected = {};
  var total = rows.length;

  listEl.style.minHeight = Math.ceil(listEl.getBoundingClientRect().height) + 'px';

  function selectedCount() {
    var c = 0;
    for (var k in selected) if (selected[k]) c++;
    return c;
  }

  function update() {
    var active = selectedCount();
    if (active === 0) {
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
    clearBtn.textContent = 'Clear all (' + active + ')';

    var shown = 0;
    rows.forEach(function (r) {
      var tags = (r.getAttribute('data-tags') || '').split('|');
      var ok = false;
      for (var i = 0; i < tags.length; i++) {
        if (selected[tags[i]]) {
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
      var isOn = !!selected[tag];
      selected[tag] = !isOn;
      if (selected[tag]) btn.classList.add('is-active');
      else btn.classList.remove('is-active');
      update();
    });
  });

  clearBtn.addEventListener('click', function () {
    selected = {};
    chips.forEach(function (btn) {
      btn.classList.remove('is-active');
    });
    update();
  });

  update();
});
