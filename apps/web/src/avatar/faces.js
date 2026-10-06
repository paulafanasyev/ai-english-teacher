/** Illustration tokens for the inline teacher portraits. */
export const FACES = {
  alex: {
    id: 'alex', name: 'Alex', gender: 'm', nationality: 'American', vibe: 'energetic',
    bg: '#DCECF7', clothing: '#D86F3E', clothingDark: '#9E402A', clothingStyle: 'hoodie',
    skin: '#D89468', skinLight: '#F4B98D', hair: '#342727', hairLight: '#704A3E',
    eyes: '#2D7893', brow: '#60443F', lips: '#A74348', blush: '#E98D7E',
    hairStyle: 'curly', faceShape: 'broad', eyeShape: 'round', accessory: 'headband', accessoryColor: '#E28243',
  },
  emma: {
    id: 'emma', name: 'Emma', gender: 'f', nationality: 'British', vibe: 'warm',
    bg: '#FBE7D5', clothing: '#E3A13D', clothingDark: '#B86D2B', clothingStyle: 'cardigan',
    skin: '#F3C39F', skinLight: '#FFE1C2', hair: '#70402F', hairLight: '#BD7C52',
    eyes: '#4E7869', brow: '#8A5A4B', lips: '#C25366', blush: '#EB9F9A',
    hairStyle: 'messyBun', faceShape: 'round', eyeShape: 'soft', accessory: 'headband', accessoryColor: '#E3A13D',
  },
  james: {
    id: 'james', name: 'James', gender: 'm', nationality: 'Irish', vibe: 'calm',
    bg: '#DDF0E5', clothing: '#3F9A6D', clothingDark: '#246847', clothingStyle: 'collar',
    skin: '#E4AD82', skinLight: '#F5CAA2', hair: '#302A2C', hairLight: '#756067',
    eyes: '#4D6D67', brow: '#6A5554', lips: '#A64D4B', blush: '#D88D7D',
    hairStyle: 'sidepart', faceShape: 'long', eyeShape: 'almond', accessory: 'glasses', accessoryColor: '#334E58',
  },
  linh: {
    id: 'linh', name: 'Linh', gender: 'f', nationality: 'Vietnamese', vibe: 'graceful',
    bg: '#F8E5E7', clothing: '#3E7CA6', clothingDark: '#285A78', clothingStyle: 'collar',
    skin: '#D99770', skinLight: '#F0B58B', hair: '#211D26', hairLight: '#655263',
    eyes: '#3D6E77', brow: '#6B4B57', lips: '#B34E68', blush: '#E28B92',
    hairStyle: 'longStraight', faceShape: 'oval', eyeShape: 'almond', accessory: 'earrings', accessoryColor: '#E6AA4B',
  },
  minh: {
    id: 'minh', name: 'Minh', gender: 'm', nationality: 'Vietnamese', vibe: 'patient',
    bg: '#F7F0D1', clothing: '#2F7FB0', clothingDark: '#205A7D', clothingStyle: 'crew',
    skin: '#B96F4D', skinLight: '#DA9369', hair: '#171B23', hairLight: '#52616A',
    eyes: '#4C765E', brow: '#62504D', lips: '#914842', blush: '#C87567',
    hairStyle: 'texturedCrop', faceShape: 'angular', eyeShape: 'soft', accessory: 'glasses', accessoryColor: '#24445B',
  },
  sofia: {
    id: 'sofia', name: 'Sofia', gender: 'f', nationality: 'Spanish', vibe: 'bold',
    bg: '#DDEAF6', clothing: '#C55543', clothingDark: '#8F382E', clothingStyle: 'collar',
    skin: '#C9825F', skinLight: '#E6A27C', hair: '#462D2A', hairLight: '#8E5A4E',
    eyes: '#735B9C', brow: '#704C50', lips: '#AA3854', blush: '#DF817C',
    hairStyle: 'longWavy', faceShape: 'round', eyeShape: 'round', accessory: 'earrings', accessoryColor: '#E6AA4B',
  },
};

const FALLBACK_PALETTE = [
  ['#E4B28C', '#3D4A65', '#7C5A9E', '#527AA0', '#F0C76D'],
  ['#C98967', '#1E2028', '#3A8D87', '#C35B51', '#E8A448'],
  ['#F1C5A4', '#5B3A31', '#D07A3E', '#568E74', '#9B5DAA'],
];
function hashId(id) { let h = 2166136261; for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 16777619); return Math.abs(h >>> 0); }
/** Deterministic, friendly fallback for a teacher added by the API. */
export function faceFor(id = 'teacher') {
  const key = String(id || 'teacher').toLowerCase();
  if (FACES[key]) return FACES[key];
  const h = hashId(key); const p = FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
  const styles = ['longStraight', 'texturedCrop', 'longWavy', 'sidepart', 'curly'];
  return {
    id: key, name: key.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), gender: h % 2 ? 'f' : 'm', nationality: 'global', vibe: 'welcoming', bg: '#E5ECF5',
    clothing: p[3], clothingDark: '#31556F', clothingStyle: 'crew', skin: p[0], skinLight: p[0], hair: p[1], hairLight: '#6B5963', eyes: p[2], brow: '#5D4B55', lips: p[3], blush: '#D9877D',
    hairStyle: styles[h % styles.length], faceShape: h % 3 === 0 ? 'round' : 'oval', eyeShape: h % 2 ? 'soft' : 'almond', accessory: h % 3 === 0 ? 'glasses' : 'none', accessoryColor: p[4],
  };
}
export const faceById = faceFor;
export default FACES;
