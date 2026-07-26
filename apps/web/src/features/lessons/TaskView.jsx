import { useEffect, useRef, useState } from 'react';
import { useT } from '../../core/store.js';
import { checkTask } from '../../engine/tasks.js';
import { TEACHERS } from '../../data/teachers.js';
import { tts } from '../../audio/tts.js';
import { stt } from '../../audio/stt.js';
import { sfx } from '../../audio/sfx.js';

const QUESTION_KEY = {
  vocab: 'task.vocab.q', vocabRev: 'task.vocabRev.q', gap: 'task.gap.q', match: 'task.match.q',
  choose: 'task.choose.q', reorder: 'task.reorder.q', findError: 'task.findError.q',
  listening: 'task.listening.q', writing: 'task.writing.q', speaking: 'task.speaking.q',
};

export default function TaskView({ task, teacher, onAnswer, disabled }) {
  const t = useT();
  const body = {
    vocab: <Options task={task} onAnswer={onAnswer} disabled={disabled} big={task.word} />,
    vocabRev: <Options task={task} onAnswer={onAnswer} disabled={disabled} big={task.word} />,
    gap: <Options task={task} onAnswer={onAnswer} disabled={disabled} sentence={task.sentence} hint={task.hint} />,
    choose: <Options task={task} onAnswer={onAnswer} disabled={disabled} sentence={task.sentence} />,
    findError: <FindError task={task} onAnswer={onAnswer} disabled={disabled} />,
    reorder: <Reorder task={task} onAnswer={onAnswer} disabled={disabled} />,
    writing: <Writing task={task} onAnswer={onAnswer} disabled={disabled} />,
    speaking: <Speaking task={task} teacher={teacher} onAnswer={onAnswer} disabled={disabled} />,
    match: <Match task={task} onAnswer={onAnswer} disabled={disabled} />,
    listening: <Listening task={task} teacher={teacher} onAnswer={onAnswer} disabled={disabled} />,
  }[task.type];

  return (
    <div className="card p-5 md:p-6">
      <div className="label mb-3">{t(QUESTION_KEY[task.type])}</div>
      {body}
    </div>
  );
}

/* ---------- shared option buttons ---------- */
function Options({ task, onAnswer, disabled, big, sentence, hint }) {
  const [picked, setPicked] = useState(null);
  const pick = (i) => {
    if (disabled || picked != null) return;
    setPicked(i);
    onAnswer(checkTask(task, i));
  };
  return (
    <div>
      {big && <div className="text-3xl md:text-4xl font-black mb-4 text-center">{big}</div>}
      {sentence && <div className="text-xl md:text-2xl font-bold mb-1 text-center leading-relaxed">{sentence}</div>}
      {hint && <div className="text-center mb-3"><span className="chip">💡 {hint}</span></div>}
      <div className={`grid gap-2.5 mt-3 ${task.options.length > 3 ? 'sm:grid-cols-2' : ''}`}>
        {task.options.map((o, i) => {
          let cls = 'btn-ghost';
          if (picked != null) {
            if (i === task.answer) cls = 'btn bg-emerald-500 text-white';
            else if (i === picked) cls = 'btn bg-rose-400 text-white anim-shake';
            else cls = 'btn-ghost opacity-50';
          }
          return <button key={i} className={`${cls} justify-start text-left !font-bold`} onClick={() => pick(i)}>{o}</button>;
        })}
      </div>
    </div>
  );
}

/* ---------- find the error ---------- */
function FindError({ task, onAnswer, disabled }) {
  const [picked, setPicked] = useState(null);
  const words = task.sentence.split(' ');
  const pick = (i) => {
    if (disabled || picked != null) return;
    setPicked(i); sfx.shot();
    onAnswer(checkTask(task, i));
  };
  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {words.map((w, i) => {
        let cls = 'btn-ghost';
        if (picked != null) {
          if (i === task.errorIndex) cls = 'btn bg-rose-400 text-white line-through';
          else if (i === picked) cls = 'btn bg-ink/20 anim-shake';
        }
        return <button key={i} className={`${cls} !px-3 !py-2 text-lg`} onClick={() => pick(i)}>{w}</button>;
      })}
      {picked != null && <div className="w-full text-center font-black text-emerald-600 anim-pop">→ {task.correction}</div>}
    </div>
  );
}

