param(
  [switch]$Stop,
  [switch]$SkipLoad
)

$ErrorActionPreference = "Continue"

$pg = "orange-test-pg"
$mysql = "orange-test-mysql"
$maria = "orange-test-mariadb"
$sqlite = "D:\User\Cache\Temp\opencode\orange-test.db"

if ($Stop) {
  docker rm -f $pg $mysql $maria 2>$null | Out-Null
  Write-Host "removed test database containers"
  exit 0
}

docker rm -f $pg $mysql $maria 2>$null | Out-Null

docker run -d --name $pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=orange -p 55432:5432 postgres:16 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { throw "failed to start $pg" }
docker run -d --name $mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=orange -p 53306:3306 mysql:8 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { throw "failed to start $mysql" }
docker run -d --name $maria -e MARIADB_ROOT_PASSWORD=root -e MARIADB_DATABASE=orange -p 53307:3306 mariadb:11 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { throw "failed to start $maria" }

function Wait-Ready([string]$container, [string]$command, [int]$attempts = 90) {
  for ($i = 0; $i -lt $attempts; $i++) {
    docker exec $container sh -c $command 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { return }
    Start-Sleep -Seconds 1
  }
  throw "$container did not become ready"
}

Wait-Ready $pg "pg_isready -U postgres -d orange"
Wait-Ready $mysql "MYSQL_PWD=root mysql -uroot -e 'SELECT 1' orange"
Wait-Ready $maria "MYSQL_PWD=root mariadb -uroot -e 'SELECT 1' orange"

if (-not $SkipLoad) {
  docker cp database/postgres/ddl.sql "${pg}:/tmp/ddl.sql" 2>$null | Out-Null
  docker cp database/postgres/dml.sql "${pg}:/tmp/dml.sql" 2>$null | Out-Null
  docker exec $pg psql -U postgres -d orange -v ON_ERROR_STOP=1 -f /tmp/ddl.sql 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "failed to load PostgreSQL ddl" }
  docker exec $pg psql -U postgres -d orange -v ON_ERROR_STOP=1 -f /tmp/dml.sql 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "failed to load PostgreSQL dml" }

  docker cp database/mysql/ddl.sql "${mysql}:/tmp/ddl.sql" 2>$null | Out-Null
  docker cp database/mysql/dml.sql "${mysql}:/tmp/dml.sql" 2>$null | Out-Null
  docker exec -e MYSQL_PWD=root $mysql mysql -uroot orange -e "source /tmp/ddl.sql" 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "failed to load MySQL ddl" }
  docker exec -e MYSQL_PWD=root $mysql mysql -uroot orange -e "source /tmp/dml.sql" 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "failed to load MySQL dml" }

  docker cp database/mariadb/ddl.sql "${maria}:/tmp/ddl.sql" 2>$null | Out-Null
  docker cp database/mariadb/dml.sql "${maria}:/tmp/dml.sql" 2>$null | Out-Null
  docker exec -e MYSQL_PWD=root $maria mariadb -uroot orange -e "source /tmp/ddl.sql" 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "failed to load MariaDB ddl" }
  docker exec -e MYSQL_PWD=root $maria mariadb -uroot orange -e "source /tmp/dml.sql" 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "failed to load MariaDB dml" }

  if (Test-Path $sqlite) { Remove-Item -Force $sqlite }
  python -c "import pathlib, sqlite3; con = sqlite3.connect(r'$sqlite'); con.executescript(pathlib.Path('database/sqlite/ddl.sql').read_text(encoding='utf-8')); con.executescript(pathlib.Path('database/sqlite/dml.sql').read_text(encoding='utf-8')); con.close()"
  if ($LASTEXITCODE -ne 0) { throw "failed to load SQLite" }
}

Write-Host "PostgreSQL : postgres://postgres:postgres@localhost:55432/orange"
Write-Host "MySQL      : mysql://root:root@localhost:53306/orange"
Write-Host "MariaDB    : mysql://root:root@localhost:53307/orange"
Write-Host "SQLite     : $sqlite"



