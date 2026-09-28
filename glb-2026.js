/* German LifeBox — 2026 site script. Every block checks for its markup,
   so this one file is safe on every page. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Nav: glass bar once the page scrolls ── */
  var nav = $('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 12); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Mobile menu ──
     Side effects (aria, scroll lock) follow the menu's real state, so they
     stay correct even if an older page script closes the menu itself. */
  var mBtn = $('.menu-btn'), mMenu = $('#mobileMenu');
  if (mBtn && mMenu) {
    var sync = function () {
      var open = mMenu.classList.contains('open');
      mBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      mBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (nav) nav.classList.toggle('scrolled', open || window.scrollY > 12);
    };
    var setMenu = function (open) { mMenu.classList.toggle('open', open); sync(); };
    if (window.MutationObserver) new MutationObserver(sync).observe(mMenu, { attributes: true, attributeFilter: ['class'] });
    mBtn.addEventListener('click', function (e) { e.stopPropagation(); setMenu(!mMenu.classList.contains('open')); });
    $$('a', mMenu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mBtn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) setMenu(false); });
  }

  /* ── Scroll reveal ── */
  var rev = $$('.reveal');
  if (rev.length) {
    if (reduce || !('IntersectionObserver' in window)) rev.forEach(function (el) { el.classList.add('in'); });
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      rev.forEach(function (el) { io.observe(el); });
    }
  }


  /* ── Split-flap board ──
     The row always has exactly as many tiles as the current word (no empty
     tiles), and each flip settles in well under half a second. */
  var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ-→,.';
  function Flap(el) {
    var words = (el.getAttribute('data-flap') || el.textContent).split('|');
    var tiles = [];
    el.textContent = '';
    var fit = function (n) {
      while (tiles.length < n) { var t = document.createElement('i'); t.textContent = '\u00a0'; el.appendChild(t); tiles.push(t); }
      while (tiles.length > n) { el.removeChild(tiles.pop()); }
    };
    this.set = function (word, instant) {
      el.setAttribute('aria-label', word);
      fit(word.length);
      tiles.forEach(function (t, k) {
        var target = word[k];
        if (instant || reduce || t.textContent === target) { t.textContent = target; return; }
        var n = 3 + k + Math.floor(Math.random() * 3), c = 0;
        (function step() {
          t.classList.remove('flip'); void t.offsetWidth; t.classList.add('flip');
          if (c >= n) { t.textContent = target; return; }
          t.textContent = CH[Math.floor(Math.random() * CH.length)]; c++;
          setTimeout(step, 55);
        })();
      });
    };
    this.words = words;
    this.set(words[0], true);
  }
  var heroFlapEl = $('.hero .flap');
  if (heroFlapEl) {
    var hf = new Flap(heroFlapEl), hi = 0;
    if (!reduce && hf.words.length > 1) setInterval(function () { if (document.hidden || window.scrollY > window.innerHeight) return; hi = (hi + 1) % hf.words.length; hf.set(hf.words[hi]); }, 3200);
  }
  var jFlapEl = $('#journeyFlap');
  var jFlap = null;
  if (jFlapEl) {
    var jw = $$('.xcard').map(function (c) { return c.getAttribute('data-flap'); });
    jFlapEl.setAttribute('data-flap', jw.join('|'));
    jFlap = new Flap(jFlapEl);
  }
  /* Page heroes: tiles flip in once, then cycle if several words are given */
  $$('.phero .flap').forEach(function (el) {
    var f = new Flap(el), w = f.words, k = 0;
    if (reduce) return;
    f.set(w[0].replace(/./g, '\u00a0'), true);
    setTimeout(function () { f.set(w[0]); }, 350);
    if (w.length > 1) setInterval(function () { if (document.hidden || window.scrollY > window.innerHeight) return; k = (k + 1) % w.length; f.set(w[k]); }, 3200);
  });
  window.__glbJourneyFlap = function (i) { if (jFlap) jFlap.set(jFlap.words[i]); };

  /* ── India / Germany clocks ── */
  var clocks = $$('[data-clock]');
  if (clocks.length && window.Intl) {
    var tick = function () {
      clocks.forEach(function (el) {
        try { el.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: el.getAttribute('data-clock') }).format(new Date()); } catch (e) {}
      });
    };
    tick(); setInterval(tick, 20000);
  }

  /* ── Expanding journey cards + rotating headline word ── */
  var xwrap = $('.xcards');
  if (xwrap) {
    var cards = $$('.xcard', xwrap);
    var words = $$('.rotator span');
    var prev = 0, current = 0, timer = null, userTook = false, visible = false;
    var activate = function (i) {
      current = i;
      cards.forEach(function (c, k) {
        var on = k === i;
        c.classList.toggle('active', on);
        c.setAttribute('aria-expanded', on ? 'true' : 'false');
        var go = $('.xcard-go', c); if (go) go.tabIndex = on ? 0 : -1;
      });
      words.forEach(function (w, k) { w.classList.toggle('on', k === i); w.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      sizeWord();
      if (window.__glbJourneyFlap && prev !== i) window.__glbJourneyFlap(i);
      prev = i;
    };
    var rot = $('.rotator');
    var sizeWord = function () { if (rot && words[current]) rot.style.width = words[current].offsetWidth + 'px'; };
    window.addEventListener('resize', sizeWord);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeWord);
    var stop = function () { userTook = true; clearInterval(timer); timer = null; };
    var start = function () {
      if (reduce || userTook || timer) return;
      timer = setInterval(function () { if (visible) activate((current + 1) % cards.length); }, 4200);
    };
    cards.forEach(function (c, i) {
      c.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) { stop(); activate(i); } });
      c.addEventListener('click', function (e) {
        if (!c.classList.contains('active')) { e.preventDefault(); stop(); activate(i); }
      });
      c.addEventListener('keydown', function (e) {
        if (e.target !== c) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stop(); activate(i); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stop(); var n = (i + 1) % cards.length; activate(n); cards[n].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stop(); var p = (i - 1 + cards.length) % cards.length; activate(p); cards[p].focus(); }
      });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.35 }).observe(xwrap);
    } else visible = true;
    activate(0); start();
  }

  /* ── Marquee: clone the row once so the loop is seamless ── */
  $$('.marquee-track').forEach(function (t) {
    $$(':scope > *', t).forEach(function (el) {
      var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; t.appendChild(c);
    });
  });

  /* ── Shared numbers (edit stats.json to update sitewide) ── */
  if ($('[data-stat]')) {
    fetch('stats.json').then(function (r) { return r.json(); }).then(function (s) {
      $$('[data-stat="yt-full"]').forEach(function (el) { el.textContent = s.ytSubscribersFull; });
      $$('[data-stat="yt-short"]').forEach(function (el) { el.textContent = s.ytSubscribersShort; });
      $$('[data-stat="whatsapp"]').forEach(function (el) { el.textContent = s.whatsappCommunity; });
    }).catch(function () {});
  }

  /* ── Zitat des Tages ── */
  var q = $('#quote-display');
  if (q) {
    var quotes = [
      ['Jede Reise beginnt mit einem ersten Schritt.', 'Every journey begins with a first step.'],
      ['Wer kämpft, kann verlieren. Wer nicht kämpft, hat schon verloren.', "Don't fight and you've already lost."],
      ['Übung macht den Meister.', 'Practice makes perfect.'],
      ['Der Weg ist das Ziel.', 'The journey is the destination.'],
      ['Ohne Fleiß kein Preis.', 'No pain, no gain.'],
      ['Träume nicht dein Leben, lebe deinen Traum.', "Don't dream your life, live your dream."],
      ['Aller Anfang ist schwer.', 'Every beginning is hard.'],
      ['Was dich nicht umbringt, macht dich stärker.', "What doesn't kill you makes you stronger."],
      ['Geduld ist eine Tugend.', 'Patience is a virtue.'],
      ['Man lernt nie aus.', 'You never stop learning.'],
      ['Wo ein Wille ist, ist auch ein Weg.', "Where there's a will, there's a way."],
      ['Der frühe Vogel fängt den Wurm.', 'The early bird catches the worm.'],
      ['Jeder Tag ist eine neue Chance.', 'Every day is a new chance.'],
      ['Klein anfangen, groß denken.', 'Start small, think big.'],
      ['Fehler sind die besten Lehrer.', 'Mistakes are the best teachers.'],
      ['Sprache ist der Schlüssel zur Welt.', 'Language is the key to the world.'],
      ['Wer wagt, gewinnt.', 'Who dares, wins.'],
      ['Stillstand ist Rückschritt.', 'Standing still is moving backward.'],
      ['Heute ist der erste Tag vom Rest deines Lebens.', 'Today is the first day of the rest of your life.'],
      ['Konstanz schlägt Talent.', 'Consistency beats talent.'],
      ['Vertrau dem Prozess.', 'Trust the process.'],
      ['Eine neue Sprache ist ein neues Leben.', 'A new language is a new life.'],
      ['Sei nicht perfekt, sei mutig.', "Don't be perfect, be brave."],
      ['Wer fragt, der lernt.', 'He who asks, learns.'],
      ['Deutschland wartet auf dich.', 'Germany is waiting for you.'],
      ["Du bist näher dran, als du denkst.", "You're closer than you think."]
    ];
    var d = new Date();
    var pick = quotes[(d.getFullYear() * 1000 + d.getMonth() * 31 + d.getDate()) % quotes.length];
    q.innerHTML = '';
    var b = document.createElement('b'); b.textContent = pick[0];
    q.appendChild(b); q.appendChild(document.createTextNode(' — ' + pick[1]));
  }
})();

