#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Preparing deployment build...');

// Ensure public directory exists in dist
const distPublicDir = path.resolve(__dirname, 'dist', 'public');
const publicDir = path.resolve(__dirname, 'public');

// Create dist/public if it doesn't exist
if (!fs.existsSync(distPublicDir)) {
  fs.mkdirSync(distPublicDir, { recursive: true });
  console.log('Created dist/public directory');
}

// Copy public assets to dist/public if public directory exists
if (fs.existsSync(publicDir)) {
  const copyRecursive = (src, dest) => {
    if (fs.lstatSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(item => {
        copyRecursive(path.join(src, item), path.join(dest, item));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };

  copyRecursive(publicDir, distPublicDir);
  console.log('Copied public assets to dist/public');
}

// Create a deployment-ready server configuration
const serverConfig = `
// Deployment configuration for Autoscale
const path = require('path');
const express = require('express');

// Serve static files from dist/public
app.use(express.static(path.resolve(__dirname, 'dist', 'public')));

// Ensure images directory is accessible
app.use('/images', express.static(path.resolve(__dirname, 'dist', 'public', 'images')));

console.log('Static file serving configured for deployment');
`;

console.log('Build preparation complete!');
console.log('For Autoscale deployment:');
console.log('1. Build command: npm run build');
console.log('2. Start command: npm start');
console.log('3. Static assets will be served from dist/public');
console.log('4. Dynamic images served via /api/image/:id');