import { Component, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp, useT } from '../core/store.js';
import { music } from '../audio/music.js';
import { setSfxEnabled } from '../audio/sfx.js';
import { setVoiceEnabled } from '../audio/tts.js';
import Layout from './Layout.jsx';
import Login from '../features/auth/Login.jsx';
import TeacherPicker from '../features/picker/TeacherPicker.jsx';
import Home from '../features/home/Home.jsx';
import Lesson from '../features/lessons/Lesson.jsx';
import Talk from '../features/talk/Talk.jsx';
import GamesHub from '../features/games/GamesHub.jsx';
import WordBattle from '../features/games/WordBattle.jsx';
import GrammarShooter from '../features/games/GrammarShooter.jsx';
import Quest from '../features/games/Quest.jsx';
import Memory from '../features/games/Memory.jsx';
import Shop from '../features/shop/Shop.jsx';
import Progress from '../features/progress/Progress.jsx';
import Admin from '../features/admin/Admin.jsx';
import Settings from '../features/settings/Settings.jsx';
import TeacherCabinet from '../features/journal/TeacherCabinet.jsx';
import ParentCabinet from '../features/journal/ParentCabinet.jsx';
import ExamCenter from '../features/exams/ExamCenter.jsx';
import Courses from '../features/courses/Courses.jsx';
import StudentDiary from '../features/journal/StudentDiary.jsx';

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
          <p className="font-semibold text-ink/60 mt-1 text-sm break-all">{String(this.state.err?.message || this.state.err)}</p>
          {this.state.stack && <pre className="text-left text-[10px] leading-tight mt-2 max-h-60 overflow-auto bg-soft rounded-xl p-3 whitespace-pre-wrap">{this.state.stack}</pre>}
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

  if (!booted) return <Splash />;
  if (!user) return <Login />;

  if (user.role === 'TEACHER') {
    return (
      <Layout>
        <ErrorBoundary>
          <Routes>
            <Route path="/teacher" element={<TeacherCabinet />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/teacher" replace />} />
          </Routes>
        </ErrorBoundary>
      </Layout>
    );
  }
  if (user.role === 'PARENT') {
    return (
      <Layout>
        <ErrorBoundary>
          <Routes>
            <Route path="/child" element={<ParentCabinet />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/child" replace />} />
          </Routes>
        </ErrorBoundary>
      </Layout>
    );
  }
  if (!user.teacherId) return <TeacherPicker firstTime />;

  return (
    <Layout>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lesson" element={<Lesson />} />
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
        <Route path="/settings" element={<Settings />} />
        <Route path="/teacher" element={<TeacherPicker />} />
        {user.role === 'ADMIN' && <Route path="/admin" element={<Admin />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </Layout>
  );
}
