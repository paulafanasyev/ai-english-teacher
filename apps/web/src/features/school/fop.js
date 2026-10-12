import fopNoo from '../../data/fop/fop_noo.json';
import russianNoo from '../../data/fop/russian_noo.json';
import literaryReadingNoo from '../../data/fop/literary_reading_noo.json';
import mathNoo from '../../data/fop/math_noo.json';
import worldNoo from '../../data/fop/world_noo.json';
import english from '../../data/fop/english.json';
import math from '../../data/fop/math.json';
import historyOoo from '../../data/fop/history_ooo.json';
import socialOoo from '../../data/fop/social_ooo.json';
import literatureOoo from '../../data/fop/literature_ooo.json';
import geographyOoo from '../../data/fop/geography_ooo.json';
import physicsOoo from '../../data/fop/physics_ooo.json';
import chemistryOoo from '../../data/fop/chemistry_ooo.json';
import biologyOoo from '../../data/fop/biology_ooo.json';
import informaticsOoo from '../../data/fop/informatics_ooo.json';
import artNoo from '../../data/fop/art_noo.json';
import musicNoo from '../../data/fop/music_noo.json';
import orkseNoo from '../../data/fop/orkse_noo.json';
import peNoo from '../../data/fop/pe_noo.json';
import techNoo from '../../data/fop/tech_noo.json';

export const PROGRAMS = [
  ...fopNoo, ...russianNoo, ...literaryReadingNoo, ...mathNoo, ...worldNoo,
  ...english, ...literatureOoo, ...math, ...historyOoo, ...socialOoo, ...geographyOoo,
  ...physicsOoo, ...chemistryOoo, ...biologyOoo, ...informaticsOoo,
  ...artNoo, ...musicNoo, ...orkseNoo, ...peNoo, ...techNoo,
];

export const SUBJECT_MAP = {
  'Русский язык': 'Русский язык', 'Литература': 'Литература',
  'Литературное чтение': 'Литературное чтение', 'Математика': 'Математика',
  'Английский язык': 'Английский язык', 'История': 'История',
  'Обществознание': 'Обществознание', 'География': 'География',
  'Физика': 'Физика', 'Химия': 'Химия', 'Биология': 'Биология',
  'Информатика': 'Информатика', 'ИЗО': 'ИЗО', 'Музыка': 'Музыка',
  'ОРКСЭ': 'ОРКСЭ', 'Физическая культура': 'Физическая культура',
  'Труд': 'Труд',
};

export function formatHours(program) {
  return `${program.hours_per_week} ч/нед. · ${program.hours_per_year} ч/год`;
}
