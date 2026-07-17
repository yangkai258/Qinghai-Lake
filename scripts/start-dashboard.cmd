@echo off
call "%~dp0..\scripts\env-load.cmd"
echo Starting dashboard on http://localhost:3003 ...
pnpm --filter @data-tw/dashboard start