/* ── "Where do I start?" check-in helper ──
   Three answers → a route of three existing pages plus honest notes.
   Nothing is stored or sent. Every claim mirrors what the linked pages say. */
(function () {
  'use strict';
  var root = document.querySelector('[data-checkin]');
  if (!root) return;
  var qs = Array.prototype.slice.call(root.querySelectorAll('.kq'));
  var result = root.querySelector('.kresult');
  var stepEl = root.querySelector('.kiosk-step');
  var bar = root.querySelector('.kiosk-bar i');
  var back = root.querySelector('.kback');
  var reset = root.querySelector('.kreset');
  var ans = {}, cur = 0;

  var P = {
    timeline:  ['germany-study-timeline.html', 'Germany Timeline Planner', 'Map your intake and every deadline'],
    aps:       ['aps-checklist.html', 'APS Document Checklist', 'Required for most Indian applicants'],
    uni:       ['university-application-checklist.html', 'University Application Checklist', 'Programmes, documents, uni-assist'],
    study:     ['study.html', 'Study in Germany', 'The full roadmap, including Bachelor’s entry'],
    ausb:      ['ausbildung.html', 'Ausbildung in Germany', 'Earn while you train, what it involves'],
    elig:      ['ausbildung-eligibility-checklist.html', 'Ausbildung Eligibility Checklist', 'School certificate, German, visa'],
    finder:    ['ausbildung-profession-finder.html', 'Ausbildung Profession Finder', 'Filter 50 professions by German level'],
    aroad:     ['ausbildung-roadmap.html', 'Ausbildung Roadmap', 'From choosing to your contract'],
    test:      ['german-level-test.html', 'Free German Level Test', '30 questions, about five minutes'],
    learn:     ['learn-german.html', 'Learn German: A1 to B1', 'What to learn at each level'],
    vocab:     ['a1-vocabulary-pack.html', 'A1 Survival Vocabulary', '800+ words and phrases, free'],
    costs:     ['cost-calculator.html', 'Moving-Cost Calculator', 'What it costs in ₹, line by line']
  };
  var YT_LOW = 'https://youtu.be/HpxHTZR83h4', YT_STORY = 'https://youtu.be/2IXgFsPdaa4', YT_LEARN = 'https://youtu.be/S7ev3b69YEg';

  function route(a) {
    var r = { steps: [], notes: [] };
    var noGerman = a.level === 'none' || a.level === 'a' || a.level === 'unknown';
    if (a.goal === 'study') {
      r.gleis = 'Gleis 02 · Studium';
      if (a.grades === 'school') {
        r.title = 'Study in Germany, starting from school';
        r.steps = [P.study, P.timeline, P.aps];
        r.notes.push('For a Bachelor’s, 12th grade alone isn’t enough for direct entry. From Winter Semester 2026/27 you need at least 70% in Class XII for the Studienkolleg (foundation year) route. The Study page explains the routes.');
      } else {
        r.title = 'Study in Germany: your university route';
        r.steps = [P.timeline, P.aps, P.uni];
        r.notes.push('Master’s after a degree in Engineering, Commerce / Finance / Economics or Business / Management? From the Summer Semester 2027 intake you also need the dMAT as part of your APS documents. <a href="aps-checklist.html#dmat">What the dMAT is →</a>');
      }
      if (noGerman) r.notes.push('Many Master’s programmes are taught in English and ask for IELTS/TOEFL instead of German. German-taught programmes usually need B1–B2. Either way, German makes daily life easier. <a href="learn-german.html">Start A1 alongside →</a>');
      if (a.grades === 'low') r.notes.push('Lower grades narrow your options; they don’t end them. <a href="' + YT_LOW + '" target="_blank" rel="noopener">How to get admission with a low CGPA ↗</a> · <a href="' + YT_STORY + '" target="_blank" rel="noopener">My own low-grades story ↗</a>');
    } else if (a.goal === 'ausb') {
      r.gleis = 'Gleis 03 · Ausbildung';
      if (noGerman) {
        r.title = 'Ausbildung: German comes first';
        r.steps = [P.test, P.learn, P.elig];
        r.notes.push('Ausbildung is trained and worked in German. For the vocational-training visa, B1 is normally the benchmark, and many employers prefer B2.');
      } else {
        r.title = 'Ausbildung: you can start shortlisting';
        r.steps = [P.elig, P.finder, P.aroad];
      }
      if (a.grades === 'school') r.notes.push('Yes, Ausbildung is possible after 12th. Most professions accept 10–12 years of schooling; some ask for more.');
      else r.notes.push('Employers look at your school-leaving certificate. The eligibility checklist covers whether yours needs recognition in Germany.');
    } else if (a.goal === 'learn') {
      r.gleis = 'Gleis 01 · Deutsch';
      r.title = a.level === 'b' ? 'German: check your level, then aim higher' : 'German: from zero to B1, in order';
      r.steps = a.level === 'b' ? [P.test, P.learn, P.study] : [P.test, P.learn, P.vocab];
      r.notes.push('The level test measures recognition and reading. Your speaking level is usually a step behind, so treat the result as where to start. <a href="' + YT_LEARN + '" target="_blank" rel="noopener">How to learn German for free ↗</a>');
    } else {
      r.gleis = 'Gleis 00 · Info';
      r.title = 'Not sure yet? Compare both routes first';
      r.steps = [P.study, P.ausb, P.costs];
      r.notes.push('University means studying first and working later. Ausbildung means training in a company and earning a salary from day one, but in German. Both pages list what each route needs.');
      if (a.grades === 'low') r.notes.push('Grades matter more for university admission than for Ausbildung, where employers weigh your German and motivation heavily.');
      if (noGerman) r.notes.push('Whichever you choose, German helps. <a href="german-level-test.html">Take the free level test →</a>');
    }
    return r;
  }

  function show(i) {
    cur = i;
    qs.forEach(function (q, k) { q.classList.toggle('is-on', k === i); });
    result.hidden = i < qs.length;
    stepEl.textContent = i < qs.length ? ('0' + (i + 1) + ' / 03') : 'Route ready';
    bar.style.width = (Math.min(i + 1, 3) / 3 * 100) + '%';
    back.hidden = i === 0;
    reset.hidden = i < qs.length;
    if (i < qs.length) {
      var first = qs[i].querySelector('button[aria-pressed="true"]') || qs[i].querySelector('button');
      if (first && root.contains(document.activeElement)) first.focus();
    }
  }
  function render() {
    var r = route(ans);
    result.querySelector('.kr-title').textContent = r.title;
    result.querySelector('.kr-gleis').textContent = r.gleis;
    var ol = result.querySelector('.kr-steps'); ol.innerHTML = '';
    r.steps.forEach(function (s) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = s[0];
      a.innerHTML = '<span><b></b><small></small></span><i aria-hidden="true">→</i>';
      a.querySelector('b').textContent = s[1]; a.querySelector('small').textContent = s[2];
      li.appendChild(a); ol.appendChild(li);
    });
    // notes contain only our own fixed strings and links (no user input)
    result.querySelector('.kr-notes').innerHTML = r.notes.map(function (n) { return '<p>' + n + '</p>'; }).join('');
    show(qs.length);
    var h = result.querySelector('.kr-title'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
  }
  qs.forEach(function (q, i) {
    q.querySelectorAll('button').forEach(function (btn) {
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        q.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        ans[q.getAttribute('data-q')] = btn.getAttribute('data-v');
        setTimeout(function () { i + 1 < qs.length ? show(i + 1) : render(); }, 180);
      });
    });
  });
  back.addEventListener('click', function () { show(Math.max(0, (cur >= qs.length ? qs.length : cur) - 1)); });
  reset.addEventListener('click', function () {
    ans = {}; root.querySelectorAll('.kopts button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    show(0); var f = qs[0].querySelector('button'); if (f) f.focus();
  });
  show(0);
})();

