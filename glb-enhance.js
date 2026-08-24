/* German LifeBox — shared enhancement layer.
   Every block guards for the markup it needs, so this file is safe on
   every page regardless of which components that page has. */
/* GLB-ENH-V1 — progressive accessibility layer. Runs last; enhances the existing
   components rather than replacing their behaviour. */
(function () {
  'use strict';
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function watch(el, fn) {
    fn();
    if (window.MutationObserver) new MutationObserver(fn).observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── Mobile menu: aria state, Escape, outside click, resize ── */
  var mBtn = document.getElementById('mobileMenuBtn');
  var mMenu = document.getElementById('mobileMenu');
  if (mBtn && mMenu) {
    mBtn.setAttribute('aria-controls', 'mobileMenu');
    var close = function () {
      if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
      else { mMenu.classList.remove('open'); mBtn.classList.remove('open'); }
    };
    watch(mMenu, function () {
      var open = mMenu.classList.contains('open');
      mBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      mBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && mMenu.classList.contains('open')) { close(); mBtn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!mMenu.classList.contains('open')) return;
      if (mMenu.contains(e.target) || mBtn.contains(e.target)) return;
      close();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && mMenu.classList.contains('open')) close();
    });
  }

  /* ── Theme toggle: announce the action, not the current state ── */
  var tBtn = document.getElementById('themeBtn');
  if (tBtn) {
    var root = document.documentElement;
    var label = function () {
      var dark = root.getAttribute('data-theme') !== 'light';
      tBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    label();
    if (window.MutationObserver) new MutationObserver(label).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ── Current page in nav ── */
  $$('nav a.active').forEach(function (a) { a.setAttribute('aria-current', 'page'); });

  /* ── FAQ accordions: focusable, operable, announced ── */
  $$('.faq-q').forEach(function (q, i) {
    var item = q.closest('.faq-item');
    var ans = item && item.querySelector('.faq-a');
    q.setAttribute('role', 'button');
    if (!q.hasAttribute('tabindex')) q.setAttribute('tabindex', '0');
    if (ans) {
      if (!ans.id) ans.id = 'glb-faq-a-' + i;
      q.setAttribute('aria-controls', ans.id);
    }
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); q.click(); }
    });
    if (item) watch(item, function () {
      var open = item.classList.contains('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (ans) ans.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
  });

  /* ── Interactive checklists: real checkbox semantics ── */
  $$('.ic-item').forEach(function (it) {
    it.setAttribute('role', 'checkbox');
    if (!it.hasAttribute('tabindex')) it.setAttribute('tabindex', '0');
    var box = it.querySelector('.ic-box');
    if (box) box.setAttribute('aria-hidden', 'true');
    it.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); it.click(); }
    });
    watch(it, function () { it.setAttribute('aria-checked', it.classList.contains('checked') ? 'true' : 'false'); });
  });

  /* ── Wide tables: keyboard-scrollable regions ── */
  $$('.table-scroll').forEach(function (w) {
    if (w.scrollWidth > w.clientWidth + 4) w.setAttribute('tabindex', '0');
  });

  /* ── Decorative emoji shouldn't be read out as words ── */
  $$('.faq-arrow').forEach(function (el) { el.setAttribute('aria-hidden', 'true'); });
})();
/* GLB-ENH-V2 */
(function(){'use strict';

  /* ── Reading progress for long article pages ── */
  (function () {
    var art = document.querySelector('article') || document.querySelector('main');
    if (!art || art.offsetHeight < window.innerHeight * 2.5) return;
    var bar = document.createElement('div');
    bar.className = 'glb-readbar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span></span>';
    document.body.appendChild(bar);
    var fill = bar.firstChild, ticking = false;
    function update() {
      var start = art.offsetTop, len = art.offsetHeight - window.innerHeight;
      var pct = len > 0 ? (window.scrollY - start) / len : 0;
      fill.style.width = Math.max(0, Math.min(1, pct)) * 100 + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  })();

  /* ── Checklist: live progress, keyboard-operable reset, confirm, print ── */
  (function () {
    var list = document.getElementById('checklist');
    var count = document.getElementById('checkCount');
    if (!list || !count) return;
    count.setAttribute('role', 'status');
    count.setAttribute('aria-live', 'polite');
    count.setAttribute('aria-atomic', 'true');

    var bar = document.querySelector('.check-progress-bar');
    if (bar) {
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-label', 'Checklist progress');
    }
    function syncValue() {
      if (!bar) return;
      var items = list.querySelectorAll('.ic-item').length;
      var done = list.querySelectorAll('.ic-item.checked').length;
      bar.setAttribute('aria-valuenow', items ? Math.round(done / items * 100) : 0);
      bar.setAttribute('aria-valuetext', done + ' of ' + items + ' complete');
    }
    syncValue();
    list.addEventListener('click', function () { setTimeout(syncValue, 0); });

    /* The existing reset is an <a> with no href: give it button semantics,
       keyboard operation, and a confirm step before it wipes saved progress. */
    var reset = document.getElementById('resetChecklist');
    if (!reset) return;
    reset.setAttribute('role', 'button');
    if (!reset.hasAttribute('tabindex')) reset.setAttribute('tabindex', '0');
    reset.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); reset.click(); }
    });
    reset.addEventListener('click', function (e) {
      if (reset.getAttribute('data-glb-confirmed') === '1') { reset.removeAttribute('data-glb-confirmed'); return; }
      e.preventDefault();
      e.stopImmediatePropagation();
      if (window.confirm('Clear every tick on this checklist? This only affects this device.')) {
        reset.setAttribute('data-glb-confirmed', '1');
        /* a synthetic event, not .click(): the DOM spec's click-in-progress flag
           silently swallows a nested element.click() call */
        reset.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        setTimeout(syncValue, 0);
      }
    }, true);

    var print = document.createElement('button');
    print.type = 'button';
    print.className = 'checklist-reset';
    print.textContent = 'Print / save as PDF';
    reset.parentNode.insertBefore(print, reset.nextSibling);
    print.addEventListener('click', function () { window.print(); });
  })();
})();
/* GLB-ENH-V3 — vocabulary search + flashcard copy. Additive: the existing
   accordion, expand-all and scroll-spy behaviour is untouched. */
