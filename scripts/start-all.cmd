@echo off
call "%~dp0env-load.cmd"
echo Starting all services ...
start "ingestion" cmd /k "call %~dp0start-ingestion.cmd"
start "admin"     cmd /k "call %~dp0start-admin.cmd"
start "dashboard" cmd /k "call %~dp0start-dashboard.cmd"
echo services started in separate windows.