/* ---------- reorder / build the sentence ---------- */
function Reorder({ task, onAnswer, disabled }) {
  const t = useT();
  const [bank, setBank] = useState(task.words.map((w, i) => ({ w, i })));
  const [built, setBuilt] = useState([]);
  const [resolved, setResolved] = useState(false);
  const take = (item) => { if (disabled || resolved) return; sfx.pop(); setBank(bank.filter((b) => b.i !== item.i)); setBuilt([...built, item]); };
  const put = (item) => { if (disabled || resolved) return; sfx.click(); setBuilt(built.filter((b) => b.i !== item.i)); setBank([...bank, item]); };
  const check = () => {
    setResolved(true);
    onAnswer(checkTask(task, built.map((b) => b.w).join(' ')));
  };
  return (
    <div>
      <div className="min-h-[64px] rounded-2xl border-2 border-dashed border-primary/30 bg-soft/50 p-3 flex flex-wrap gap-2 items-center justify-center">
        {built.length === 0 && <span className="text-ink/30 font-bold text-sm">…</span>}
        {built.map((b) => <button key={b.i} className="btn-primary !px-3 !py-1.5 text-base" onClick={() => put(b)}>{b.w}</button>)}
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-4 min-h-[44px]">
        {bank.map((b) => <button key={b.i} className="btn-ghost !px-3 !py-1.5 text-base" onClick={() => take(b)}>{b.w}</button>)}
      </div>
      <button className="btn-primary w-full mt-4" disabled={bank.length > 0 || resolved} onClick={check}>{t('task.check')}</button>
    </div>
  );
}

/* ---------- writing ---------- */
function Writing({ task, onAnswer, disabled }) {
  const t = useT();
  const [val, setVal] = useState('');
  const [resolved, setResolved] = useState(false);
  const submit = (e) => {
    e?.preventDefault();
    if (disabled || resolved || !val.trim()) return;
    setResolved(true);
    onAnswer(checkTask(task, val));
  };
  return (
    <form onSubmit={submit}>
      <div className="text-3xl font-black mb-1 text-center">{task.prompt}</div>
      {task.example && <div className="text-center text-sm text-ink/40 font-semibold mb-3 italic">…{task.example.replace(new RegExp(task.answerText, 'ig'), '___')}</div>}
      <input autoFocus className="input text-center text-xl" placeholder={t('task.writing.placeholder')}
        value={val} onChange={(e) => setVal(e.target.value)} disabled={resolved} />
      <button className="btn-primary w-full mt-3" disabled={!val.trim() || resolved}>{t('task.check')}</button>
    </form>
  );
}

/* ---------- speaking ---------- */
function Speaking({ task, teacher, onAnswer, disabled }) {
  const t = useT();
  const [rec, setRec] = useState(false);
  const [heard, setHeard] = useState('');
  const [typed, setTyped] = useState('');
  const [resolved, setResolved] = useState(false);
  const recRef = useRef(null);

  const finish = (text) => {
    if (resolved || !text.trim()) return;
    setResolved(true);
    onAnswer(checkTask(task, text));
  };
  const toggleRec = () => {
    if (disabled || resolved) return;
    if (rec) { recRef.current?.stop(); return; }
    setHeard(''); setRec(true); sfx.pop();
    recRef.current = stt.listen({
      onPartial: (txt) => setHeard(txt),
      onFinal: (txt) => { setRec(false); setHeard(txt); finish(txt); },
      onError: () => setRec(false),
    });
  };
  const listenSample = () => tts.speak(task.sentence, teacher, { force: true });
  useEffect(() => () => recRef.current?.stop(), []);

  return (
    <div className="text-center">
      <div className="text-xl md:text-2xl font-black leading-relaxed">“{task.sentence}”</div>
      <button className="chip mt-2 cursor-pointer hover:bg-primary hover:text-white transition" onClick={listenSample}>🔊 {t('task.listening.replay')}</button>
      {stt.supported ? (
        <>
          <button onClick={toggleRec} disabled={resolved}
            className={`mt-5 w-24 h-24 rounded-full text-4xl shadow-xl transition mx-auto flex items-center justify-center ${rec ? 'bg-rose-500 animate-pulse text-white' : 'btn-primary !rounded-full'}`}>
            {rec ? '⏹' : '🎤'}
          </button>
          <div className="mt-2 font-bold text-ink/50 text-sm">{rec ? t('task.speaking.listening') : t('task.speaking.tap')}</div>
          {heard && <div className="mt-3 font-semibold">🗣 {t('task.speaking.heard')} <i>“{heard}”</i></div>}
        </>
      ) : (
        <div className="mt-4">
          <div className="text-sm font-bold text-ink/50 mb-2">{t('task.speaking.nomic')}</div>
          <input className="input text-center" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={task.sentence.split(' ').slice(0, 2).join(' ') + '…'} />
          <button className="btn-primary w-full mt-3" disabled={!typed.trim() || resolved} onClick={() => finish(typed)}>{t('task.check')}</button>
        </div>
      )}
    </div>
  );
}

