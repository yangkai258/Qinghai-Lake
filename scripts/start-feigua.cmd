@echo off
call "%~dp0env-load.cmd"
echo Starting feigua worker ...
pnpm --filter @data-tw/feigua-worker start