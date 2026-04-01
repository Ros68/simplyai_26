@echo off
echo Starting SimolyAI Servers...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo Starting Frontend Server...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend will be available at: http://localhost:4000
echo Frontend will be available at: http://localhost:8080 (or next available port)
echo.
echo Press any key to exit this window...
pause > nul 