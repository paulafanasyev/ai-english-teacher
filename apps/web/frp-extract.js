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
      const head = n => new RegExp(`к\\s+концу\\s+(?:обучения\\s+)?в\\s+${n}\\s+класс`, 'i');
      const start = paras.findIndex(x => head(job.grade).test(x));
      const end = start < 0 ? -1 : paras.slice(start + 1).findIndex(x => head('\\d+').test(x) || /^\d+(?:\.\d+)+\.?\s/.test(x));
      const body = start < 0 ? [] : paras.slice(start, end < 0 ? paras.length : start + 1 + end);
      // Иероглифы и примеры в КонсультантПлюс даны картинками: на их месте ставим маркер [рис.].
      const lines = [];
      for (const x of body) { if (IMG.test(x)) { if (lines.length && !lines[lines.length - 1].endsWith('[рис.]')) lines[lines.length - 1] += ' [рис.]'; } else lines.push(x); }
      out.push({ id: job.id, grade: job.grade, skip: job.skip || 0, paras: paras.length, lines });
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

// Плагин вызывает extractJobs и печатает результат сам; печатаем здесь частями и возвращаем пустой список.
export async function extractJobs(root) { await printExtract(root); return []; }
