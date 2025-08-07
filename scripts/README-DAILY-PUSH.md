# Daily Git Push Automation

This directory contains scripts to automate daily Git pushes for the Z-Trade project.

## Files

- `daily-git-push.ps1` - PowerShell script for daily Git operations
- `daily-push.bat` - Windows batch file for easy execution
- `README-DAILY-PUSH.md` - This documentation file

## Usage

### Option 1: Using the Batch File (Recommended)
```bash
# Double-click the batch file or run from command line
scripts\daily-push.bat
```

### Option 2: Using PowerShell Directly
```powershell
# Run the PowerShell script directly
powershell -ExecutionPolicy Bypass -File "scripts\daily-git-push.ps1"

# With custom commit message
powershell -ExecutionPolicy Bypass -File "scripts\daily-git-push.ps1" -CommitMessage "Custom message"
```

### Option 3: Manual Git Commands
```bash
git add .
git commit -m "Daily update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Project maintenance and updates"
git push origin master
```

## Features

- ✅ Automatic file detection and staging
- ✅ Timestamped commit messages
- ✅ Error handling and validation
- ✅ Color-coded output for better visibility
- ✅ Checks for Git repository status
- ✅ Validates changes before committing

## Automation Setup

### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to Daily
4. Set action to start program: `scripts\daily-push.bat`
5. Set start in: `C:\Users\galz\OneDrive\Desktop\Project\Trade`

### GitHub Actions (Alternative)
You can also set up GitHub Actions for automated daily commits, but this requires additional configuration.

## Troubleshooting

### Common Issues
1. **Not in Git repository**: Run from project root directory
2. **Permission denied**: Run PowerShell as Administrator
3. **Execution policy**: Use `-ExecutionPolicy Bypass` flag
4. **No changes**: Script will exit gracefully if no changes detected

### Error Messages
- ❌ "Not in a Git repository" - Run from project root
- ❌ "Failed to add files" - Check file permissions
- ❌ "Failed to commit" - Check Git configuration
- ❌ "Failed to push" - Check network and remote access

## Daily Routine

1. **Morning**: Run daily push script
2. **Afternoon**: Check for any new changes
3. **Evening**: Final push if needed

## Commit Message Format

Default format: `Daily update: YYYY-MM-DD HH:MM:SS - Project maintenance and updates`

Custom format: Pass `-CommitMessage "Your custom message"` parameter
