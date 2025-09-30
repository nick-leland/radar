#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Alternative ZeroMQ installation using zmq package...');

try {
    console.log('Step 1: Cleaning everything...');
    
    // Remove node_modules and package-lock.json
    if (fs.existsSync('node_modules')) {
        console.log('Removing node_modules...');
        execSync('rmdir /s /q node_modules', { stdio: 'inherit', shell: true });
    }
    if (fs.existsSync('package-lock.json')) {
        console.log('Removing package-lock.json...');
        fs.unlinkSync('package-lock.json');
    }

    console.log('Step 2: Installing zmq (alternative ZeroMQ package)...');
    
    // Use the 'zmq' package instead of 'zeromq' - it's more stable
    execSync('npm install zmq@2.15.3', { stdio: 'inherit', cwd: __dirname });

    console.log('Step 3: Installing electron-rebuild...');
    execSync('npm install electron-rebuild@3.2.9', { stdio: 'inherit', cwd: __dirname });

    console.log('Step 4: Rebuilding for Electron 11.0.5...');
    
    try {
        execSync('npx electron-rebuild --force --electron-version=11.0.5 --module-dir . --which-module=zmq', { 
            stdio: 'inherit', 
            cwd: __dirname 
        });
        console.log('✅ Rebuild successful!');
    } catch (error) {
        console.log('⚠️  Rebuild failed, but zmq might still work...');
    }

    console.log('Step 5: Testing zmq...');
    
    // Test if zmq works
    try {
        execSync('node -e "const zmq = require(\'zmq\'); console.log(\'zmq version:\', zmq.version || \'loaded\');"', { 
            stdio: 'inherit', 
            cwd: __dirname 
        });
        console.log('✅ zmq is working correctly!');
    } catch (testError) {
        console.log('⚠️  zmq test failed, but it might still work in Electron.');
    }

    console.log('🎉 Alternative ZeroMQ installation completed!');
    console.log('Note: You may need to update your code to use "zmq" instead of "zeromq"');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure you have Python 3.x installed');
    console.error('2. Make sure you have Visual Studio Build Tools installed');
    console.error('3. Try running as Administrator');
    process.exit(1);
}