(function () {
  'use strict';
  var input = document.getElementById('vocabSearch');
  var clearBtn = document.getElementById('vocabSearchClear');
  var status = document.getElementById('vocabSearchStatus');
  var article = document.querySelector('article');
  if (!input || !article) return;

  /* ── normalise so "grussen" finds "grüßen" and "Fussgangerzone" finds "Fußgängerzone" ── */
  function norm(t) {
    return t.toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
      .replace(/\s+/g, ' ').trim();
  }

  /* ── index every searchable entry once ── */
  var entries = [];
  Array.prototype.forEach.call(article.querySelectorAll('.word-card'), function (el) {
    entries.push({ el: el, text: norm(el.textContent), table: null });
  });
  Array.prototype.forEach.call(article.querySelectorAll('.vocab-table tr, .emg-table tr'), function (tr) {
    if (tr.querySelector('th')) return;
    entries.push({ el: tr, text: norm(tr.textContent), table: tr.closest('table') });
  });
  if (!entries.length) return;

  var sections = Array.prototype.slice.call(article.querySelectorAll('.g-section'));
  var nonSections = Array.prototype.filter.call(article.children, function (n) {
    return !n.classList.contains('g-section');
  });
  var accordions = Array.prototype.slice.call(article.querySelectorAll('.vocab-list .faq-item, .faq-item'));
  var tables = Array.prototype.slice.call(article.querySelectorAll('.vocab-table, .emg-table'));
  var openBefore = null;

  function show(el, on) { el.classList.toggle('vs-hide', !on); }

  /* ── highlight, with the original markup stashed for restore ── */
  function highlight(el, re) {
    if (el.__vsOrig === undefined) el.__vsOrig = el.innerHTML;
    else el.innerHTML = el.__vsOrig;
    if (!re) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) if (re.test(n.nodeValue)) nodes.push(n);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      var last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(node.nodeValue)) !== null) {
        frag.appendChild(document.createTextNode(node.nodeValue.slice(last, m.index)));
        var mk = document.createElement('mark');
        mk.textContent = m[0];
        frag.appendChild(mk);
        last = m.index + m[0].length;
        if (m[0] === '') re.lastIndex++;
      }
      frag.appendChild(document.createTextNode(node.nodeValue.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function restoreHighlights() {
    entries.forEach(function (e) {
      if (e.el.__vsOrig !== undefined) { e.el.innerHTML = e.el.__vsOrig; e.el.__vsOrig = undefined; }
    });
  }

  function reset() {
    restoreHighlights();
    entries.forEach(function (e) { show(e.el, true); });
    sections.concat(nonSections).forEach(function (el) { show(el, true); });
    accordions.forEach(function (a) { show(a, true); });
    if (openBefore) {
      accordions.forEach(function (a, i) { a.classList.toggle('open', !!openBefore[i]); });
      openBefore = null;
    }
    status.textContent = '';
    status.classList.remove('is-empty');
    clearBtn.hidden = true;
  }

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function run(raw) {
    var q = norm(raw);
    if (q.length < 2) { reset(); return; }
    if (!openBefore) openBefore = accordions.map(function (a) { return a.classList.contains('open'); });
    clearBtn.hidden = false;
    restoreHighlights();

    var re = null;
    try { re = new RegExp(esc(raw.trim()), 'gi'); } catch (e) { re = null; }

    var hits = 0;
    var hitSections = [];
    entries.forEach(function (e) {
      var match = e.text.indexOf(q) !== -1;
      show(e.el, match);
      if (match) {
        hits++;
        highlight(e.el, re);
        var sec = e.el.closest('.g-section');
        if (sec && hitSections.indexOf(sec) === -1) hitSections.push(sec);
      }
    });

    /* a category with no surviving rows collapses out of the way */
    tables.forEach(function (t) {
      var live = t.querySelectorAll('tr:not(.vs-hide):not(:first-child)').length;
      var item = t.closest('.faq-item');
      if (item) { show(item, live > 0); item.classList.toggle('open', live > 0); }
    });
    accordions.forEach(function (a) {
      if (a.querySelector('table')) return;
      var live = a.querySelectorAll('.word-card:not(.vs-hide)').length;
      if (a.querySelector('.word-card')) show(a, live > 0);
    });

    sections.forEach(function (s) { show(s, hitSections.indexOf(s) !== -1); });
    nonSections.forEach(function (n) { show(n, false); });

    if (hits) {
      status.classList.remove('is-empty');
      status.innerHTML = '<b>' + hits + '</b> ' + (hits === 1 ? 'match' : 'matches') +
        ' in ' + hitSections.length + ' ' + (hitSections.length === 1 ? 'category' : 'categories') +
        ' &mdash; press Esc to clear';
    } else {
      status.classList.add('is-empty');
      status.innerHTML = '<b>No matches.</b> Try the other language, or a shorter word &mdash; ' +
        'search covers German, English and the examples.';
    }
  }

  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { run(input.value); }, 120);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') { input.value = ''; reset(); }
  });
  clearBtn.addEventListener('click', function () { input.value = ''; reset(); input.focus(); });

  /* ── copy a category as tab-separated German→English (Anki / Quizlet import) ── */
  function copyText(text, btn) {
    var done = function () {
      var was = btn.textContent;
      btn.textContent = 'Copied \u2713';
      btn.classList.add('is-done');
      setTimeout(function () { btn.textContent = was; btn.classList.remove('is-done'); }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
    } else fallback(text, done);
  }
  function fallback(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:absolute;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  tables.forEach(function (t) {
    var inner = t.closest('.faq-a-inner') || t.parentNode;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vcopy';
    btn.textContent = 'Copy list for flashcards';
    btn.title = 'Copies German and English separated by a tab \u2014 ready to paste into Anki or Quizlet';
    inner.insertBefore(btn, inner.firstChild);
    btn.addEventListener('click', function () {
      var rows = Array.prototype.filter.call(t.querySelectorAll('tr'), function (tr) {
        return !tr.querySelector('th') && !tr.classList.contains('vs-hide');
      });
      var text = rows.map(function (tr) {
        var c = tr.querySelectorAll('td');
        return c.length > 1 ? c[0].textContent.trim() + '\t' + c[1].textContent.trim() : '';
      }).filter(Boolean).join('\n');
      if (text) copyText(text, btn);
    });
  });
})();
/* GLB-ENH-V4 — exposes the state of the existing tab/filter buttons and adds
   keyboard navigation. Purely additive: click behaviour is unchanged. */
