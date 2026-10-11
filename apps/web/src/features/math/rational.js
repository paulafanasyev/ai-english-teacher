// Exact rational arithmetic on BigInt. No floating point anywhere in checking.
const babs = (a) => (a < 0n ? -a : a);
export function gcd(a, b) { a = babs(a); b = babs(b); while (b) { [a, b] = [b, a % b]; } return a; }

export class Q {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new MathError('div0');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
  }
  static of(v) {
    if (v instanceof Q) return v;
    if (typeof v === 'bigint') return new Q(v);
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return new Q(BigInt(v));
      return Q.parseDecimal(String(v));
    }
    if (typeof v === 'string') return Q.parseDecimal(v);
    throw new MathError('bad');
  }
  static parseDecimal(s) {
    const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s.trim());
    if (!m || (m[2] === '' && !m[3])) throw new MathError('bad');
    const frac = m[3] || '';
    const n = BigInt((m[2] || '0') + frac) * (m[1] ? -1n : 1n);
    return new Q(n, 10n ** BigInt(frac.length));
  }
  add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = Q.of(o); if (o.n === 0n) throw new MathError('div0'); return new Q(this.n * o.d, this.d * o.n); }
  neg() { return new Q(-this.n, this.d); }
  pow(e) {
    e = Q.of(e);
    if (e.d !== 1n) throw new MathError('nonint_pow');
    let k = e.n; if (babs(k) > 64n) throw new MathError('big_pow');
    let base = k < 0n ? new Q(this.d, this.n) : this; k = babs(k);
    let r = new Q(1n);
    for (let i = 0n; i < k; i++) r = r.mul(base);
    return r;
  }
  eq(o) { o = Q.of(o); return this.n === o.n && this.d === o.d; }
  isInt() { return this.d === 1n; }
  toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
  // Human form: integers as is, finite decimals with comma, otherwise a/b
  toHuman() {
    if (this.d === 1n) return String(this.n).replace('-', '−');
    let d = this.d, two = 0, five = 0;
    while (d % 2n === 0n) { d /= 2n; two++; }
    while (d % 5n === 0n) { d /= 5n; five++; }
    if (d === 1n && Math.max(two, five) <= 4) {
      const k = Math.max(two, five), scale = 10n ** BigInt(k);
      const v = (this.n * scale) / this.d, neg = v < 0n, a = babs(v).toString().padStart(k + 1, '0');
      return (neg ? '−' : '') + a.slice(0, -k) + ',' + a.slice(-k);
    }
    return (this.n < 0n ? '−' : '') + `${babs(this.n)}/${this.d}`;
  }
}

export class MathError extends Error { constructor(code) { super(code); this.code = code; } }