/* ── Moving-cost calculator (cost-calculator.html) ──
   Every line is editable. Live EUR→INR rate with a dated fallback.
   Inputs are remembered only in this browser (localStorage, best effort). */
(function () {
  'use strict';
  var root = document.querySelector('[data-calc]');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var FALLBACK = { rate: 109.10, date: '28 Sep 2026' };
  var KEY = 'glb-calc-v1', RATE_KEY = 'glb-eur-inr';
  var rateIn = $('#c-rate'), note = $('.crate-note'), status = $('.crate-status');
  var fields = $$('input[type=number], select, input[type=checkbox]');
  var inr = function (x) { return '₹' + Math.round(x).toLocaleString('en-IN'); };
  var eur = function (x) { return '€' + (Math.round(x * 100) / 100).toLocaleString('en-IE', { maximumFractionDigits: 2 }); };
  var num = function (el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; };

  function save() {
    try {
      var o = {}; fields.forEach(function (f) { if (f.id) o[f.id] = f.type === 'checkbox' ? f.checked : f.value; });
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {}
  }
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
      fields.forEach(function (f) { if (f.id && f.id in o && f.id !== 'c-rate') { if (f.type === 'checkbox') f.checked = !!o[f.id]; else f.value = o[f.id]; } });
      if (o['c-rate-manual'] && o['c-rate']) { rateIn.value = o['c-rate']; rateIn.dataset.manual = '1'; note.textContent = 'Your own rate'; status.textContent = 'Your rate'; }
    } catch (e) {}
  }

  function calc() {
    var rate = num(rateIn) || FALLBACK.rate;
    var t = { spend: 0, dep: 0, blocked: 0 };
    var toINR = function (v, cur) { return cur === 'eur' ? v * rate : v; };
    var out = function (id, text) { var el = root.querySelector('[data-out="' + id + '"]'); if (el) el.textContent = text; };
    $$('input[data-kind]').forEach(function (el) {
      var v = num(el), cur = el.getAttribute('data-cur'), kind = el.getAttribute('data-kind');
      if (kind === 'blocked' && !$('#c-useblocked').checked) { out(el.id, 'Not included'); el.closest('.cin').style.opacity = .45; return; }
      el.closest('.cin').style.opacity = '';
      t[kind] += toINR(v, cur);
      out(el.id, cur === 'eur' ? '≈ ' + inr(v * rate) : '≈ ' + eur(v / rate));
    });
    // uni-assist: €75 first, €30 each extra
    var n = Math.min(30, Math.floor(num($('#c-uni'))));
    var uniE = n > 0 ? 75 + 30 * (n - 1) : 0;
    t.spend += uniE * rate; out('c-uni', n > 0 ? eur(uniE) + ' ≈ ' + inr(uniE * rate) : 'No uni-assist fees');
    // health insurance (first month)
    var ins = parseFloat($('#c-age').value) || 0; t.spend += ins * rate; out('c-age', '≈ ' + inr(ins * rate));
    // deposit = months × rent
    var depE = (parseFloat($('#c-depm').value) || 0) * num($('#c-rent'));
    t.dep += depE * rate; out('c-depm', depE ? eur(depE) + ' ≈ ' + inr(depE * rate) : 'No deposit');

    var total = t.spend + t.dep + t.blocked;
    root.querySelector('[data-total-inr]').textContent = inr(total);
    root.querySelector('[data-total-eur]').textContent = '≈ €' + Math.round(total / rate).toLocaleString('en-IE') + ' at ₹' + rate.toFixed(2) + ' per €';
    ['spend', 'dep', 'blocked'].forEach(function (k) {
      root.querySelector('[data-line="' + k + '"]').textContent = inr(t[k]);
      root.querySelector('[data-bar="' + k + '"]').style.width = (total ? t[k] / total * 100 : 0) + '%';
    });
  }

  function setRate(r, label, live) {
    if (rateIn.dataset.manual) return;
    rateIn.value = r.toFixed(2);
    note.textContent = label;
    status.textContent = live ? 'Live rate' : 'Saved rate';
    calc();
  }
  function fetchRate() {
    try {
      var c = JSON.parse(localStorage.getItem(RATE_KEY) || 'null');
      if (c && c.rate && Date.now() - c.time < 6 * 3600 * 1000) { setRate(c.rate, 'Live rate, ' + c.date, true); return; }
    } catch (e) {}
    setRate(FALLBACK.rate, 'Mid-market rate on ' + FALLBACK.date + ' (live rate unavailable)', false);
    if (!window.fetch) return;
    fetch('https://api.exchangerate-api.com/v4/latest/EUR').then(function (r) { return r.json(); }).then(function (d) {
      var r = d && d.rates && d.rates.INR; if (!r) return;
      var date = d.date ? new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'today';
      try { localStorage.setItem(RATE_KEY, JSON.stringify({ rate: r, date: date, time: Date.now() })); } catch (e) {}
      setRate(r, 'Live rate, ' + date, true);
    }).catch(function () {});
  }

  fields.forEach(function (f) {
    f.addEventListener('input', function () {
      if (f === rateIn) { rateIn.dataset.manual = '1'; note.textContent = 'Your own rate'; status.textContent = 'Your rate'; }
      calc(); save();
      try { var o = JSON.parse(localStorage.getItem(KEY) || '{}'); o['c-rate-manual'] = !!rateIn.dataset.manual; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    });
    f.addEventListener('change', function () { calc(); save(); });
  });
  root.querySelector('[data-reset]').addEventListener('click', function () {
    fields.forEach(function (f) {
      if (f.type === 'checkbox') f.checked = true;
      else if (f.dataset.def != null) f.value = f.dataset.def;
    });
    delete rateIn.dataset.manual;
    try { localStorage.removeItem(KEY); } catch (e) {}
    fetchRate(); calc();
  });
  root.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
  load(); calc(); fetchRate();
})();