(function () {
  'use strict';
  var slice = function (n) { return Array.prototype.slice.call(n); };
  function watch(el, fn) {
    fn();
    if (window.MutationObserver) new MutationObserver(fn).observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── Tab groups ── */
  slice(document.querySelectorAll('.wyn-tabs, .path-tabs')).forEach(function (group, gi) {
    var tabs = slice(group.querySelectorAll('[data-tab], [data-path]'));
    if (tabs.length < 2) return;
    group.setAttribute('role', 'tablist');
    tabs.forEach(function (tab, i) {
      var panelId = tab.getAttribute('data-tab') || tab.getAttribute('data-path');
      var panel = panelId ? document.getElementById(panelId) : null;
      tab.setAttribute('role', 'tab');
      if (!tab.id) tab.id = 'glb-tab-' + gi + '-' + i;
      if (panel) {
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
      }
      watch(tab, function () {
        var on = tab.classList.contains('active');
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.setAttribute('tabindex', on ? '0' : '-1');
      });
      tab.addEventListener('keydown', function (e) {
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        var next = null;
        if (d) next = tabs[(i + d + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        next.focus();
        next.click();
      });
    });
    /* if the page marked none active, make the first tab reachable */
    if (!tabs.some(function (t) { return t.classList.contains('active'); })) tabs[0].setAttribute('tabindex', '0');
  });

  /* ── Filter / pill-select groups: expose pressed state ── */
  [['.path-filter-btn', 'active'], ['.pill-select-btn', 'selected']].forEach(function (pair) {
    slice(document.querySelectorAll(pair[0])).forEach(function (btn) {
      if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
      watch(btn, function () {
        btn.setAttribute('aria-pressed', btn.classList.contains(pair[1]) ? 'true' : 'false');
      });
    });
  });

  /* ── Resources: announce how many resources a filter leaves ── */
  var filterRow = document.querySelector('.path-filter');
  if (filterRow && document.querySelector('.res-card')) {
    var out = document.createElement('p');
    out.className = 'glb-filter-status';
    out.setAttribute('role', 'status');
    out.setAttribute('aria-live', 'polite');
    filterRow.parentNode.insertBefore(out, filterRow.nextSibling);
    var report = function () {
      var cards = slice(document.querySelectorAll('.res-card'));
      // Shared resources exist twice so each path can show them at its own point
      // in the journey. Only one copy is ever visible, so the duplicates must not
      // count towards the total — otherwise this reads "26 of 29" and the three
      // extra can never be found.
      var total = cards.filter(function (c) { return !c.hasAttribute('data-dupe'); }).length;
      var shown = cards.filter(function (c) { return c.style.display !== 'none'; }).length;
      var cats = slice(document.querySelectorAll('.res-category')).filter(function (c) { return c.style.display !== 'none'; }).length;
      out.innerHTML = '<b>' + shown + '</b> of ' + total + ' resources' +
        (cats ? ' across ' + cats + ' ' + (cats === 1 ? 'section' : 'sections') : '');
    };
    filterRow.addEventListener('click', function () { setTimeout(report, 0); });
    report();
  }
})();
/* GLB-ENH-V5 — active-section tracking for the sticky jump nav.
   Same behaviour as the guide pages, driven off the TOC's own hrefs. */
(function () {
  'use strict';
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc-scroll a'));
  if (!links.length || !window.IntersectionObserver) return;
  var strip = document.querySelector('.toc-scroll');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = links.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  }).filter(Boolean);

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + id); });
      var active = strip.querySelector('a.active');
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }, { rootMargin: '-124px 0px -60% 0px', threshold: 0 });
  targets.forEach(function (t) { obs.observe(t); });
})();

