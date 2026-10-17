// Содержание обучения НОО по действующей редакции ФОП НОО (приказ № 372, ред. от 10.11.2025, КонсультантПлюс).
// При сборке страницы содержания по классам загружаются с consultant.ru и разбираются на разделы и абзацы.
// Слова не меняются: только кавычки «», тире, склейка перечней и удаление сносок/примечаний КонсультантПлюс.
// Если источник недоступен, сборка не падает: остаётся содержание из корпуса. В GitHub Actions сборка падает при неполноте.
// Музыка в ФОП изложена модулями без деления по классам и здесь не обрабатывается.
import fs from 'node:fs';
import path from 'node:path';

const DOC = 'https://www.consultant.ru/document/cons_doc_LAW_452094/';
const VID = 'virtual:noo-content';
const ENT = { nbsp: ' ', quot: '"', laquo: '«', raquo: '»', amp: '&', lt: '<', gt: '>', mdash: '—', ndash: '–', hellip: '…' };
// [предмет, класс, пункт ФОП, страница КонсультантПлюс]
export const PAGES = [
  ['Русский язык', 1, '20.6', '1aca76c957e9454926b6d4425637b01759b14267'], ['Русский язык', 2, '20.7', 'd3c141313597d6c704608ee64459321ca58fd8b1'],
  ['Русский язык', 3, '20.8', 'c465cf7c6aa781c272710869438f4c858457a887'], ['Русский язык', 4, '20.9', '24fbf78d58b23ab0a157c2fa1eaaa120c20a85a4'],
  ['Литературное чтение', 1, '21.6', '8ca82b245495b28d0485de372555a1fc72640c67'], ['Литературное чтение', 2, '21.7', 'b279350778529d3d9dc6e8f52ae1efc6d42a7ffe'],
  ['Литературное чтение', 3, '21.8', '2a052b7e357da50f5a8267ca693037948fdcafb8'], ['Литературное чтение', 4, '21.9', 'ce7489d37f975e65e92dcff6644e997668563372'],
  ['Иностранный (английский) язык', 2, '157.6', 'b07075ae1b8bc112400118f6a2067650086f3019'], ['Иностранный (английский) язык', 3, '157.7', '523fd78c6e439a03a7c0ca8723d3bbe222d25cee'],
  ['Иностранный (английский) язык', 4, '157.8', 'fa584a884ee56c087e5df0770c77e8b7445d5800'],
  ['Математика', 1, '162.6', '89956370edba1f055692596d4e0acc2ea4000926'], ['Математика', 2, '162.7', '9beed8c8cce18e0a11fdbbcbd0ee76a3c9be092d'],
  ['Математика', 3, '162.8', 'c04558f8083544f18ae589c49f84727b90a39ec5'], ['Математика', 4, '162.9', '6f252396bec17e7ffe87457c8613aef9d68aedc9'],
  ['Окружающий мир', 1, '163.6', '2b9ef0cdc6a0d212b90cb1dab0940115664e3ca8'], ['Окружающий мир', 2, '163.7', 'f9f798f2bdb51051de43eb7bc11f2e530794391b'],
  ['Окружающий мир', 3, '163.8', '1ef0e77852d445e26c190823245ad28697c2d655'], ['Окружающий мир', 4, '163.9', '1c5b16d99d3c4c94b1a30e2c691771b22407cd8f'],
  ['ОРКСЭ', 4, '164.6', '4c08ec5474dfa34e3db3866616ea79912557a79e'],
  ['Изобразительное искусство', 1, '165.6', 'fec5151211550c32dc69eea3646391424e7f8093'], ['Изобразительное искусство', 2, '165.7', '7b9c3a1147a228c3658943da9aea27f09f104871'],
  ['Изобразительное искусство', 3, '165.8', '7ff1abf3796b947a7d9bce0e32a2f1b51ae1b9af'], ['Изобразительное искусство', 4, '165.9', 'dd2eaa17fbd1ac58720285f4838e4ba46e28588a'],
  ['Труд (технология)', 1, '167.6', '77ac32bdfe0585fc6adf46072494e80fbf0405a7'], ['Труд (технология)', 2, '167.7', 'c2efa319d283a62f0122e4bff1be6212d0097749'],
  ['Труд (технология)', 3, '167.8', '6af914467a352371e1b78406d99736e7bd407e63'], ['Труд (технология)', 4, '167.9', '06556783f4eb2b399a6a2dd09b47951982f9d8c0'],
  // Физическая культура: вариант N 2 (п. 168.3), с ним совпадают результаты; классы — пп. 168.3.2–168.3.5 одной страницы.
  ['Физическая культура', 1, '168.3.2', 'c0837412925e5cee690e9ad933344c7a875d02c7'], ['Физическая культура', 2, '168.3.3', 'c0837412925e5cee690e9ad933344c7a875d02c7'],
  ['Физическая культура', 3, '168.3.4', 'c0837412925e5cee690e9ad933344c7a875d02c7'], ['Физическая культура', 4, '168.3.5', 'c0837412925e5cee690e9ad933344c7a875d02c7'],
];
export const EXPECTED = PAGES.length + 5; // ОРКСЭ: 6 модулей на одной странице

