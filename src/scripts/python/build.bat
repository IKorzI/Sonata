@echo off
cd /d "%~dp0"

:: 1. Собираем проект (создаются папки dist и build)
pyinstaller start.py

:: 2. Перемещаем содержимое из dist\start в текущую папку
:: /E - включая подпапки, /Y - без подтверждения перезаписи, /H - скрытые файлы
xcopy "dist\start\*" . /E /H /Y

:: 3. Удаляем ненужные папки и spec-файл
rmdir /S /Q "build"
rmdir /S /Q "dist"
del "start.spec"