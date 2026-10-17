# build-html.ps1 - Tu dong ghep cac file trong thu muc templates thanh index.html
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rootPath = (Get-Item $PSScriptRoot).Parent.FullName
$templatesDir = Join-Path $rootPath "templates"
$outputHtml = Join-Path $rootPath "index.html"

if (-not (Test-Path $templatesDir)) {
    Write-Host "[ERROR] Khong tim thay thu muc templates!" -ForegroundColor Red
    exit 1
}

$templateFiles = Get-ChildItem -Path $templatesDir -Filter "*.html" | Sort-Object Name

if ($templateFiles.Count -eq 0) {
    Write-Host "[ERROR] Khong co file html nao trong thu muc templates!" -ForegroundColor Red
    exit 1
}

Write-Host "Dang ghep cac file template vao index.html..." -ForegroundColor Cyan

$sb = [System.Text.StringBuilder]::new()
foreach ($file in $templateFiles) {
    Write-Host "  -> + $($file.Name)" -ForegroundColor Gray
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    [void]$sb.AppendLine($content)
}

$utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($outputHtml, $sb.ToString().TrimEnd() + "`r`n", $utf8WithoutBom)

Write-Host "[SUCCESS] Da tao xong index.html thanh cong tu $($templateFiles.Count) template!" -ForegroundColor Green
