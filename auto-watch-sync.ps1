# auto-watch-sync.ps1 — Tự động theo dõi thay đổi file và push lên GitHub
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Auto-Sync GitHub: Shadow Survivors"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   👀 CHẾ ĐỘ TỰ ĐỘNG THEO DÕI & ĐẨY CODE LÊN GITHUB" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Chương trình đang lắng nghe thay đổi trong thư mục game..." -ForegroundColor Green
Write-Host "Mỗi khi bạn sửa/lưu file, hệ thống sẽ tự động commit & push!" -ForegroundColor Gray
Write-Host "(Nhấn Ctrl+C để dừng bất cứ lúc nào)`n" -ForegroundColor DarkGray

$path = $PSScriptRoot
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Lọc bỏ các thư mục ẩn như .git
$filterRegex = '\\\.git\\'

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
        
        # Kiểm tra xem có file thay đổi trong git không
        $status = git status --porcelain
        if ($status) {
            $timeStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            Write-Host "`n⚡ Phát hiện thay đổi! Đang tự động đồng bộ lên GitHub ($timeStr)..." -ForegroundColor Yellow
            
            git add .
            git commit -m "Tự động đồng bộ: $timeStr" | Out-Null
            $pushOut = git push origin main 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Đã đẩy thành công lên GitHub lúc $timeStr!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Có lỗi khi push: $pushOut" -ForegroundColor Red
            }
        }
    }
}
