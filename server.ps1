# 마전초등학교 양치 챌린지 - Windows 로컬 서버
# Node.js / Python 없이 PowerShell 만으로 실행

$Port = 8080
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.ico'  = 'image/x-icon'
    '.svg'  = 'image/svg+xml'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
} catch {
    Write-Host ""
    Write-Host "[오류] 서버를 시작할 수 없습니다."
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "다른 프로그램이 8080 포트를 쓰고 있을 수 있습니다."
    Write-Host "이 창을 닫고 다시 시도해 주세요."
    Write-Host ""
    Read-Host "Enter 키를 누르면 종료"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "  서버 실행 중!"
Write-Host "  주소: http://localhost:$Port"
Write-Host "  종료: Ctrl + C"
Write-Host "========================================"
Write-Host ""

Start-Sleep -Seconds 1
Start-Process "http://localhost:$Port/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq '/') { $path = '/index.html' }

        $relative = $path.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
        $filePath = Join-Path $Root $relative

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mime[$ext]
            if (-not $contentType) { $contentType = 'application/octet-stream' }

            $bytes = [IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [Text.Encoding]::UTF8.GetBytes("404 - 파일을 찾을 수 없습니다: $path")
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }

        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
