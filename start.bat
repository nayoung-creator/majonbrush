@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   마전초등학교 양치 챌린지 서버 시작
echo ========================================
echo.

if not exist "config.js" (
    echo [오류] config.js 파일이 없습니다.
    echo config.example.js 를 config.js 로 복사한 뒤 토큰을 입력하세요.
    echo.
    pause
    exit /b 1
)

echo config.js 확인 완료
echo 브라우저에서 http://localhost:8080 을 엽니다...
echo 종료하려면 이 창에서 Ctrl+C 를 누르세요.
echo.

where npx >nul 2>&1
if %errorlevel%==0 (
    start "" http://localhost:8080
    npx -y serve -p 8080
    goto :done
)

where python >nul 2>&1
if %errorlevel%==0 (
    start "" http://localhost:8080
    python -m http.server 8080
    goto :done
)

echo [오류] Node.js 또는 Python 이 필요합니다.
echo Node.js 설치: https://nodejs.org
echo.
pause
exit /b 1

:done
pause
