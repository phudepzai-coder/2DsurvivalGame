# setup-firebase-rules.ps1
# Tự động cài Firebase Rules bằng cách lấy Access Token từ Google OAuth

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Firebase Rules Setup"

$PROJECT_ID   = "dsurvivalgame-4a736"
$DB_URL       = "https://dsurvivalgame-4a736-default-rtdb.asia-southeast1.firebasedatabase.app"
# Firebase CLI Client ID (public, dùng để đăng nhập Google OAuth)
$CLIENT_ID     = "563584335869-fguslh0rl2stsq0bls7o5a3pnlpjlbpp.apps.googleusercontent.com"
$CLIENT_SECRET = "j9iVZfS7ydnEZEEBjABjOQ7c"
$REDIRECT_URI  = "urn:ietf:wg:oauth:2.0:oob"
$SCOPES        = "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform"

$RULES_JSON = @'
{
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
}
'@

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   🔥 CÀI ĐẶT FIREBASE RULES TỰ ĐỘNG" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Bước 1: Mở trình duyệt để đăng nhập tài khoản Google..." -ForegroundColor Green
Write-Host ""

$authUrl = "https://accounts.google.com/o/oauth2/auth" +
    "?client_id=$CLIENT_ID" +
    "&redirect_uri=$([System.Uri]::EscapeDataString($REDIRECT_URI))" +
    "&response_type=code" +
    "&scope=$([System.Uri]::EscapeDataString($SCOPES))" +
    "&access_type=offline"

Start-Process $authUrl
Write-Host "✅ Trình duyệt đã mở! Hãy đăng nhập bằng tài khoản Google" -ForegroundColor Green
Write-Host "   mà bạn dùng để tạo Firebase project ($PROJECT_ID)." -ForegroundColor Gray
Write-Host ""
Write-Host "Sau khi đăng nhập, Google sẽ hiện 1 mã code (Authorization Code)." -ForegroundColor Yellow
Write-Host ""
$authCode = Read-Host "👉 Dán mã code vào đây rồi nhấn Enter"
$authCode = $authCode.Trim()

if (-not $authCode) {
    Write-Host "❌ Mã code trống! Thoát..." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Bước 2: Đổi code lấy Access Token..." -ForegroundColor Green

try {
    $tokenRes = Invoke-RestMethod -Method POST `
        -Uri "https://oauth2.googleapis.com/token" `
        -Body @{
            code          = $authCode
            client_id     = $CLIENT_ID
            client_secret = $CLIENT_SECRET
            redirect_uri  = $REDIRECT_URI
            grant_type    = "authorization_code"
        } `
        -ContentType "application/x-www-form-urlencoded"

    $accessToken = $tokenRes.access_token
    Write-Host "✅ Lấy Access Token thành công!" -ForegroundColor Green
} catch {
    Write-Host "❌ Lỗi khi đổi token: $_" -ForegroundColor Red
    Write-Host "   Mã code có thể đã hết hạn (chỉ dùng được 1 lần)." -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Bước 3: Áp dụng Firebase Rules..." -ForegroundColor Green

try {
    $rulesUrl = "$DB_URL/.settings/rules.json?access_token=$accessToken"
    $result = Invoke-RestMethod -Method PUT `
        -Uri $rulesUrl `
        -Body $RULES_JSON `
        -ContentType "application/json"

    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   ✅ THÀNH CÔNG! Firebase Rules đã được cài đặt!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Rules đang hoạt động:" -ForegroundColor Cyan
    Write-Host "  /accounts/<username>  →  read: true, write: true" -ForegroundColor Gray
    Write-Host "  Phần còn lại          →  read: false, write: false" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎮 Game của bạn giờ đã sẵn sàng nhận/lưu tài khoản Firebase!" -ForegroundColor Yellow

} catch {
    $errMsg = $_.Exception.Message
    Write-Host ""
    Write-Host "❌ Lỗi khi set Rules: $errMsg" -ForegroundColor Red
    Write-Host ""
    Write-Host "👉 Thử cài Rules thủ công tại:" -ForegroundColor Yellow
    Write-Host "   https://console.firebase.google.com/u/0/project/$PROJECT_ID/database/$PROJECT_ID-default-rtdb/rules" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Dán đoạn này vào và bấm Publish:" -ForegroundColor Gray
    Write-Host $RULES_JSON -ForegroundColor DarkGray
}
