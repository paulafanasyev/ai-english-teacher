// Разовое извлечение действующей редакции ФОП (КонсультантПлюс через r.jina.ai) в аннотации CI.
// Задания: src/data/fop/extract_jobs.json, [{ id, url, grade, skip? }]. Только чтение, данные Svetlana не меняются.
import fs from 'node:fs';
import path from 'node:path';

const IMG = /^!?\[?Image \d+/;
async function collect(root) {
  const file = path.join(root, 'src/data/fop/extract_jobs.json');
  if (!fs.existsSync(file)) return [];
  const out = [], cache = new Map();
  for (const job of JSON.parse(fs.readFileSync(file, 'utf8')).filter(j => j.type !== 'fpu')) {
    try {
      if (!cache.has(job.url)) {
        const res = await fetch(`https://r.jina.ai/${job.url}`, { signal: AbortSignal.timeout(90000) });
        cache.set(job.url, await res.text());
      }
      const paras = cache.get(job.url).split('\n').map(x => x.replace(/\[\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      const ORD = ['', 'перв', 'втор', 'трет', 'четв', 'пят', 'шест', 'седьм', 'восьм', 'девят', 'десят', 'одиннадцат'];
      const head = n => new RegExp(`к\\s+концу\\s+(?:обучения\\s+)?во?\\s+(?:${n}|(?:${n === '\\d+' ? ORD.slice(1).join('|') : ORD[n] || n})[а-я]*)\\s+класс`, 'i');
      const start = paras.findIndex(x => head(job.grade).test(x));
      const end = start < 0 ? -1 : paras.slice(start + 1).findIndex(x => head('\\d+').test(x) || /^\d+\.\d+\.?\s/.test(x) || /^Таблица \d/.test(x));
      const body = start < 0 ? [] : paras.slice(start, end < 0 ? paras.length : start + 1 + end);
      // Иероглифы и примеры в КонсультантПлюс даны картинками: на их месте ставим маркер [рис.].
      const lines = [];
      // Номера подпунктов ФОП (110.8.7.2.) убираем: в ФРП их нет.
      const NOTE = /^\((?:в ред\.|см\. текст|введен|абзац|пп?\.\s|подпункт)|consultant\.ru|^<\d+>/i;
      for (const x0 of body) { const x = x0.replace(/^\d+(?:\.\d+)+\.?\s*/, '').replace(/!?\[Image \d+: Рисунок \d+\]\([^)]*\)/g, 'ё').replace(/Image \d+: Рисунок \d+/g, 'ё').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); if (NOTE.test(x)) continue; if (IMG.test(x)) { if (lines.length && !lines[lines.length - 1].endsWith('[рис.]')) lines[lines.length - 1] += ' [рис.]'; } else lines.push(x); }
      const probe = start < 0 ? paras.filter(x => /класс|^\d+(?:\.\d+)+/.test(x)).slice(0, 12).map(x => x.slice(0, 120)) : [];
      out.push({ id: job.id, grade: job.grade, skip: job.skip || 0, out: job.out, paras: paras.length, lines, probe });
    } catch (e) { out.push({ id: job.id, grade: job.grade, skip: 0, lines: [], error: String(e.message || e) }); }
  }
  return out;
}

// Печать частями по ~1900 символов: до 9 notice и 10 warning на шаг (лимит GitHub на аннотации).
export async function printExtract(root) {
  const esc = s => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  let n = 0;
  for (const x of await collect(root)) {
    const text = `#${x.id} g${x.grade} lines=${x.lines.length}${x.error ? ` ERR ${x.error}` : ''}\n` + x.lines.slice(x.skip).map((l, i) => `${i + x.skip}|${l}`).join('\n');
    for (let i = 0; i < text.length && n < 18; i += 1900, n++)
      console.log(`::${n < 8 ? 'notice' : 'warning'} title=x${n}-${x.id}::${esc(text.slice(i, i + 1900))}`);
  }
}

// Сверка: какие строки ФОП (действующая редакция) отсутствуют в результатах корпуса ЕДСОО, и наоборот.
// Общий счётчик аннотаций на шаг: первые 8 — notice, следующие 10 — warning.
let EMITTED = 0;
function emit(prefix, text) {
  const esc = s => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  for (let i = 0; i < text.length && EMITTED < 18; i += 1900, EMITTED++)
    console.log(`::${EMITTED < 8 ? 'notice' : 'warning'} title=${prefix}${EMITTED}::${esc(text.slice(i, i + 1900))}`);
}
const norm = s => String(s).replace(/ \[рис\.\]/g, '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
export async function diffExtract(root) {
  // Пул: все программы из src/data/fop/*.json (массивы {id, results}) + сгенерированные плагином китайского.
  const programs = [];
  const dir = path.join(root, 'src/data/fop');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try {
      const a = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (Array.isArray(a)) { for (const q of a) if (q && q.id && Array.isArray(q.results)) programs.push(q); }
      else if (f.endsWith('_results.json')) for (const [id, r] of Object.entries(a)) if (Array.isArray(r)) programs.unshift({ id, results: r });
    } catch {}
  }
  try { const { loadChinese } = await import('./frp-chinese-plugin.js'); programs.push(...(await loadChinese({ root })).programs); } catch {}
  const blocks = [];
  for (const x of await collect(root)) {
    const p = programs.find(q => q.id === x.id);
    const pool = p ? p.results : [];
    const hay = ` ${norm(pool.join(' '))} `;
    const fop = x.lines.slice(1).filter(l => norm(l).length > 20);
    const fopHay = ` ${norm(fop.join(' '))} `;
    const miss = fop.map((l, i) => [i + 1, l]).filter(([, l]) => !hay.includes(` ${norm(l)} `)).map(([i, l]) => {
      const w = new Set(norm(l).split(' '));
      let best = '', sc = -1;
      for (const c of pool) { const k = norm(c).split(' ').filter(t => w.has(t)).length; if (k > sc) { sc = k; best = c; } }
      return `F${i}: ${l}\nC: ${best}`;
    });
    const extra = pool.filter(c => norm(c).length > 20 && !fopHay.includes(` ${norm(c)} `));
    const all = x.lines.slice(1).filter(l => norm(l).length > 5);
    if (x.out && all.length) {
      // Итоговые формулировки: строка корпуса, если совпадает с ФОП (сохраняем «ё» и кавычки), иначе текст ФОП в оформлении корпуса.
      const fmt = l => { let t = l.trim().replace(/"([^"]*)"/g, '«$1»').replace(/(\d)\s+-\s+(\d)/g, '$1–$2').replace(/\s+-\s+/g, ' — ').replace(/[;,.]$/, '') + '.'; return t[0].toUpperCase() + t.slice(1); };
      const fin = all.map(l => pool.find(c => norm(c) === norm(l)) || fmt(l));
      blocks.push(`#${x.id} n=${fin.length} same=${fin.filter(f => pool.includes(f)).length}\n` + fin.join('\n'));
      continue;
    }
    if (!fop.length) { blocks.push(`#${x.id} fop=0 paras=${x.paras}${x.error ? ' ERR ' + x.error : ''}\nPROBE:\n${(x.probe || []).join('\n')}`); continue; }
    // Компактно: при расхождениях печатаем все строки ФОП по порядку, «*» — нет в корпусе; затем номера лишних строк корпуса.
    const missSet = new Set(fop.filter(l => !hay.includes(` ${norm(l)} `)));
    const body = missSet.size ? fop.map((l, i) => `${missSet.has(l) ? '*' : ' '}${i + 1}|${l}`).join('\n') : '';
    const ex = extra.map(c => pool.indexOf(c) + 1).join(',');
    blocks.push(`#${x.id} fop=${fop.length} corpus=${pool.length} miss=${miss.length} extra=${extra.length}${ex ? ' [' + ex + ']' : ''}${x.error ? ' ERR ' + x.error : ''}${body ? '\n' + body : ''}`);
  }
  emit('d', blocks.join('\n'));
}

// ФПУ (приказ № 436): по номеру раздела находим страницу КонсультантПлюс и печатаем строки таблиц.
// Задание: { type: 'fpu', section: '1.1.2.14', grades?: [5, 6] }.
// Страница раздела у КонсультантПлюс: ячейки таблицы склеены в текст. Строка = «583.1.1.2.14.1.1.Наименование…Класс Приказ…».
// Печатаем: порядковый номер ФПУ | код | наименование, авторы, издатель, класс | срок использования.
export function fpuRows(md) {
  const t = md.replace(/\[[^\]]*\]\([^)]*\)/g, '').replace(/\s*\n\s*/g, ' ');
  const re = /(?:^|[^\d.])(\d{1,4})\.\s*([12]\.1\.[123]\.\d+(?:\.\d+){1,2})\.?(?!\d)/g;
  const ms = [...t.matchAll(re)], seen = new Set(), out = [];
  ms.forEach((m, i) => {
    if (seen.has(m[2])) return; seen.add(m[2]);
    const s = m.index + m[0].length, e = i + 1 < ms.length ? ms[i + 1].index + 1 : t.length;
    let body = t.slice(s, e); const k = body.search(/\s*(?:Приказ\s*)?N \d{3}/); const tail = k > 0 ? body.slice(k) : ''; if (k > 0) body = body.slice(0, k);
    const until = (tail.match(/До 31 августа (\d{4})/) || [])[1] || '';
    body = body.replace(/Акционерное общество "Издательство "Просвещение"/g, ' @Просвещение ').replace(/Общество с ограниченной ответственностью/g, 'ООО').replace(/\s+/g, ' ').trim();
    out.push(`${m[1]}|${m[2]}|${body}|${until}`);
  });
  return out;
}
// ЭОР (приказ № 591): «1589.4.3.4.1.Наименование и описание…Правообладатель…Класс Приказ N 413…».
// Печатаем: номер | код | начало наименования | правообладатель | класс.
export function eorRows(md, section) {
  const t = md.replace(/\[[^\]]*\]\([^)]*\)/g, '').replace(/\s*\n\s*/g, ' ');
  const ms = [...t.matchAll(new RegExp(`(?<!\\d)(\\d{1,4})\\.\\s*(${section.replace(/\./g, '\\.')}\\.\\d+(?:\\.\\d+)?)\\.?(?!\\d)`, 'g'))], seen = new Set(), out = [];
  ms.forEach((m, i) => {
    if (seen.has(m[2])) return; seen.add(m[2]);
    let body = t.slice(m.index + m[0].length, i + 1 < ms.length ? ms[i + 1].index + 1 : t.length);
    const k = body.search(/Приказ\s*N \d{3}/); if (k > 0) body = body.slice(0, k);
    const own = [...body.matchAll(/(?:Общество с ограниченной ответственностью|Акционерное общество|Автономная некоммерческая организация|Федеральное государственное [а-яё ]+|Государственное [а-яё ]+)\s*"[^"]*(?:"[^"]*)?"+/g)].pop();
    const owner = own ? own[0].replace('Общество с ограниченной ответственностью', 'ООО').replace('Акционерное общество', 'АО') : '?';
    const title = (own ? body.slice(0, own.index) : body).replace(/\s+/g, ' ').trim().slice(0, 150);
    const grade = own ? body.slice(own.index + own[0].length).replace(/\s+/g, ' ').trim() : '';
    out.push(`${m[1]}|${m[2]}|${title}|${owner}|${grade}`);
  });
  return out;
}
const FPU_DOC = 'LAW_540209'; // ФПУ, приказ № 436; ЭОР (приказ № 591) — job.doc = 'LAW_545053'
export async function fpuExtract(jobs) {
  const get = async u => (await fetch(`https://r.jina.ai/${u}`, { signal: AbortSignal.timeout(90000) })).text();
  const indexes = new Map();
  const linksOf = async doc => {
    if (!indexes.has(doc)) {
      const index = await get(`https://www.consultant.ru/document/cons_doc_${doc}/`);
      const links = new Map();
      for (const m of index.matchAll(new RegExp(`\\[(\\d+(?:\\.\\d+)*)\\.?\\s([^\\]]*)\\]\\((https:\\/\\/www\\.consultant\\.ru\\/document\\/cons_doc_${doc}\\/[0-9a-f]+\\/)\\)`, 'g')))
        if (!links.has(m[1])) links.set(m[1], { url: m[3], name: m[2] });
      indexes.set(doc, links);
    }
    return indexes.get(doc);
  };
  const blocks = [];
  for (const job of jobs) {
    const links = await linksOf(job.doc || FPU_DOC);
    if (job.list) { blocks.push(`#${job.doc} links=${links.size}\n` + [...links].filter(([, v]) => !job.grep || new RegExp(job.grep, 'i').test(v.name)).map(([k, v]) => `${k} ${v.name.slice(0, job.grep ? 110 : 40)} ${job.full ? v.url.slice(-41, -1) : v.url.slice(-41, -31)}`).join('\n')); continue; }
    const url = job.url || (links.get(job.section) || {}).url;
    if (!url) { blocks.push(`#${job.section} NO LINK`); continue; }
    if (job.urlOnly) { blocks.push(`#${job.section} ${url}`); continue; }
    try {
      const md = await get(url);
      if (job.raw) { const k = Math.max(0, md.indexOf('\n# ')); blocks.push(`#${job.section} RAW len=${md.length} ${url.slice(-41, -1)}\n` + md.slice(k, k + job.raw)); continue; }
      const all = job.doc === 'LAW_545053' ? eorRows(md, job.section) : fpuRows(md);
      let rows0 = null;
      if (job.pick) {
        // Компактно: по каждому классу до job.pick ЭОР, приоритет — правообладатели из job.prefer.
        const pref = job.prefer || ['Государственный университет просвещения', 'Издательство "Просвещение', 'ЯКласс'];
        const parsed = all.filter(r => r.split('|')[1].startsWith(job.section + '.')).map(r => {
          const [n, code, title, owner, grade] = r.split('|');
          const g = (grade.match(/^(\d+)(?:\s*-\s*(\d+))?/) || []);
          const short = (title.match(/^(.*?\d+(?:\s*-\s*\d+)?\s*(?:-?(?:й|е))?\s*(?:класс(?:ы|а)?|кл\.)\.?\)?(?:\s*\((?:базовый|углубленный)[^)]*\))?(?:[.:]?\s*(?:Цифровая рабочая тетрадь|Наглядные уроки|Интерактивные задания))?)/) || [, title.slice(0, 90)])[1];
          const until = (grade.match(/До (\d+ [а-я]+ \d{4})/) || [])[1] || '';
          const rank = pref.findIndex(p => owner.includes(p));
          return { n, code, short, owner, from: +g[1] || 0, to: +(g[2] || g[1]) || 0, until, rank: rank < 0 ? 99 : rank };
        });
        const out = [], per = new Map();
        for (const x of parsed.sort((a, b) => a.rank - b.rank || a.n - b.n)) {
          const key = `${x.from}-${x.to}`; if ((per.get(key) || 0) >= job.pick) continue; per.set(key, (per.get(key) || 0) + 1); out.push(x);
        }
        rows0 = out.sort((a, b) => a.n - b.n).map(x => `${x.n}|${x.from}${x.to !== x.from ? '-' + x.to : ''}|${x.short}|${x.owner.replace(/Федеральное государственное автономное образовательное учреждение высшего образования/, 'ФГАОУ ВО')}|${x.until}`);
      }
      const rows = rows0 || (job.numbers ? all.filter(r => job.numbers.includes(Number(r.split('|')[0]))) : all.filter(r => r.split('|')[1].startsWith(job.section + '.')));
      blocks.push(`#${job.section} rows=${rows.length} ${url.slice(-41, -1)}\n` + (rows.length ? rows.join('\n') : `len=${md.length}\n` + md.slice(Math.max(0, md.indexOf('\n# ')), Math.max(0, md.indexOf('\n# ')) + 3000)));
    } catch (e) { blocks.push(`#${job.section} ERR ${e.message || e}`); }
  }
  return blocks.join('\n');
}

// Плагин вызывает extractJobs и печатает результат сам; печатаем здесь сверку и возвращаем пустой список.
export async function extractJobs(root) {
  const file = path.join(root, 'src/data/fop/extract_jobs.json');
  const jobs = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  const fpu = jobs.filter(j => j.type === 'fpu');
  if (fpu.length) {
    emit('f', await fpuExtract(fpu));
  }
  if (jobs.some(j => j.type !== 'fpu')) await diffExtract(root);
  return [];
}
