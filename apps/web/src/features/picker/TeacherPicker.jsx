import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useT, useLocale } from '../../core/store.js';
import { api } from '../../core/api.js';
import { TEACHERS, greetingUrl } from '../../data/teachers.js';
import { pickL } from '../../i18n/index.js';
import Avatar, { SpeechBubble } from '../../avatar/Avatar.jsx';
import { sfx } from '../../audio/sfx.js';

const TEACHER_PRICE = 300;

export default function TeacherPicker({ firstTime = false }) {
  const { user, setUser } = useApp();
  const t = useT();
  const locale = useLocale();
  const nav = useNavigate();
  const [unlocks, setUnlocks] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => { api.getUnlocks().then(setUnlocks).catch(() => {}); }, []);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const isUnlocked = (id) =>
    firstTime || !user.teacherId || id === user.teacherId || unlocks.some((u) => u.itemType === 'teacher' && u.itemId === id);

  const playVoice = (teacher) => {
    sfx.click();
    audioRef.current?.pause();
    if (playingId === teacher.id) { setPlayingId(null); return; }
    const a = new Audio(greetingUrl(teacher.id));
    audioRef.current = a;
    a.onended = () => setPlayingId(null);
    a.onerror = () => setPlayingId(null);
    a.play().then(() => setPlayingId(teacher.id)).catch(() => setPlayingId(null));
  };

  const choose = async (teacher) => {
    if (!isUnlocked(teacher.id)) { nav('/shop'); return; }
    sfx.levelUp();
    const u = await api.updateProfile({ teacherId: teacher.id });
    setUser(u);
    nav('/');
  };

  return (
    <div className={firstTime ? 'min-h-full px-4 md:px-8 py-8 max-w-6xl mx-auto' : ''}>
      <div className="text-center mb-8">
        <h1 className="h1">🧑‍🏫 {t('picker.title')}</h1>
        <p className="mt-2 font-semibold text-ink/60">{t('picker.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {TEACHERS.map((teacher) => {
          const unlocked = isUnlocked(teacher.id);
          const playing = playingId === teacher.id;
          return (
            <div key={teacher.id} className={`card p-3 flex flex-col gap-2 relative overflow-visible transition hover:-translate-y-1 ${!unlocked ? 'opacity-80' : ''}`}>
              {playing && (
                <SpeechBubble className="absolute -top-4 left-1/2 -translate-x-1/2 w-[130%] z-20 text-xs !px-3 !py-2">
                  {teacher.greeting}
                </SpeechBubble>
              )}
              <Avatar teacher={teacher} talking={playing} className="w-full" />
              <div className="text-center">
                <div className="font-black">{teacher.emoji} {teacher.name}</div>
                <div className="text-xs font-semibold text-ink/50 leading-tight min-h-[2rem]">{pickL(teacher.tagline, locale)}</div>
              </div>
              {!unlocked && (
                <div className="absolute top-2 right-2 chip !bg-black/60 text-white text-xs">🔒 {TEACHER_PRICE}🪙</div>
              )}
              <div className="flex gap-1.5 mt-auto">
                <button className="btn-ghost flex-1 !px-2 !py-2 text-xs" onClick={() => playVoice(teacher)}>
                  {playing ? '⏸' : '▶️'} {t('picker.playVoice')}
                </button>
                <button className={`flex-1 !px-2 !py-2 text-xs ${unlocked ? 'btn-primary' : 'btn-outline'}`} onClick={() => choose(teacher)}>
                  {unlocked ? t('picker.choose') : t('picker.locked')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {!firstTime && (
        <p className="text-center mt-6 text-sm font-semibold text-ink/50">{t('picker.unlockHint', { price: TEACHER_PRICE })}</p>
      )}
    </div>
  );
}
