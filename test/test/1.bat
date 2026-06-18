@echo off
chcp 65001 > nul

set "BUILDER_PATH=C:\Program Files\ONLYOFFICE\DocumentBuilder\docbuilder.exe"
set "TMP_SCRIPT=D:\test\temp_runner.docbuilder"

:: Запуск утилиты ONLYOFFICE в изолированном процессе
"%BUILDER_PATH%" "%TMP_SCRIPT%"