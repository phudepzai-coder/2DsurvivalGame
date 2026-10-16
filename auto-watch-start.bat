@echo off
chcp 65001 >nul
title Khởi động Auto-Sync GitHub
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto-watch-sync.ps1"
pause
