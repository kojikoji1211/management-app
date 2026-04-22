@echo off
echo Starting Server...
echo Please do NOT close this window while using the app!
start http://localhost:8000/index.html
python -m http.server 8000
