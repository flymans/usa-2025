#!/usr/bin/env bash
set -euo pipefail

readonly DEPLOY_HOST="myserver"
readonly DEPLOY_ROOT="/var/www/flymanmd.ru/html/usa"
readonly BACKUP_ROOT="/var/www/flymanmd.ru/backups"

cd "$(dirname "$0")/.."

npm run build
test -f out/index.html

ssh "$DEPLOY_HOST" "set -eu
  mkdir -p '$DEPLOY_ROOT' '$BACKUP_ROOT'
  if find '$DEPLOY_ROOT' -mindepth 1 -print -quit | grep -q .; then
    backup_name=\"usa-\$(date +%Y%m%d-%H%M%S).tar.gz\"
    tar -C '$DEPLOY_ROOT' -czf '$BACKUP_ROOT'/\"\$backup_name\" .
  fi
"

rsync -az --delete out/ "$DEPLOY_HOST:$DEPLOY_ROOT/"
ssh "$DEPLOY_HOST" "find '$DEPLOY_ROOT' -type d -exec chmod 755 {} +; find '$DEPLOY_ROOT' -type f -exec chmod 644 {} +"

curl --fail --silent --show-error --location \
  --output /dev/null \
  --write-out "Published: %{url_effective} (%{http_code})\n" \
  "https://flymanmd.ru/usa/"
