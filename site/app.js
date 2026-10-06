/* AI English Teacher landing: i18n, animated background, talking Emma. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.remove('no-js');

  /* ---------------- i18n (RU lives in the HTML) ---------------- */
  const I18N = {
    en: {
      'meta.title': 'AI English Teacher: learn English with a talking teacher',
      'nav.features': 'Features', 'nav.teachers': 'Teachers', 'nav.how': 'Get started', 'nav.faq': 'FAQ', 'nav.team': 'Team', 'nav.open': 'Open',
      'hero.badge': 'Free · No sign-up · Right in your browser',
      'hero.title': 'English with a teacher who <span class="grad">talks with you</span>',
      'hero.lead': 'Emma and five more Pixar-style teachers explain, cheer you on and listen to your pronunciation through the microphone. Lessons, games and exams work instantly, nothing to download.',
      'hero.open': 'Start for free', 'hero.apk': 'Android APK', 'hero.hear': 'Say hi to Emma',
      'hero.t1': 'Voice and lip-sync', 'hero.t2': 'Pronunciation check', 'hero.t3': 'RU · EN · VI interface',
      'stats.teachers': 'Pixar-style teachers', 'stats.langs': 'interface languages', 'stats.servers': 'servers and sign-ups', 'stats.free': 'free',
      'features.kicker': 'Features', 'features.title': 'Everything you need to start speaking English',
      'f1.t': 'Teachers talk', 'f1.d': 'A real voice, moving lips and blinking eyes. Your teacher reads tasks, praises and gives hints.',
      'f2.t': 'Answer with your voice', 'f2.d': 'Speak into the microphone: the app recognises speech and rates pronunciation. Typing works too.',
      'f3.t': 'Lessons and games', 'f3.d': 'Short lessons, word battles, a diary and rewards to keep you learning every day.',
      'f4.t': 'Exams', 'f4.d': 'Check your level: listening, reading, writing and speaking with a detailed review.',
      'f5.t': 'No sign-up', 'f5.d': 'Progress stays on your device only. No accounts, no servers.',
      'f6.t': 'Smart AI, if you want', 'f6.d': 'Everything works without downloading a model. Want smarter chats? Turn on local AI in settings.',
      'teachers.kicker': 'Teachers', 'teachers.title': 'Pick your teacher',
      'how.kicker': 'Get started', 'how.title': 'Three steps and you are speaking',
      's1.t': 'Open the app', 's1.d': 'In the browser on your phone or computer. No install needed.',
      's2.t': 'Pick a teacher', 's2.d': 'Each has their own voice and personality. Switch any time.',
      's3.t': 'Learn by speaking', 's3.d': 'Listen, repeat and answer into the mic. Your teacher helps and cheers.',
      'faq.kicker': 'FAQ', 'faq.title': 'Frequently asked questions',
      'q1': 'Do I need to download the AI?', 'a1': 'No. Lessons, answer checking, voice and microphone work right away. You can turn on a local model in settings if you like; it only makes free conversations smarter.',
      'q2': 'I can\u2019t hear the teacher. What now?', 'a2': 'Tap the screen once: browsers allow sound only after a tap. Check the volume and silent mode. Voice works best in Chrome, Edge and Safari.',
      'q3': 'How do I turn on the microphone?', 'a3': 'Press the mic button and allow access. If access is blocked, click the lock icon in the address bar and enable the microphone. Chrome needs the internet for speech recognition.',
      'q4': 'Is it really free?', 'a4': 'Yes. No subscriptions and no sign-up. Progress is stored on your device.',
      'q5': 'Does it work offline?', 'a5': 'Yes, after the first visit the app is cached. Only Chrome speech recognition needs a connection.',
      'team.dev': 'Developer', 'team.devName': 'Paul Pavel Afanasyev', 'team.lead': 'Project lead', 'team.leadName': 'Mikhailov Sergey',
      'final.title': 'Emma is waiting for you',
      'footer.by': 'Developer: Paul Pavel Afanasyev · Project lead: Mikhailov Sergey', 'footer.privacy': 'Privacy',
      greet: ["Hi there! I'm Emma, your English teacher.", "Let's learn English together. It's fun and easy!"],
    },
    vi: {
      'meta.title': 'AI English Teacher: học tiếng Anh với giáo viên biết nói',
      'nav.features': 'Tính năng', 'nav.teachers': 'Giáo viên', 'nav.how': 'Bắt đầu', 'nav.faq': 'Hỏi đáp', 'nav.team': 'Đội ngũ', 'nav.open': 'Mở',
      'hero.badge': 'Miễn phí · Không cần đăng ký · Ngay trên trình duyệt',
      'hero.title': 'Học tiếng Anh với giáo viên <span class="grad">trò chuyện cùng bạn</span>',
      'hero.lead': 'Emma và năm giáo viên phong cách Pixar giảng bài, khen ngợi và nghe phát âm của bạn qua micro. Bài học, trò chơi và bài thi dùng được ngay, không cần tải gì.',
      'hero.open': 'Bắt đầu miễn phí', 'hero.apk': 'Android APK', 'hero.hear': 'Chào Emma',
      'hero.t1': 'Giọng nói và khẩu hình', 'hero.t2': 'Chấm phát âm', 'hero.t3': 'Giao diện RU · EN · VI',
      'stats.teachers': 'giáo viên Pixar', 'stats.langs': 'ngôn ngữ giao diện', 'stats.servers': 'máy chủ và đăng ký', 'stats.free': 'miễn phí',
      'features.kicker': 'Tính năng', 'features.title': 'Mọi thứ để bạn nói tiếng Anh',
      'f1.t': 'Giáo viên biết nói', 'f1.d': 'Giọng nói thật, môi cử động và mắt chớp. Giáo viên đọc đề, khen và gợi ý.',
      'f2.t': 'Trả lời bằng giọng nói', 'f2.d': 'Nói vào micro: ứng dụng nhận dạng và chấm phát âm. Gõ chữ cũng được.',
      'f3.t': 'Bài học và trò chơi', 'f3.d': 'Bài học ngắn, đấu từ vựng, nhật ký và phần thưởng để học mỗi ngày.',
      'f4.t': 'Bài thi', 'f4.d': 'Kiểm tra trình độ: nghe, đọc, viết và nói với phần nhận xét chi tiết.',
      'f5.t': 'Không cần đăng ký', 'f5.d': 'Tiến độ chỉ lưu trên thiết bị của bạn. Không tài khoản, không máy chủ.',
      'f6.t': 'AI thông minh tùy chọn', 'f6.d': 'Mọi thứ chạy mà không cần tải mô hình. Muốn hội thoại thông minh hơn? Bật AI cục bộ trong cài đặt.',
      'teachers.kicker': 'Giáo viên', 'teachers.title': 'Chọn giáo viên của bạn',
      'how.kicker': 'Bắt đầu', 'how.title': 'Ba bước là bạn đã nói được',
      's1.t': 'Mở ứng dụng', 's1.d': 'Trên trình duyệt điện thoại hoặc máy tính. Không cần cài đặt.',
      's2.t': 'Chọn giáo viên', 's2.d': 'Mỗi người có giọng và tính cách riêng. Đổi bất cứ lúc nào.',
      's3.t': 'Học bằng giọng nói', 's3.d': 'Nghe, nhắc lại và trả lời vào micro. Giáo viên sẽ gợi ý và khen bạn.',
      'faq.kicker': 'Hỏi đáp', 'faq.title': 'Câu hỏi thường gặp',
      'q1': 'Có cần tải AI không?', 'a1': 'Không. Bài học, chấm bài, giọng nói và micro dùng được ngay. Bạn có thể bật mô hình cục bộ trong cài đặt nếu muốn, nó chỉ giúp hội thoại tự do thông minh hơn.',
      'q2': 'Không nghe thấy giáo viên?', 'a2': 'Chạm vào màn hình một lần: trình duyệt chỉ cho phát âm thanh sau khi chạm. Kiểm tra âm lượng và chế độ im lặng. Giọng nói chạy tốt nhất trên Chrome, Edge và Safari.',
      'q3': 'Bật micro thế nào?', 'a3': 'Bấm nút micro và cho phép truy cập. Nếu bị chặn, bấm biểu tượng ổ khóa trên thanh địa chỉ và bật micro. Chrome cần Internet để nhận dạng giọng nói.',
      'q4': 'Có thật sự miễn phí?', 'a4': 'Có. Không thuê bao, không đăng ký. Tiến độ lưu trên thiết bị của bạn.',
      'q5': 'Có dùng ngoại tuyến được không?', 'a5': 'Có, sau lần mở đầu ứng dụng được lưu lại. Chỉ nhận dạng giọng nói của Chrome cần mạng.',
      'team.dev': 'Nhà phát triển', 'team.devName': 'Paul Pavel Afanasyev', 'team.lead': 'Trưởng dự án', 'team.leadName': 'Mikhailov Sergey',
      'final.title': 'Emma đang chờ bạn',
      'footer.by': 'Nhà phát triển: Paul Pavel Afanasyev · Trưởng dự án: Mikhailov Sergey', 'footer.privacy': 'Quyền riêng tư',
      greet: ['Xin chào! Mình là Emma, cô giáo tiếng Anh của bạn.', 'Cùng học tiếng Anh thật vui nhé!'],
      greetEn: ["Hi there! I'm Emma, your English teacher.", "Let's learn English together!"],
    },
    ru: { greet: ['Привет! Я Эмма, твой учитель английского.', 'Давай учиться вместе, это весело и просто!'], 'meta.title': document.title },
  };
  const VOICE_LANG = { ru: 'ru-RU', en: 'en-US', vi: 'vi-VN' };
  const nodes = $$('[data-i18n]');
  nodes.forEach((el) => { I18N.ru[el.dataset.i18n] = el.innerHTML; });
  const saved = (() => { try { return localStorage.getItem('aet_site_lang'); } catch { return null; } })();
  const nav = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  let lang = I18N[saved] ? saved : (I18N[nav] ? nav : 'ru');

  function applyLang(next) {
    lang = I18N[next] ? next : 'ru';
    const dict = I18N[lang];
    nodes.forEach((el) => { const v = dict[el.dataset.i18n] ?? I18N.ru[el.dataset.i18n]; if (v != null) el.innerHTML = v; });
    document.documentElement.lang = lang;
    document.title = dict['meta.title'] || I18N.ru['meta.title'];
    $$('.lang button').forEach((b) => { const on = b.dataset.lang === lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    try { localStorage.setItem('aet_site_lang', lang); } catch {}
    typeGreeting();
  }
  $$('.lang button').forEach((b) => b.addEventListener('click', () => { applyLang(b.dataset.lang); stopSpeech(); }));

  /* ---------------- animated aurora background ---------------- */
  const canvas = $('#bg');
  const ctx = canvas.getContext('2d');
  const BLOBS = [
    { c: [124, 92, 255], x: .15, y: .2, r: .55, sx: .00011, sy: .00017 },
    { c: [20, 184, 166], x: .85, y: .25, r: .5, sx: .00013, sy: .0001 },
    { c: [255, 95, 162], x: .7, y: .85, r: .45, sx: .00009, sy: .00015 },
    { c: [255, 181, 71], x: .2, y: .9, r: .4, sx: .00016, sy: .00008 },
    { c: [91, 124, 255], x: .5, y: .5, r: .35, sx: .00012, sy: .00014 },
  ];
  let W = 0; let H = 0; let running = true;
  function resize() {
    // Low-res canvas, upscaled by CSS: cheap and naturally soft.
    W = canvas.width = Math.max(64, Math.round(innerWidth / 6));
    H = canvas.height = Math.max(64, Math.round(innerHeight / 6));
  }
  function frame(t) {
    ctx.fillStyle = '#f4f7fb';
    ctx.fillRect(0, 0, W, H);
    const m = Math.max(W, H);
    BLOBS.forEach((b, i) => {
      const x = (b.x + Math.sin(t * b.sx + i) * .18) * W;
      const y = (b.y + Math.cos(t * b.sy + i * 2) * .16) * H;
      const r = b.r * m * (1 + Math.sin(t * .0003 + i) * .08);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${b.c},.34)`);
      g.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
    if (running && !reduced) requestAnimationFrame(frame);
  }
  resize();
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reduced) requestAnimationFrame(frame);
  });
  requestAnimationFrame(frame);

  // Floating words drifting up behind the content.
  const WORDS = ['Hello!', 'Привет', 'Xin chào', 'ABC', 'Great job!', 'apple', 'I can do it', '⭐', 'Thank you', 'Спасибо', 'Cảm ơn', 'How are you?', '🎤', 'book', 'Well done!'];
  if (!reduced) {
    const box = $('#floaters');
    const count = innerWidth < 680 ? 9 : 16;
    for (let i = 0; i < count; i += 1) {
      const s = document.createElement('span');
      s.textContent = WORDS[i % WORDS.length];
      s.style.left = `${(i / count) * 100 + Math.random() * 4}%`;
      s.style.fontSize = `${14 + Math.random() * 22}px`;
      s.style.animationDuration = `${22 + Math.random() * 26}s`;
      s.style.animationDelay = `${-Math.random() * 40}s`;
      box.appendChild(s);
    }
  }

  /* ---------------- top bar + reveal ---------------- */
  const topbar = $('#topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); });
  } else $$('.reveal').forEach((el) => el.classList.add('in'));

  /* ---------------- teacher portraits (from the app's data modules) ---------------- */
  const REV = 'e19bed09d0cbce96d412d2d4746861d4806399b5';
  const SOURCES = [
    `https://cdn.jsdelivr.net/gh/paulafanasyev/ai-english-teacher@${REV}/apps/web/src/avatar/pixar/`,
    `https://raw.githubusercontent.com/paulafanasyev/ai-english-teacher/${REV}/apps/web/src/avatar/pixar/`,
  ];
  async function fetchText(path) {
    for (const base of SOURCES) {
      try { const r = await fetch(base + path, { cache: 'force-cache' }); if (r.ok) return await r.text(); } catch {}
    }
    throw new Error('portrait unavailable');
  }
  const parseModule = (src) => JSON.parse(src.slice(src.indexOf('export default') + 14).trim().replace(/;\s*$/, ''));
  const parseString = (src) => (src.match(/['"](data:image\/[^'"]+)['"]/) || [])[1];
  async function loadFull(id) { return parseModule(await fetchText(`${id}.js`)); }
  async function loadBase(id) {
    if (['alex', 'linh', 'minh'].includes(id)) return parseString(await fetchText(`${id}/base.js`));
    return loadFull(id).then((d) => d.base);
  }

  /* ---------------- Emma: portrait, blink, lip-sync ---------------- */
  const emmaBtn = $('#emma');
  const face = $('#emmaFace');
  const layers = {};
  const target = { A: 0, O: 0, E: 0, happy: 0, blink: 0 };
  const cur = { ...target };
  let emmaReady = false;
  const emmaData = loadFull('emma').then((data) => {
    const pct = (v) => `${(v / data.size) * 100}%`;
    const base = new Image();
    base.className = 'base'; base.alt = 'Emma'; base.src = data.base; base.decoding = 'async';
    face.appendChild(base);
    ['happy', 'A', 'O', 'E', 'blink'].forEach((k) => {
      const l = data.layers[k]; if (!l) return;
      const img = new Image();
      img.className = 'layer'; img.alt = ''; img.src = l.src;
      Object.assign(img.style, { left: pct(l.x), top: pct(l.y), width: pct(l.w), height: pct(l.h) });
      face.appendChild(img); layers[k] = img;
    });
    emmaBtn.classList.add('ready');
    emmaReady = true;
    target.happy = 1;
    return data;
  }).catch(() => null);
  let lastT = performance.now();
  (function tick(now) {
    const dt = Math.min(64, now - lastT); lastT = now;
    Object.keys(target).forEach((k) => {
      const speed = k === 'blink' ? .6 : k === 'happy' ? .12 : .45;
      cur[k] += (target[k] - cur[k]) * Math.min(1, speed * dt / 16);
      if (layers[k]) layers[k].style.opacity = cur[k].toFixed(3);
    });
    requestAnimationFrame(tick);
  })(lastT);
  (function blink() {
    setTimeout(() => {
      target.blink = 1;
      setTimeout(() => { target.blink = 0; }, 110);
      blink();
    }, 2200 + Math.random() * 3800);
  })();
  const mouth = (k) => { ['A', 'O', 'E'].forEach((m) => { target[m] = m === k ? 1 : 0; }); };
  const visemeOf = (ch) => {
    const c = ch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if ('aаяă'.includes(c)) return 'A';
    if ('oоuуwюơư'.includes(c)) return 'O';
    if ('mbpмбп'.includes(c)) return null;
    return 'E';
  };
  let mouthTimers = [];
  function animateWord(word) {
    mouthTimers.forEach(clearTimeout); mouthTimers = [];
    [...word].filter((c) => /\p{L}/u.test(c)).forEach((c, i) => mouthTimers.push(setTimeout(() => mouth(visemeOf(c)), i * 70)));
    mouthTimers.push(setTimeout(() => mouth(null), word.length * 70 + 60));
  }
  let babbleTimer = 0; let lastBoundary = 0;
  function startTalking() {
    emmaBtn.classList.add('talking'); target.happy = 0;
    const babble = () => {
      if (performance.now() - lastBoundary > 300) { const r = Math.random(); mouth(r < .38 ? 'A' : r < .62 ? 'E' : r < .8 ? 'O' : null); }
      babbleTimer = setTimeout(babble, 90 + Math.random() * 120);
    };
    clearTimeout(babbleTimer); babbleTimer = setTimeout(babble, 200);
  }
  function stopTalking() {
    emmaBtn.classList.remove('talking'); clearTimeout(babbleTimer); mouthTimers.forEach(clearTimeout); mouth(null); target.happy = 1;
  }

  /* ---------------- speech (robust for Chrome) ---------------- */
  const synth = window.speechSynthesis;
  let voices = [];
  const loadVoices = () => { try { voices = synth.getVoices(); } catch {} };
  if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }
  const FEMALE = /female|samantha|aria|jenny|zira|victoria|karen|tessa|sonia|libby|ava|allison|susan|milena|irina|svetlana|linh|hoaimy|hoai my|google us english|google русский|google tiếng việt/i;
  function pickVoice(code, attempt) {
    const key = code.slice(0, 2);
    let list = voices.filter((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith(key));
    if (attempt === 1) list = list.filter((v) => v.localService !== false);
    if (attempt >= 2 || !list.length) return null;
    return list.find((v) => FEMALE.test(v.name)) || list.find((v) => v.lang === code) || list[0];
  }
  let speakId = 0;
  function stopSpeech() { speakId += 1; try { if (synth && (synth.speaking || synth.pending)) synth.cancel(); } catch {} stopTalking(); }
  function say(lines, code) {
    if (!synth || typeof SpeechSynthesisUtterance !== 'function') { pulseOnly(); return; }
    const busy = synth.speaking || synth.pending;
    stopSpeech();
    const id = speakId;
    let i = 0; let attempt = 0;
    const next = () => {
      if (id !== speakId) return;
      if (i >= lines.length) { stopTalking(); return; }
      const u = new SpeechSynthesisUtterance(lines[i]);
      u.lang = code; u.rate = .95; u.pitch = 1.08; u.volume = 1;
      const v = pickVoice(code, attempt); if (v) u.voice = v;
      let started = false;
      const watchdog = setTimeout(() => { if (!started && id === speakId) { try { synth.cancel(); } catch {} if (attempt < 2) { attempt += 1; setTimeout(next, 120); } else { stopTalking(); pulseOnly(); } } }, 2800);
      u.onstart = () => { started = true; startTalking(); };
      u.onboundary = (e) => { if (e.name === 'sentence') return; lastBoundary = performance.now(); const w = lines[i].slice(e.charIndex).match(/^\S+/); if (w) animateWord(w[0]); };
      u.onend = () => { clearTimeout(watchdog); if (id !== speakId) return; if (!started) return; i += 1; setTimeout(next, 220); };
      u.onerror = (e) => { clearTimeout(watchdog); if (id !== speakId || e.error === 'interrupted' || e.error === 'canceled') return; if (e.error === 'not-allowed') { armGesture(); return; } if (attempt < 2) { attempt += 1; setTimeout(next, 120); } else { stopTalking(); pulseOnly(); } };
      window.__emmaU = u; // keep a reference so Chrome does not drop the events
      try { synth.resume(); synth.speak(u); } catch { stopTalking(); }
    };
    // Chrome drops speak() issued right after cancel(): give it a beat.
    if (!voices.length) { loadVoices(); setTimeout(next, 250); } else if (busy) setTimeout(next, 100); else next();
  }
  function pulseOnly() { startTalking(); setTimeout(stopTalking, 2600); }
  function greet() {
    const dict = I18N[lang];
    let lines = dict.greet; let code = VOICE_LANG[lang];
    loadVoices();
    const has = voices.some((v) => (v.lang || '').toLowerCase().startsWith(code.slice(0, 2)));
    if (!has && voices.length && dict.greetEn) { lines = dict.greetEn; code = 'en-US'; }
    say(lines, code);
  }

  /* ---------------- greeting bubble ---------------- */
  const bubble = $('#bubble'); const bubbleText = $('#bubbleText');
  let typeTimer = 0;
  function typeGreeting() {
    const text = I18N[lang].greet.join(' ');
    clearTimeout(typeTimer); bubble.classList.remove('done');
    if (reduced) { bubbleText.textContent = text; bubble.classList.add('done'); return; }
    let n = 0;
    const step = () => { bubbleText.textContent = text.slice(0, n); n += 1; if (n <= text.length) typeTimer = setTimeout(step, 28); else bubble.classList.add('done'); };
    step();
  }

  // Browsers need one user gesture before speech: greet on the first tap anywhere.
  let greeted = false;
  function armGesture() {
    const once = (e) => {
      if (e.target.closest && e.target.closest('a[href]:not([href^="#"]), #emma, #talkBtn, .lang')) return; // own handlers / leaving
      removeEventListener('pointerdown', once, true); removeEventListener('keydown', once, true);
      if (!greeted) { greeted = true; greet(); }
    };
    addEventListener('pointerdown', once, true); addEventListener('keydown', once, true);
  }
  const hello = (e) => { e.stopPropagation(); greeted = true; greet(); };
  emmaBtn.addEventListener('click', hello);
  $('#talkBtn').addEventListener('click', hello);

  applyLang(lang);
  emmaData.then(() => {
    if (navigator.userActivation && navigator.userActivation.hasBeenActive) { greeted = true; setTimeout(greet, 600); }
    else { armGesture(); if (!reduced) pulseOnly(); }
  });

  // Teacher row portraits.
  $$('.t-img').forEach((el) => {
    el.textContent = '🙂';
    loadBase(el.dataset.id).then((src) => {
      if (!src) return;
      const img = new Image(); img.alt = ''; img.loading = 'lazy'; img.src = src;
      el.textContent = ''; el.appendChild(img);
    }).catch(() => {});
  });
})();
