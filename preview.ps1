# Blog Local Preview Script

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom

function Try-FixUtf8AsGbk {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $gbk = [System.Text.Encoding]::GetEncoding(936)
    $utf8 = [System.Text.Encoding]::UTF8
    $fixed = $utf8.GetString($gbk.GetBytes($Value))
    if ($fixed.Contains([char]0xFFFD)) { return $Value }
    return $fixed
}

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

function Remove-BlogPost {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Slug
    )

    $repoRoot = $PSScriptRoot
    $postsRoot = Join-Path $repoRoot "source\_posts"

    $postFile = Join-Path $postsRoot ($Slug + ".md")
    if (!(Test-Path $postFile)) {
        $matches = Get-ChildItem -Path $postsRoot -Recurse -File -Filter ($Slug + ".md") -ErrorAction SilentlyContinue
        if ($matches.Count -eq 1) {
            $postFile = $matches[0].FullName
        } else {
            Write-Host "  Post not found: $Slug" -ForegroundColor Red
            if ($matches -and $matches.Count -gt 1) {
                Write-Host "  Multiple matches:" -ForegroundColor Yellow
                $matches | ForEach-Object { Write-Host ("   - " + $_.FullName) -ForegroundColor Yellow }
            }
            Start-Sleep -Seconds 2
            return $false
        }
    }

    $postDir = Split-Path $postFile -Parent
    $assetDir = Join-Path $postDir $Slug

    Write-Host "" 
    Write-Host "  Will delete:" -ForegroundColor Yellow
    Write-Host ("   - " + $postFile) -ForegroundColor Yellow
    if (Test-Path $assetDir) {
        Write-Host ("   - " + $assetDir) -ForegroundColor Yellow
    }
    Write-Host ""
    $confirm = Read-Host "  Type DELETE to confirm"
    if ($confirm -ne "DELETE") {
        Write-Host "  Cancelled." -ForegroundColor DarkGray
        Start-Sleep -Seconds 1
        return $false
    }

    if (Test-Path $postFile) {
        Remove-Item -LiteralPath $postFile -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $assetDir) {
        Remove-Item -LiteralPath $assetDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Host "  Deleted." -ForegroundColor Green
    Start-Sleep -Seconds 1
    return $true
}

