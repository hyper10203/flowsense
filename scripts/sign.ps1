# FlowSense Code Signing Script
# Creates a self-signed code signing cert, adds to trust stores, and signs the installer.
# Run from PowerShell in the repo root.

$signtool = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.18362.0\x64\signtool.exe"
$certSubject = "CN=FlowSense"
$pfxPath = "$env:TEMP\FlowSense-CS.pfx"
$pfxPassword = "fs2026"
$installer = "apps\desktop\dist\FlowSense Setup 0.1.0.exe"
$exe = "apps\desktop\dist\win-unpacked\FlowSense.exe"

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

    $pwd = ConvertTo-SecureString -String $pfxPassword -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd -NoProperties | Out-Null
    Write-Host "Cert created: $thumbprint"
} else {
    Write-Host "Using existing cert: $($existing.Thumbprint)"
    if (-not (Test-Path $pfxPath)) {
        $pwd = ConvertTo-SecureString -String $pfxPassword -Force -AsPlainText
        Export-PfxCertificate -Cert $existing[0] -FilePath $pfxPath -Password $pwd -NoProperties | Out-Null
    }
}

# 2. Remove interfering UUID certs
Get-ChildItem "Cert:\CurrentUser\My" -ErrorAction SilentlyContinue | Where-Object { $_.Subject -match "^[0-9a-f]{8}-[0-9a-f]{4}" } | ForEach-Object { Remove-Item "Cert:\CurrentUser\My\$($_.Thumbprint)" -Force -ErrorAction SilentlyContinue }

# 3. Sign
foreach ($file in @($exe, $installer)) {
    if (Test-Path $file) {
        Write-Host "Signing: $file"
        & $signtool sign /f $pfxPath /p $pfxPassword /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 $file 2>&1 | Select-String "Successfully"
        & $signtool verify /pa $file 2>&1 | Select-String "Successfully"
    }
}
Write-Host "Done."
