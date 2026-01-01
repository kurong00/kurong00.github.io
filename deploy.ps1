# Blog Deployment Script

Write-Host "Starting deployment to GitHub..." -ForegroundColor Cyan

# 1. Get Commit Message
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$defaultMsg = "Site update: $date"
$userMsg = Read-Host "Enter commit message [Press Enter for '$defaultMsg']"

if ([string]::IsNullOrWhiteSpace($userMsg)) {
    $message = $defaultMsg
} else {
    $message = $userMsg
}

# 2. Add changes
Write-Host "`n1. Adding changes..." -ForegroundColor Green
git add .

# 3. Commit
Write-Host "2. Committing changes..." -ForegroundColor Green
git commit -m "$message"

# 4. Push
Write-Host "3. Pushing to master branch..." -ForegroundColor Green
git push origin master

# 5. Result
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Changes pushed to master." -ForegroundColor Cyan
    Write-Host "GitHub Actions will now build and publish your site." -ForegroundColor Cyan
    Write-Host "Check status here: https://github.com/kurong00/kurong00.github.io/actions" -ForegroundColor Yellow
} else {
    Write-Host "`n[ERROR] Something went wrong during push." -ForegroundColor Red
}

Read-Host "Press Enter to exit"
