<#
.SYNOPSIS
    Downloads the official Windows embeddable Python and extracts it to vendor/python/.
    Run once before building the desktop app so the runtime is bundled for end users.
#>

$ErrorActionPreference = "Stop"
$pythonVersion = "3.14.0"
$arch = "amd64"
$url = "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-embed-$arch.zip"
$vendorRoot = Join-Path $PSScriptRoot "..\vendor"
$vendorDir = Join-Path $vendorRoot "python"
$zipPath = Join-Path $vendorRoot "python-embed.zip"

if (Test-Path $vendorDir) {
    Write-Host "vendor/python already exists. Delete it to re-download."
    exit 0
}

New-Item -ItemType Directory -Force -Path $vendorRoot | Out-Null
Write-Host "Downloading embeddable Python $pythonVersion ($arch)..."
Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $vendorDir -Force
Remove-Item $zipPath -Force

$pythonExe = Join-Path $vendorDir "python.exe"
$stdlibZip = Get-ChildItem -Path $vendorDir -Filter "python3*.zip" | Select-Object -First 1
if ($stdlibZip) {
    Write-Host "Unpacking stdlib from $($stdlibZip.Name)..."
    Expand-Archive -Path $stdlibZip.FullName -DestinationPath $vendorDir -Force
    $marker = Join-Path $vendorDir "python314._pth"
    if (Test-Path $marker) {
        Set-Content -Path $marker -Value "python314.zip`nLib`n.`nimport site" -Encoding ASCII
    }
}

Write-Host "Bootstrapping pip..."
& $pythonExe -m ensurepip --upgrade 2>&1 | Write-Host

Write-Host "Installing backend dependencies from apps/backend/pyproject.toml..."
$backendDir = Join-Path $PSScriptRoot "..\apps\backend"
& $pythonExe -m pip install -e $backendDir 2>&1 | Write-Host

Write-Host "Done. Bundled Python is at: $vendorDir"
