#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('Simple ZeroMQ build for Electron 11.0.5...');

try {
    console.log('Cleaning previous installation...');
    try {
        execSync('npm uninstall zeromq', { stdio: 'inherit', cwd: __dirname });
    } catch (e) {
        // Ignore if not installed
    }

    console.log('Installing ZeroMQ with specific configuration...');
    
    // Set environment variables for the build
    const env = {
        ...process.env,
        npm_config_target: '11.0.5',
        npm_config_arch: 'x64',
        npm_config_target_arch: 'x64',
        npm_config_disturl: 'https://electronjs.org/headers',
        npm_config_runtime: 'electron',
        npm_config_cache: path.join(__dirname, 'node_modules', '.cache'),
        npm_config_build_from_source: 'true'
    };

    // Try installing with specific flags
    execSync('npm install zeromq@6.0.0 --target=11.0.5 --target_arch=x64 --target_platform=win32 --build-from-source', { 
        stdio: 'inherit', 
        cwd: __dirname,
        env: env
    });

    console.log('ZeroMQ installation completed!');
    console.log('Testing ZeroMQ...');
    
    // Test if ZeroMQ works
    execSync('node -e "const zmq = require(\'zeromq\'); console.log(\'ZeroMQ version:\', zmq.version);"', { 
        stdio: 'inherit', 
        cwd: __dirname 
    });

    console.log('ZeroMQ is working correctly!');

} catch (error) {
    console.error('Build failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure you have Python 3.x installed');
    console.error('2. Make sure you have Visual Studio Build Tools installed');
    console.error('3. Try running as Administrator');
    process.exit(1);
}
