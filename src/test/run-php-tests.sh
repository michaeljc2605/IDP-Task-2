#!/usr/bin/env bash
# Real HTTP + MySQL checks using installed binaries and an entirely disposable fixture.
set -euo pipefail
repo_dir=$(cd "$(dirname "$0")/../.." && pwd)
work_parent=$(dirname "$repo_dir")
mysql_binary=${EBOOK_TEST_MYSQL_BIN:-$(command -v mysql || true)}
mysqld_binary=${EBOOK_TEST_MYSQLD_BIN:-$(command -v mysqld || true)}
mysqladmin_binary=${EBOOK_TEST_MYSQLADMIN_BIN:-$(command -v mysqladmin || true)}
php_binary=${EBOOK_TEST_PHP_BIN:-$(command -v php || true)}
node_binary=${EBOOK_TEST_NODE_BIN:-$(command -v node || true)}
for binary in "$mysql_binary" "$mysqld_binary" "$mysqladmin_binary" "$php_binary" "$node_binary"; do
  [[ -n "$binary" && -x "$binary" ]] || { echo 'PHP, Node and MySQL must already be installed.' >&2; exit 1; }
done
fixture=$(mktemp -d "$work_parent/ebookshop-php-test.XXXXXX")
token=${fixture##*.}
schema="ebookshop_test_${token}"
socket_path="/tmp/ebookshop-php-${token}.sock"
server_pid=''
cleanup() {
  status=$?
  trap - EXIT
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    "$mysqladmin_binary" --no-defaults --protocol=socket --socket="$socket_path" --user=root shutdown >/dev/null 2>&1 || kill -TERM "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  case "$fixture" in "$work_parent"/ebookshop-php-test.*) rm -rf -- "$fixture" ;; *) echo 'Refused unexpected cleanup path' >&2; exit 1 ;; esac
  rm -f -- "$socket_path" "$socket_path.lock"
  echo 'CLEANUP Removed the disposable PHP/MySQL fixture.'
  exit "$status"
}
trap cleanup EXIT
port=${EBOOK_TEST_MYSQL_PORT:-33081}
http_port=${EBOOK_TEST_HTTP_PORT:-18081}
for checked_port in "$port" "$http_port"; do
  if command -v lsof >/dev/null && lsof -nP -iTCP:"$checked_port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $checked_port is occupied; refusing to use an existing service." >&2; exit 1
  fi
done
mkdir "$fixture/data"
"$mysqld_binary" --no-defaults --initialize-insecure --datadir="$fixture/data" >"$fixture/initialize.log" 2>&1
"$mysqld_binary" --no-defaults --datadir="$fixture/data" --socket="$socket_path" \
  --port="$port" --bind-address=127.0.0.1 --mysqlx=OFF \
  --pid-file="$fixture/server.pid" --log-error="$fixture/server.log" &
server_pid=$!
ready=0
for attempt in {1..60}; do
  if "$mysqladmin_binary" --no-defaults --protocol=socket --socket="$socket_path" --user=root ping >/dev/null 2>&1; then ready=1; break; fi
  if ! kill -0 "$server_pid" 2>/dev/null; then echo 'Disposable MySQL failed to start.' >&2; cat "$fixture/server.log" >&2; exit 1; fi
  sleep 0.25
done
[[ "$ready" == 1 ]] || { echo 'Disposable MySQL startup timed out.' >&2; exit 1; }
"$mysql_binary" --no-defaults --protocol=socket --socket="$socket_path" --user=root -e "CREATE DATABASE \`$schema\` CHARACTER SET utf8mb4;"
"$mysql_binary" --no-defaults --protocol=socket --socket="$socket_path" --user=root --database="$schema" < "$repo_dir/deployment/ebookshop-catalog-only.sql"
fixture_hash=$("$php_binary" -r "echo password_hash('fixture-only-not-a-live-password', PASSWORD_BCRYPT);")
"$mysql_binary" --no-defaults --protocol=socket --socket="$socket_path" --user=root --database="$schema" -e "INSERT INTO users (username,password_hash) VALUES ('fixture-staff','$fixture_hash');"
"$node_binary" "$repo_dir/scripts/package-infinityfree.mjs" "$fixture/package"
export EBOOK_PHP_TEST_ORIGIN="http://127.0.0.1:$http_port"
export EBOOK_PHP_TEST_SCHEMA="$schema" EBOOK_PHP_TEST_SOCKET="$socket_path" EBOOK_PHP_TEST_MYSQL_BIN="$mysql_binary"
export EBOOK_PHP_TEST_FIXTURE="$fixture" EBOOK_PHP_TEST_REPO="$repo_dir" EBOOK_PHP_TEST_PORT="$port" EBOOK_PHP_TEST_HTTP_PORT="$http_port" EBOOK_PHP_TEST_PHP_BIN="$php_binary"
"$node_binary" --input-type=module <<'JS'
import { spawn } from 'node:child_process';
import { open, writeFile, readFile, mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const fixture=process.env.EBOOK_PHP_TEST_FIXTURE, repo=process.env.EBOOK_PHP_TEST_REPO;
const config={db_host:'127.0.0.1',db_port:Number(process.env.EBOOK_PHP_TEST_PORT),db_name:process.env.EBOOK_PHP_TEST_SCHEMA,db_user:'root',db_password:'',public_origin:process.env.EBOOK_PHP_TEST_ORIGIN,session_ttl_seconds:3600};
await writeFile(fixture+'/package/htdocs/php/config.local.php',"<?php return json_decode('"+JSON.stringify(config)+"', true);\n",{mode:0o600});
await mkdir(fixture+'/sessions');
const log=await open(fixture+'/php.log','w');
const server=spawn(process.env.EBOOK_PHP_TEST_PHP_BIN,['-d',`session.save_path=${fixture}/sessions`,'-S',`127.0.0.1:${process.env.EBOOK_PHP_TEST_HTTP_PORT}`,'-t',fixture+'/package/htdocs',repo+'/src/test/php-router.php'],{env:{...process.env,PHP_CLI_SERVER_WORKERS:'4'},stdio:['ignore',log.fd,log.fd],detached:true});
let stopped=false;
function stop(){if(!stopped){stopped=true;try{process.kill(-server.pid,'SIGTERM');}catch(error){if(error.code!=='ESRCH')throw error;}}}
process.on('SIGTERM',()=>{stop();process.exit(143);}); process.on('SIGINT',()=>{stop();process.exit(130);});
try {
  let ready=false;
  for(let attempt=0;attempt<60;attempt++){
    if(server.exitCode!==null)throw Error('Disposable PHP server exited before readiness');
    try{const result=await fetch(process.env.EBOOK_PHP_TEST_ORIGIN+'/api/books',{signal:AbortSignal.timeout(1000)});if(result.status===200){ready=true;break;}}catch{}
    await delay(100);
  }
  if(!ready)throw Error('Disposable PHP server did not become ready');
  const test=spawn(process.execPath,[repo+'/src/test/php-integration.mjs'],{env:process.env,stdio:'inherit'});
  const status=await new Promise((resolve,reject)=>{test.once('error',reject);test.once('exit',resolve);});
  if(status!==0)process.exitCode=status||1;
} catch(error){console.error(error.message);console.error(await readFile(fixture+'/php.log','utf8'));process.exitCode=1;}
finally{stop();if(server.exitCode===null)await Promise.race([new Promise(resolve=>server.once('exit',resolve)),delay(2000)]);await log.close();}
JS
