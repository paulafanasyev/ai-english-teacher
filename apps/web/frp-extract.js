// Разовое извлечение действующей редакции ФОП (КонсультантПлюс через r.jina.ai) в аннотации CI.
// Задания: src/data/fop/extract_jobs.json, [{ id, url, grade, skip? }]. Только чтение, данные Svetlana не меняются.
import fs from 'node:fs';
import path from 'node:path';

const IMG = /^!?\[?Image \d+/;
async function collect(root) {
  const file = path.join(root, 'src/data/fop/extract_jobs.json');
  if (!fs.existsSync(file)) return [];
  const out = [], cache = new Map();
  for (const job of JSON.parse(fs.readFileSync(file, 'utf8'))) {
    try {
      if (!cache.has(job.url)) {
        const res = await fetch(`https://r.jina.ai/${job.url}`, { signal: AbortSignal.timeout(90000) });
        cache.set(job.url, await res.text());
      }
      const paras = cache.get(job.url).split('\n').map(x => x.replace(/\[\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      const head = n => new RegExp(`к\\s+концу\\s+(?:обучения\\s+)?во?\\s+${n}\\s+класс`, 'i');
      const start = paras.findIndex(x => head(job.grade).test(x));
      const end = start < 0 ? -1 : paras.slice(start + 1).findIndex(x => head('\\d+').test(x) || /^\d+(?:\.\d+)+\.?\s/.test(x));
      const body = start < 0 ? [] : paras.slice(start, end < 0 ? paras.length : start + 1 + end);
      // Иероглифы и примеры в КонсультантПлюс даны картинками: на их месте ставим маркер [рис.].
      const lines = [];
      for (const x of body) { if (IMG.test(x)) { if (lines.length && !lines[lines.length - 1].endsWith('[рис.]')) lines[lines.length - 1] += ' [рис.]'; } else lines.push(x); }
      const probe = start < 0 ? paras.filter(x => /класс|^\d+(?:\.\d+)+/.test(x)).slice(0, 12).map(x => x.slice(0, 120)) : [];
      out.push({ id: job.id, grade: job.grade, skip: job.skip || 0, paras: paras.length, lines, probe });
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
const norm = s => String(s).replace(/ \[рис\.\]/g, '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
export async function diffExtract(root) {
  const { loadChinese } = await import('./frp-chinese-plugin.js');
  const { programs } = await loadChinese({ root });
  const esc = s => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
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
    if (!fop.length) { blocks.push(`#${x.id} fop=0 paras=${x.paras}${x.error ? ' ERR ' + x.error : ''}\nPROBE:\n${(x.probe || []).join('\n')}`); continue; }
    blocks.push(`#${x.id} fop=${fop.length} corpus=${pool.length} miss=${miss.length} extra=${extra.length}${x.error ? ' ERR ' + x.error : ''}\n${miss.join('\n')}\nEXTRA:\n${extra.slice(0, 5).join('\n')}`);
  }
  const text = blocks.join('\n');
  for (let i = 0, n = 0; i < text.length && n < 18; i += 1900, n++)
    console.log(`::${n < 8 ? 'notice' : 'warning'} title=d${n}::${esc(text.slice(i, i + 1900))}`);
}

// Плагин вызывает extractJobs и печатает результат сам; печатаем здесь сверку и возвращаем пустой список.
export async function extractJobs(root) { await diffExtract(root); return []; }
