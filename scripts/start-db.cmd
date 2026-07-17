@echo off
REM Start Postgres 17 (Windows service) and ensure dashboard DB exists.
net start postgresql-x64-17 >NUL 2>&1
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname = ''dashboard''" | findstr /R "1" >NUL
if errorlevel 1 (
  "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE dashboard"
)
echo dashboard DB ready.