#!/usr/bin/env bash
# Создаёт Android keystore для подписи APK/AAB и печатает base64 для секрета GitHub.
#   ./scripts/make-keystore.sh [alias] [файл-keystore]
# Затем добавьте секреты в GitHub → Settings → Secrets and variables → Actions.
set -euo pipefail

ALIAS="${1:-aet}"
KS="${2:-aet-release.keystore}"

command -v keytool >/dev/null || { echo "❌ keytool не найден — установите JDK 17 (Temurin) или Android Studio"; exit 1; }

if [ -f "$KS" ]; then
  echo "⚠ $KS уже существует — не перезаписываю (потеря ключа = невозможность обновлять приложение в Play)"
else
  echo "▶ Создаю keystore '$KS' (alias: $ALIAS). Задайте пароли и данные владельца:"
  keytool -genkey -v -keystore "$KS" -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000
fi

echo
echo "▶ base64 для секрета ANDROID_KEYSTORE_BASE64 (одна строка, скопируйте целиком):"
echo "----------8<----------"
if base64 --help 2>&1 | grep -q -- '-w'; then base64 -w0 "$KS"; else base64 "$KS" | tr -d '\n'; fi
echo
echo "---------->8----------"
echo
echo "Секреты для GitHub Actions:"
echo "  ANDROID_KEYSTORE_BASE64   = строка выше"
echo "  ANDROID_KEYSTORE_PASSWORD = <пароль хранилища>"
echo "  ANDROID_KEY_ALIAS         = $ALIAS"
echo "  ANDROID_KEY_PASSWORD      = <пароль ключа>"
echo
echo "🔒 Сохраните '$KS' и пароли в надёжном месте и сделайте бэкап. Не коммитьте keystore в git."