/* ---------- match pairs ---------- */
function Match({ task, onAnswer, disabled }) {
  const [left] = useState(() => [...task.pairs].sort(() => 0.5 - Math.random()));
  const [right] = useState(() => [...task.pairs].sort(() => 0.5 - Math.random()));
  const [selL, setSelL] = useState(null);
  const [done, setDone] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const mistakes = useRef(0);

  const clickL = (p) => { if (disabled || done.includes(p.id)) return; sfx.click(); setSelL(p.id); };
  const clickR = (p) => {
    if (disabled || done.includes(p.id) || selL == null) return;
    if (p.id === selL) {
      sfx.match();
      const nd = [...done, p.id];
      setDone(nd); setSelL(null);
      if (nd.length === task.pairs.length) onAnswer({ ...checkTask(task, { mistakes: mistakes.current }), correctText: '' });
    } else {
      sfx.wrong(); mistakes.current++;
      setWrongPair(p.id);
      setTimeout(() => setWrongPair(null), 400);
      setSelL(null);
    }
  };
  const btnCls = (id, side, extra = '') =>
    `btn w-full !justify-start text-left ${done.includes(id) ? 'bg-emerald-100 text-emerald-700 pointer-events-none' :
      side === 'l' && selL === id ? 'btn-primary' : wrongPair === id && side === 'r' ? 'bg-rose-300 anim-shake' : 'btn-ghost'} ${extra}`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">{left.map((p) => <button key={p.id} className={btnCls(p.id, 'l')} onClick={() => clickL(p)}>{p.a}</button>)}</div>
      <div className="space-y-2">{right.map((p) => <button key={p.id} className={btnCls(p.id, 'r')} onClick={() => clickR(p)}>{p.b}</button>)}</div>
    </div>
  );
}

/* ---------- listening ---------- */
function Listening({ task, teacher, onAnswer, disabled }) {
  const t = useT();
  const d = task.dialogue;
  const other = TEACHERS.find((x) => x.gender !== teacher.gender) || TEACHERS[1];
  const [playing, setPlaying] = useState(false);
  const [lineIdx, setLineIdx] = useState(-1);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [nCorrect, setNCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const play = () => {
    if (playing) { tts.stop(); setPlaying(false); setLineIdx(-1); return; }
    setPlaying(true); sfx.click();
    tts.speakSeq(
      d.lines.map((l) => ({ text: l.t, teacher: l.s === 'A' ? teacher : other, force: true })),
      { onItem: (i) => setLineIdx(i), onEnd: () => { setPlaying(false); setLineIdx(-1); } }
    );
  };
  useEffect(() => () => tts.stop(), []);

  const q = d.questions[qIdx];
  const pickOpt = (i) => {
    if (picked != null || finished) return;
    setPicked(i);
    const ok = i === q.answer;
    if (ok) { sfx.correct(); setNCorrect(nCorrect + 1); } else sfx.wrong();
    setTimeout(() => {
      if (qIdx + 1 < d.questions.length) { setQIdx(qIdx + 1); setPicked(null); }
      else {
        setFinished(true);
        const total = d.questions.length;
        const finalCorrect = nCorrect + (ok ? 1 : 0);
        onAnswer({ correct: finalCorrect === total, correctText: `${finalCorrect}/${total}` });
      }
    }, 650);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button className="btn-primary !py-2" onClick={play}>{playing ? '⏸' : '🔊'} {playing ? t('talk.stop') : t('task.listening.play')}</button>
        <div className="flex gap-1.5">
          {d.lines.map((l, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${i === lineIdx ? 'bg-primary animate-pulse' : 'bg-ink/15'}`} />
          ))}
        </div>
      </div>
      {finished && (
        <div className="mb-4 space-y-1 text-sm font-semibold bg-soft rounded-2xl p-3">
          {d.lines.map((l, i) => <div key={i}><b>{l.s}:</b> {l.t}</div>)}
        </div>
      )}
      <div className="font-black text-lg mb-3">{qIdx + 1}/{d.questions.length} · {q.q.en}</div>
      <div className="grid gap-2">
        {q.options.map((o, i) => {
          let cls = 'btn-ghost';
          if (picked != null) {
            if (i === q.answer) cls = 'btn bg-emerald-500 text-white';
            else if (i === picked) cls = 'btn bg-rose-400 text-white';
          }
          return <button key={i} className={`${cls} !justify-start`} onClick={() => pickOpt(i)}>{o}</button>;
        })}
      </div>
    </div>
  );
}
