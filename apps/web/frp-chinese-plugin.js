// ФРП из корпуса github.com/Bormotoon/program-constructor (машинный разбор официальных PDF ЕДСОО, ред. 2025),
// по зафиксированному коммиту, при сборке, с кэшем:
// 1) китайский язык: НОО 2–4, второй иностранный ООО 5–9 и СОО 10–11;
// 2) предметные результаты обществознания 10 класса (новая программа, текст приказа № 729).
// Контроль: результаты литературы 10 класса корпуса сравниваются с нашими, сверенными по ФОП СОО ред. от 10.11.2025.
// Итог контроля (7 из 13 совпали): литература в корпусе в редакции до изменений, поэтому литературу оттуда не берём.
// Слова не меняются: убираются только колонтитулы/номера страниц и восстанавливаются потерянные дефисы.
// Если источник недоступен, сборка не падает (данные просто не появятся).
// Исключение: в GitHub Actions сборка падает, если не собраны все 10 программ по китайскому и результаты обществознания 10.
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

// Предметные результаты, которых нет в собственных данных Svetlana, из того же корпуса ФРП.
// social-soo-10: новая программа (приказ № 729), действует в 10 классе с 01.09.2026.
// social-soo-11 не берём: в 2026/27 11 класс учится по прежней программе, а корпус содержит новую.
export const EXTRA_RESULTS = [
  { file: 'obschestvoznanie-soo-bazovyj.json', grade: 10, id: 'social-soo-10', hint: '729' },
];
// Контроль качества корпуса: результаты литературы 10 класса уже сверены у нас вручную (ФОП СОО ред. от 10.11.2025).
const CONTROL = { file: 'literatura-soo-bazovyj.json', grade: 10, local: 'src/data/fop/literature_soo.json', id: 'literature-soo-10', min: 0.9 };
const norm = s => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
export function controlScore(corpusLines, ours) {
  const hay = ` ${norm(corpusLines.join(' '))} `;
  const items = ours.filter(x => norm(x).length > 20);
  const miss = items.filter(x => !hay.includes(` ${norm(x)} `));
  const hit = items.length - miss.length;
  return { hit, total: items.length, ratio: items.length ? hit / items.length : 0,
    misses: miss.slice(0, 3).map(x => x.slice(0, 160)), corpusSample: corpusLines.slice(0, 3).map(x => x.slice(0, 160)), corpusLines: corpusLines.length };
}

// Результаты класса: по ключу класса; если ФРП излагает их одним блоком (пустой ключ),
// берём отрезок от «к концу N класса» до следующего такого заголовка.
export function gradeResults(sr, g) {
  if (!sr || typeof sr !== 'object') return [];
  if (sr[String(g)]) return lines(sr[String(g)]);
  const all = lines(sr['']);
  const head = n => new RegExp(`к\\s+концу\\s+(?:обучения\\s+в\\s+)?${n}\\s+класс`, 'i');
  const start = all.findIndex(x => head(g).test(x));
  if (start < 0) return [];
  const rest = all.slice(start + 1).findIndex(x => head('\\d+').test(x));
  return all.slice(start, rest < 0 ? all.length : start + 1 + rest);
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

export async function loadChinese({ cacheDir = path.resolve('node_modules/.cache/frp-chinese'), localDir = process.env.FRP_CHINESE_DIR, root = process.cwd() } = {}) {
  const programs = [], errors = [], extraResults = {};
  let control = null;
  for (const job of JOBS) {
    try { programs.push(...build(job, await load(job, cacheDir, localDir))); }
    catch (e) { errors.push(String(e.message || e)); }
  }
  try {
    const data = await load(CONTROL, cacheDir, localDir);
    const ours = JSON.parse(fs.readFileSync(path.join(root, CONTROL.local), 'utf8')).find(p => p.id === CONTROL.id)?.results || [];
    control = { ...controlScore(gradeResults(data.subjectResults, CONTROL.grade), ours), keys: Object.keys(data.subjectResults || {}) };
    control.passed = control.ratio >= CONTROL.min;
    for (const job of EXTRA_RESULTS) {
      const d = await load(job, cacheDir, localDir);
      if (job.hint && !String(d.source || '').includes(job.hint)) { errors.push(`${job.file}: неожиданный источник ${d.source}`); continue; }
      const r = gradeResults(d.subjectResults, job.grade);
      if (r.length) extraResults[job.id] = r; else errors.push(`${job.file}: нет результатов ${job.grade} класса`);
    }
  } catch (e) { errors.push(String(e.message || e)); }
  return { programs, errors, extraResults, control };
}

export default function chineseFrp() {
  let mod = null, report = null;
  return {
    name: 'chinese-frp',
    // Отчёт о загрузке кладётся в сборку (frp-report.json), чтобы проверить результат без доступа к логам CI.
    generateBundle() { if (report) this.emitFile({ type: 'asset', fileName: 'frp-report.json', source: JSON.stringify(report, null, 1) }); },
    resolveId(id) { return id === VID ? '\0' + VID : null; },
    async load(id) {
      if (id !== '\0' + VID) return null;
      if (!mod) {
        const { programs, errors, extraResults, control } = await loadChinese();
        console.log(`[chinese-frp] программ: ${programs.length}; доп. результаты: ${Object.keys(extraResults).join(', ')}; контроль: ${control ? `${control.hit}/${control.total}` : 'нет'}`);
        report = { programs: programs.map(p => ({ id: p.id, hours: p.hours_per_year, topics: p.sections.reduce((n, s) => n + s.topics.length, 0), content: p.content.length, results: p.results.length })),
          extraResults: Object.fromEntries(Object.entries(extraResults).map(([k, v]) => [k, v.length])), control, errors };
        // В GitHub Actions отчёт выводится аннотацией (видна в API проверок без доступа к логам).
        if (process.env.GITHUB_ACTIONS === 'true') console.log(`::notice title=frp-report::${JSON.stringify(report).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')}`);
        if (process.env.GITHUB_ACTIONS === 'true' && (programs.length !== 10 || Object.keys(extraResults).length !== EXTRA_RESULTS.length))
          this.error(`ФРП из корпуса: программ ${programs.length} из 10, доп. результатов ${Object.keys(extraResults).length} из ${EXTRA_RESULTS.length}. ${errors.join(' | ')}`);
        errors.forEach(e => this.warn(`ФРП из корпуса: ${e}`));
        mod = `export const errors=${JSON.stringify(errors)};\nexport const extraResults=${JSON.stringify(extraResults)};\nexport const control=${JSON.stringify(control)};\nexport default ${JSON.stringify(programs)};`;
      }
      return mod;
    },
  };
}
