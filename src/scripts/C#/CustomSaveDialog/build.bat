@echo off

chcp 65001 > nul

cd /d "%~dp0"

dotnet clean -c Release

dotnet build -c Release
if %errorlevel% neq 0 (
    pause
    exit /b %errorlevel%
)

if not exist "..\..\other" mkdir "..\..\other"

xcopy "bin\Release\net462\CustomSaveDialog.exe" "..\..\other\" /Y /R
xcopy "bin\Release\net462\*.dll" "..\..\other\" /Y /R

rmdir /S /Q "bin"
rmdir /S /Q "obj"