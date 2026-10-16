@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-github.ps1"
pause
