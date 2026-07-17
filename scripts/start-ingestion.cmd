@echo off
call "%~dp0..\scripts\env-load.cmd"
echo Starting ingestion runner ...
pnpm --filter @data-tw/ingestion start