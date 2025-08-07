# Daily Git Push Script for Z-Trade Project
# This script automates daily Git commits and pushes

param(
    [string]$CommitMessage = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Get current date and time
$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Default commit message if none provided
if ([string]::IsNullOrEmpty($CommitMessage)) {
    $CommitMessage = "Daily update: $currentDate - Project maintenance and updates"
}

Write-Host "Starting daily Git push process..." -ForegroundColor Green
Write-Host "Date: $currentDate" -ForegroundColor Cyan
Write-Host "Commit message: $CommitMessage" -ForegroundColor Yellow

try {
    # Check if we're in a Git repository
    $gitStatus = git status 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Not in a Git repository. Please run this script from the project root."
    }

    # Check for changes
    $changes = git status --porcelain
    if ([string]::IsNullOrEmpty($changes)) {
        Write-Host "No changes to commit. Repository is up to date." -ForegroundColor Green
        exit 0
    }

    Write-Host "Changes detected. Adding files..." -ForegroundColor Yellow
    
    # Add all changes
    git add .
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add files to Git"
    }

    Write-Host "Files added successfully" -ForegroundColor Green

    # Commit changes
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }

    Write-Host "Changes committed successfully" -ForegroundColor Green

    # Push to remote
    Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
    git push origin master
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push to remote repository"
    }

    Write-Host "Successfully pushed to remote repository!" -ForegroundColor Green
    Write-Host "Daily Git push completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "Error during daily Git push: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
