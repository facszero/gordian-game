param(
    [Parameter(Mandatory=$true)][string]$Godot,
    [switch]$ExportAndroid
)
$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskEngine = (Get-Command $Godot -ErrorAction Stop).Source
Push-Location $taskRoot
try {
    & node android-godot/tools/export-reference.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Reference export failed' }
    & $taskEngine --headless --path android-godot --script tools/prepare_assets.gd
    if ($LASTEXITCODE -ne 0) { throw 'Asset preparation failed' }
    & $taskEngine --headless --path android-godot --editor --import
    if ($LASTEXITCODE -ne 0) { throw 'Godot import failed' }
    foreach ($taskTest in @('tests/test_level1.gd','tests/test_runtime.gd','tests/test_platform_assets.gd','tests/test_enemy_audio.gd')) {
        & $taskEngine --headless --path android-godot --script $taskTest
        if ($LASTEXITCODE -ne 0) { throw "Failed: $taskTest" }
    }
    if ($ExportAndroid) {
        New-Item -ItemType Directory -Force android-godot/build | Out-Null
        & $taskEngine --headless --path android-godot --export-debug 'Android Debug' build/gordian-level1-debug.apk
        if ($LASTEXITCODE -ne 0) { throw 'Android export failed' }
    }
} finally { Pop-Location }
