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
import { useAI } from '../../ai/useAI.js';

const MODE_COPY = { en: { local: 'AI: local model', basic: 'AI: basic mode', mic: 'Microphone error — type instead.' }, ru: { local: 'AI: локальная модель', basic: 'AI: базовый режим', mic: 'Ошибка микрофона — напиши ответ.' }, vi: { local: 'AI: mô hình cục bộ', basic: 'AI: chế độ cơ bản', mic: 'Lỗi micrô — hãy gõ thay thế.' } };

export default function Talk() {
  const { user, setUser } = useApp();
  const t = useT();
  const locale = useLocale();
  const teacher = teacherById(user.teacherId);
  const ai = useAI();
  const copy = MODE_COPY[locale] || MODE_COPY.en;
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [talking, setTalking] = useState(false);
  const [emotion, flash] = useEmotion();
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [doneInfo, setDoneInfo] = useState(null);
  const sessionRef = useRef(null);
  const recRef = useRef(null);
  const okSteps = useRef(0);
  const logRef = useRef(null);

  useEffect(() => { logRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [messages, doneInfo]);
  useEffect(() => () => { tts.stop(); recRef.current?.stop(); }, []);

  const teacherSay = (text, onDone) => {
    if (!text) { onDone?.(); return; }
    setMessages((m) => [...m, { who: 't', text }]);
    tts.speak(text, teacher, { onStart: () => setTalking(true), onEnd: () => { setTalking(false); onDone?.(); }, lang: 'en-US' });
  };
  const startScenario = (s) => {
    tts.unlock?.();
    sfx.click();
    const session = createScenarioSession(s);
    sessionRef.current = session; okSteps.current = 0;
    setMode({ kind: 'scenario', s }); setMessages([]); setDoneInfo(null); setVoiceError('');
    // Intentionally synchronous: browser audio must be unlocked in this click handler.
    teacherSay(session.step.say);
  };
  const startFree = () => {
    tts.unlock?.();
    sfx.click();
    const chat = createFreeChat();
    sessionRef.current = chat; okSteps.current = 0;
    setMode({ kind: 'free' }); setMessages([]); setDoneInfo(null); setVoiceError('');
    teacherSay(chat.opener(user.name));
  };
  const finish = async (say = true) => {
    tts.stop(); recRef.current?.stop(); setListening(false);
    const steps = okSteps.current, xp = Math.min(60, steps * 8), coins = steps > 0 ? 8 + steps * 2 : 0;
    if (say && sessionRef.current?.farewell) teacherSay(sessionRef.current.farewell());
    const u = await api.earn({ xp, coins }).catch(() => null); if (u) setUser(u);
    setDoneInfo({ steps, xp, coins }); if (steps > 2) sfx.levelUp();
  };
  const addStreamingBubble = () => {
    const id = `ai-${Date.now()}-${Math.random()}`;
    setMessages((m) => [...m, { id, who: 't', text: '' }]);
    return id;
  };
  const updateBubble = (id, text) => setMessages((items) => items.map((item) => item.id === id ? { ...item, text } : item));
  const askTeacher = async (text, context = {}) => {
    const bubbleId = addStreamingBubble(); let streamed = '';
    const result = await ai.runTask('tutor_reply', { text, history: messages.slice(-8).map((item) => ({ role: item.who === 's' ? 'user' : 'assistant', content: item.text })), scenario: mode?.s?.title?.en || mode?.s?.id || 'free conversation' }, { locale, level: user.level, teacher, fallbackSession: sessionRef.current, ...context, onToken: (token) => { streamed += token; updateBubble(bubbleId, streamed); } });
    const finalText = result.data?.text || streamed;
    updateBubble(bubbleId, finalText);
    tts.speak(finalText, teacher, { onStart: () => setTalking(true), onEnd: () => setTalking(false), lang: 'en-US' });
    return result;
  };
  const submit = async (textRaw) => {
    const text = (textRaw ?? input).trim();
    if (!text || talking) return;
    setInput(''); setMessages((m) => [...m, { who: 's', text }]);
    const session = sessionRef.current;
    if (mode.kind === 'scenario') {
      const res = session.submit(text);
      api.addAttempt({ taskType: 'speaking', topic: 'conversation', level: mode.s.level, correct: res.ok, durationMs: 0 }).then((u) => u && setUser(u)).catch(() => {});
      if (res.ok) { okSteps.current++; sfx.correct(); flash('happy'); } else { sfx.wrong(); flash('encourage'); }
      const correction = await ai.runTask('correct_sentence', { sentence: text }, { locale, level: user.level });
      const errors = correction.data?.errors || [];
      if (errors.length) setMessages((m) => [...m, { who: 'fix', text: `${errors[0].wrong} → ${errors[0].right}`, tip: errors[0].rule }]);
      // Scenarios stay scripted (predictable lesson path); the next line waits for the teacher to finish speaking.
      teacherSay(res.say, () => {
        if (res.done) setTimeout(() => finish(false), 500);
        else if (res.ok) setTimeout(() => teacherSay(session.step.say), 300);
      });
    } else {
      okSteps.current = Math.min(okSteps.current + 1, 20);
      const correction = await ai.runTask('correct_sentence', { sentence: text }, { locale, level: user.level });
      const errors = correction.data?.errors || [];
      if (errors.length) flash('encourage'); else if (Math.random() < 0.4) flash('happy');
      if (errors.length) setMessages((m) => [...m, { who: 'fix', text: `${errors[0].wrong} → ${errors[0].right}`, tip: errors[0].rule }]);
      await askTeacher(text);
    }
  };
  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); return; }
    if (!stt.supported) { setVoiceError(copy.mic); return; }
    sfx.pop(); setVoiceError(''); setListening(true);
    recRef.current = stt.listen({ lang: 'en-US', onPartial: (txt) => setInput(txt), onFinal: (txt) => { setListening(false); if (txt.trim()) submit(txt); }, onError: () => { setListening(false); setVoiceError(copy.mic); } });
  };

  if (!mode) return (
    <div>
      <h1 className="h1 mb-1">💬 {t('talk.title')}</h1><p className="font-semibold text-ink/60 mb-6">{t('talk.subtitle', { name: teacher.name })}</p>
      <div className="mb-4"><span className="chip text-xs">{ai.ready ? copy.local : copy.basic}</span></div>
      {!stt.supported && <div className="card p-3 mb-4 text-sm font-bold text-amber-600">⚠️ {t('talk.notSupported')}</div>}
      <button onClick={startFree} className="card p-5 w-full flex items-center gap-4 hover:-translate-y-0.5 transition mb-6 text-left"><div className="w-20 shrink-0"><Avatar teacher={teacher} rounded="rounded-2xl" /></div><div><div className="font-black text-lg">🗨️ {t('talk.free')}</div><div className="text-sm font-semibold text-ink/55">{t('talk.freeDesc', { name: teacher.name })}</div></div><span className="ml-auto text-2xl">→</span></button>
      <div className="label mb-2">{t('talk.scenarios')}</div>
      <div className="grid sm:grid-cols-2 gap-3">{scenarios.map((s) => <button key={s.id} onClick={() => startScenario(s)} className="card p-4 text-left hover:-translate-y-0.5 transition"><div className="flex items-center gap-2"><span className="text-3xl">{s.emoji}</span><div className="min-w-0"><div className="font-black truncate">{pickL(s.title, locale)}</div><div className="text-xs font-bold text-primary">{s.level} · {s.steps.length} 💬</div></div></div><div className="text-sm font-semibold text-ink/55 mt-2">{pickL(s.description, locale)}</div></button>)}</div>
    </div>
  );

  const scenario = mode.kind === 'scenario' ? mode.s : null;
  const session = sessionRef.current;
  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] flex flex-col">
      {doneInfo && <Confetti burst={doneInfo.steps > 2} />}
      <div className="flex items-center gap-3 mb-3"><button className="text-2xl" onClick={() => { finish(false); setMode(null); }}>←</button><div className="font-black truncate">{scenario ? `${scenario.emoji} ${pickL(scenario.title, locale)}` : '🗨️ ' + t('talk.free')}</div>{scenario && !doneInfo && <span className="chip ml-auto">{t('talk.step', { n: Math.min(session.index + 1, session.total), total: session.total })}</span>}{!scenario && !doneInfo && <button className="btn-ghost !py-1.5 !px-3 text-sm ml-auto" onClick={() => finish(true)}>🏁 {t('talk.exit')}</button>}</div>
      <div className="flex items-center gap-2 mb-2"><span className="chip text-xs">{ai.ready ? copy.local : copy.basic}</span>{voiceError && <span className="text-xs font-bold text-rose-600">{voiceError}</span>}</div>
      <div className="flex-1 min-h-0 grid grid-cols-[92px_1fr] md:grid-cols-[150px_1fr] gap-4"><div className="sticky top-0"><Avatar teacher={teacher} talking={talking} emotion={emotion} frame={user.frame} /></div><div ref={logRef} className="overflow-y-auto pr-1 space-y-2.5 pb-2">{messages.map((m, i) => m.who === 'fix' ? <div key={m.id || i} className="anim-bubble mx-auto max-w-[90%] text-center text-sm font-bold bg-amber-100 text-amber-800 rounded-2xl px-4 py-2">✏️ {m.text}<div className="text-xs font-semibold mt-0.5">{m.tip}</div></div> : <div key={m.id || i} className={`anim-bubble max-w-[85%] rounded-2xl px-4 py-2.5 font-semibold leading-snug ${m.who === 't' ? 'bg-surface border border-black/5 shadow-sm' : 'ml-auto text-white'}`} style={m.who === 's' ? { background: 'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' } : {}}>{m.text}</div>)}{doneInfo && <div className="card p-5 text-center anim-pop"><div className="text-3xl">🏆</div><div className="font-black text-lg">{t('talk.done.title')}</div><div className="mt-1 font-bold text-ink/60 text-sm">{t('talk.done.steps')}: {doneInfo.steps} · ⭐ +{doneInfo.xp} · 🪙 +{doneInfo.coins}</div><button className="btn-primary mt-3" onClick={() => setMode(null)}>{t('common.back')}</button></div>}</div></div>
      {!doneInfo && <div className="mt-3 space-y-2">{scenario && session.step && <div className="text-center"><span className="chip text-xs">💡 {t('talk.hint')}: {pickL(session.step.hint, locale)}</span></div>}<div className="flex gap-2">{stt.supported && <button onClick={toggleMic} className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center shadow-lg shrink-0 transition ${listening ? 'bg-rose-500 text-white animate-pulse' : 'btn-primary !p-0'}`}>{listening ? '⏹' : '🎤'}</button>}<input className="input flex-1" placeholder={listening ? t('task.speaking.listening') : t('talk.typed.placeholder')} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} /><button className="btn-primary shrink-0" onClick={() => submit()} disabled={!input.trim() || talking}>➤</button></div></div>}
    </div>
  );
}
