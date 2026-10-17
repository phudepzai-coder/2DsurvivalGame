# sync-github.ps1 - Tu dong commit va push len GitHub
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   DANG CAP NHAT CODE LEN GITHUB..." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $rootPath

# 0. Tu dong ghep cac template HTML vao index.html neu co thu muc templates
$buildScript = Join-Path $PSScriptRoot "build-html.ps1"
if (Test-Path $buildScript) {
    & $buildScript
    Write-Host ""
}

# 1. Add tat ca file thay doi
git add .

# 2. Kiem tra xem co file thay doi khong
$status = git status --porcelain
if (-not $status) {
    Write-Host "[INFO] Khong co file nao thay doi can luu them." -ForegroundColor Cyan
    Write-Host "Dang kiem tra dong bo len GitHub..." -ForegroundColor Gray
} else {
    $timeStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "[*] Dang tao ban commit luc $timeStr..." -ForegroundColor Yellow
    git commit -m "Cap nhat game: $timeStr"
}

# 3. Push len GitHub
Write-Host ""
Write-Host "[*] Dang day code len GitHub (branch main)..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   THANH CONG! Code da duoc cap nhat len GitHub!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Red
    Write-Host "   CO LOI XAY RA KHI PUSH LEN GITHUB!" -ForegroundColor Red
    Write-Host "========================================================" -ForegroundColor Red
}
Write-Host ""
