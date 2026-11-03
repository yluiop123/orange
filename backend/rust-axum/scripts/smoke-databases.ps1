# Smoke-tests the Rust/Axum backend against every database in docs/DB-MATRIX.md.
#
#   pwsh -File scripts/smoke-databases.ps1                 # all engines
#   pwsh -File scripts/smoke-databases.ps1 -Engine sqlite
#
# Each engine starts its own process on a separate port and checks:
# login (super/super), user-info, menus, users list (+keyword filter),
# role list sorted by name, permission and group lists, group create/delete,
# operation-log list, user create/delete and role create/delete.
#
# The databases are expected to be loaded from database/<engine>/ddl.sql and
# dml.sql; the script only creates and deletes its own rows.

param(
    [ValidateSet('all', 'postgres', 'mysql', 'mariadb', 'sqlite')]
    [string]$Engine = 'all',
    # Overrides the URL for a single-engine run.
    [string]$Url
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$exe = Join-Path $root 'target\debug\orange-rust-axum.exe'
if (-not (Test-Path $exe)) {
    throw "build first: cargo build (missing $exe)"
}

$engines = [ordered]@{
    postgres = @{
        driver = 'postgres'
        url    = 'postgres://postgres:postgres@localhost:55432/orange_rust'
        port   = 18083
    }
    mysql    = @{
        driver = 'mysql'
        url    = 'mysql://root:root@localhost:53306/orange_rust'
        port   = 18084
    }
    mariadb  = @{
        driver = 'mariadb'
        url    = 'mysql://root:root@localhost:53307/orange_rust'
        port   = 18085
    }
    sqlite   = @{
        driver = 'sqlite'
        url    = 'sqlite:D:/User/Cache/Temp/opencode/orange-rust.db'
        port   = 18086
    }
}

function Invoke-Smoke {
    param([string]$Name, [string]$Driver, [string]$DatabaseUrl, [int]$Port)

    $log = Join-Path $env:TEMP "orange-rust-smoke-$Name.log"
    $errLog = Join-Path $env:TEMP "orange-rust-smoke-$Name.err.log"
    Remove-Item $log, $errLog -ErrorAction SilentlyContinue

    $env:DB_DRIVER = $Driver
    $env:DATABASE_URL = $DatabaseUrl
    $env:APP_PORT = "$Port"
    $env:JWT_SECRET = 'smoke-test-secret'
    $env:RUST_LOG = 'info'

    $process = Start-Process -FilePath $exe -WorkingDirectory $root `
        -RedirectStandardOutput $log -RedirectStandardError $errLog `
        -PassThru -NoNewWindow

    $base = "http://127.0.0.1:$Port/api/v1"
    $result = [ordered]@{ engine = $Name; driver = $Driver; start = 'fail' }

    try {
        $ready = $false
        for ($i = 0; $i -lt 60; $i++) {
            Start-Sleep -Milliseconds 500
            if ($process.HasExited) { break }
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient
                $tcp.Connect('127.0.0.1', $Port)
                $tcp.Close()
                $ready = $true
                break
            } catch { }
        }
        if (-not $ready) {
            throw "server did not start: $(Get-Content $errLog -Raw -ErrorAction SilentlyContinue)"
        }
        $result.start = 'pass'

        $login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" `
            -ContentType 'application/json' `
            -Body '{"username":"super","password":"super"}'
        if ($login.code -ne 200) { throw "login code $($login.code): $($login.message)" }
        $token = $login.data.token
        if ([string]::IsNullOrWhiteSpace($token)) { throw 'login returned no token' }
        $result.login = 'pass'
        $headers = @{ Authorization = "Bearer $token" }

        $info = Invoke-RestMethod -Method Get -Uri "$base/auth/user-info" -Headers $headers
        $result.user_info = if ($info.code -eq 200 -and $info.data.username -eq 'super') { 'pass' } else { "fail:$($info.code)" }

        $menus = Invoke-RestMethod -Method Get -Uri "$base/auth/menus" -Headers $headers
        $result.menus = if ($menus.code -eq 200 -and $menus.data.Count -gt 0) { "pass($($menus.data.Count))" } else { "fail:$($menus.code)" }

        $users = Invoke-RestMethod -Method Get -Uri "$base/system/users?page=1&size=10" -Headers $headers
        $result.users = if ($users.code -eq 200 -and $users.data.total -ge 1) { "pass(total=$($users.data.total))" } else { "fail:$($users.code)" }

        $filtered = Invoke-RestMethod -Method Get -Uri "$base/system/users?page=1&size=10&keyword=super" -Headers $headers
        $result.users_keyword = if ($filtered.code -eq 200) { "pass(total=$($filtered.data.total))" } else { "fail:$($filtered.code)" }

        $roles = Invoke-RestMethod -Method Get -Uri "$base/system/roles?page=1&size=10&sort=name" -Headers $headers
        $result.roles_sort_name = if ($roles.code -eq 200 -and $roles.data.total -ge 1) { "pass(total=$($roles.data.total))" } else { "fail:$($roles.code)" }

        $perms = Invoke-RestMethod -Method Get -Uri "$base/system/permissions?size=100" -Headers $headers
        $result.permissions = if ($perms.code -eq 200 -and $perms.data.Count -gt 0) { "pass(count=$($perms.data.Count))" } else { "fail:$($perms.code)" }

        $groups = Invoke-RestMethod -Method Get -Uri "$base/system/groups" -Headers $headers
        $result.groups = if ($groups.code -eq 200 -and $groups.data.Count -gt 0) { "pass(count=$($groups.data.Count))" } else { "fail:$($groups.code)" }

        try {
            $body = '{"id":"0088","name":"smoke-group","parentId":"00"}'
            $created = Invoke-RestMethod -Method Post -Uri "$base/system/groups/children" -Headers $headers -ContentType 'application/json' -Body $body
            $result.group_create = if ($created.code -eq 200 -and $created.data.id -eq '0088') { 'pass' } else { "fail:$($created.code)" }
            $deleted = Invoke-RestMethod -Method Delete -Uri "$base/system/groups/0088" -Headers $headers
            $result.group_delete = if ($deleted.code -eq 200) { 'pass' } else { "fail:$($deleted.code)" }
        } catch {
            $result.group_create = "fail:$($_.Exception.Message)"
        }

        try {
            $userBody = '{"name":"Smoke User","username":"smoketest1","email":"smoke@example.com","groupId":"0001","phone":"13800009999","status":"1","roles":["user"],"permissions":[]}'
            $createdUser = Invoke-RestMethod -Method Post -Uri "$base/system/users" -Headers $headers -ContentType 'application/json' -Body $userBody
            $result.user_create = if ($createdUser.code -eq 200) { 'pass' } else { "fail:$($createdUser.code)" }
            $found = Invoke-RestMethod -Method Get -Uri "$base/system/users?page=1&size=10&keyword=smoketest1" -Headers $headers
            $userId = $found.data.list[0].id
            $deletedUser = Invoke-RestMethod -Method Delete -Uri "$base/system/users/$userId" -Headers $headers
            $result.user_delete = if ($deletedUser.code -eq 200) { 'pass' } else { "fail:$($deletedUser.code)" }
        } catch {
            $result.user_create = "fail:$($_.Exception.Message)"
        }

        try {
            $roleBody = '{"id":"smokerole","name":"Smoke Role","permissions":["0000"]}'
            $createdRole = Invoke-RestMethod -Method Post -Uri "$base/system/roles" -Headers $headers -ContentType 'application/json' -Body $roleBody
            $result.role_create = if ($createdRole.code -eq 200 -and $createdRole.data -eq 'smokerole') { 'pass' } else { "fail:$($createdRole.code)" }
            $deletedRole = Invoke-RestMethod -Method Delete -Uri "$base/system/roles/smokerole" -Headers $headers
            $result.role_delete = if ($deletedRole.code -eq 200) { 'pass' } else { "fail:$($deletedRole.code)" }
        } catch {
            $result.role_create = "fail:$($_.Exception.Message)"
        }

        try {
            $logs = Invoke-RestMethod -Method Get -Uri "$base/system/operation-logs?page=1&size=10&username=super" -Headers $headers
            $result.operation_logs = if ($logs.code -eq 200 -and $logs.data.total -ge 1) { "pass(total=$($logs.data.total))" } else { "fail:$($logs.code)" }
        } catch {
            $result.operation_logs = "fail:$($_.Exception.Message)"
        }
    } catch {
        $result.error = $_.Exception.Message
    } finally {
        if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
    }

    [pscustomobject]$result
}

$selected = if ($Engine -eq 'all') { $engines.Keys } else { @($Engine) }
foreach ($name in $selected) {
    $config = $engines[$name]
    $databaseUrl = if ($Url) { $Url } else { $config.url }
    Invoke-Smoke -Name $name -Driver $config.driver -DatabaseUrl $databaseUrl -Port $config.port |
        Format-List
}
