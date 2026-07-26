#!/usr/bin/env bash
# restore.sh — restores a gzipped pg_dump backup (produced by backup.sh)
# into the PostgreSQL database running under docker compose.
#
# Usage:
#   ./scripts/restore.sh backups/ai_english_teacher_20260101T020000Z.sql.gz
#
# WARNING: this is a destructive operation. It drops and recreates the
# target database's contents. Always confirm you are pointing at the correct
# environment (not production, unless that is truly the intent) before
# running this.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [ -f "$REPO_ROOT/.env" ]; then
  # shellcheck disable=SC1091
  set -a
  source "$REPO_ROOT/.env"
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-app_user}"
POSTGRES_DB="${POSTGRES_DB:-ai_english_teacher}"
COMPOSE_SERVICE="postgres"

cd "$REPO_ROOT"

echo "==> About to restore '$BACKUP_FILE' into database '$POSTGRES_DB' (user: $POSTGRES_USER)."
read -r -p "    This will overwrite existing data. Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

echo "==> Dropping and recreating schema 'public'..."
docker compose exec -T "$COMPOSE_SERVICE" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'

echo "==> Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T "$COMPOSE_SERVICE" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "==> Restore complete. Consider running 'npx prisma migrate deploy' inside"
echo "    the api container if the backup predates the current schema."