function New-BlogPost {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Slug,
        [Parameter(Mandatory = $true)]
        [string]$Title,
        [Parameter(Mandatory = $true)]
        [string]$Tags
    )

    $repoRoot = $PSScriptRoot
    $postsRoot = Join-Path $repoRoot "source\_posts"
    $hexoPath = Join-Path $repoRoot "node_modules\hexo\bin\hexo"

    $targetRelPath = "$Slug.md"
    $postFile = Join-Path $postsRoot ($Slug + ".md")

    $existing = Get-ChildItem -Path $postsRoot -Recurse -File -Filter ($Slug + "*.md") -ErrorAction SilentlyContinue
    if ($existing -and $existing.Count -gt 0) {
        Write-Host "  Post slug already exists (or has duplicates): $Slug" -ForegroundColor Red
        $existing | ForEach-Object { Write-Host ("   - " + $_.FullName) -ForegroundColor Yellow }
        Start-Sleep -Seconds 2
        return $false
    }

    $safeTitle = Try-FixUtf8AsGbk -Value $Title
    $safeTags = Try-FixUtf8AsGbk -Value $Tags

    & node $hexoPath new post $safeTitle --path $targetRelPath --slug $Slug | Out-Host

    if (!(Test-Path $postFile)) {
        Write-Host "  Failed to create post: $postFile" -ForegroundColor Red
        Start-Sleep -Seconds 2
        return $false
    }

    $assetDir = Join-Path $postsRoot $Slug
    if (!(Test-Path $assetDir)) {
        New-Item -ItemType Directory -Path $assetDir -Force | Out-Null
    }

    $raw = Get-Content -LiteralPath $postFile -Raw -ErrorAction SilentlyContinue
    if ([string]::IsNullOrEmpty($raw)) {
        Write-Host "  Failed to read post: $postFile" -ForegroundColor Red
        Start-Sleep -Seconds 2
        return $false
    }

    $lines = $raw -split "`r?`n"
    if ($lines.Length -lt 3 -or $lines[0].Trim() -ne "---") {
        Write-Host "  Unexpected front-matter format: $postFile" -ForegroundColor Red
        Start-Sleep -Seconds 2
        return $false
    }

    $endIndex = -1
    for ($i = 1; $i -lt $lines.Length; $i++) {
        if ($lines[$i].Trim() -eq "---") { $endIndex = $i; break }
    }
    if ($endIndex -lt 0) {
        Write-Host "  Front-matter not closed: $postFile" -ForegroundColor Red
        Start-Sleep -Seconds 2
        return $false
    }

    $fm = New-Object System.Collections.Generic.List[string]
    for ($i = 1; $i -lt $endIndex; $i++) { $fm.Add($lines[$i]) }

    function Upsert-FmLine([System.Collections.Generic.List[string]]$list, [string]$key, [string]$value) {
        $prefix = $key + ":"
        for ($j = 0; $j -lt $list.Count; $j++) {
            if ($list[$j].TrimStart().StartsWith($prefix)) {
                $list[$j] = ($key + ": " + $value)
                return
            }
        }
        $list.Add($key + ": " + $value)
    }

    Upsert-FmLine $fm "catalog" "false"
    Upsert-FmLine $fm "header-img" "title.gif"
    Upsert-FmLine $fm "tags" $safeTags
    Upsert-FmLine $fm "title" $safeTitle

    $outLines = New-Object System.Collections.Generic.List[string]
    $outLines.Add("---")
    $fm | ForEach-Object { $outLines.Add($_) }
    $outLines.Add("---")
    for ($i = $endIndex + 1; $i -lt $lines.Length; $i++) { $outLines.Add($lines[$i]) }

    $newContent = ($outLines -join "`r`n").TrimEnd() + "`r`n"
    Set-Content -LiteralPath $postFile -Value $newContent -Encoding UTF8

    Write-Host "  Created: $postFile" -ForegroundColor Green
    Start-Sleep -Seconds 1
    return $true
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
    Write-Host "  [N] New Post" -ForegroundColor Yellow
    Write-Host "  [D] Delete Post (Delete .md + asset folder)" -ForegroundColor Yellow
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
        'n' {
            $slug = Read-Host "  Post slug (e.g. dairy-xx)"
            if ([string]::IsNullOrWhiteSpace($slug)) {
                Write-Host "  Empty slug." -ForegroundColor Red
                Start-Sleep -Seconds 1
                break
            }
            $title = Read-Host "  Post title"
            if ([string]::IsNullOrWhiteSpace($title)) {
                Write-Host "  Empty title." -ForegroundColor Red
                Start-Sleep -Seconds 1
                break
            }
            $tags = Read-Host "  Tags (default: 大固其其)"
            if ([string]::IsNullOrWhiteSpace($tags)) {
                $tags = "大固其其"
            }

            if ($serverProcess -and !$serverProcess.HasExited) { 
                Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue 
                Start-Sleep -Milliseconds 300
            }

            $created = New-BlogPost -Slug $slug.Trim() -Title $title.Trim() -Tags $tags.Trim()
            if ($created) {
                Write-Host "  Restarting server..." -ForegroundColor Yellow
                if ($serverProcess -and !$serverProcess.HasExited) { 
                    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue 
                }
                $serverProcess = Start-BlogServer
                Write-Host "  Server restarted!" -ForegroundColor Green
                Start-Sleep -Seconds 1
            }
        }
        'd' {
            $slug = Read-Host "  Post slug (e.g. dairy-10)"
            if ([string]::IsNullOrWhiteSpace($slug)) {
                Write-Host "  Empty slug." -ForegroundColor Red
                Start-Sleep -Seconds 1
                break
            }
            if ($serverProcess -and !$serverProcess.HasExited) { 
                Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue 
                Start-Sleep -Milliseconds 300
            }

            $deleted = Remove-BlogPost -Slug $slug.Trim()
            if ($deleted) {
                $hexoPath = Join-Path $PSScriptRoot "node_modules\hexo\bin\hexo"
                & node $hexoPath clean | Out-Host

                Write-Host "  Restarting server..." -ForegroundColor Yellow
                if ($serverProcess -and !$serverProcess.HasExited) { 
                    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue 
                }
                $serverProcess = Start-BlogServer
                Write-Host "  Server restarted!" -ForegroundColor Green
                Start-Sleep -Seconds 1
            }
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
