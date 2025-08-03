@echo off
REM This batch file runs commands with a timeout fallback using PowerShell
REM Usage: run-with-timeout.bat your command here

pwsh -File run-command.ps1 -Command "%*" 