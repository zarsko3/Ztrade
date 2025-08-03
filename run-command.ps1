param(
    [Parameter(Mandatory=$true)]
    [string]$Command
)

# Function to execute command with timeout
function Execute-CommandWithTimeout {
    param (
        [string]$Command,
        [int]$TimeoutSeconds = 5
    )
    
    Write-Host "Attempting to run command: $Command" -ForegroundColor Cyan
    
    try {
        # Start a job to run the command
        $job = Start-Job -ScriptBlock { 
            param($cmd)
            Invoke-Expression $cmd
        } -ArgumentList $Command
        
        # Wait for the job to complete with timeout
        $completed = Wait-Job -Job $job -Timeout $TimeoutSeconds
        
        if ($completed) {
            Write-Host "Command completed successfully" -ForegroundColor Green
            Receive-Job -Job $job
        } else {
            Write-Host "Command timed out, trying alternative method..." -ForegroundColor Yellow
            Remove-Job -Job $job -Force
            
            # Alternative method: Use Start-Process
            if ($Command -match "^cd ") {
                # Handle cd commands differently
                $path = $Command -replace "^cd ", ""
                Set-Location $path
                Write-Host "Changed directory to: $path" -ForegroundColor Green
            } else {
                # For other commands use cmd.exe
                $result = cmd.exe /c $Command
                Write-Host $result
            }
        }
    } catch {
        Write-Host "Error executing command: $_" -ForegroundColor Red
    }
}

# Execute the command with timeout
Execute-CommandWithTimeout -Command $Command 