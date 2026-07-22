@echo off
chcp 65001 >nul
title 마전초등학교 양치 챌린지 서버
cd /d "%~dp0"

echo.
echo ========================================
echo   마전초등학교 양치 챌린지
echo ========================================
echo.
echo 현재 폴더:
echo %CD%
echo.

if not exist "%~dp0index.html" (
    echo [오류] index.html 파일이 이 폴더에 없습니다.
    echo.
    echo 이 폴더의 파일 목록:
    dir /b
    echo.
    echo index 파일이 보이면: 탐색기 - 보기 - 파일 이름 확장명 을 켜서
    echo index.html 인지 확인하세요.
    echo.
    pause
    exit /b 1
)

if not exist "%~dp0config.js" (
    echo [오류] config.js 파일이 없습니다.
    echo config.example.js 를 복사해 config.js 를 만든 뒤 토큰을 넣으세요.
    echo.
    pause
    exit /b 1
)

echo [확인] index.html, config.js OK
echo.
echo 서버를 시작합니다. 이 창을 닫지 마세요.
echo 브라우저 주소: http://localhost:8080
echo.

"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
set PS_ERR=%errorlevel%

if %PS_ERR% NEQ 0 (
    echo.
    echo PowerShell 서버가 실패했습니다. 다른 방법을 시도합니다...
    echo.

    where python >nul 2>&1
    if %errorlevel%==0 (
        start "" cmd /c "ping -n 4 127.0.0.1 >nul && start http://localhost:8080/"
        python -m http.server 8080
        goto :end
    )

    where npx >nul 2>&1
    if %errorlevel%==0 (
        start "" cmd /c "ping -n 8 127.0.0.1 >nul && start http://localhost:8080/"
        npx -y http-server . -p 8080 -c-1
        goto :end
    )

    echo [오류] 서버를 시작할 수 없습니다.
    echo server.ps1 오류 코드: %PS_ERR%
    echo.
)

:end
echo.
echo 서버가 종료되었습니다.
pause
