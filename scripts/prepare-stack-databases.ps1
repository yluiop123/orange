param(
  [string[]]$Stacks = @("spring", "go", "nest", "csharp", "fastapi")
)

$ErrorActionPreference = "Continue"
$pg = "orange-test-pg"
$mysql = "orange-test-mysql"
$maria = "orange-test-mariadb"
$sqlite = "D:\User\Cache\Temp\opencode\orange-test.db"

foreach ($stack in $Stacks) {
  $db = "orange_$stack"

  # PostgreSQL: drop/create, then load the reference schema.
  docker exec $pg psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS $db" 2>$null | Out-Null
  docker exec $pg psql -U postgres -d postgres -c "CREATE DATABASE $db" 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "postgres: could not create $db" }
  docker exec $pg psql -U postgres -d $db -v ON_ERROR_STOP=1 -f /tmp/ddl.sql 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "postgres: ddl failed for $db" }
  docker exec $pg psql -U postgres -d $db -v ON_ERROR_STOP=1 -f /tmp/dml.sql 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "postgres: dml failed for $db" }

  # MySQL and MariaDB: same idea, one database per stack.
  foreach ($spec in @(
      @{ container = $mysql; client = "mysql" },
      @{ container = $maria; client = "mariadb" }
    )) {
    $container = $spec.container
    $client = $spec.client
    docker exec -e MYSQL_PWD=root $container $client -uroot -e "DROP DATABASE IF EXISTS $db; CREATE DATABASE $db" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "${client}: could not create $db" }
    docker exec -e MYSQL_PWD=root $container $client -uroot $db -e "source /tmp/ddl.sql" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "${client}: ddl failed for $db" }
    docker exec -e MYSQL_PWD=root $container $client -uroot $db -e "source /tmp/dml.sql" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "${client}: dml failed for $db" }
  }

  # SQLite: one file per stack.
  $target = "D:\User\Cache\Temp\opencode\orange-$stack.db"
  Copy-Item -Force $sqlite $target
  Write-Host "$db ready (sqlite: $target)"
}

