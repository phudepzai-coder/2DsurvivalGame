@echo off
chcp 65001 >nul
title Đẩy Code Tự Động Lên GitHub — Shadow Survivors
echo ========================================================
echo   🚀 TỰ ĐỘNG CẬP NHẬT CODE LÊN GITHUB
echo ========================================================
echo.

:: 1. Kiểm tra cấu hình Git User
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Chưa cấu hình thông tin Git!
    set /p gitname="phudepzai-code "
    set /p gitemail="phu123234345@gmail.com "
    git config --global user.name "%gitname%"
    git config --global user.email "%gitemail%"
    echo [+] Đã lưu thông tin Git.
    echo.
)

:: 2. Kiểm tra Remote GitHub (origin)
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Dự án chưa được liên kết với Repository GitHub nào!
    echo.
    echo Vui lòng tạo 1 repository mới trên https://github.com/new
    echo rồi dán đường dẫn link repo vào đây.
    echo (Ví dụ: https://github.com/ten-ban/survival-game.git)
    echo.
    set /p repo_url="👉 Dán link GitHub repo của bạn vào đây: "
    if "%repo_url%"=="" (
        echo [x] Link không được để trống! Thoát...
        pause
        exit /b 1
    )
    git remote add origin %repo_url%
    echo [+] Đã liên kết với: %repo_url%
    echo.
)

:: 3. Gom thay đổi
echo [*] Đang kiểm tra các file thay đổi...
git add .

:: 4. Kiểm tra có gì để commit không
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo [i] Không có thay đổi nào mới cần cập nhật!
    echo.
    echo Bạn có muốn thử git push lại không? (Y/N)
    set /p repush=""
    if /i not "%repush%"=="Y" (
        pause
        exit /b 0
    )
) else (
    echo.
    set /p msg="👉 Nhập ghi chú cập nhật (Nhấn Enter để dùng mặc định): "
    if "%msg%"=="" (
        for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set d=%%a-%%b-%%c
        for /f "tokens=1-2 delims=: " %%a in ("%time%") do set t=%%a:%%b
        set msg=Cập nhật game lúc %d% %t%
    )
    echo [*] Đang commit: "%msg%"...
    git commit -m "%msg%"
)

:: 5. Push lên GitHub
echo.
echo [*] Đang đẩy code lên branch main trên GitHub...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   ✅ THÀNH CÔNG! Code đã được cập nhật lên GitHub!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   ❌ CÓ LỖI XẢY RA KHI PUSH!
    echo   Mẹo: Nếu repo trên GitHub đã có file từ trước (như README),
    echo   hãy thử chạy lệnh: git pull origin main --rebase
    echo   rồi chạy lại file này nhé!
    echo ========================================================
)

echo.
pause
