#!/bin/bash

# Build the React frontend
cd frontend
npm install
npm run build

# Copy the build to the Flask static directory
cd ..
mkdir -p static
cp -r frontend/build/* static/

echo "Build completed successfully!" 