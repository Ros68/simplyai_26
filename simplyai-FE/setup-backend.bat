@echo off
echo Setting up backend for image upload functionality...
echo.

cd backend

echo Installing backend dependencies...
call npm install

echo.
echo Running database migration...
node migrate.js

echo.
echo Setup complete!
echo.
echo To start the backend server:
echo cd backend && npm start
echo.
echo Backend will be available at http://localhost:4000
echo Upload endpoint: http://localhost:4000/api/upload/image
echo Static files served at: http://localhost:4000/uploads/

pause
