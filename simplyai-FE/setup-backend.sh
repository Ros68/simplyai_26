#!/bin/bash

# Navigate to backend directory
cd backend

# Install dependencies (including multer)
echo "Installing backend dependencies..."
npm install

# Run database migration
echo "Running database migration..."
node migrate.js

echo "Setup complete!"
echo ""
echo "To start the backend server:"
echo "cd backend && npm start"
echo ""
echo "Backend will be available at http://localhost:4000"
echo "Upload endpoint: http://localhost:4000/api/upload/image"
echo "Static files served at: http://localhost:4000/uploads/"
