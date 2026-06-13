@echo off
cd /d "%~dp0"

pyinstaller start.py

xcopy "dist\start\*" . /E /H /Y

rmdir /S /Q "build"
rmdir /S /Q "dist"
del "start.spec"