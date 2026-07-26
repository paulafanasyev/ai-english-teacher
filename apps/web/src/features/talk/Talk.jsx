import { useEffect, useRef, useState } from 'react';
import { useApp, useT, useLocale } from '../../core/store.js';
import { api } from '../../core/api.js';
import { teacherById } from '../../data/teachers.js';
import { scenarios } from '../../data/index.js';
import { createScenarioSession, createFreeChat } from '../../engine/conversation.js';
import { pickL } from '../../i18n/index.js';
import Avatar, { useEmotion } from '../../avatar/Avatar.jsx';
import { tts } from '../../audio/tts.js';
import { stt } from '../../audio/stt.js';
import { sfx } from '../../audio/sfx.js';
import { Confetti } from '../../ui/kit.jsx';

export default function Talk() {
  const { user, setUser } = useApp();
  const t = useT();
  const locale = useLocale();
  const teacher = teacherById(user.teacherId);

  const [mode, setMode] = useState(null); // null | {kind:'scenario', s} | {kind:'free'}
  const [messages, setMessages] = useState([]);
  const [talking, setTalking] = useState(false);
  const [emotion, flash] = useEmotion();
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [doneInfo, setDoneInfo] = useState(null);
  const sessionRef = useRef(null);
  const recRef = useRef(null);
  const okSteps = useRef(0);
  const logRef = useRef(null);

  useEffect(() => { logRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [messages, doneInfo]);
  useEffect(() => () => { tts.stop(); recRef.current?.stop(); }, []);

  const teacherSay = (text) => {
    setMessages((m) => [...m, { who: 't', text }]);
    tts.speak(text, teacher, { onStart: () => setTalking(true), onEnd: () => setTalking(false) });
  };

  const startScenario = (s) => {
    sfx.click();
    const session = createScenarioSession(s);
    sessionRef.current = session;
    okSteps.current = 0;
    setMode({ kind: 'scenario', s });
    setMessages([]);
    setDoneInfo(null);
    setTimeout(() => teacherSay(session.step.say), 250);
  };
  const startFree = () => {
    sfx.click();
    const chat = createFreeChat();
    sessionRef.current = chat;
    okSteps.current = 0;
    setMode({ kind: 'free' });
    setMessages([]);
    setDoneInfo(null);
    setTimeout(() => teacherSay(chat.opener(user.name)), 250);
  };

  const finish = async (say = true) => {
    tts.stop(); recRef.current?.stop(); setListening(false);
    const steps = okSteps.current;
    const xp = Math.min(60, steps * 8), coins = steps > 0 ? 8 + steps * 2 : 0;
    if (say && sessionRef.current?.farewell) teacherSay(sessionRef.current.farewell());
    const u = await api.earn({ xp, coins }).catch(() => null);
    if (u) setUser(u);
    setDoneInfo({ steps, xp, coins });
    if (steps > 2) sfx.levelUp();
  };

  const submit = (textRaw) => {
    const text = (textRaw ?? input).trim();
    if (!text || talking) return;
    setInput('');
    setMessages((m) => [...m, { who: 's', text }]);
    const session = sessionRef.current;

    if (mode.kind === 'scenario') {
      const res = session.submit(text);
      api.addAttempt({ taskType: 'speaking', topic: 'conversation', level: mode.s.level, correct: res.ok, durationMs: 0 }).then((u) => u && setUser(u)).catch(() => {});
      if (res.ok) { okSteps.current++; sfx.correct(); flash('happy'); } else { sfx.wrong(); flash('encourage'); }
      const correctionMsg = res.errors?.length ? { who: 'fix', text: `${res.errors[0].wrong} → ${res.errors[0].fix}`, tip: pickL(res.errors[0].tip, locale) } : null;
      setTimeout(() => {
        if (correctionMsg) setMessages((m) => [...m, correctionMsg]);
        teacherSay(res.say);
        if (res.done) setTimeout(() => finish(false), 800);
        else if (res.ok) setTimeout(() => teacherSay(session.step.say), 1400);
      }, 350);
    } else {
      okSteps.current = Math.min(okSteps.current + 1, 20);
      const res = session.reply(text);
      if (res.errors?.length) flash('encourage'); else if (Math.random() < 0.4) flash('happy');
      const correctionMsg = res.correction ? { who: 'fix', text: `${res.correction.wrong} → ${res.correction.fix}`, tip: pickL(res.correction.tip, locale) } : null;
      setTimeout(() => {
        if (correctionMsg) setMessages((m) => [...m, correctionMsg]);
        teacherSay(res.say);
      }, 350);
    }
  };

  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); return; }
    if (!stt.supported) return;
    sfx.pop(); setListening(true);
    recRef.current = stt.listen({
      onPartial: (txt) => setInput(txt),
      onFinal: (txt) => { setListening(false); if (txt.trim()) submit(txt); },
      onError: () => setListening(false),
    });
  };

  /* ---------- picker ---------- */
  if (!mode) {
    return (
      <div>
        <h1 className="h1 mb-1">💬 {t('talk.title')}</h1>
        <p className="font-semibold text-ink/60 mb-6">{t('talk.subtitle', { name: teacher.name })}</p>
        {!stt.supported && <div className="card p-3 mb-4 text-sm font-bold text-amber-600">⚠️ {t('talk.notSupported')}</div>}
        <button onClick={startFree} className="card p-5 w-full flex items-center gap-4 hover:-translate-y-0.5 transition mb-6 text-left">
          <div className="w-20 shrink-0"><Avatar teacher={teacher} rounded="rounded-2xl" /></div>
          <div>
            <div className="font-black text-lg">🗨️ {t('talk.free')}</div>
            <div className="text-sm font-semibold text-ink/55">{t('talk.freeDesc', { name: teacher.name })}</div>
          </div>
          <span className="ml-auto text-2xl">→</span>
        </button>
        <div className="label mb-2">{t('talk.scenarios')}</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {scenarios.map((s) => (
            <button key={s.id} onClick={() => startScenario(s)} className="card p-4 text-left hover:-translate-y-0.5 transition">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{s.emoji}</span>
                <div className="min-w-0">
                  <div className="font-black truncate">{pickL(s.title, locale)}</div>
                  <div className="text-xs font-bold text-primary">{s.level} · {s.steps.length} 💬</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-ink/55 mt-2">{pickL(s.description, locale)}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- session ---------- */
  const scenario = mode.kind === 'scenario' ? mode.s : null;
  const session = sessionRef.current;
  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] flex flex-col">
      {doneInfo && <Confetti burst={doneInfo.steps > 2} />}
      <div className="flex items-center gap-3 mb-3">
        <button className="text-2xl" onClick={() => { finish(false); setMode(null); }}>←</button>
        <div className="font-black truncate">{scenario ? `${scenario.emoji} ${pickL(scenario.title, locale)}` : '🗨️ ' + t('talk.free')}</div>
        {scenario && !doneInfo && <span className="chip ml-auto">{t('talk.step', { n: Math.min(session.index + 1, session.total), total: session.total })}</span>}
        {!scenario && !doneInfo && <button className="btn-ghost !py-1.5 !px-3 text-sm ml-auto" onClick={() => finish(true)}>🏁 {t('talk.exit')}</button>}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[92px_1fr] md:grid-cols-[150px_1fr] gap-4">
        <div className="sticky top-0">
          <Avatar teacher={teacher} talking={talking} emotion={emotion} frame={user.frame} />
        </div>
        <div ref={logRef} className="overflow-y-auto pr-1 space-y-2.5 pb-2">
          {messages.map((m, i) => m.who === 'fix' ? (
            <div key={i} className="anim-bubble mx-auto max-w-[90%] text-center text-sm font-bold bg-amber-100 text-amber-800 rounded-2xl px-4 py-2">
              ✏️ {m.text}<div className="text-xs font-semibold mt-0.5">{m.tip}</div>
            </div>
          ) : (
            <div key={i} className={`anim-bubble max-w-[85%] rounded-2xl px-4 py-2.5 font-semibold leading-snug ${m.who === 't' ? 'bg-surface border border-black/5 shadow-sm' : 'ml-auto text-white'}`}
              style={m.who === 's' ? { background: 'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' } : {}}>
              {m.text}
            </div>
          ))}
          {doneInfo && (
            <div className="card p-5 text-center anim-pop">
              <div className="text-3xl">🏆</div>
              <div className="font-black text-lg">{t('talk.done.title')}</div>
              <div className="mt-1 font-bold text-ink/60 text-sm">{t('talk.done.steps')}: {doneInfo.steps} · ⭐ +{doneInfo.xp} · 🪙 +{doneInfo.coins}</div>
              <button className="btn-primary mt-3" onClick={() => setMode(null)}>{t('common.back')}</button>
            </div>
          )}
        </div>
      </div>

      {!doneInfo && (
        <div className="mt-3 space-y-2">
          {scenario && session.step && (
            <div className="text-center">
              <span className="chip text-xs">💡 {t('talk.hint')}: {pickL(session.step.hint, locale)}</span>
            </div>
          )}
          <div className="flex gap-2">
            {stt.supported && (
              <button onClick={toggleMic}
                className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center shadow-lg shrink-0 transition ${listening ? 'bg-rose-500 text-white animate-pulse' : 'btn-primary !p-0'}`}>
                {listening ? '⏹' : '🎤'}
              </button>
            )}
            <input className="input flex-1" placeholder={listening ? t('task.speaking.listening') : t('talk.typed.placeholder')}
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
            <button className="btn-primary shrink-0" onClick={() => submit()} disabled={!input.trim()}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
