@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "ADMIN="
if not "%MARIADB_HOME%"=="" (
    set "ADMIN=%MARIADB_HOME%\bin\mariadb-admin.exe"
) else (
    for /d %%i in ("C:\Program Files\MariaDB 12.*") do if exist "%%i\bin\mariadb-admin.exe" set "ADMIN=%%i\bin\mariadb-admin.exe"
    if not defined ADMIN for /d %%i in ("C:\Program Files\MariaDB 11.*") do if exist "%%i\bin\mariadb-admin.exe" set "ADMIN=%%i\bin\mariadb-admin.exe"
    if not defined ADMIN for /d %%i in ("C:\Program Files\MariaDB 10.*") do if exist "%%i\bin\mariadb-admin.exe" set "ADMIN=%%i\bin\mariadb-admin.exe"
    if not defined ADMIN if exist "C:\xampp\mysql\bin\mariadb-admin.exe" set "ADMIN=C:\xampp\mysql\bin\mariadb-admin.exe"
    if not defined ADMIN where mariadb-admin.exe >nul 2>&1 && set "ADMIN=mariadb-admin.exe"
)
if not defined ADMIN (
    echo [MariaDB] ERREUR : MariaDB introuvable.
    pause
    exit /b 1
)

echo [MariaDB] Arret...
"!ADMIN!" -u root shutdown 2>nul
timeout /t 2 /nobreak >nul
echo [MariaDB] Arrete.
