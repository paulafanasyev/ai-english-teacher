import { Component, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp, useT } from '../core/store.js';
import { music } from '../audio/music.js';
import { setSfxEnabled } from '../audio/sfx.js';
import { setVoiceEnabled } from '../audio/tts.js';
import Layout from './Layout.jsx';
import Login from '../features/auth/Login.jsx';
import TeacherPicker from '../features/picker/TeacherPicker.jsx';
import Home from '../features/home/Home.jsx';

// Everything except the first screens is loaded on demand: the school programs
// (ФОП data for grades 1–11), exams, courses and games are large and most
// children never open all of them in one visit.
// If a chunk fails to load (new deploy, flaky network) one reload fixes it.
const retryLazy = (factory) => lazy(() => factory().catch((error) => {
  const key = 'aet_chunk_reload';
  if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); location.reload(); }
  throw error;
}));
const Lesson = retryLazy(() => import('../features/lessons/Lesson.jsx'));
const Talk = retryLazy(() => import('../features/talk/Talk.jsx'));
const GamesHub = retryLazy(() => import('../features/games/GamesHub.jsx'));
const WordBattle = retryLazy(() => import('../features/games/WordBattle.jsx'));
const GrammarShooter = retryLazy(() => import('../features/games/GrammarShooter.jsx'));
const Quest = retryLazy(() => import('../features/games/Quest.jsx'));
const Memory = retryLazy(() => import('../features/games/Memory.jsx'));
const Shop = retryLazy(() => import('../features/shop/Shop.jsx'));
const Progress = retryLazy(() => import('../features/progress/Progress.jsx'));
const Admin = retryLazy(() => import('../features/admin/Admin.jsx'));
const Settings = retryLazy(() => import('../features/settings/Settings.jsx'));
const TeacherCabinet = retryLazy(() => import('../features/journal/TeacherCabinet.jsx'));
const ParentCabinet = retryLazy(() => import('../features/journal/ParentCabinet.jsx'));
const ExamCenter = retryLazy(() => import('../features/exams/ExamCenter.jsx'));
const Courses = retryLazy(() => import('../features/courses/Courses.jsx'));
const StudentDiary = retryLazy(() => import('../features/journal/StudentDiary.jsx'));
const MathTutor = retryLazy(() => import('../features/math/MathTutor.jsx'));
const Programs = retryLazy(() => import('../features/school/Programs.jsx'));
const Planner = retryLazy(() => import('../features/school/Planner.jsx'));
const ClassRoom = retryLazy(() => import('../features/school/ClassRoom.jsx'));

const DEV = !!import.meta.env.DEV;

class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null, stack: '' }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { this.setState({ stack: info?.componentStack || '' }); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="card p-6 max-w-xl text-center">
          <div className="text-5xl">😵</div>
          <div className="h2 mt-2">Oops!</div>
          {DEV && <p className="font-semibold text-ink/60 mt-1 text-sm break-all">{String(this.state.err?.message || this.state.err)}</p>}
          {DEV && this.state.stack && <pre className="text-left text-[10px] leading-tight mt-2 max-h-60 overflow-auto bg-soft rounded-xl p-3 whitespace-pre-wrap">{this.state.stack}</pre>}
          <button className="btn-primary w-full mt-4" onClick={() => { this.setState({ err: null, stack: '' }); location.hash = '#/'; }}>↻ Reload</button>
        </div>
      </div>
    );
  }
}

function Splash() {
  const t = useT();
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center anim-pop">
        <div className="text-6xl anim-floaty">🎓</div>
        <div className="h2 mt-3">{t('app.name')}</div>
        <div className="text-ink/50 font-semibold mt-1">{t('common.loading')}</div>
      </div>
    </div>
  );
}

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Splash />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  const { user, booted, prefs } = useApp();

  useEffect(() => { setSfxEnabled(prefs.sfxOn); }, [prefs.sfxOn]);
  useEffect(() => { setVoiceEnabled(prefs.voiceOn); }, [prefs.voiceOn]);
  useEffect(() => { try { music.setVolume(prefs.musicVol); } catch {} }, [prefs.musicVol]);
  useEffect(() => {
    try {
      if (prefs.musicOn) { music.setStyle(prefs.musicStyle); music.start(); music.setVolume(prefs.musicVol); }
      else music.stop();
    } catch {}
  }, [prefs.musicOn, prefs.musicStyle]);
  useEffect(() => () => music.stop(), []);
  // A successful render means chunks load fine again: allow the one-time reload next time.
  useEffect(() => { try { sessionStorage.removeItem('aet_chunk_reload'); } catch {} }, []);

  if (!booted) return <Splash />;
  if (!user) return <Login />;

  if (user.role === 'TEACHER') {
    return (
      <Layout>
        <Page>
          <Routes>
            <Route path="/teacher" element={<TeacherCabinet />} />
            <Route path="/classroom" element={<ClassRoom />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/teacher" replace />} />
          </Routes>
        </Page>
      </Layout>
    );
  }
  if (user.role === 'PARENT') {
    return (
      <Layout>
        <Page>
          <Routes>
            <Route path="/child" element={<ParentCabinet />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/child" replace />} />
          </Routes>
        </Page>
      </Layout>
    );
  }
  if (!user.teacherId) return <TeacherPicker firstTime />;

  return (
    <Layout>
      <Page>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lesson" element={<Lesson />} />
          <Route path="/math" element={<MathTutor />} />
          <Route path="/talk" element={<Talk />} />
          <Route path="/games" element={<GamesHub />} />
          <Route path="/games/wordbattle" element={<WordBattle />} />
          <Route path="/games/shooter" element={<GrammarShooter />} />
          <Route path="/games/quest" element={<Quest />} />
          <Route path="/games/memory" element={<Memory />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/exams" element={<ExamCenter />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/diary" element={<StudentDiary />} />
          <Route path="/classroom" element={<ClassRoom />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/teacher" element={<TeacherPicker />} />
          {user.role === 'ADMIN' && <Route path="/admin" element={<Admin />} />}
          {user.role === 'ADMIN' && <Route path="/planner" element={<Planner />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Page>
    </Layout>
  );
}
