
'use strict';

const TeraRadarMod = require('./lib/TeraRadarMod');

/**
 * Tera Radar Mod - Main Entry Point
 * A high-performance modification for Tera Toolbox that provides real-time entity tracking
 * optimized for external Python consumption and aimbot integration.
 * 
 * This is the clean, optimized entry point that uses the new modular architecture.
 * All legacy code has been migrated to the appropriate classes.
 */
module.exports = function TeraRadarModMain(mod) {
    mod.log('[TeraRadarMod] Module entry point called');
    
    try {
        mod.log('[TeraRadarMod] Creating TeraRadarMod instance...');
        
        // Create and initialize the main mod instance first
        const radarMod = new TeraRadarMod(mod);
        
        mod.log('[TeraRadarMod] TeraRadarMod instance created successfully');

        // Add debug logging for command registration
        mod.log('[TeraRadarMod] Attempting to register commands...');

        // Commands will be registered after entering game in TeraRadarMod.onEnterGame()
        mod.log('[TeraRadarMod] Initialization complete, commands will be registered after entering game');

        // Store reference for cleanup
        mod._radarModInstance = radarMod;

        // Handle mod unload/reload gracefully
        const cleanup = () => {
            if (mod._radarModInstance) {
                try {
                    mod._radarModInstance.cleanup();
                    mod._radarModInstance = null;
                } catch (error) {
                    mod.error(`[TeraRadarMod] Cleanup error: ${error.message}`);
                }
            }
        };

        // Register cleanup handlers
        process.on('exit', cleanup);
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        // Handle mod-specific cleanup
        if (mod.destructor) {
            mod.destructor(cleanup);
        }

        mod.log('[TeraRadarMod] Successfully initialized with optimized architecture');

    } catch (error) {
        mod.error(`[TeraRadarMod] Initialization failed: ${error.message}`);
        mod.error(`[TeraRadarMod] Stack trace: ${error.stack}`);
    }
};