# setup-firebase-rules.ps1
# Tu dong cai Firebase Rules bang cach lay Access Token tu Google OAuth

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Firebase Rules Setup"

$PROJECT_ID    = "dsurvivalgame-4a736"
$DB_URL        = "https://dsurvivalgame-4a736-default-rtdb.asia-southeast1.firebasedatabase.app"
$CLIENT_ID     = "563584335869-fguslh0rl2stsq0bls7o5a3pnlpjlbpp.apps.googleusercontent.com"
$CLIENT_SECRET = "j9iVZfS7ydnEZEEBjABjOQ7c"
$REDIRECT_URI  = "urn:ietf:wg:oauth:2.0:oob"
$SCOPE_ENC     = [System.Uri]::EscapeDataString("https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform")
$REDIRECT_ENC  = [System.Uri]::EscapeDataString($REDIRECT_URI)

$RULES_JSON = '{
  "rules": {
    ".read": false,
    ".write": false,
    "accounts": {
      "$username": {
        ".read": true,
        ".write": true
      }
    }
  }
}'

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   FIREBASE RULES SETUP - Shadow Survivors" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Buoc 1: Mo trinh duyet de dang nhap Google..." -ForegroundColor Green

$authUrl = "https://accounts.google.com/o/oauth2/auth?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_ENC&response_type=code&scope=$SCOPE_ENC&access_type=offline"

Start-Process $authUrl

Write-Host "Trinh duyet da mo! Hay dang nhap bang tai khoan Google" -ForegroundColor Green
Write-Host "ma ban dung de tao Firebase project: $PROJECT_ID" -ForegroundColor Gray
Write-Host ""
Write-Host "Sau khi dang nhap, Google se hien 1 ma code (Authorization Code)." -ForegroundColor Yellow
Write-Host ""
$authCode = Read-Host "Dan ma code vao day roi nhan Enter"
$authCode = $authCode.Trim()

if (-not $authCode) {
    Write-Host "Ma code trong! Thoat..." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Buoc 2: Doi code lay Access Token..." -ForegroundColor Green

try {
    $body = "code=$([System.Uri]::EscapeDataString($authCode))&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&redirect_uri=$REDIRECT_ENC&grant_type=authorization_code"
    $tokenRes = Invoke-RestMethod -Method POST `
        -Uri "https://oauth2.googleapis.com/token" `
        -Body $body `
        -ContentType "application/x-www-form-urlencoded"

    $accessToken = $tokenRes.access_token
    Write-Host "Lay Access Token thanh cong!" -ForegroundColor Green
} catch {
    Write-Host "Loi khi doi token: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Ma code chi dung duoc 1 lan. Chay lai script va copy ma moi." -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Buoc 3: Ap dung Firebase Rules..." -ForegroundColor Green

try {
    $rulesUrl = "$DB_URL/.settings/rules.json?access_token=$accessToken"
    Invoke-RestMethod -Method PUT `
        -Uri $rulesUrl `
        -Body $RULES_JSON `
        -ContentType "application/json" | Out-Null

    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   THANH CONG! Firebase Rules da duoc cai dat!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Rules hien tai:" -ForegroundColor Cyan
    Write-Host "  /accounts/<username>  -> read: true, write: true" -ForegroundColor Gray
    Write-Host "  Phan con lai          -> read: false, write: false" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Game san sang su dung Firebase!" -ForegroundColor Yellow

} catch {
    Write-Host ""
    Write-Host "Loi khi set Rules: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Cai thu cong tai:" -ForegroundColor Yellow
    Write-Host "https://console.firebase.google.com/u/0/project/$PROJECT_ID/database/$PROJECT_ID-default-rtdb/rules" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Dan doan rules nay vao va bam Publish:" -ForegroundColor Gray
    Write-Host $RULES_JSON -ForegroundColor DarkGray
}