/* ══════════ GLB-ENH-V11 · renewal path & calendar reminder ══════════ */
(function () {
  'use strict';

  /* ── calendar reminder: .ics download + Google Calendar fallback ── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()); }
  function esc(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function fold(line) {
    /* RFC 5545: content lines are folded at 75 octets */
    var out = '', i = 0;
    while (line.length - i > 74) { out += line.substr(i, 74) + '\r\n '; i += 74; }
    return out + line.substr(i);
  }

  /* How many months this payment covered. Razorpay's redirect URL carries it
     (…-confirm.html?term=3m); if it doesn't arrive, the page offers a toggle. */
  function termFromUrl() {
    try {
      var q = new URLSearchParams(window.location.search);
      var t = (q.get('term') || q.get('months') || '').toLowerCase();
      return (t === '3' || t === '3m' || t === '3months') ? 3 : 1;
    } catch (e) { return 1; }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-glb-renew]'), function (btn) {
    var plan = btn.getAttribute('data-plan');
    var price = btn.getAttribute('data-price');
    var price3 = btn.getAttribute('data-price-3m');
    var link = btn.getAttribute('data-link');
    var months = termFromUrl();

    var wrap = btn.parentNode;
    var box = wrap.parentNode;
    var when = box.querySelector('.renew-when');
    var gcal = wrap.querySelector('.renew-gcal');
    var toggle = box.querySelector('[data-glb-term-toggle]');
    var due, title, body;

    function recompute() {
      var days = months === 3 ? 87 : 27;
      due = new Date();
      due.setUTCHours(12, 0, 0, 0);
      due.setUTCDate(due.getUTCDate() + days);
      title = 'Renew German LifeBox ' + plan + ' (' + (months === 3 && price3 ? price3 : price) + ')';
      body = 'Your Speaking Club ' + (months === 3 ? '3 months are' : 'month is') + ' nearly up. '
           + 'Renew through the same link to keep your Discord access without a gap: ' + link;

      var next = new Date(due.getTime() + 86400000);
      if (when) {
        when.hidden = false;
        when.textContent = 'Sets an all-day reminder for ' +
          due.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) +
          ' — a few days before your ' + (months === 3 ? '3 months run' : 'month runs') + ' out.';
      }
      if (gcal) {
        gcal.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
          + '&text=' + encodeURIComponent(title)
          + '&dates=' + ymd(due) + '/' + ymd(next)
          + '&details=' + encodeURIComponent(body);
      }
      if (toggle) {
        toggle.textContent = months === 3
          ? 'Actually I paid for 1 month — use that instead'
          : 'I paid for the 3-month plan — use that instead';
      }
    }
    recompute();
    if (toggle) toggle.addEventListener('click', function () { months = months === 3 ? 1 : 3; recompute(); });

    btn.addEventListener('click', function () {
      var next = new Date(due.getTime() + 86400000);
      var lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0',
        'PRODID:-//German LifeBox//Renewal Reminder//EN', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:glb-renew-' + plan.toLowerCase() + '-' + Date.now() + '@germanlifebox.com',
        'DTSTAMP:' + ymd(new Date()) + 'T120000Z',
        'DTSTART;VALUE=DATE:' + ymd(due),
        'DTEND;VALUE=DATE:' + ymd(next),
        fold('SUMMARY:' + esc(title)),
        fold('DESCRIPTION:' + esc(body)),
        fold('URL:' + esc(link)),
        'BEGIN:VALARM', 'TRIGGER:-PT9H', 'ACTION:DISPLAY',
        fold('DESCRIPTION:' + esc(title)), 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'
      ];
      var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'german-lifebox-' + plan.toLowerCase() + '-renewal.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      var was = btn.textContent;
      btn.textContent = 'Reminder downloaded \u2713';
      btn.classList.add('is-done');
      setTimeout(function () { btn.textContent = was; btn.classList.remove('is-done'); }, 3000);
    });
  });

  /* ── switch between the first-month form and the renewal confirmation ── */
  var flow = document.getElementById('bookingFlow');
  var renew = document.getElementById('alreadyDoneNotice');
  if (!flow || !renew) return;
  function show(which) {
    flow.style.display = which === 'form' ? '' : 'none';
    renew.style.display = which === 'form' ? 'none' : 'block';
    /* If the one-time-use lock already fired, its Tally listener was never wired,
       so a member who opens the form by hand would have no way out. Enable the
       continue button for them. */
    if (which === 'form') {
      var wrap = document.getElementById('continueWrap');
      var hint = document.getElementById('continueHint');
      if (wrap && wrap.style.pointerEvents === 'none') {
        wrap.style.opacity = '1';
        wrap.style.pointerEvents = 'auto';
        if (hint) hint.textContent = 'Submit the form above, then continue \u2192';
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-show-renew]'), function (b) {
    b.addEventListener('click', function () { show('renew'); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-show-form]'), function (b) {
    b.addEventListener('click', function () { show('form'); });
  });
})();

