#!/usr/bin/env node
// Добавляет нативные разрешения на микрофон/распознавание речи в сгенерированные
// проекты Capacitor. Запускать ПОСЛЕ `npx cap add` (для android и/или ios); идемпотентно.
// В CI вызывается из рабочей директории apps/web (где создаются android/ и ios/).
import fs from 'node:fs';

const log = (m) => console.log('[patch-native] ' + m);

// ---------- Android: RECORD_AUDIO ----------
const manifest = 'android/app/src/main/AndroidManifest.xml';
if (fs.existsSync(manifest)) {
  let x = fs.readFileSync(manifest, 'utf8');
  if (!x.includes('android.permission.RECORD_AUDIO')) {
    x = x.replace(/<manifest([^>]*)>/, (m) => m + '\n    <uses-permission android:name="android.permission.RECORD_AUDIO"/>');
    fs.writeFileSync(manifest, x);
    log('Android: добавлено разрешение RECORD_AUDIO');
  } else {
    log('Android: RECORD_AUDIO уже есть');
  }
} else {
  log('Android manifest не найден — пропускаю');
}

// ---------- Android: принудительно Java 17 для всех модулей ----------
// Некоторые community-плагины (напр. @capacitor-community/text-to-speech)
// собираются под Java 21, а CI использует JDK 17 → "invalid source release: 21".
// Приводим ВСЕ модули к Java 17 (плагины не используют возможностей Java 21).
const rootGradle = 'android/build.gradle';
if (fs.existsSync(rootGradle)) {
  let g = fs.readFileSync(rootGradle, 'utf8');
  if (!g.includes('patch-native: force Java 17')) {
    g += `

// patch-native: force Java 17 across all modules (some plugins target Java 21)
subprojects { sp ->
    sp.afterEvaluate {
        if (sp.extensions.findByName('android') != null) {
            sp.android {
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
    }
}
`;
    fs.writeFileSync(rootGradle, g);
    log('Android: принудительно Java 17 для всех модулей (build.gradle)');
  } else {
    log('Android: Java-17 override уже есть');
  }
} else {
  log('Android build.gradle не найден — пропускаю Java-17 override');
}

// ---------- iOS: Info.plist usage descriptions ----------
const plist = 'ios/App/App/Info.plist';
if (fs.existsSync(plist)) {
  let x = fs.readFileSync(plist, 'utf8');
  const want = [
    ['NSMicrophoneUsageDescription', 'Микрофон нужен для практики устной речи с ИИ-учителем.'],
    ['NSSpeechRecognitionUsageDescription', 'Распознавание речи нужно, чтобы проверять ваше произношение.'],
  ];
  const add = want.filter(([k]) => !x.includes(k));
  if (add.length) {
    const block = add.map(([k, v]) => `\t<key>${k}</key>\n\t<string>${v}</string>`).join('\n');
    x = x.replace(/<\/dict>\s*<\/plist>\s*$/, block + '\n</dict>\n</plist>\n');
    fs.writeFileSync(plist, x);
    log('iOS: добавлено ' + add.map((a) => a[0]).join(', '));
  } else {
    log('iOS: usage-описания уже есть');
  }
} else {
  log('iOS Info.plist не найден — пропускаю');
}
