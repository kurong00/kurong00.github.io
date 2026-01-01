# Blog Local Preview Script

function Start-BlogServer {
    # 1. 清理端口
    $port = 4000
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) { 
        # Write-Host "Cleaning port 4000..." -ForegroundColor DarkGray
        Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue 
    }

    # 2. 启动服务器（新窗口）
    # 使用 Start-Process 打开一个新的 PowerShell 窗口运行 hexo
    $hexoPath = "node_modules/hexo/bin/hexo"
    $p = Start-Process node -ArgumentList "$hexoPath", "server" -PassThru
    return $p
}

# 初始启动
Clear-Host
Write-Host "Starting Preview Server..." -ForegroundColor Cyan
$serverProcess = Start-BlogServer

# 自动打开浏览器
Start-Sleep -Seconds 3
Start-Process "http://localhost:4000"

# 交互循环
while ($true) {
    Clear-Host
    Write-Host "==========================================" -ForegroundColor Magenta
    Write-Host "       Hexo Blog Preview Controller       " -ForegroundColor Magenta
    Write-Host "==========================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  Server is running in a SEPARATE window." -ForegroundColor Green
    Write-Host "  (Do not close that window manually)"
    Write-Host ""
    Write-Host "  [R] Restart Server (Use this after config changes)" -ForegroundColor Yellow
    Write-Host "  [O] Open Browser (http://localhost:4000)" -ForegroundColor Cyan
    Write-Host "  [Q] Quit / Stop Server" -ForegroundColor Red
    Write-Host ""
    
    $input = Read-Host "  Choose option"
    
    switch ($input.ToLower()) {
        'r' { 
            Write-Host "  Restarting server..." -ForegroundColor Yellow
            if ($serverProcess -and !$serverProcess.HasExited) { 
                Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue 
            }
            $serverProcess = Start-BlogServer
            Write-Host "  Server restarted!" -ForegroundColor Green
            Start-Sleep -Seconds 1
        }
        'o' { 
            Start-Process "http://localhost:4000" 
        }
        'q' { 
            Write-Host "  Stopping server and exiting..." -ForegroundColor Yellow
            if ($serverProcess -and !$serverProcess.HasExited) { 
                Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue 
            }
            exit
        }
    }
}
