// ФРП «Китайский язык» (ЕДСОО, ред. 2025): НОО 2–4, второй иностранный ООО 5–9 и СОО 10–11.
// Тексты берутся при сборке из машинного разбора официальных PDF edsoo.ru
// (github.com/Bormotoon/program-constructor, src/data/frp) по зафиксированному коммиту и кэшируются.
// Слова не меняются: убираются только колонтитулы/номера страниц и восстанавливаются потерянные дефисы.
// Если источник недоступен, сборка не падает: китайский остаётся в разделе «официальные источники».
import fs from 'node:fs';
import path from 'node:path';

const SRC_COMMIT = '0efda7cf9967ec37abae7b70610d74bd0a46cb50';
const BASE = `https://raw.githubusercontent.com/Bormotoon/program-constructor/${SRC_COMMIT}/src/data/frp/`;
const VID = 'virtual:chinese-frp';
const CHECK = 'Текст перенесён из машинного разбора официального PDF ЕДСОО: часы и выборочные фрагменты сверены с PDF, построчная сверка продолжается. Для документов школы используйте официальный PDF.';
const OPT = 'Второй иностранный язык изучается по решению образовательной организации при наличии условий; минимальное число часов ФОП не устанавливает. Рекомендовано 2 ч в неделю.';
export const JOBS = [
  { file: 'inostrannyj-kitajskij-yazyk-noo.json', level: 'НОО', grades: [2, 3, 4], id: 'chinese-noo-', subject: 'Иностранный (китайский) язык', hint: 'kitajskij',
    url: 'https://edsoo.ru/wp-content/uploads/2025/07/2025_noo_frp_kitajskij-yazyk_2-4.pdf',
    doc: 'Федеральная рабочая программа начального общего образования «Иностранный (китайский) язык» (для 2–4 классов), ЕДСОО, ред. 2025' },
  { file: 'vtoroj-inostrannyj-kitajskij-yazyk-ooo.json', level: 'ООО', grades: [5, 6, 7, 8, 9], id: 'chinese-vi-ooo-', subject: 'Второй иностранный (китайский) язык', hint: 'kit',
    url: 'https://edsoo.ru/wp-content/uploads/2025/02/frp-kit-yaz_vi_5-9_.pdf',
    doc: 'Федеральная рабочая программа основного общего образования «Второй иностранный (китайский) язык» (для 5–9 классов), ЕДСОО, ред. 2025' },
  { file: 'kitajskij-yazyk-vtoroj-inostrannyj-yazyk-soo-bazovyj.json', level: 'СОО', grades: [10, 11], id: 'chinese-vi-soo-', subject: 'Второй иностранный (китайский) язык', hint: 'kit',
    url: 'https://edsoo.ru/wp-content/uploads/2025/07/2025_soo_frp_vi_kit-yaz_10-11.pdf',
    doc: 'Федеральная рабочая программа среднего общего образования «Второй иностранный (китайский) язык» (базовый уровень, для 10–11 классов), ЕДСОО, ред. 2025' },
];

// При извлечении текста из PDF теряются дефисы в составных словах; восстанавливаем только известные случаи.
const HYPHENS = [['духовнонравствен', 'духовно-нравствен'], ['коммуникативнокогнитив', 'коммуникативно-когнитив'], ['социальнотрудов', 'социально-трудов'],
  ['лексикограмматическ', 'лексико-грамматическ'], ['покитайски', 'по-китайски'], ['порусски', 'по-русски'], ['репликклише', 'реплик-клише'],
  ['утвердительноотрицательн', 'утвердительно-отрицательн'], ['видовременн', 'видо-временн'], ['научнопопулярн', 'научно-популярн'],
  ['учебнопознавательн', 'учебно-познавательн'], ['информационнокоммуникацион', 'информационно-коммуникацион'], ['историкокультурн', 'историко-культурн'],
  ['культурноисторическ', 'культурно-историческ'], ['художественноэстетическ', 'художественно-эстетическ'], ['ценностноориентацион', 'ценностно-ориентацион'],
  ['социальнобытов', 'социально-бытов'], ['социальнокультурн', 'социально-культурн'], ['учебноисследовательск', 'учебно-исследовательск'],
  ['проектноисследовательск', 'проектно-исследовательск'], ['эмоциональноценностн', 'эмоционально-ценностн'], ['причинноследственн', 'причинно-следственн'],
  ['общественнополезн', 'общественно-полезн']];
