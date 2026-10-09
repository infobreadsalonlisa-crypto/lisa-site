(() => {
  const EN = document.documentElement.lang === 'en';
  const $ = id => document.getElementById(id);

  // ---- mega menu (hamburger) ----
  const burger = $('burger'), mega = $('drawer');
  const setMega = open => {
    if (!burger || !mega) return;
    mega.hidden = !open;
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? burger.dataset.close : burger.dataset.open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setSearch(false);
  };
  if (burger) burger.addEventListener('click', () => setMega(mega.hidden));

  // ---- nav dropdowns ----
  document.querySelectorAll('.gh .dd').forEach(dd => {
    const b = dd.querySelector('.ddb');
    b.addEventListener('click', ev => {
      ev.stopPropagation();
      const open = !dd.classList.contains('open');
      document.querySelectorAll('.gh .dd.open').forEach(o => { o.classList.remove('open'); o.querySelector('.ddb').setAttribute('aria-expanded', false); });
      dd.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open);
    });
  });

  // ---- language menu ----
  const lb = $('langbtn'), lm = $('langmenu');
  const setLang = open => { if (!lb) return; lm.hidden = !open; lb.setAttribute('aria-expanded', open); };
  if (lb) lb.addEventListener('click', ev => { ev.stopPropagation(); setLang(lm.hidden); });

  // ---- site search ----
  const sb = $('searchbtn'), sp = $('search'), q = $('q'), sres = $('sres'), hint = $('shint');
  let idx = [];
  try { idx = JSON.parse($('sidx').textContent); } catch (_) { idx = []; }
  function setSearch(open) {
    if (!sb) return;
    sp.hidden = !open;
    sb.setAttribute('aria-expanded', open);
    if (open) { setMega(false); setTimeout(() => q.focus(), 0); }
  }
  const norm = s => s.toLowerCase().normalize('NFKC');
  const render = () => {
    const k = norm(q.value.trim());
    sres.innerHTML = '';
    if (!k) { hint.textContent = ''; return; }
    const hits = idx.filter(x => norm(x.t + ' ' + x.d).includes(k)).slice(0, 12);
    hint.textContent = hits.length ? hint.dataset.cnt.replace('{n}', hits.length) : hint.dataset.none;
    hits.forEach(x => {
      const li = document.createElement('li'), a = document.createElement('a'), b = document.createElement('b'), s = document.createElement('span');
      a.href = x.u; b.textContent = x.t; s.textContent = x.d;
      a.append(b, s); li.append(a); sres.append(li);
    });
  };
  if (sb) {
    sb.addEventListener('click', ev => { ev.stopPropagation(); setSearch(sp.hidden); });
    q.addEventListener('input', render);
    sp.addEventListener('click', ev => ev.stopPropagation());
  }

  // ---- global close ----
  document.addEventListener('click', ev => {
    if (lm && !lm.contains(ev.target)) setLang(false);
    document.querySelectorAll('.gh .dd.open').forEach(o => { if (!o.contains(ev.target)) { o.classList.remove('open'); o.querySelector('.ddb').setAttribute('aria-expanded', false); } });
    if (sp && !sp.hidden && !sp.contains(ev.target)) setSearch(false);
  });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (lm && !lm.hidden) { setLang(false); lb.focus(); }
    if (sp && !sp.hidden) { setSearch(false); sb.focus(); }
    if (mega && !mega.hidden) { setMega(false); burger.focus(); }
    document.querySelectorAll('.gh .dd.open').forEach(o => o.classList.remove('open'));
  });
  if (mega) mega.addEventListener('click', ev => { if (ev.target.closest('a')) setMega(false); });

  // ---- hero carousel ----
  const hc = $('hc');
  if (hc) {
    const track = $('track'), slides = [...track.children], dots = $('dots');
    let i = 0, timer;
    slides.forEach((_, k) => {
      const x = document.createElement('button');
      x.setAttribute('role', 'tab'); x.setAttribute('aria-label', (EN ? 'Slide ' : 'スライド ') + (k + 1));
      x.addEventListener('click', () => { go(k); restart(); });
      dots.appendChild(x);
    });
    const go = k => {
      i = (k + slides.length) % slides.length;
      track.style.transform = `translateX(${-100 * i}%)`;
      slides.forEach((s, n) => { s.setAttribute('aria-hidden', n !== i); s.querySelectorAll('a').forEach(a => a.tabIndex = n === i ? 0 : -1); });
      [...dots.children].forEach((x, n) => x.setAttribute('aria-selected', n === i));
      hc.classList.toggle('on-light', slides[i].dataset.theme === 'light');
    };
    const restart = () => { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => go(i + 1), 7000); };
    $('prev').onclick = () => { go(i - 1); restart(); };
    $('next').onclick = () => { go(i + 1); restart(); };
    hc.addEventListener('mouseenter', () => clearInterval(timer));
    hc.addEventListener('mouseleave', restart);
    hc.addEventListener('focusin', () => clearInterval(timer));
    let sx = null;
    hc.addEventListener('touchstart', ev => sx = ev.touches[0].clientX, { passive: true });
    hc.addEventListener('touchend', ev => { if (sx === null) return; const dx = ev.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); } sx = null; });
    go(0); restart();
  }

  // ---- location map (data comes from the #mapdata JSON block) ----
  const map = $('map'), mapdata = $('mapdata');
  if (map && mapdata) {
    let V = [];
    try { V = JSON.parse(mapdata.textContent); } catch (_) { V = []; }
    const addr = $('addr'), tabs = document.querySelectorAll('.map-tabs button');
    const show = k => {
      const v = V[k];
      if (!v) return;
      map.src = `https://www.openstreetmap.org/export/embed.html?bbox=${v.bbox}&layer=mapnik`;
      addr.innerHTML = '';
      const h = document.createElement('h4'); h.textContent = v.h; addr.append(h);
      [v.a, v.dt].filter(Boolean).forEach(t => { const p = document.createElement('p'); p.textContent = t; addr.append(p); });
      const a = document.createElement('a'); a.className = 'cta';
      a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.q);
      a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = (EN ? 'Open in Google Maps' : 'Googleマップで開く') + '<span class="arrow" aria-hidden="true"></span>';
      addr.append(a);
      tabs.forEach((t, n) => { t.classList.toggle('on', n === k); t.setAttribute('aria-selected', n === k); });
    };
    tabs.forEach(t => t.addEventListener('click', () => show(+t.dataset.i)));
    show(0);
  }

  // ---- factoid count-up ----
  const nums = document.querySelectorAll('[data-count]');
  if (nums.length) {
    const run = el => {
      const to = +el.dataset.count, t0 = performance.now();
      const step = t => { const p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('ja-JP'); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) nums.forEach(n => n.textContent = (+n.dataset.count).toLocaleString('ja-JP'));
    else {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), { threshold: .4 });
      nums.forEach(n => io.observe(n));
    }
  }

  // ---- profile filter (people.html) ----
  const fc = $('fc');
  if (fc) {
    const cards = document.querySelectorAll('.pcard[data-c]'), cnt = $('fcount');
    const apply = () => {
      let n = 0;
      cards.forEach(c => { const on = !fc.value || c.dataset.c === fc.value; c.hidden = !on; if (on) n++; });
      cnt.textContent = cnt.dataset.tpl.replace('{n}', n);
    };
    fc.addEventListener('change', apply);
    $('fclear').addEventListener('click', () => { fc.value = ''; apply(); });
    const qp = new URLSearchParams(location.search).get('c');
    if (qp) fc.value = qp;
    apply();
  }
})();