export function htmlLines(html) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<img[^>]*>/gi, 'ё').replace(/<\/?(?:p|br|div|h\d|li|tr)\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/&([a-z]+);/g, (m, k) => ENT[k] ?? m).replace(/[ \t]+/g, ' ')
    .split('\n').map(x => x.trim()).filter(Boolean);
}
const typo = s => s.replace(/<\d+>/g, '').replace(/"([^"]*)"/g, '«$1»').replace(/(\d)\s*-\s*(\d)/g, '$1–$2').replace(/\s+-\s+/g, ' – ').replace(/\s+/g, ' ').trim();
const NUM = /^(\d+(?:\.\d+)+)\.?\s+(.*)$/;
const NOTE = /^(?:КонсультантПлюс: примечание|Нумерация подпунктов дана|\((?:в ред\.|введен|абзац|пп?\.\s|подпункт)|-{5,}|<\d+>)/;
const oneTitle = t => t.length < 150 && !/:/.test(t) && !/[.!?»)]\s+[А-ЯЁA-Z«]/.test(t.replace(/\.$/, ''));
const STOP = /^(?:Изучение|Освоение)\s|универсальн[а-я]+ учебн/;

// Разбор одной части страницы: sec — пункт класса (например '20.7' или '168.3.3').
export function parse(lines, sec, { lit = false } = {}) {
  const a = lines.findIndex(x => x.startsWith(`${sec}.1.`) || x.startsWith(`${sec}.1 `));
  if (a < 0) return [];
  const d0 = sec.split('.').length;
  const items = [];
  for (let i = a; i < lines.length; i++) {
    const x = lines[i];
    if (/^Открыть полный текст/.test(x)) break;
    if (NOTE.test(x)) continue;
    const m = x.match(NUM);
    if (m && !m[1].startsWith(sec + '.')) break;
    if (m && m[1].split('.').length === d0 + 1 && STOP.test(m[2])) break;
    items.push(m ? { num: m[1], depth: m[1].split('.').length, text: m[2] } : { text: x });
  }
  const secs = [], stack = [];
  const cur = () => {
    if (!stack.length) return null;
    const key = stack.map(s => s.num).join('|');
    let s = secs.find(z => z.key === key);
    if (!s) { s = { key, depth: stack[stack.length - 1].depth, title: stack.slice(-2).map(z => z.title).join(': '), topics: [] }; secs.push(s); }
    return s;
  };
  const add = t => {
    const s = cur(); if (!s) return;
    const prev = s.topics[s.topics.length - 1];
    if (prev && (/[:;]$/.test(prev) || /^[a-zа-яё(]/.test(t))) s.topics[s.topics.length - 1] = `${prev} ${t}`;
    else if (prev && s.pending) { s.topics[s.topics.length - 1] = `${prev} ${t}`; }
    else s.topics.push(t);
    s.pending = t.length < 45 && /\.$/.test(t) && oneTitle(t) && !/[:;]/.test(t);
  };
  items.forEach((it, i) => {
    const text = typo(it.text);
    if (lit && it.num) {
      if (it.depth === d0 + 1) {
        const title = (text.match(/^(.+?)\.(?:\s|$)/) || [, text])[1];
        while (stack.length) stack.pop();
        stack.push({ num: it.num, depth: it.depth, title });
      }
      add(text);
      return;
    }
    const next = items[i + 1];
    const isHead = it.num && oneTitle(text) && (!next || !next.num || next.num.startsWith(it.num + '.'));
    if (isHead) {
      while (stack.length && stack[stack.length - 1].depth >= it.depth) stack.pop();
      stack.push({ num: it.num, depth: it.depth, title: text.replace(/\.$/, '') });
      return;
    }
    add(text);
  });
  // Разделы, у которых есть подразделы, сами по себе не выводим (вводные абзацы и описания модулей).
  return secs.filter(s => s.topics.length && !secs.some(z => z !== s && z.key.startsWith(s.key + '|')))
    .map(s => ({ title: s.title, topics: s.topics }));
}

// ОРКСЭ: модули 164.6.k — отдельные программы «ОРКСЭ: <модуль>».
export function parseOrkse(lines) {
  const out = {};
  for (let k = 1; k <= 6; k++) {
    const h = lines.find(x => x.startsWith(`164.6.${k}. `));
    const name = h && (h.match(/Модуль "([^"]+)"/) || [])[1];
    if (!name) continue;
    const topics = lines.filter(x => x.startsWith(`164.6.${k}.`) && x !== h).map(x => typo(x.replace(NUM, '$2')));
    if (topics.length) out[`ОРКСЭ: ${name}|4`] = [{ title: `Модуль «${name}»`, topics }];
  }
  return out;
}

async function page(hash, cacheDir) {
  const f = path.join(cacheDir, `${hash}.html`);
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const res = await fetch(`${DOC}${hash}/`, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ru' }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (!html.includes('LAW_452094') && !html.includes('Минпросвещения')) throw new Error('неожиданная страница');
  fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(f, html);
  return html;
}

export async function loadNooContent({ cacheDir = path.resolve('node_modules/.cache/noo-content') } = {}) {
  const map = {}, errors = [];
  for (const [subject, grade, sec, hash] of PAGES) {
    try {
      const lines = htmlLines(await page(hash, cacheDir));
      if (subject === 'ОРКСЭ') { Object.assign(map, parseOrkse(lines)); continue; }
      const s = parse(lines, sec, { lit: subject === 'Литературное чтение' });
      if (s.length) map[`${subject}|${grade}`] = s; else errors.push(`${sec}: разделы не найдены`);
    } catch (e) { errors.push(`${sec}: ${e.message || e}`); }
  }
  return { map, errors };
}

export default function nooContent() {
  let mod = null;
  return {
    name: 'noo-content',
    resolveId(id) { return id === VID ? '\0' + VID : null; },
    async load(id) {
      if (id !== '\0' + VID) return null;
      if (!mod) {
        const { map, errors } = await loadNooContent();
        const n = Object.keys(map).length;
        console.log(`[noo-content] программ: ${n} из ${EXPECTED}${errors.length ? '; ' + errors.join(' | ') : ''}`);
        if (process.env.GITHUB_ACTIONS === 'true') {
          const esc = s => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
          const sum = Object.entries(map).map(([k, v]) => `#${k} s=${v.length} t=${v.reduce((a, s) => a + s.topics.length, 0)}\n` + v.map(s => `${s.title.slice(0, 60)} [${s.topics.length}]`).join('\n')).join('\n');
          const dump = (map['Русский язык|2'] || []).map(s => `## ${s.title}\n${s.topics.join('\n')}`).join('\n');
          const text = `n=${n}/${EXPECTED} errors=${errors.join(' | ')}\n${sum}\n=== Русский язык 2\n${dump}`;
          for (let i = 0, k = 0; i < text.length && k < 18; i += 1900, k++) console.log(`::${k < 8 ? 'notice' : 'warning'} title=c${k}::${esc(text.slice(i, i + 1900))}`);
          if (n < EXPECTED) this.error(`Содержание НОО из ФОП: ${n} из ${EXPECTED}. ${errors.join(' | ')}`);
        }
        mod = `export default ${JSON.stringify(map)};`;
      }
      return mod;
    },
  };
}