const fixHyphens = s => HYPHENS.reduce((t, [a, b]) => t.replace(new RegExp(a, 'gi'), m => (m[0] === m[0].toUpperCase() ? b[0].toUpperCase() + b.slice(1) : b)), s);
// Остатки колонтитулов и номера страниц из PDF.
const JUNK = /^(?:\d+[–-]\d+\s+классы(?:\s*\(базовый уровень\))?|Федеральная рабочая программа\s*\|.*|\d{1,3})$/;
const clean = s => fixHyphens(String(s ?? '').replace(/\s+/g, ' ').trim());
export function lines(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.flatMap(x => lines(x && typeof x === 'object' ? (x.text ?? x.content ?? x.name ?? '') : x));
  return String(v).replace(/\r/g, '').split('\n').map(clean).filter(s => s && !JUNK.test(s))
    .flatMap(p => (p.length > 700 ? p.split(/(?<=;)\s+/).map(s => s.trim()).filter(Boolean) : [p]));
}
function topicText(t) {
  const num = clean(t.num), name = clean(t.name), body = clean(t.content);
  let head = (num ? `Тема ${num}. ` : '') + name;
  if (head && !/[.!?»]$/.test(head)) head += '.';
  return clean(`${head} ${body}`);
}
export function build(job, data) {
  const src = String(data.source || '');
  if (!src.includes(job.hint)) throw new Error(`${job.file}: неожиданный источник ${src}`);
  const sr = data.subjectResults && typeof data.subjectResults === 'object' ? data.subjectResults : {};
  const byGrade = new Map((data.classes || []).map(c => [Number(c.grade), c]));
  return job.grades.map(g => {
    const c = byGrade.get(g);
    if (!c) throw new Error(`${job.file}: нет ${g} класса`);
    const hours = Number(c.declaredHours || c.hours || 0);
    const sections = (c.sections || []).map((s, i) => ({ title: clean(s.name) || `Раздел ${i + 1}`, topics: (s.topics || []).map(topicText).filter(Boolean) })).filter(s => s.topics.length);
    const content = lines(c.content), results = lines(sr[String(g)]);
    if (!sections.length || !content.length || !results.length || !(hours > 0))
      throw new Error(`${job.file} ${g} кл.: разделов ${sections.length}, содержания ${content.length}, результатов ${results.length}, часов ${hours}`);
    return { id: job.id + g, level: job.level, subject: job.subject, grade: g, optional: job.level !== 'НОО',
      hours_per_week: Math.round((hours / 34) * 100) / 100, hours_per_year: hours, sections, content, results,
      source_url: job.url, source_doc: job.doc, source_file: src, extraction: `github.com/Bormotoon/program-constructor@${SRC_COMMIT.slice(0, 7)}`,
      verification: 'machine_extracted_spot_checked', note: job.level !== 'НОО' ? `${OPT} ${CHECK}` : CHECK };
  });
}

async function load(job, cacheDir, localDir) {
  if (localDir) return JSON.parse(fs.readFileSync(path.join(localDir, job.file), 'utf8'));
  const cached = path.join(cacheDir, `${SRC_COMMIT.slice(0, 7)}-${job.file}`);
  if (fs.existsSync(cached)) return JSON.parse(fs.readFileSync(cached, 'utf8'));
  const res = await fetch(BASE + job.file, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${job.file}: HTTP ${res.status}`);
  const text = await res.text();
  const data = JSON.parse(text);
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cached, text);
  return data;
}

export async function loadChinese({ cacheDir = path.resolve('node_modules/.cache/frp-chinese'), localDir = process.env.FRP_CHINESE_DIR } = {}) {
  const programs = [], errors = [];
  for (const job of JOBS) {
    try { programs.push(...build(job, await load(job, cacheDir, localDir))); }
    catch (e) { errors.push(String(e.message || e)); }
  }
  return { programs, errors };
}

export default function chineseFrp() {
  let mod = null;
  return {
    name: 'chinese-frp',
    resolveId(id) { return id === VID ? '\0' + VID : null; },
    async load(id) {
      if (id !== '\0' + VID) return null;
      if (!mod) {
        const { programs, errors } = await loadChinese();
        errors.forEach(e => this.warn(`ФРП «Китайский язык»: ${e}`));
        console.log(`[chinese-frp] программ: ${programs.length} (${programs.map(p => p.id).join(', ')})`);
        mod = `export const errors=${JSON.stringify(errors)};\nexport default ${JSON.stringify(programs)};`;
      }
      return mod;
    },
  };
}
