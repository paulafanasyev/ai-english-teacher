import math from '../../data/fop/math.json';
import english from '../../data/fop/english.json';
import russianNoo from '../../data/fop/russian_noo.json';
import readingNoo from '../../data/fop/literary_reading_noo.json';
import worldNoo from '../../data/fop/world_noo.json';
import mathNoo from '../../data/fop/math_noo.json';
import orkseNoo from '../../data/fop/orkse_noo.json';
import artNoo from '../../data/fop/art_noo.json';
import musicNoo from '../../data/fop/music_noo.json';
import techNoo from '../../data/fop/tech_noo.json';
import peNoo from '../../data/fop/pe_noo.json';
import historyOoo from '../../data/fop/history_ooo.json';
import physicsOoo from '../../data/fop/physics_ooo.json';
import chemistryOoo from '../../data/fop/chemistry_ooo.json';
import biologyOoo from '../../data/fop/biology_ooo.json';
import informaticsOoo from '../../data/fop/informatics_ooo.json';
import socialOoo from '../../data/fop/social_ooo.json';
import literatureOoo from '../../data/fop/literature_ooo.json';

export const PROGRAMS=[...russianNoo,...readingNoo,...mathNoo,...worldNoo,...orkseNoo,...artNoo,...musicNoo,...techNoo,...peNoo,...literatureOoo,...math,...historyOoo,...socialOoo,...physicsOoo,...chemistryOoo,...biologyOoo,...informaticsOoo,...english];
export const DOCS={noo:{title:'ФОП НОО, приказ № 372 от 18.05.2023',url:'http://publication.pravo.gov.ru/document/0001202307130044'},ooo:{title:'ФОП ООО, приказ № 370 от 18.05.2023 (ред. от 10.11.2025)',url:'http://publication.pravo.gov.ru/document/0001202307140040'},ooo808:{title:'Изменения в ФОП ООО, приказ № 808 от 10.11.2025',url:'http://publication.pravo.gov.ru/document/0001202602120006'},faopNoo:{title:'ФАОП НОО, приказ № 1023 от 24.11.2022',url:'http://publication.pravo.gov.ru/Document/View/0001202303220005'},faopOoo:{title:'ФАОП ООО, приказ № 1025 от 24.11.2022',url:'http://publication.pravo.gov.ru/Document/View/0001202303220006'},fpu:{title:'ФПУ, приказ № 436 от 22.06.2026',url:'http://publication.pravo.gov.ru/document/0001202607230005'},edsoo:{title:'Единое содержание общего образования',url:'https://edsoo.ru/normativnye-dokumenty/'}};
export const PLANS={'НОО':{label:'1–4 классы',grades:[1,2,3,4],doc:'noo',rows:[['Русский язык',[5,5,5,5]],['Литературное чтение',[4,4,4,4]],['Иностранный язык',[0,2,2,2]],['Математика',[4,4,4,4]],['Окружающий мир',[2,2,2,2]],['Основы религиозных культур и светской этики',[0,0,0,1]],['Изобразительное искусство',[1,1,1,1]],['Музыка',[1,1,1,1]],['Труд (технология)',[1,1,1,1]],['Физическая культура',[2,2,2,2]]],total:[20,22,22,23],max:[21,23,23,23]},'ООО':{label:'5–9 классы',grades:[5,6,7,8,9],doc:'ooo',rows:[['Русский язык',[5,6,4,3,3]],['Литература',[3,3,2,2,3]],['Иностранный язык',[2,3,3,3,3]],['Математика',[5,5,0,0,0]],['Алгебра',[0,0,3,3,3]],['Геометрия',[0,0,2,2,2]],['Вероятность и статистика',[0,0,1,1,1]],['Информатика',[0,0,1,1,1]],['История',[3,3,3,3,2]],['Обществознание',[0,0,0,0,1]],['География',[1,1,2,2,2]],['Физика',[0,0,2,2,3]],['Химия',[0,0,0,2,2]],['Биология',[1,1,1,2,2]],['Духовно-нравственная культура России',[.5,0,0,0,0]],['Изобразительное искусство',[1,1,1,0,0]],['Музыка',[1,1,1,1,0]],['Труд (технология)',[2,2,2,1,1]],['Физическая культура',[2,2,2,2,2]],['Основы безопасности и защиты Родины',[0,0,0,1,1]]],total:[26.5,28,30,31,32],max:[29,30,32,33,33]}};
const MAP={'Математика':'Математика','Алгебра':'Алгебра','Геометрия':'Геометрия','Вероятность и статистика':'Вероятность и статистика','Иностранный язык':'Иностранный (английский) язык','Русский язык':'Русский язык','Литературное чтение':'Литературное чтение','Окружающий мир':'Окружающий мир','Основы религиозных культур и светской этики':'ОРКСЭ','Изобразительное искусство':'Изобразительное искусство','Музыка':'Музыка','Труд (технология)':'Труд (технология)','Физическая культура':'Физическая культура','Литература':'Литература','Обществознание':'Обществознание','География':'География','История':'История','Физика':'Физика','Химия':'Химия','Биология':'Биология','Информатика':'Информатика'};
export const fmtHours=h=>String(h).replace('.',',');
export const isSampleResults=()=>false;
export function findPrograms(s,g){const x=MAP[s];return x?PROGRAMS.filter(p=>p.grade===g&&(p.subject===x||p.subject.startsWith(`${x}: `))):[];}
export function findProgram(s,g){return findPrograms(s,g)[0];}
export function splitTopic(t){return String(t).split(/(?<=[.;])\s+(?=[А-ЯЁA-Z«(])/).map(x=>x.trim()).filter(Boolean);}
export function defaultDays(h){return({1:[3],2:[2,4],3:[1,3,5],4:[1,2,4,5]})[h]||[1,2,3,4,5];}
export function schoolYearStart(now=new Date()){const y=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;return `${y}-09-01`;}
export function isValidDate(s){if(typeof s!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s))return false;const d=new Date(`${s}T12:00:00`);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export const isWeekday=d=>Number.isInteger(d)&&d>=1&&d<=6;
export function checkDays(days,per){const v=[...new Set(Array.isArray(days)?days:[])].filter(isWeekday);if(!v.length)return{ok:false,msg:'Выберите дни уроков.'};if(v.length>per)return{ok:false,msg:`По программе ${per} ч в неделю: выберите не больше ${per} дн.`};return{ok:true,paired:v.length<per};}
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function lessonDates(start,days,per,count){const a=[...new Set(days)].filter(isWeekday).sort((x,y)=>x-y);if(!a.length||count<=0||!isValidDate(start))return[];const out=[],d=new Date(`${start}T12:00:00`);for(let i=0;out.length<count&&i<800;i++,d.setDate(d.getDate()+1))if(a.includes(d.getDay()))out.push(ymd(d));return out;}
export function buildPlan(program,{start,days,secs}){const u=[];program.sections.forEach((s,i)=>{if(secs&&!secs.includes(i))return;s.topics.forEach(t=>splitTopic(t).forEach(topic=>u.push({section:s.title,topic})))});const n=Math.min(program.hours_per_year,u.length),dates=lessonDates(start,days,program.hours_per_week,n);return u.slice(0,n).map((x,i)=>({n:i+1,date:dates[i]||'',...x,hw:''}));}
export function toCSV(rows){const e=v=>`\"${String(v??'').replace(/\"/g,'\"\"')}\"`;return `\ufeff${[['№','Дата','Раздел','Тема урока','Домашнее задание'],...rows.map(r=>[r.n,r.date,r.section,r.topic,r.hw])].map(r=>r.map(e).join(';')).join('\\r\\n')}`;}
