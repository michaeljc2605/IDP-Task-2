#!/usr/bin/env bash
# Uses an already-installed MySQL server binary; never connects to a user's service.
set -euo pipefail
repo_dir=$(cd "$(dirname "$0")/../.." && pwd)
work_parent=$(dirname "$repo_dir")
mysql_binary=${EBOOK_TEST_MYSQL_BIN:-$(command -v mysql || true)}
mysqld_binary=${EBOOK_TEST_MYSQLD_BIN:-$(command -v mysqld || true)}
mysqladmin_binary=${EBOOK_TEST_MYSQLADMIN_BIN:-$(command -v mysqladmin || true)}
java_binary=${EBOOK_TEST_JAVA_BIN:-$(command -v java || true)}
javac_binary=${EBOOK_TEST_JAVAC_BIN:-$(command -v javac || true)}
for binary in "$mysql_binary" "$mysqld_binary" "$mysqladmin_binary" "$java_binary" "$javac_binary"; do
  [[ -n "$binary" && -x "$binary" ]] || { echo 'Install Java 17+ and MySQL, or set the EBOOK_TEST_*_BIN paths.' >&2; exit 1; }
done
jar_root=${EBOOK_TEST_M2_REPOSITORY:-$HOME/.m2/repository}
classpath=${EBOOK_TEST_CLASSPATH:-$jar_root/jakarta/servlet/jakarta.servlet-api/6.0.0/jakarta.servlet-api-6.0.0.jar:$jar_root/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar:$jar_root/org/mindrot/jbcrypt/0.4/jbcrypt-0.4.jar}
IFS=: read -r -a jars <<< "$classpath"
for jar in "${jars[@]}"; do
  [[ -f "$jar" ]] || { echo "Missing dependency: $jar. Resolve the Maven project dependencies first." >&2; exit 1; }
done
fixture=$(mktemp -d "$work_parent/ebookshop-mysql-test.XXXXXX")
token=${fixture##*.}
schema="ebookshop_test_${token}"
socket_path="/tmp/ebookshop-test-${token}.sock"
server_pid=''
cleanup() {
  status=$?
  trap - EXIT
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    "$mysqladmin_binary" --no-defaults --protocol=socket --socket="$socket_path" --user=root shutdown >/dev/null 2>&1 || kill -TERM "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  case "$fixture" in "$work_parent"/ebookshop-mysql-test.*) rm -rf -- "$fixture" ;; *) echo 'Refused unexpected cleanup path' >&2; exit 1 ;; esac
  rm -f -- "$socket_path" "$socket_path.lock"
  echo 'CLEANUP Removed only the disposable MySQL test process and fixture.'
  exit "$status"
}
trap cleanup EXIT
port=${EBOOK_TEST_MYSQL_PORT:-33081}
if command -v lsof >/dev/null && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $port is occupied; refusing to use another MySQL service." >&2; exit 1
fi
mkdir "$fixture/data" "$fixture/classes"
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
"$javac_binary" --release 17 -cp "$classpath" -d "$fixture/classes" "$repo_dir"/src/main/java/*.java "$repo_dir"/src/test/java/*.java
DB_URL="jdbc:mysql://127.0.0.1:$port/$schema?sslMode=DISABLED&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=0&socketTimeout=0" \
DB_USER=root DB_PASS='' "$java_binary" -cp "$fixture/classes:$classpath" DatabaseMigrationTest
