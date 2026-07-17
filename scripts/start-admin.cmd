@echo off
call "%~dp0env-load.cmd"
echo Starting admin on http://localhost:3004 ...
pnpm --filter @data-tw/admin start