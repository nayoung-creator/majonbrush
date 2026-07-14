@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   마전초등학교 양치 챌린지 서버 시작
echo ========================================
echo.

if not exist "index.html" (
    echo [오류] index.html 파일이 없습니다.
    echo Git Bash에서 아래 명령을 실행하세요:
    echo   git checkout cursor/brushing-challenge-updates-4539
    echo.
    pause
    exit /b 1
)

if not exist "config.js" (
    echo [오류] config.js 파일이 없습니다.
    echo config.example.js 를 config.js 로 복사한 뒤 토큰을 입력하세요.
    echo.
    pause
    exit /b 1
)

echo [1/2] config.js 확인 완료
echo [2/2] 서버를 시작합니다...
echo.
echo ※ 서버가 켜진 뒤 브라우저가 자동으로 열립니다.
echo ※ 이 검은 창을 닫으면 앱이 종료됩니다.
echo.

REM PowerShell 서버 (Node/Python 불필요)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
if %errorlevel%==0 goto :done

echo.
echo PowerShell 서버 시작 실패. 다른 방법을 시도합니다...
echo.

where npx >nul 2>&1
if %errorlevel%==0 (
    echo Node.js 로 서버 실행 중... 처음이면 1~2분 걸릴 수 있습니다.
    start "" cmd /c "ping -n 8 127.0.0.1 >nul && start http://localhost:8080"
    npx -y http-server . -p 8080 -c-1
    goto :done
)

where python >nul 2>&1
if %errorlevel%==0 (
    echo Python 으로 서버 실행 중...
    start "" cmd /c "ping -n 4 127.0.0.1 >nul && start http://localhost:8080"
    python -m http.server 8080
    goto :done
)

echo [오류] 서버를 시작할 수 없습니다.
echo.
pause
exit /b 1

:done
echo.
echo 서버가 종료되었습니다.
pause
