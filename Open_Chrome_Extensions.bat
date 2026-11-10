@echo off
echo ========================================================
echo   Opening Chrome Extensions and Extension Folder...
echo ========================================================
echo.
echo 1. Turn on "Developer mode" in the top-right corner.
echo 2. Click "Load unpacked" in the top-left corner.
echo 3. Select this folder!
echo.

start chrome "chrome://extensions"
explorer "%~dp0"

exit
