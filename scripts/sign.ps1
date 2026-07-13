# FlowSense Code Signing Script
# Creates a self-signed code signing cert, adds it to the current user's trust stores,
# and signs the latest generated installer plus the primary unpacked executable.
# Run from PowerShell in the repo root after `npm -w flowsense-desktop run build`.

$ErrorActionPreference = "Stop"

$scriptRoot = $PSScriptRoot
$releaseDir = Join-Path $scriptRoot "..\apps\desktop\release"
$signtoolCommand = Get-Command "signtool.exe" -ErrorAction SilentlyContinue
$signtool = if ($signtoolCommand) { $signtoolCommand.Source } else { $null }

if (-not $signtool) {
    $sdkRoot = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
    if (Test-Path -LiteralPath $sdkRoot) {
        $signtool = Get-ChildItem -LiteralPath $sdkRoot -Directory |
            Sort-Object Name -Descending |
            ForEach-Object {
                $candidate = Join-Path $_.FullName "x64\signtool.exe"
                if (Test-Path -LiteralPath $candidate) {
                    $candidate
                    break
                }
            }
    }
}

if (-not $signtool) {
    throw "signtool.exe was not found. Install the Windows SDK or add signtool.exe to PATH."
}

$certSubject = "CN=FlowSense"
$pfxPath = "$env:TEMP\FlowSense-CS.pfx"

if ([string]::IsNullOrWhiteSpace($env:FLOWSENSE_SIGNING_PFX_PASSWORD)) {
    $securePfxPassword = Read-Host -Prompt "Enter a password for the temporary FlowSense signing certificate" -AsSecureString
} else {
    $securePfxPassword = ConvertTo-SecureString -String $env:FLOWSENSE_SIGNING_PFX_PASSWORD -AsPlainText -Force
}

if ($securePfxPassword.Length -eq 0) {
    throw "A password is required to export the signing certificate."
}

if (-not (Test-Path -LiteralPath $releaseDir)) {
    throw "Release output was not found at '$releaseDir'. Build the desktop app first."
}

$installer = Get-ChildItem -LiteralPath $releaseDir -Filter "FlowSense Setup *.exe" -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
$exe = Get-ChildItem -LiteralPath (Join-Path $releaseDir "win-unpacked") -Filter "FlowSense.exe" -File -ErrorAction SilentlyContinue |
    Select-Object -First 1
$filesToSign = @($exe, $installer) | Where-Object { $null -ne $_ }

if ($filesToSign.Count -eq 0) {
    throw "No FlowSense installer or unpacked executable was found in '$releaseDir'."
}

# 1. Create cert if not exists
$existing = Get-ChildItem "Cert:\CurrentUser\My" -CodeSigningCert -ErrorAction SilentlyContinue | Where-Object { $_.Subject -eq $certSubject -and $_.NotAfter -gt (Get-Date) }
if (-not $existing) {
    Write-Host "Creating code signing certificate..."
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject $certSubject -FriendlyName "FlowSense Code Signing" -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(5)
    $thumbprint = $cert.Thumbprint

    $cerPath = "$env:TEMP\FlowSense-CS.cer"
    Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null
    Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\CurrentUser\TrustedPublisher" | Out-Null
    certutil -addstore -user Root $cerPath | Select-Object -Last 1

    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $securePfxPassword -NoProperties | Out-Null
    Write-Host "Cert created: $thumbprint"
} else {
    Write-Host "Using existing cert: $($existing.Thumbprint)"
    if (-not (Test-Path $pfxPath)) {
        Export-PfxCertificate -Cert $existing[0] -FilePath $pfxPath -Password $securePfxPassword -NoProperties | Out-Null
    }
}

# 2. Remove interfering UUID certs
Get-ChildItem "Cert:\CurrentUser\My" -ErrorAction SilentlyContinue | Where-Object { $_.Subject -match "^[0-9a-f]{8}-[0-9a-f]{4}" } | ForEach-Object { Remove-Item "Cert:\CurrentUser\My\$($_.Thumbprint)" -Force -ErrorAction SilentlyContinue }

# 3. Sign
$pfxPassword = [System.Net.NetworkCredential]::new("", $securePfxPassword).Password
try {
    foreach ($file in $filesToSign) {
        Write-Host "Signing: $($file.FullName)"
        & $signtool sign /f $pfxPath /p $pfxPassword /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 $file.FullName
        if ($LASTEXITCODE -ne 0) {
            throw "Signing failed for '$($file.FullName)' (exit code $LASTEXITCODE)."
        }

        & $signtool verify /pa $file.FullName
        if ($LASTEXITCODE -ne 0) {
            throw "Signature verification failed for '$($file.FullName)' (exit code $LASTEXITCODE)."
        }
    }
} finally {
    $pfxPassword = $null
}
Write-Host "Done."
