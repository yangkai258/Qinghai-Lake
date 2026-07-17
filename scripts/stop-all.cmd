@echo off
if not exist "%~dp0..\pids" (
  echo nothing to stop.
  exit /b 0
)
for %%f in ("%~dp0..\pids\*") do (
  echo stopping PID %%~nf ...
  taskkill /F /PID %%~nf >NUL 2>&1
)
del /Q "%~dp0..\pids" >NUL 2>&1
echo all stopped.