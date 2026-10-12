import { useLocale } from '../../core/store.js';
import Logo from '../../ui/Logo.jsx';

const DEV = {
  wa: '79148289964',
  phone: '+7 (914) 828-99-64',
  email: 'Pavel.afanasyev@inbox.ru',
  telegram: 'PaulPavel_it_dev',
  name: { ru: 'Афанасьев Павел', en: 'Pavel Afanasyev' },
};
const COPY = {
  ru: { title: 'О проекте', dev: 'Разработчик', wa: 'WhatsApp', note: '«Светлана Репетитор»: помощник школьника и учителя на базе «Светланы» АНО ЦПС «Мир Самозанятых». Демо-версия: данные хранятся в этом браузере.' },
  en: { title: 'About', dev: 'Developer', wa: 'WhatsApp', note: 'Svetlana Tutor: a helper for students and teachers, based on “Svetlana” by the non-profit “Mir Samozanyatykh”. Demo version: data is stored in this browser.' },
};

export default function About() {
  const locale = useLocale();
  const lang = COPY[locale] ? locale : 'ru';
  const c = COPY[lang];
  return (
    <div className="card p-5 space-y-4">
      <div className="label">ℹ️ {c.title}</div>
      <Logo />
      <p className="text-sm font-semibold text-ink/60">{c.note}</p>
      <div className="rounded-2xl border border-black/5 bg-surface p-4">
        <div className="text-xs font-extrabold uppercase tracking-wider text-ink/45">{c.dev}</div>
        <div className="font-black mt-0.5">{DEV.name[lang]}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 text-sm font-extrabold text-white shadow-sm active:scale-95 transition"
            href={`https://wa.me/${DEV.wa}`} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7a11.5 11.5 0 0 1-4.6-4.1c-.4-.5-1-1.6-1-2.9 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4z" /></svg>
            {c.wa} · {DEV.phone}
          </a>
          <a className="inline-flex items-center gap-2 rounded-xl bg-[#229ED9] px-3 py-2 text-sm font-extrabold text-white shadow-sm active:scale-95 transition"
            href={`https://t.me/${DEV.telegram}`} target="_blank" rel="noopener noreferrer">✈️ Telegram · @{DEV.telegram}</a>
          <a className="inline-flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2 text-sm font-extrabold text-ink shadow-sm active:scale-95 transition"
            href={`mailto:${DEV.email}`}>✉️ {DEV.email}</a>
        </div>
      </div>
    </div>
  );
}
