@echo off
chcp 65001 >nul
title Cài đặt Firebase Rules — Shadow Survivors
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-firebase-rules.ps1"
pause
