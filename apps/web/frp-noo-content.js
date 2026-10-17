// Содержание обучения НОО по действующей редакции ФОП НОО (приказ № 372, ред. от 10.11.2025, КонсультантПлюс).
// Этап 1: только диагностика в GitHub Actions (структура страниц), данные Svetlana не меняются.
const DOC = 'https://www.consultant.ru/document/cons_doc_LAW_452094/';
const ENT = { nbsp: ' ', quot: '"', laquo: '«', raquo: '»', amp: '&', lt: '<', gt: '>', mdash: '—', ndash: '–', hellip: '…' };
export async function pageLines(hash) {
  const res = await fetch(`${DOC}${hash}/`, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ru' }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.text()).replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<img[^>]*>/gi, 'ё').replace(/<\/?(?:p|br|div|h\d|li|tr)\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/&([a-z]+);/g, (m, k) => ENT[k] ?? m).replace(/[ \t]+/g, ' ')
    .split('\n').map(x => x.trim()).filter(Boolean);
}
const PROBE = [['20.7', 'd3c141313597d6c704608ee64459321ca58fd8b1'], ['21.7', ''], ['157.6', 'b07075ae1b8bc112400118f6a2067650086f3019'], ['162.7', '9beed8c8cce18e0a11fdbbcbd0ee76a3c9be092d'],
  ['163.7', 'f9f798f2bdb51051de43eb7bc11f2e530794391b'], ['164.6', '4c08ec5474dfa34e3db3866616ea79912557a79e'], ['165.7', '7b9c3a1147a228c3658943da9aea27f09f104871'],
  ['166.6', 'fa93888f44e4134baf8e18f48fbda2c043913d4b'], ['167.7', 'c2efa319d283a62f0122e4bff1be6212d0097749'], ['168.3', 'c0837412925e5cee690e9ad933344c7a875d02c7']];
async function probe() {
  const index = await (await fetch(`https://r.jina.ai/${DOC}`, { signal: AbortSignal.timeout(90000) })).text();
  const find = sec => (index.match(new RegExp(`\\[${sec.replace('.', '\\.')}\\.?\\s[^\\]]*\\]\\(${DOC.replace(/[/.]/g, '\\$&')}([0-9a-f]{40})/\\)`)) || [])[1] || '';
  const out = [['20.8', '20.9', '21.6', '21.7', '21.8', '21.9'].map(s => `${s}=${find(s)}`).join(' ')];
  for (const [sec, h0] of PROBE) {
    try {
      const ls = await pageLines(h0 || find(sec));
      const a = Math.max(0, ls.findIndex(x => x.startsWith(`${sec}.1`)));
      out.push(`#${sec} lines=${ls.length - a}`, ...ls.slice(a, a + 45).map(x => /^\d+(?:\.\d+)+\.?\s/.test(x) && x.length < 120 ? x : `  ${x.slice(0, 40)}…${x.length}`));
    } catch (e) { out.push(`#${sec} ERR ${e.message || e}`); }
  }
  return out.join('\n');
}
export default function nooContent() {
  return {
    name: 'noo-content',
    async buildStart() {
      if (process.env.GITHUB_ACTIONS !== 'true') return;
      const text = await probe().catch(e => `ERR ${e.message || e}`);
      const esc = s => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
      for (let i = 0, n = 0; i < text.length && n < 18; i += 1900, n++) console.log(`::${n < 8 ? 'notice' : 'warning'} title=n${n}::${esc(text.slice(i, i + 1900))}`);
    },
  };
}
