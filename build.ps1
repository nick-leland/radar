# PowerShell script to build ZeroMQ for Electron 11.0.5
Write-Host "Building ZeroMQ for Electron 11.0.5..." -ForegroundColor Green

try {
    Write-Host "Cleaning previous installation..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
    if (Test-Path "package-lock.json") {
        Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
    }

    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install

    Write-Host "Installing ZeroMQ with Electron configuration..." -ForegroundColor Yellow
    
    # Set environment variables
    $env:npm_config_target = "11.0.5"
    $env:npm_config_arch = "x64"
    $env:npm_config_target_arch = "x64"
    $env:npm_config_disturl = "https://electronjs.org/headers"
    $env:npm_config_runtime = "electron"
    $env:npm_config_build_from_source = "true"

    # Install ZeroMQ
    npm install zeromq@6.0.0 --target=11.0.5 --target_arch=x64 --target_platform=win32

    Write-Host "Testing ZeroMQ..." -ForegroundColor Yellow
    node -e "const zmq = require('zeromq'); console.log('ZeroMQ version:', zmq.version);"

    Write-Host "ZeroMQ build completed successfully!" -ForegroundColor Green
    Write-Host "You can now use the radar mod with ZeroMQ support." -ForegroundColor Green

} catch {
    Write-Host "Build failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure you have Python 3.x installed" -ForegroundColor White
    Write-Host "2. Make sure you have Visual Studio Build Tools installed" -ForegroundColor White
    Write-Host "3. Try running as Administrator" -ForegroundColor White
    Write-Host "4. Check if you have the correct Node.js version" -ForegroundColor White
    exit 1
}