/* ══════════ GLB-ENH-V12 · hide options whose payment link isn't set yet ══════════ */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('[data-glb-hide-if-unset]'), function (el) {
    var link = el.querySelector('a[href]');
    /* the stylesheet hides these by default, so revealing needs an explicit
       value — clearing the inline style would leave display:none in force */
    if (link && link.getAttribute('href').indexOf('PASTE_RZP_') === -1) el.style.display = 'block';
  });
})();

/* ══════════ GLB-ENH-V13 · "Say thanks" card ══════════
   #gratitudeBtn used to link straight out to a Razorpay payment link. It now opens
   a small card that thanks the visitor first and carries the Razorpay subscription
   button inside it — that button has its own fixed visual and does not sit well
   inline on individual pages.

   The card markup is built here rather than pasted into 24 pages, so the copy can
   be changed in one place.

   Razorpay's payment-button.js is loaded on FIRST OPEN, not at page load. Two
   reasons: the script injects its button where its own <script> tag sits, and can
   render zero-height inside a display:none parent; and this keeps a third-party
   payment script off every page view for visitors who never click. */
(function () {
  'use strict';

  var btn = document.getElementById('gratitudeBtn');
  if (!btn) return;

  var RZP_BUTTON_ID = 'pl_TMDs91gY2kgTh8';

  var overlay = document.createElement('div');
  overlay.className = 'grat-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'gratTitle');
  overlay.innerHTML =
    '<div class="grat-card">' +
      '<button type="button" class="grat-close" aria-label="Close">✕</button>' +
      '<div class="grat-emoji" aria-hidden="true">💛</div>' +
      '<h2 class="grat-title" id="gratTitle">Thank you</h2>' +
      '<p class="grat-body">You have not sent anything yet, and that is completely fine — ' +
        '<strong>thank you for even considering it.</strong></p>' +
      '<p class="grat-body">Whatever you are working towards right now — the exam, the ' +
        'application, the move — I hope it goes well for you.</p>' +
      '<div class="grat-rule"></div>' +
      '<div class="grat-pay" id="gratPay"></div>' +
      '<p class="grat-note">Everything on German LifeBox stays free either way.</p>' +
    '</div>';
  document.body.appendChild(overlay);

  var card    = overlay.querySelector('.grat-card');
  var closeEl = overlay.querySelector('.grat-close');
  var payEl   = overlay.querySelector('#gratPay');
  var loaded  = false;
  var lastFocus = null;

  function loadButton() {
    if (loaded) return;
    loaded = true;
    var form = document.createElement('form');
    var s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    s.async = true;
    s.setAttribute('data-payment_button_id', RZP_BUTTON_ID);
    form.appendChild(s);
    payEl.appendChild(form);
  }

  function open(e) {
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    loadButton();
    closeEl.focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  btn.addEventListener('click', open);
  closeEl.addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  /* keep tab focus inside the card while it is open */
  card.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = card.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
