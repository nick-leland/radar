# ZeroMQ Installation for TERA Toolbox

This guide will help you install ZeroMQ with proper Electron 11.0.5 compatibility for the radar mod.

## Prerequisites

Before installing, make sure you have:

1. **Python 3.x** (required for native module compilation)
2. **C++ Build Tools**:
   - **Windows**: Visual Studio Build Tools or Visual Studio Community
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Linux**: `build-essential` package

## Recommended Workflow (Matches Current Setup)

1. **Clean any previous install (optional but recommended):**
   ```powershell
   Remove-Item node_modules -Recurse -Force
   Remove-Item package-lock.json -Force
   ```

2. **Pin Zeromq to 6.0.0 in `package.json`:**
   ```json
   "dependencies": {
     "electron-rebuild": "^3.2.9",
     "zeromq": "6.0.0"
   }
   ```

3. **Install dependencies without running package scripts:**
   ```powershell
   npm install --ignore-scripts
   ```

4. **Rebuild Zeromq against Electron 11.0.5 (Toolbox root is 3 levels up):**
   ```powershell
   npx electron-rebuild -f -w zeromq --electron-version=11.0.5 --project-dir "..\..\.."
   ```

   > You can alternatively run `node build.js`, which now issues the same command internally.

5. **Verification:**
   ```powershell
   node -e "const zmq = require('zeromq'); console.log('ZeroMQ version:', zmq.version);"
   ```

6. **Launch TERA Toolbox and confirm the radar mod loads without ZeroMQ errors.**

## Alternative Workflows

### Automated Build Script (after initial setup)
Once Zeromq is pinned to 6.0.0 and the first install has completed, you can rerun:
```powershell
node build.js
```
This script now calls the rebuild command with the correct project directory.

### Manual Installation (if you prefer explicit steps)
```powershell
npm install --ignore-scripts
npx electron-rebuild -f -w zeromq --electron-version=11.0.5 --project-dir "..\..\.."
```

### Force Build from Source (last resort)
```powershell
npm install --ignore-scripts
npm install --build-from-source zeromq@6.0.0 --save-exact
npx electron-rebuild -f -w zeromq --electron-version=11.0.5 --project-dir "..\..\.."
```

## Troubleshooting

### Common Issues

1. **"Python not found"**: Install Python 3.x and ensure it's in your PATH
2. **"MSBuild not found"**: Install Visual Studio Build Tools
3. **`run-p` not recognized**: This goes away when using `npm install --ignore-scripts`
4. **Electron version not detected**: Include `--project-dir "..\..\.."` or run `node build.js`

### Windows Specific
If you get MSBuild errors:
1. Install Visual Studio Build Tools 2019 or later
2. Run: `npm config set msvs_version 2019`
3. Try the installation again

### macOS Specific
```bash
xcode-select --install
```

### Linux Specific
```bash
sudo apt-get update
sudo apt-get install build-essential python3-dev
```

## Success Indicators

- ZeroMQ installation completes without errors
- The radar mod loads without "ZeroMQ failed to load" messages
- TERA Toolbox shows the mod as loaded successfully

## Getting Help

If you continue to have issues:
1. Check the error logs in TERA Toolbox
2. Verify your Python and C++ compiler installations
3. Try the alternative installation methods above
4. Check the [ZeroMQ.js documentation](https://github.com/zeromq/zeromq.js#rebuilding-for-electron) for more details
