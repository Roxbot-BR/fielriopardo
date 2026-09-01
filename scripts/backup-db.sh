#!/bin/bash
set -eo pipefail

DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/opt/fielriopardo/backups/db
LOG=/opt/fielriopardo/logs/backup.log
OUTFILE="$BACKUP_DIR/fielriopardo_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump com validação de erro de pipe
if ! docker exec fiel-postgres pg_dump -U fielriopardo fielriopardo_db 2>>/tmp/backup_pg_error.log | gzip > "$OUTFILE"; then
  echo "$(date): ERRO no pg_dump! Veja /tmp/backup_pg_error.log" >> "$LOG"
  rm -f "$OUTFILE"
  exit 1
fi

# Valida se arquivo tem tamanho mínimo (> 1KB)
FILESIZE=$(stat -c%s "$OUTFILE" 2>/dev/null || echo 0)
if [ "$FILESIZE" -lt 1024 ]; then
  echo "$(date): ERRO — backup gerado com apenas $FILESIZE bytes (possível dump vazio). Arquivo removido." >> "$LOG"
  rm -f "$OUTFILE"
  exit 1
fi

# Remove backups antigos (manter últimos 7)
ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +8 | xargs rm -f

echo "$(date): Backup OK — $OUTFILE ($(du -sh "$OUTFILE" | cut -f1))" >> "$LOG"
