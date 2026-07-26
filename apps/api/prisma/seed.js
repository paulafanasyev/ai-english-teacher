// Seed script: creates one admin user (from env, with a safe default) and
// 12 demo students with realistic-looking Attempt history spread across the
// last 30 days. Run with `npm run seed` (requires a live DATABASE_URL).

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_COST = 12;

const TASK_TYPES = ['vocab-card', 'gap-task', 'listening', 'speaking-drill', 'grammar-quiz'];
const TOPICS = [
  'travel',
  'food',
  'business',
  'family',
  'weather',
  'technology',
  'health',
  'sports',
  'shopping',
  'education',
];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const STUDENT_NAMES = [
  'Alice Johnson',
  'Bruno Silva',
  'Chen Wei',
  'Diana Petrova',
  'Ethan Müller',
  'Fatima Al-Sayed',
  'Grace Kim',
  'Hiro Tanaka',
  'Isabel Costa',
  'Jonas Andersson',
  'Klara Nowak',
  'Liam O\'Brien',
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function daysAgo(n, hour = randInt(7, 22)) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, randInt(0, 59), randInt(0, 59), 0);
  return d;
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe_123';

  console.log(`==> Seeding admin user: ${adminEmail}`);

  const adminPasswordHash = await bcrypt.hash(adminPassword, BCRYPT_COST);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'Administrator',
      role: 'ADMIN',
      level: 'C1',
      locale: 'en',
    },
  });

  console.log(`    Admin ready: ${admin.id}`);

  console.log('==> Seeding default settings...');
  const defaultSettings = [
    { key: 'avatarGenerationEnabled', value: 'true' },
    { key: 'gamesEnabled', value: 'true' },
    { key: 'listeningEnabled', value: 'true' },
    { key: 'registrationOpen', value: 'true' },
  ];
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`==> Seeding ${STUDENT_NAMES.length} demo students with 30 days of attempts...`);

  const demoPasswordHash = await bcrypt.hash('Demo_Student123', BCRYPT_COST);
  const seededStudents = [];

  for (let i = 0; i < STUDENT_NAMES.length; i += 1) {
    const name = STUDENT_NAMES[i];
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '.');
    const email = `${slug}${i}@demo.example.com`;
    const level = pick(LEVELS);

    const student = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: demoPasswordHash,
        name,
        role: 'STUDENT',
        level,
        teacherId: admin.id,
        xp: 0,
        coins: 0,
        locale: pick(['ru', 'en']),
      },
    });
    seededStudents.push(student);

    // Skip regenerating attempts if this student already has some (idempotent reseed).
    const existingCount = await prisma.attempt.count({ where: { userId: student.id } });
    if (existingCount > 0) {
      console.log(`    ${name}: already has ${existingCount} attempts, skipping.`);
      continue;
    }

    let totalXp = 0;
    let totalCoins = 0;
    let attemptsCreated = 0;

    // Simulate a plausible daily practice pattern: most days have 0-2
    // sessions, weekends slightly more active, overall accuracy trending
    // upward over the 30-day window (a "learning" curve).
    for (let dayOffset = 29; dayOffset >= 0; dayOffset -= 1) {
      const sessionsToday = Math.random() < 0.65 ? randInt(1, 4) : 0;
      const progressFactor = (29 - dayOffset) / 29; // 0 -> 1 over the month
      const baseAccuracy = 0.55 + progressFactor * 0.3; // 55% -> 85%

      for (let s = 0; s < sessionsToday; s += 1) {
        const correct = Math.random() < baseAccuracy;
        const attempt = await prisma.attempt.create({
          data: {
            userId: student.id,
            taskType: pick(TASK_TYPES),
            topic: pick(TOPICS),
            level,
            correct,
            durationMs: randInt(1500, 25000),
            createdAt: daysAgo(dayOffset),
          },
        });
        attemptsCreated += 1;
        if (correct) {
          const xpGain = randInt(5, 20);
          const coinGain = randInt(1, 8);
          totalXp += xpGain;
          totalCoins += coinGain;
        }
      }
    }

    await prisma.user.update({
      where: { id: student.id },
      data: { xp: totalXp, coins: totalCoins },
    });

    console.log(`    ${name} (${level}): ${attemptsCreated} attempts, ${totalXp} xp, ${totalCoins} coins.`);
  }

  // --- Phase 10: teacher, parent, class, enrollments, electronic journal ---
  console.log('==> Seeding teacher, parent, class and electronic journal...');
  const teacherPass = await bcrypt.hash('Teacher_123', BCRYPT_COST);
  const parentPass = await bcrypt.hash('Parent_123', BCRYPT_COST);

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@demo.example.com' },
    update: { role: 'TEACHER' },
    create: { email: 'teacher@demo.example.com', passwordHash: teacherPass, name: 'Maria Petrova', role: 'TEACHER', level: 'C1', locale: 'ru' },
  });

  const classStudents = seededStudents.slice(0, 6);
  let klass = await prisma.class.findFirst({ where: { teacherId: teacher.id } });
  if (!klass) {
    klass = await prisma.class.create({ data: { name: 'Group 5A · English', teacherId: teacher.id } });
  }
  for (const s of classStudents) {
    await prisma.enrollment.upsert({
      where: { classId_studentId: { classId: klass.id, studentId: s.id } },
      update: {},
      create: { classId: klass.id, studentId: s.id },
    });
  }

  const parent = await prisma.user.upsert({
    where: { email: 'parent@demo.example.com' },
    update: { role: 'PARENT' },
    create: { email: 'parent@demo.example.com', passwordHash: parentPass, name: 'Irina (parent)', role: 'PARENT', level: 'A1', locale: 'ru' },
  });
  if (classStudents[0]) {
    await prisma.parentLink.upsert({
      where: { parentId_studentId: { parentId: parent.id, studentId: classStudents[0].id } },
      update: {},
      create: { parentId: parent.id, studentId: classStudents[0].id },
    });
  }

  const journalCount = await prisma.journalEntry.count({ where: { classId: klass.id } });
  if (journalCount === 0) {
    const KINDS = ['lesson', 'quiz', 'homework'];
    const JT = ['travel', 'food', 'family', 'weather', 'education'];
    for (const s of classStudents) {
      const n = randInt(4, 7);
      for (let e = 0; e < n; e += 1) {
        await prisma.journalEntry.create({
          data: {
            studentId: s.id, classId: klass.id, teacherId: teacher.id,
            kind: pick(KINDS), topic: pick(JT), mark: randInt(3, 5), comment: '', createdAt: daysAgo(randInt(0, 18)),
          },
        });
      }
    }
    if (classStudents[0]) {
      await prisma.journalEntry.create({ data: { studentId: classStudents[0].id, classId: klass.id, teacherId: teacher.id, kind: 'note', topic: '', mark: null, comment: 'Great progress in speaking practice!', createdAt: daysAgo(2) } });
      await prisma.journalEntry.create({ data: { studentId: classStudents[0].id, classId: klass.id, teacherId: teacher.id, kind: 'homework', topic: 'family', mark: 5, comment: 'Homework done excellently.', createdAt: daysAgo(1) } });
    }
  }
  console.log(`    Teacher ${teacher.id}, parent ${parent.id}, class ${klass.id}, ${classStudents.length} enrolled.`);

  console.log('==> Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
