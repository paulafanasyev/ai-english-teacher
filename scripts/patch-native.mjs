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

// ---------- iOS: поднять minimum deployment target ----------
// Некоторые плагины (напр. @capacitor-community/text-to-speech) требуют iOS ≥14,
// а Capacitor по умолчанию ставит 13.0 → pod install падает. Поднимаем до 14.0.
// ВАЖНО: этот патч должен применяться ДО `cap sync ios` (до pod install).
const podfile = 'ios/App/Podfile';
if (fs.existsSync(podfile)) {
  let p = fs.readFileSync(podfile, 'utf8');
  const m = p.match(/platform :ios, '([\d.]+)'/);
  if (m && parseFloat(m[1]) < 14) {
    p = p.replace(/platform :ios, '[\d.]+'/, "platform :ios, '14.0'");
    fs.writeFileSync(podfile, p);
    log('iOS: platform поднят до 14.0 (Podfile)');
  } else {
    log('iOS: Podfile platform уже ≥14 (или строка не найдена)');
  }
} else {
  log('iOS Podfile не найден — пропускаю');
}
const pbx = 'ios/App/App.xcodeproj/project.pbxproj';
if (fs.existsSync(pbx)) {
  let x = fs.readFileSync(pbx, 'utf8');
  if (/IPHONEOS_DEPLOYMENT_TARGET = 1[0-3]\.\d+;/.test(x)) {
    x = x.replace(/IPHONEOS_DEPLOYMENT_TARGET = 1[0-3]\.\d+;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 14.0;');
    fs.writeFileSync(pbx, x);
    log('iOS: IPHONEOS_DEPLOYMENT_TARGET → 14.0 (pbxproj)');
  } else {
    log('iOS: pbxproj deployment target уже ≥14 (или не найден)');
  }
} else {
  log('iOS pbxproj не найден — пропускаю');
}
