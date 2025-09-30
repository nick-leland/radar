#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Building ZeroMQ for Electron 11.0.5...');

try {
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });

    console.log('Rebuilding ZeroMQ for Electron...');
    execSync('npx electron-rebuild -f -w zeromq --electron-version=11.0.5', { 
        stdio: 'inherit', 
        cwd: __dirname 
    });

    console.log('ZeroMQ rebuild completed successfully!');
    console.log('You can now use the radar mod with ZeroMQ support.');

} catch (error) {
    console.error('Build failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure you have Python 3.x installed');
    console.error('2. Make sure you have a C++ compiler (Visual Studio Build Tools on Windows)');
    console.error('3. Try running: npm install --build-from-source zeromq');
    process.exit(1);
}
