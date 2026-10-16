# auto-watch-sync.ps1 - Tu dong theo doi thay doi file va push len GitHub
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   CHE DO TU DONG THEO DOI VA DAY CODE LEN GITHUB" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Chuong trinh dang lang nghe thay doi trong thu muc game..." -ForegroundColor Green
Write-Host "Moi khi ban sua/luu file, he thong se tu dong commit va push!" -ForegroundColor Gray
Write-Host "(Nhan Ctrl+C de dung bat cu luc nao)`n" -ForegroundColor DarkGray

$path = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $path
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$script:lastChange = [DateTime]::MinValue
$script:pendingSync = $false

$action = {
    param($source, $e)
    if ($e.FullPath -match '\\\.git\\') { return }
    $script:lastChange = [DateTime]::Now
    $script:pendingSync = $true
}

Register-ObjectEvent $watcher 'Changed' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Created' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Deleted' -Action $action | Out-Null
Register-ObjectEvent $watcher 'Renamed' -Action $action | Out-Null

while ($true) {
    Start-Sleep -Seconds 2
    if ($script:pendingSync -and ([DateTime]::Now - $script:lastChange).TotalSeconds -ge 8) {
        $script:pendingSync = $false
        
        $status = git status --porcelain
        if ($status) {
            $timeStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            Write-Host "`n[*] Phat hien thay doi! Dang tu dong dong bo len GitHub ($timeStr)..." -ForegroundColor Yellow
            
            git add .
            git commit -m "Tu dong dong bo: $timeStr" | Out-Null
            $pushOut = git push origin main 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Da day thanh cong len GitHub luc $timeStr!" -ForegroundColor Green
            } else {
                Write-Host "[ERROR] Co loi khi push: $pushOut" -ForegroundColor Red
            }
        }
    }
}
