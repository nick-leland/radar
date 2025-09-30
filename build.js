#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Building ZeroMQ for Electron 11.0.5...');

try {
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });

    console.log('Rebuilding ZeroMQ for Electron...');
    
    // Try multiple approaches to rebuild ZeroMQ
    let rebuildSuccess = false;
    
    // Method 1: Direct electron-rebuild with explicit version
    try {
        execSync('npx electron-rebuild -f -w zeromq --electron-version=11.0.5', { 
            stdio: 'inherit', 
            cwd: __dirname 
        });
        rebuildSuccess = true;
    } catch (error) {
        console.log('Method 1 failed, trying alternative approach...');
        
        // Method 2: Use electron-rebuild with different parameters
        try {
            execSync('npx electron-rebuild --force --module-dir . --electron-version=11.0.5 --which-module=zeromq', { 
                stdio: 'inherit', 
                cwd: __dirname 
            });
            rebuildSuccess = true;
        } catch (error2) {
            console.log('Method 2 failed, trying manual rebuild...');
            
            // Method 3: Manual rebuild using node-gyp
            try {
                execSync('npx node-gyp rebuild --target=11.0.5 --arch=x64 --disturl=https://electronjs.org/headers', { 
                    stdio: 'inherit', 
                    cwd: path.join(__dirname, 'node_modules', 'zeromq')
                });
                rebuildSuccess = true;
            } catch (error3) {
                console.log('Method 3 failed, trying pre-built binaries...');
                
                // Method 4: Try installing pre-built binaries
                try {
                    execSync('npm uninstall zeromq', { stdio: 'inherit', cwd: __dirname });
                    execSync('npm install zeromq@6.0.0-beta.6', { stdio: 'inherit', cwd: __dirname });
                    rebuildSuccess = true;
                } catch (error4) {
                    throw new Error('All rebuild methods failed');
                }
            }
        }
    }

    if (rebuildSuccess) {
        console.log('ZeroMQ rebuild completed successfully!');
        console.log('You can now use the radar mod with ZeroMQ support.');
    }

} catch (error) {
    console.error('Build failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure you have Python 3.x installed');
    console.error('2. Make sure you have a C++ compiler (Visual Studio Build Tools on Windows)');
    console.error('3. Try running: npm install --build-from-source zeromq');
    console.error('4. Check if you have the correct Node.js version');
    process.exit(1);
}