/* ── Content pages v3: accordions, tabs, section bar ── */
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Accordions: <button class="acc-btn" aria-expanded aria-controls> + .acc-panel */
  $$('.acc-btn').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var set = function (open) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); panel.classList.toggle('open', open); panel.setAttribute('aria-hidden', open ? 'false' : 'true'); };
    set(btn.getAttribute('aria-expanded') === 'true');
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  });
  // open the FAQ item a link points at (#faq-3)
  if (location.hash) { var t = document.querySelector(location.hash + ' .acc-btn'); if (t) t.click(); }

  /* Tabs: [role=tablist][data-sync=key] — tablists sharing a key stay in step */
  var lists = $$('[role="tablist"]');
  function select(list, value, focus) {
    $$('[role="tab"]', list).forEach(function (tab) {
      var on = tab.getAttribute('data-value') === value;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
      var p = document.getElementById(tab.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
  }
  lists.forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        var v = tab.getAttribute('data-value'), key = list.getAttribute('data-sync');
        lists.forEach(function (l) { if (l === list || (key && l.getAttribute('data-sync') === key)) select(l, v, false); });
      });
      tab.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        e.preventDefault(); var n = tabs[(i + d + tabs.length) % tabs.length]; n.click(); n.focus();
      });
    });
    var cur = list.querySelector('[aria-selected="true"]') || tabs[0];
    if (cur) select(list, cur.getAttribute('data-value'), false);
  });

  /* Section bar: highlight the section in view, keep the pill visible */
  var bar = document.querySelector('.subnav-in');
  if (bar && 'IntersectionObserver' in window) {
    var links = $$('a[href^="#"]', bar), map = {};
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) map[s.id] = a; });
    var active = null;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = map[e.target.id]; if (!a || a === active) return;
        if (active) active.classList.remove('on');
        a.classList.add('on'); active = a;
        var l = a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2;
        bar.scrollTo({ left: l, behavior: 'smooth' });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
})();
