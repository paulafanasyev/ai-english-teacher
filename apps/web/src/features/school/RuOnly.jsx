import { useApp } from '../../core/store.js';

const TEXT = {
  en: 'This section follows the Russian federal school curricula, so its content is shown in Russian.',
  vi: 'Mục này theo chương trình phổ thông liên bang của Nga, vì vậy nội dung được hiển thị bằng tiếng Nga.',
};

export default function RuOnly() {
  const { locale } = useApp();
  if (!TEXT[locale]) return null;
  return <p lang={locale} className="rounded-2xl bg-soft px-4 py-2 text-sm font-bold text-ink/70">ℹ️ {TEXT[locale]}</p>;
}
