import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { teacherById } from '../../data/teachers.js';
import { greetingFor, vocabulary, pickOne } from '../../data/index.js';
import Avatar, { SpeechBubble, useEmotion } from '../../avatar/Avatar.jsx';
import { tts } from '../../audio/tts.js';
import { Stat } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';

export default function Home() {
  const { user, prefs } = useApp();
  const t = useT();
  const teacher = teacherById(user.teacherId);
  const [stats, setStats] = useState(null);
  const [talking, setTalking] = useState(false);
  const [bubble, setBubble] = useState(null);
  const [emotion, flash] = useEmotion();
  const [tip] = useState(() => pickOne(vocabulary.filter((w) => w.level === (user.level || 'A1'))));

  useEffect(() => { api.getStats().then(setStats).catch(() => {}); }, [user.xp]);

  const sayHello = () => {
    sfx.pop();
    const text = greetingFor(user.name);
    setBubble(text);
    flash('happy', 1200);
    const ok = tts.speak(text, teacher, { onStart: () => setTalking(true), onEnd: () => { setTalking(false); setTimeout(() => setBubble(null), 2500); } });
    if (!ok) setTimeout(() => setBubble(null), 3500);
  };

  const CTA = [
    { to: '/lesson', icon: '📖', title: t('home.startLesson'), desc: t('home.lessonDesc'), cls: 'from-violet-500 to-fuchsia-500' },
    { to: '/talk', icon: '🎤', title: t('home.quickTalk', { name: teacher.name }), desc: t('home.talkDesc'), cls: 'from-sky-500 to-cyan-400' },
    { to: '/games', icon: '🎮', title: t('home.playGames'), desc: t('home.gamesDesc'), cls: 'from-amber-500 to-orange-500' },
    { to: '/exams', icon: '📝', title: t('home.exams'), desc: t('home.examsDesc'), cls: 'from-rose-500 to-red-500' },
    { to: '/courses', icon: '📚', title: t('home.courses'), desc: t('home.coursesDesc'), cls: 'from-emerald-500 to-teal-500' },
    { to: '/diary', icon: '📔', title: t('home.diary'), desc: t('home.diaryDesc'), cls: 'from-indigo-500 to-violet-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero with live avatar */}
      <div className="card p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-visible">
        <button onClick={sayHello} className="w-40 md:w-48 shrink-0 relative group" title="👋">
          <Avatar teacher={teacher} talking={talking} emotion={emotion} frame={user.frame} />
          <span className="absolute -bottom-1 -right-1 text-2xl bg-surface rounded-full p-1.5 shadow group-hover:scale-110 transition">👋</span>
        </button>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          {bubble
            ? <SpeechBubble className="inline-block">{bubble}</SpeechBubble>
            : (
              <>
                <h1 className="h1">{t('home.hello', { name: user.name })}</h1>
                <p className="mt-1 font-semibold text-ink/60">{t('home.subtitle')}</p>
              </>
            )}
          <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
            <span className="chip">🧑‍🏫 {t('home.myTeacher')}: <b>{teacher.name}</b></span>
            <Link to="/teacher" className="chip hover:bg-primary hover:text-white transition cursor-pointer">🔄 {t('home.changeTeacher')}</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon="🎯" label={t('home.level')} value={user.level} sub={`LVL ${1 + Math.floor(user.xp / 250)}`} />
        <Stat icon="⭐" label={t('home.xp')} value={user.xp} />
        <Stat icon="🪙" label={t('home.coins')} value={user.coins} />
        <Stat icon="🔥" label={t('home.streak')} value={(stats?.streak ?? 0) + 'd'} />
        <Stat icon="✅" label={t('home.accuracy')} value={stats ? Math.round(stats.accuracy * 100) + '%' : '—'} sub={stats ? `${stats.total} ${t('home.attempts').toLowerCase()}` : ''} />
      </div>

      {/* CTAs */}
      <div className="grid md:grid-cols-3 gap-4">
        {CTA.map((c) => (
          <Link key={c.to} to={c.to} onClick={() => sfx.click()}
            className={`rounded-3xl p-5 text-white bg-gradient-to-br ${c.cls} shadow-xl hover:-translate-y-1 transition block`}>
            <div className="text-4xl">{c.icon}</div>
            <div className="mt-2 text-lg font-black leading-tight">{c.title}</div>
            <div className="text-sm font-semibold text-white/80 mt-1">{c.desc}</div>
          </Link>
        ))}
      </div>

      {/* Tip of the day */}
      {tip && (
        <div className="card p-5 flex items-center gap-4">
          <div className="text-3xl">💡</div>
          <div>
            <div className="label">{t('home.tip.title')}</div>
            <div className="font-black text-lg">{tip.en} — {useApp.getState().locale === 'vi' ? tip.vi : tip.ru}</div>
            <div className="text-sm font-semibold text-ink/50 italic">{tip.exEn}</div>
          </div>
        </div>
      )}
    </div>
  );
}
