// Разовое извлечение действующей редакции ФОП (КонсультантПлюс через r.jina.ai) в аннотации CI.
// Задания: src/data/fop/extract_jobs.json, [{ id, url, grade }]. Только чтение, данные Svetlana не меняются.
import fs from 'node:fs';
import path from 'node:path';

export async function extractJobs(root) {
  const file = path.join(root, 'src/data/fop/extract_jobs.json');
  if (!fs.existsSync(file)) return [];
  const out = [];
  for (const job of JSON.parse(fs.readFileSync(file, 'utf8'))) {
    try {
      const res = await fetch(`https://r.jina.ai/${job.url}`, { signal: AbortSignal.timeout(90000) });
      const md = await res.text();
      const paras = md.split('\n').map(x => x.replace(/\[\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      const head = n => new RegExp(`к\\s+концу\\s+(?:обучения\\s+)?в\\s+${n}\\s+класс`, 'i');
      const start = paras.findIndex(x => head(job.grade).test(x));
      const end = start < 0 ? -1 : paras.slice(start + 1).findIndex(x => head('\\d+').test(x) || /^\d+(?:\.\d+)+\.?\s/.test(x));
      const body = start < 0 ? [] : paras.slice(start, end < 0 ? paras.length : start + 1 + end);
      const heads = paras.map((x, i) => [i, x]).filter(([, x]) => /класс|^\d+(?:\.\d+)+\./i.test(x) && x.length < 220).slice(0, 40).map(([i, x]) => `${i}: ${x.slice(0, 110)}`);
      out.push({ id: job.id, grade: job.grade, status: res.status, paras: paras.length, lines: body, heads: body.length ? [] : heads });
    } catch (e) { out.push({ id: job.id, grade: job.grade, error: String(e.message || e) }); }
  }
  return out;
}
