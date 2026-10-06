/* Pure SVG renderer shared by Avatar.jsx and the static preview. */

export const FRAME_CLS = {
  none: '',
  gold: 'ring-4 ring-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.45)]',
  neon: 'ring-4 ring-cyan-400 shadow-[0_0_28px_rgba(34,211,238,0.55)]',
  leaf: 'ring-4 ring-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.4)]',
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeId = (value) => String(value || 'teacher').replace(/[^a-z0-9_-]/gi, '_');

/* Wide silhouettes intentionally remain morph-compatible for live speech. */
export const VISEME_SHAPES = {
  rest: { left: 128, right: 192, top: 221, bottom: 230, open: 0.08, teeth: 0.0, tongue: 0.0 },
  A: { left: 126, right: 194, top: 207, bottom: 252, open: 1, teeth: 0.66, tongue: 0.22 },
  E: { left: 124, right: 196, top: 211, bottom: 244, open: 0.92, teeth: 0.86, tongue: 0.04 },
  I: { left: 129, right: 191, top: 212, bottom: 244, open: 0.76, teeth: 0.62, tongue: 0.26 },
  O: { left: 137, right: 183, top: 204, bottom: 253, open: 1, teeth: 0.02, tongue: 0.75 },
  U: { left: 130, right: 190, top: 210, bottom: 249, open: 0.95, teeth: 0.08, tongue: 0.55 },
  M: { left: 125, right: 195, top: 220, bottom: 233, open: 0.03, teeth: 0, tongue: 0 },
  F: { left: 126, right: 194, top: 215, bottom: 242, open: 0.36, teeth: 0.95, tongue: 0 },
  L: { left: 126, right: 194, top: 211, bottom: 245, open: 0.82, teeth: 0.78, tongue: 0.72 },
  W: { left: 132, right: 188, top: 207, bottom: 250, open: 0.98, teeth: 0.04, tongue: 0.35 },
  happy: { left: 121, right: 199, top: 216, bottom: 247, open: 0.84, teeth: 0.98, tongue: 0.02 },
  encourage: { left: 120, right: 200, top: 219, bottom: 247, open: 0.78, teeth: 0.94, tongue: 0.04 },
};

export const normalizeViseme = (v) => VISEME_SHAPES[v] ? v : 'rest';
export const getVisemeShape = (v = 'rest') => ({ ...VISEME_SHAPES[normalizeViseme(v)] });
export function interpolateViseme(a, b, amount) {
  const t = Math.max(0, Math.min(1, amount)); const out = {};
  Object.keys(VISEME_SHAPES.rest).forEach((key) => { out[key] = a[key] + (b[key] - a[key]) * t; });
  return out;
}

export function mouthPathsFromShape(shape) {
  const { left, right, top, bottom, open, teeth, tongue } = shape;
  const center = (top + bottom) / 2;
  const innerTop = center - (center - top) * Math.max(open, 0.08);
  const innerBottom = center + (bottom - center) * Math.max(open, 0.08);
  const innerLeft = left + 3 * open; const innerRight = right - 3 * open;
  const outer = `M ${left.toFixed(2)} ${center.toFixed(2)} Q 160 ${top.toFixed(2)} ${right.toFixed(2)} ${center.toFixed(2)} Q 160 ${bottom.toFixed(2)} ${left.toFixed(2)} ${center.toFixed(2)} Z`;
  const inner = `M ${innerLeft.toFixed(2)} ${center.toFixed(2)} Q 160 ${innerTop.toFixed(2)} ${innerRight.toFixed(2)} ${center.toFixed(2)} Q 160 ${innerBottom.toFixed(2)} ${innerLeft.toFixed(2)} ${center.toFixed(2)} Z`;
  const toothTop = `M ${innerLeft.toFixed(2)} ${(center - 1).toFixed(2)} Q 160 ${(innerTop + 2).toFixed(2)} ${innerRight.toFixed(2)} ${(center - 1).toFixed(2)} L ${innerRight.toFixed(2)} ${(center + 6).toFixed(2)} Q 160 ${(innerTop + 7).toFixed(2)} ${innerLeft.toFixed(2)} ${(center + 6).toFixed(2)} Z`;
  const tonguePath = `M ${(left + 7).toFixed(2)} ${(innerBottom - 2).toFixed(2)} Q 160 ${(innerBottom + 7).toFixed(2)} ${(right - 7).toFixed(2)} ${(innerBottom - 2).toFixed(2)} Q 160 ${(innerBottom - 7).toFixed(2)} ${(left + 7).toFixed(2)} ${(innerBottom - 2).toFixed(2)} Z`;
  return { left, right, top, bottom, outer, inner, toothTop, tonguePath, innerOpacity: Math.min(1, open * 1.35), teethOpacity: Math.min(1, teeth), tongueOpacity: Math.min(1, tongue) };
}

const eye = (id, x, def, emotion = 'neutral', browRaise = 0) => {
  const shape = def.eyeShape || 'soft'; const female = def.gender === 'f';
  const happy = emotion === 'happy' || emotion === 'encourage' || emotion === 'excited';
  const top = happy ? 145 : (shape === 'round' ? 134 : shape === 'almond' ? 138 : 136);
  const bottom = happy ? 168 : (shape === 'round' ? 179 : shape === 'almond' ? 175 : 177);
  const irisRy = happy ? 9.5 : (shape === 'round' ? 14 : 12.5);
  const upper = `M ${x - 27} 158 Q ${x} ${top - browRaise} ${x + 27} 158 Q ${x} ${bottom} ${x - 27} 158Z`;
  const lid = happy ? `<path d="M ${x - 25} 164 Q ${x} 176 ${x + 25} 164" fill="none" stroke="${esc(def.brow)}" stroke-width="3" opacity=".62" stroke-linecap="round"/>` : `<path d="M ${x - 26} 157 Q ${x} ${top - browRaise} ${x + 26} 157" fill="none" stroke="#B87463" stroke-width="2.5" opacity=".43" stroke-linecap="round"/><path d="M ${x - 22} 166 Q ${x} 177 ${x + 22} 166" fill="none" stroke="#9B6457" stroke-width="2.4" opacity=".28" stroke-linecap="round"/>`;
  const lashes = female ? `<path d="M ${x - 24} 154 L ${x - 30} 149 M ${x - 19} 149 L ${x - 23} 143 M ${x + 19} 149 L ${x + 23} 143 M ${x + 24} 154 L ${x + 30} 149" stroke="${esc(def.brow)}" stroke-width="2.6" stroke-linecap="round" opacity=".72"/>` : '';
  return `<g id="${id}" class="avatar-eye">
    <path d="${upper}" fill="#FFFEFA"/>
    ${lid}
    <g id="avatar-gaze-${x < 160 ? 'left' : 'right'}" transform="translate(0 0)">
      <ellipse cx="${x}" cy="159" rx="12.5" ry="${irisRy}" fill="${esc(def.eyes)}"/>
      <ellipse cx="${x}" cy="160" rx="6.1" ry="9.2" fill="#17212B"/>
      <circle cx="${x - 4}" cy="154" r="4" fill="#FFFFFF" opacity=".97"/>
      <circle cx="${x + 4}" cy="166" r="1.8" fill="#FFFFFF" opacity=".55"/>
    </g>
    <path d="M ${x - 22} 129 Q ${x} ${121 - browRaise} ${x + 22} 129" fill="none" stroke="${esc(def.brow)}" stroke-width="4.5" stroke-linecap="round" opacity=".78"/>
    ${lashes}
  </g>`;
};

const hairBack = (style, def) => {
  const c = esc(def.hair); const hi = esc(def.hairLight);
  if (style === 'messyBun') return `<g fill="${c}"><circle cx="211" cy="54" r="34"/><circle cx="238" cy="45" r="22"/><circle cx="221" cy="27" r="17"/></g><path d="M92 145 C76 104 93 59 137 46 C190 30 235 60 239 119 L234 244 Q231 278 215 296 L200 282 L196 139 C179 109 129 104 106 133 L104 282 Q90 295 82 268Z" fill="${c}"/><path d="M213 31 Q239 16 253 33 M224 64 Q253 55 258 70 M201 25 Q185 12 174 20" fill="none" stroke="${hi}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
  if (style === 'longWavy') return `<path d="M84 133 C72 77 103 39 157 37 C214 35 246 75 238 140 L248 179 Q254 214 239 236 Q254 267 239 296 Q228 316 207 302 L198 208 L120 208 L110 303 Q89 318 77 295 Q66 268 80 239 Q64 211 78 183Z" fill="${c}"/><path d="M91 163 Q74 198 92 222 Q105 239 86 269 Q74 287 91 307 M229 151 Q246 183 228 210 Q215 232 235 253 Q247 275 228 305 M106 63 Q157 35 213 65" fill="none" stroke="${hi}" stroke-width="7" opacity=".53" stroke-linecap="round"/>`;
  if (style === 'longStraight') return `<path d="M84 130 C80 75 111 39 159 38 C211 38 241 76 236 135 L238 313 Q222 326 205 311 L199 130 Q180 105 159 101 Q130 104 112 131 L107 311 Q91 326 76 313 L80 177Z" fill="${c}"/><path d="M96 153 L94 300 M223 143 L225 300 M106 61 Q159 36 215 64" fill="none" stroke="${hi}" stroke-width="5" opacity=".48" stroke-linecap="round"/>`;
  if (style === 'curly') return `<path d="M82 155 C65 104 78 55 119 39 C179 14 236 50 243 115 L248 198 Q255 225 237 241 Q249 271 226 286 Q208 293 202 267 L199 139 Q176 110 141 111 Q112 115 103 145 L99 273 Q91 294 74 281 Q61 266 75 239 Q58 219 72 194Z" fill="${c}"/><g fill="${c}"><circle cx="94" cy="68" r="18"/><circle cx="125" cy="42" r="19"/><circle cx="159" cy="34" r="18"/><circle cx="194" cy="43" r="19"/><circle cx="222" cy="71" r="18"/><circle cx="75" cy="121" r="17"/><circle cx="242" cy="126" r="17"/></g><path d="M96 73 Q157 33 221 73 M83 160 Q68 205 85 239 M236 159 Q251 204 233 241" fill="none" stroke="${hi}" stroke-width="6" opacity=".56" stroke-linecap="round"/>`;
  if (style === 'sidepart') return `<path d="M91 148 C83 93 110 50 158 43 C214 35 242 78 237 143 L231 199 L213 211 L203 127 Q179 100 143 106 Q113 111 97 143Z" fill="${c}"/><path d="M158 45 Q143 79 123 103 M93 103 Q123 68 173 55" fill="none" stroke="${hi}" stroke-width="6" opacity=".56" stroke-linecap="round"/>`;
  return `<path d="M91 145 C86 92 112 50 159 43 C210 37 240 75 237 139 L230 174 L210 168 Q184 103 143 107 Q111 112 96 148Z" fill="${c}"/><path d="M100 93 Q155 45 218 74" fill="none" stroke="${hi}" stroke-width="6" opacity=".5" stroke-linecap="round"/>`;
};

const hairFront = (style, def) => {
  const c = esc(def.hair); const hi = esc(def.hairLight);
  if (style === 'messyBun') return `<path d="M91 123 Q102 62 160 58 Q214 58 235 112 Q218 101 196 103 Q177 80 151 85 Q120 85 91 123Z" fill="${c}"/><path d="M103 111 Q111 78 142 70 Q170 62 200 87" fill="none" stroke="${hi}" stroke-width="6" opacity=".56" stroke-linecap="round"/><path d="M99 96 Q84 80 93 67 M103 74 Q94 54 108 45" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
  if (style === 'longWavy') return `<path d="M91 128 Q99 66 160 57 Q216 58 235 119 Q214 102 193 94 Q166 80 138 91 Q112 101 91 128Z" fill="${c}"/><path d="M98 130 Q79 162 98 188 Q110 207 94 233 M222 119 Q241 151 224 176 Q210 198 228 221" fill="none" stroke="${c}" stroke-width="15" stroke-linecap="round"/><path d="M106 101 Q156 64 212 99" fill="none" stroke="${hi}" stroke-width="6" opacity=".52" stroke-linecap="round"/>`;
  if (style === 'longStraight') return `<path d="M92 132 Q101 67 159 58 Q216 58 231 121 Q214 108 193 101 Q162 87 132 98 Q108 109 92 132Z" fill="${c}"/><path d="M94 111 Q115 91 137 89 L127 164 Q112 153 94 160Z M226 111 Q207 91 185 89 L193 166 Q210 153 226 160Z" fill="${c}"/><path d="M101 106 Q156 70 218 105" fill="none" stroke="${hi}" stroke-width="5" opacity=".48"/>`;
  if (style === 'curly') return `<path d="M89 128 Q100 66 160 57 Q216 58 234 121 Q213 99 191 94 Q158 83 127 96 Q105 106 89 128Z" fill="${c}"/><g fill="${c}"><circle cx="101" cy="109" r="16"/><circle cx="117" cy="82" r="17"/><circle cx="142" cy="65" r="16"/><circle cx="169" cy="63" r="16"/><circle cx="196" cy="76" r="17"/><circle cx="218" cy="101" r="16"/></g><path d="M101 107 Q155 61 218 104" fill="none" stroke="${hi}" stroke-width="5" opacity=".58" stroke-linecap="round"/>`;
  if (style === 'sidepart') return `<path d="M88 126 Q96 64 157 56 Q216 53 232 115 Q207 94 180 89 Q141 80 111 105 L88 126Z" fill="${c}"/><path d="M147 61 Q135 87 112 104" fill="none" stroke="${hi}" stroke-width="7" opacity=".64" stroke-linecap="round"/>`;
  return `<path d="M90 124 Q98 66 158 57 Q214 56 232 115 Q211 97 187 91 Q148 80 116 103Z" fill="${c}"/><path d="M103 92 Q153 59 216 93" fill="none" stroke="${hi}" stroke-width="5" opacity=".5" stroke-linecap="round"/>`;
};

const clothing = (style, def, uid) => {
  const c = esc(def.clothing); const dark = esc(def.clothingDark);
  if (style === 'hoodie') return `<path d="M86 300 Q110 277 137 273 Q160 292 183 273 Q211 278 234 300 L289 360 L31 360Z" fill="url(#${uid}-shirt)"/><path d="M113 282 Q160 330 207 282 Q192 270 181 263 L160 293 L139 263 Q127 270 113 282Z" fill="${dark}" opacity=".68"/><path d="M119 289 Q160 320 201 289" fill="none" stroke="#FFF8EA" stroke-width="4" opacity=".35" stroke-linecap="round"/>`;
  if (style === 'cardigan') return `<path d="M31 360 Q48 312 101 282 Q123 275 139 277 L181 277 Q197 275 219 282 Q272 312 289 360Z" fill="url(#${uid}-shirt)"/><path d="M134 277 L160 306 L186 277" fill="#FFF7E8" opacity=".92"/><path d="M160 306 L160 360 M125 290 L146 317 M195 290 L174 317" fill="none" stroke="${dark}" stroke-width="4" opacity=".72"/><circle cx="160" cy="328" r="3" fill="${dark}" opacity=".72"/>`;
  if (style === 'collar') return `<path d="M31 360 Q50 311 102 282 Q128 274 139 276 L160 300 L181 276 Q192 274 218 282 Q270 311 289 360Z" fill="url(#${uid}-shirt)"/><path d="M139 276 L160 304 L181 276 L172 326 L160 339 L148 326Z" fill="#FFF8EC" opacity=".95"/><path d="M160 304 L160 360" stroke="${dark}" stroke-width="4" opacity=".7"/>`;
  return `<path d="M31 360 Q45 310 101 281 Q126 273 139 276 L181 276 Q194 273 219 281 Q275 310 289 360Z" fill="url(#${uid}-shirt)"/><path d="M130 280 Q160 305 190 280" fill="none" stroke="#E7F4FA" stroke-width="6" opacity=".62" stroke-linecap="round"/>`;
};

const accessory = (kind, def) => {
  const c = esc(def.accessoryColor);
  if (kind === 'glasses') return `<g fill="none" stroke="${c}" stroke-width="4" opacity=".94"><rect x="102" y="137" width="54" height="39" rx="18"/><rect x="164" y="137" width="54" height="39" rx="18"/><path d="M156 150 Q160 146 164 150"/></g>`;
  if (kind === 'headband') return `<path d="M91 93 Q160 48 231 94" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" opacity=".95"/>`;
  if (kind === 'earrings') return `<g fill="none" stroke="${c}" stroke-width="4"><circle cx="91" cy="192" r="8"/><circle cx="229" cy="192" r="8"/></g>`;
  return '';
};

const expressionFeatures = (emotion, def) => {
  if (!(emotion === 'happy' || emotion === 'encourage' || emotion === 'excited')) return '';
  const blush = esc(def.blush);
  return `<g class="avatar-expression"><path d="M103 207 Q112 198 122 204" fill="none" stroke="${blush}" stroke-width="4" opacity=".58" stroke-linecap="round"/><path d="M198 204 Q208 198 217 207" fill="none" stroke="${blush}" stroke-width="4" opacity=".58" stroke-linecap="round"/><path d="M126 229 Q121 224 117 223" fill="none" stroke="${blush}" stroke-width="3" opacity=".38" stroke-linecap="round"/><path d="M194 229 Q199 224 203 223" fill="none" stroke="${blush}" stroke-width="3" opacity=".38" stroke-linecap="round"/></g>`;
};

const headShape = (shape = 'oval') => ({
  round: 'M96 118 C96 77 122 59 160 59 C198 59 224 77 224 118 L221 194 C219 236 197 257 160 260 C123 257 101 236 99 194Z',
  broad: 'M93 119 C94 78 121 59 160 59 C199 59 226 78 227 119 L223 194 C220 235 197 253 160 256 C123 253 100 235 97 194Z',
  long: 'M102 119 C102 77 126 59 160 59 C194 59 218 77 218 119 L216 205 C214 248 193 270 160 272 C127 270 106 248 104 205Z',
  angular: 'M98 119 C98 78 124 59 160 59 C196 59 222 78 222 119 L219 196 C216 237 194 258 160 260 C126 258 104 237 101 196Z',
  oval: 'M97 119 C97 77 123 59 160 59 C197 59 223 77 223 119 L220 199 C218 243 195 263 160 265 C125 263 102 243 100 199Z',
}[shape] || 'M97 119 C97 77 123 59 160 59 C197 59 223 77 223 119 L220 199 C218 243 195 263 160 265 C125 263 102 243 100 199Z');

const smileInk = (emotion) => (emotion === 'happy' || emotion === 'encourage' || emotion === 'excited' ? `<path d="M122 231 Q132 241 160 243 Q188 241 198 231" fill="none" stroke="#7C263C" stroke-width="2.8" stroke-linecap="round" opacity=".72"/><path d="M122 230 Q126 227 130 230 M190 230 Q194 227 198 230" fill="none" stroke="#F58B91" stroke-width="2.5" stroke-linecap="round" opacity=".78"/>` : '');

const emotionMouth = (emotion) => ({ happy: 'happy', encourage: 'encourage', excited: 'happy', proud: 'happy', worried: 'I', sad: 'U' }[emotion] || 'rest');

export function renderAvatarSVG(def, { emotion = 'neutral', viseme = emotionMouth(emotion), instanceId = '' } = {}) {
  const d = { ...def }; const id = safeId(d.id); const suffix = instanceId ? String(instanceId).replace(/[^a-z0-9_-]/gi, '_') : ''; const uid = `avatar-${id}${suffix ? `-${suffix}` : ''}`;
  const mouth = mouthPathsFromShape(getVisemeShape(viseme)); const happy = emotion === 'happy' || emotion === 'encourage' || emotion === 'excited'; const browRaise = happy ? 3 : 0;
  const skin = esc(d.skin); const skinLight = esc(d.skinLight);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 360" role="img" aria-label="${esc(d.name || 'English teacher')}" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${esc(d.bg)}"/><stop offset="1" stop-color="${esc(d.bg)}" stop-opacity=".68"/></linearGradient>
    <linearGradient id="${uid}-shirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${esc(d.clothing)}"/><stop offset="1" stop-color="${esc(d.clothingDark)}"/></linearGradient>
    <linearGradient id="${uid}-skin" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="${skinLight}"/><stop offset="1" stop-color="${skin}"/></linearGradient>
    <radialGradient id="${uid}-cheek"><stop offset="0" stop-color="${esc(d.blush)}" stop-opacity=".58"/><stop offset="1" stop-color="${esc(d.blush)}" stop-opacity="0"/></radialGradient>
    <filter id="${uid}-shadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="320" height="360" fill="url(#${uid}-bg)"/><circle cx="39" cy="30" r="78" fill="#FFFFFF" opacity=".14"/><circle cx="292" cy="278" r="72" fill="#FFFFFF" opacity=".1"/>
  <ellipse cx="160" cy="360" rx="137" ry="20" fill="#1E3040" opacity=".14" filter="url(#${uid}-shadow)"/>
  <g id="avatar-body" class="avatar-breathe">
    ${hairBack(d.hairStyle, d)}
    ${clothing(d.clothingStyle, d, uid)}
    <path d="M140 224 L140 286 Q160 301 180 286 L180 224Z" fill="url(#${uid}-skin)"/>
    <path d="M137 246 Q160 267 183 246 L179 286 Q160 299 141 286Z" fill="#7A433D" opacity=".24"/>
    <path d="M140 242 Q160 260 180 242 Q171 270 160 276 Q149 270 140 242Z" fill="#7A433D" opacity=".16"/>
    <circle cx="96" cy="184" r="17" fill="${skin}"/><circle cx="224" cy="184" r="17" fill="${skin}"/>
    <path id="avatar-head" class="avatar-head-sway" d="${headShape(d.faceShape)}" fill="url(#${uid}-skin)"/>
    <path d="M103 112 Q95 165 107 211 Q114 235 134 247" fill="none" stroke="#FFF5DD" stroke-width="5" opacity=".20" stroke-linecap="round"/>
    <path d="M101 190 Q109 224 131 242" fill="none" stroke="${skinLight}" stroke-width="9" opacity=".20" stroke-linecap="round"/>
    <path d="M101 211 Q111 247 142 258 Q160 265 178 258" fill="none" stroke="#7B443F" stroke-width="7" opacity=".15" stroke-linecap="round"/>
    <ellipse cx="119" cy="202" rx="27" ry="19" fill="url(#${uid}-cheek)"/><ellipse cx="201" cy="202" rx="27" ry="19" fill="url(#${uid}-cheek)"/>
    ${expressionFeatures(emotion, d)}
    ${eye('avatar-eye-left', 130, d, emotion, browRaise)}
    ${eye('avatar-eye-right', 190, d, emotion, browRaise)}
    <path d="M158 164 Q149 191 158 204 Q165 207 170 201" fill="none" stroke="#9D604F" stroke-width="5" opacity=".44" stroke-linecap="round"/>
    <path d="M161 166 Q168 188 164 198" fill="none" stroke="#FFF2D5" stroke-width="3" opacity=".24" stroke-linecap="round"/>
    <path d="M151 207 Q160 212 169 207" fill="none" stroke="#8C5046" stroke-width="3" opacity=".35" stroke-linecap="round"/>
    <g id="avatar-mouth" data-viseme="${normalizeViseme(viseme)}">
      <path id="avatar-mouth-outer" d="${mouth.outer}" fill="${esc(d.lips)}"/>
      <path id="avatar-mouth-inner" d="${mouth.inner}" fill="#4C1E2B" opacity="${mouth.innerOpacity}"/>
      <path id="avatar-mouth-teeth" d="${mouth.toothTop}" fill="#FFFDF4" opacity="${mouth.teethOpacity}"/>
      <path id="avatar-mouth-tongue" d="${mouth.tonguePath}" fill="#D86F7A" opacity="${mouth.tongueOpacity}"/>
      <path id="avatar-mouth-highlight" d="M ${Math.max(137, mouth.left + 8).toFixed(1)} ${(mouth.top + 4).toFixed(1)} Q160 ${(mouth.top + 1).toFixed(1)} ${Math.min(183, mouth.right - 8).toFixed(1)} ${(mouth.top + 4).toFixed(1)}" fill="none" stroke="#F58B91" stroke-width="2.3" stroke-linecap="round" opacity=".62"/>
    </g>
    ${smileInk(emotion)}
    ${hairFront(d.hairStyle, d)}
    ${accessory(d.accessory, d)}
  </g>
  <path d="M39 329 Q74 297 111 287" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".2" stroke-linecap="round"/>
  <style>
    .avatar-breathe { transform-box: fill-box; transform-origin: center bottom; }
    .avatar-head-sway { transform-box: fill-box; transform-origin: center bottom; }
    .avatar-eye { transform-box: fill-box; transform-origin: center; }
    @keyframes avatar-breathe { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
    @keyframes avatar-sway { 0%,100% { transform: rotate(-.5deg) } 50% { transform: rotate(.5deg) } }
    .avatar-breathe { animation: avatar-breathe 4.2s ease-in-out infinite; }
    .avatar-head-sway { animation: avatar-sway 7s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .avatar-breathe, .avatar-head-sway { animation: none !important; } }
  </style>
</svg>`;
}

export { emotionMouth };
