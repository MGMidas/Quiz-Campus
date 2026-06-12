@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo [MariaDB] Recherche de MariaDB...

set "MYSQLD="
if not "%MARIADB_HOME%"=="" (
    set "MYSQLD=%MARIADB_HOME%\bin\mariadbd.exe"
) else (
    for /d %%i in ("C:\Program Files\MariaDB 12.*") do if exist "%%i\bin\mariadbd.exe" set "MYSQLD=%%i\bin\mariadbd.exe"
    if not defined MYSQLD for /d %%i in ("C:\Program Files\MariaDB 11.*") do if exist "%%i\bin\mariadbd.exe" set "MYSQLD=%%i\bin\mariadbd.exe"
    if not defined MYSQLD for /d %%i in ("C:\Program Files\MariaDB 10.*") do if exist "%%i\bin\mariadbd.exe" set "MYSQLD=%%i\bin\mariadbd.exe"
    if not defined MYSQLD if exist "C:\xampp\mysql\bin\mariadbd.exe" set "MYSQLD=C:\xampp\mysql\bin\mariadbd.exe"
    if not defined MYSQLD where mariadbd.exe >nul 2>&1 && set "MYSQLD=mariadbd.exe"
)
if not defined MYSQLD (
    echo [MariaDB] ERREUR : MariaDB introuvable.
    echo.
    echo Definis MARIADB_HOME ou installe MariaDB :
    echo   - https://mariadb.org/download/
    echo.
    echo Exemple : set MARIADB_HOME=C:\Program Files\MariaDB 12.2
    pause
    exit /b 1
)

set "ROOT=%~dp0..\.."
set "DATADIR=%ROOT%\server\data\mariadb\data"

if not exist "%DATADIR%" mkdir "%DATADIR%"

if not exist "%DATADIR%\ibdata1" (
    echo [MariaDB] Initialisation de l'instance locale...
    "!MYSQLD!" --initialize-insecure --datadir="%DATADIR%"
    if !errorlevel! neq 0 (
        echo [MariaDB] ERREUR lors de l'initialisation.
        pause
        exit /b 1
    )
)

echo [MariaDB] Demarrage de l'instance locale...
start /B /MIN "" "!MYSQLD!" --datadir="%DATADIR%" --port=3306 --skip-grant-tables --skip-networking=0
timeout /t 4 /nobreak >nul
echo [MariaDB] Pret sur port 3306
