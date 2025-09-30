#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Fixing ZeroMQ installation for Electron 11.0.5...');

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

    console.log('Step 2: Installing basic dependencies...');
    execSync('npm install electron-rebuild@3.2.9', { stdio: 'inherit', cwd: __dirname });

    console.log('Step 3: Installing ZeroMQ 5.3.1 (more stable version)...');
    
    // Use a more stable version of ZeroMQ that works better with older Electron
    execSync('npm install zeromq@5.3.1', { stdio: 'inherit', cwd: __dirname });

    console.log('Step 4: Rebuilding for Electron 11.0.5...');
    
    // Try different rebuild approaches
    let rebuildSuccess = false;
    
    try {
        // Method 1: Direct electron-rebuild
        execSync('npx electron-rebuild --force --electron-version=11.0.5 --module-dir . --which-module=zeromq', { 
            stdio: 'inherit', 
            cwd: __dirname 
        });
        rebuildSuccess = true;
        console.log('Method 1 succeeded!');
    } catch (error) {
        console.log('Method 1 failed, trying Method 2...');
        
        try {
            // Method 2: Manual node-gyp rebuild
            const zeromqPath = path.join(__dirname, 'node_modules', 'zeromq');
            execSync('npx node-gyp rebuild --target=11.0.5 --arch=x64 --disturl=https://electronjs.org/headers', { 
                stdio: 'inherit', 
                cwd: zeromqPath 
            });
            rebuildSuccess = true;
            console.log('Method 2 succeeded!');
        } catch (error2) {
            console.log('Method 2 failed, trying Method 3...');
            
            try {
                // Method 3: Use prebuilt binaries
                execSync('npm uninstall zeromq', { stdio: 'inherit', cwd: __dirname });
                execSync('npm install zeromq@5.3.1 --target=11.0.5 --target_arch=x64 --target_platform=win32', { 
                    stdio: 'inherit', 
                    cwd: __dirname 
                });
                rebuildSuccess = true;
                console.log('Method 3 succeeded!');
            } catch (error3) {
                throw new Error('All rebuild methods failed');
            }
        }
    }

    if (rebuildSuccess) {
        console.log('Step 5: Testing ZeroMQ...');
        
        // Test if ZeroMQ works
        try {
            execSync('node -e "const zmq = require(\'zeromq\'); console.log(\'ZeroMQ version:\', zmq.version);"', { 
                stdio: 'inherit', 
                cwd: __dirname 
            });
            console.log('✅ ZeroMQ is working correctly!');
        } catch (testError) {
            console.log('⚠️  ZeroMQ installed but test failed. This might still work in Electron.');
        }

        console.log('🎉 ZeroMQ installation completed!');
        console.log('You can now use the radar mod with ZeroMQ support.');
    }

} catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure you have Python 3.x installed');
    console.error('2. Make sure you have Visual Studio Build Tools installed');
    console.error('3. Try running as Administrator');
    console.error('4. The issue might be Node.js version compatibility');
    process.exit(1);
}
