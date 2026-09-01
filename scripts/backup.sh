#!/bin/bash
DATE=20260405_121007
BACKUP_DIR=/opt/fielriopardo/backups
docker exec fielriopardo-postgres pg_dump -U fielriopardo fielriopardo_db | gzip > /db_.sql.gz
find  -name "*.sql.gz" -mtime +7 -delete
echo "Backup concluído: "
