# Script to rename blueprint files to match task naming convention

# Mapping of current files to desired format
$fileMapping = @{
    "blueprint-Task 1.2.2.md" = "blueprint-task-1.2.2.md"
    "blueprint-Task 1.2.3.md" = "blueprint-task-1.2.3.md"
    "blueprint-Task 1.3.2.md" = "blueprint-task-1.3.2.md"
    # The following files already follow the convention
    # "blueprint-task-1.1.1.md" = "blueprint-task-1.1.1.md"
    # "blueprint-task-1.2.1.md" = "blueprint-task-1.2.1.md"
    # "blueprint-task-1.3.1.md" = "blueprint-task-1.3.1.md"
}

# Rename each file
foreach ($file in $fileMapping.Keys) {
    $newName = $fileMapping[$file]
    if (Test-Path $file) {
        Write-Host "Renaming '$file' to '$newName'..." -ForegroundColor Cyan
        Rename-Item -Path $file -NewName $newName -Force
        if ($?) {
            Write-Host "Successfully renamed to '$newName'" -ForegroundColor Green
        } else {
            Write-Host "Failed to rename '$file'" -ForegroundColor Red
        }
    } else {
        Write-Host "File '$file' not found" -ForegroundColor Yellow
    }
}

Write-Host "Blueprint files renaming completed" -ForegroundColor Green 