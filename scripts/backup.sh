#!/usr/bin/env bash
# backup.sh — dumps the PostgreSQL database running under docker compose,
# gzips it into backups/ with a timestamped filename, and prunes old backups
# keeping only the newest 14.
#
# Usage:
#   ./scripts/backup.sh
#
# Run from anywhere; the script resolves paths relative to its own location
# so it also works when invoked from cron with an absolute path.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$REPO_ROOT/backups"
KEEP=14

# Load env vars (POSTGRES_USER / POSTGRES_DB) from the repo-root .env if present.
if [ -f "$REPO_ROOT/.env" ]; then
  # shellcheck disable=SC1091
  set -a
  source "$REPO_ROOT/.env"
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-app_user}"
POSTGRES_DB="${POSTGRES_DB:-ai_english_teacher}"
COMPOSE_SERVICE="postgres"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTFILE="$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

echo "==> Dumping database '$POSTGRES_DB' (user: $POSTGRES_USER) from service '$COMPOSE_SERVICE'..."

cd "$REPO_ROOT"

docker compose exec -T "$COMPOSE_SERVICE" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges \
  | gzip -9 > "$OUTFILE"

echo "==> Backup written to: $OUTFILE"
echo "==> Size: $(du -h "$OUTFILE" | cut -f1)"

# --- Retention: keep only the newest $KEEP backups -------------------------
echo "==> Pruning old backups, keeping newest $KEEP..."

mapfile -t ALL_BACKUPS < <(ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null || true)

COUNT=${#ALL_BACKUPS[@]}
if [ "$COUNT" -gt "$KEEP" ]; then
  for ((i = KEEP; i < COUNT; i++)); do
    echo "    removing old backup: ${ALL_BACKUPS[$i]}"
    rm -f "${ALL_BACKUPS[$i]}"
  done
else
  echo "    nothing to prune ($COUNT/$KEEP)."
fi

echo "==> Done."

# -----------------------------------------------------------------------------
# Example cron entry (runs nightly at 02:30 server time):
#
#   30 2 * * * cd /opt/ai-english-teacher && ./scripts/backup.sh >> /var/log/ai-english-teacher-backup.log 2>&1
#
# Remember to also periodically verify a backup restores cleanly — see
# scripts/restore.sh and SECURITY_AUDIT.md's "backup verification" checklist
# item. A backup you have never test-restored is not a backup you can trust.
# -----------------------------------------------------------------------------
