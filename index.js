'use strict'

module.exports = function PlayerPositionLogger(mod) {
    // Initialize the game object to access player data
    mod.game.initialize(['me']);

    let positionInterval = null;
    let lastAimData = null;
    let lastLookDirection = null;
    
    // Cache the latest position data
    let lastPosition = null;
    let lastFacingDirection = null;
    let lastDestination = null;

    // Game State Variables
    let player = null;
    let zone = null;
    let player_level = null;
    
    // Set to track circular references
    const seen = new Set();

    const fs = require('fs');
    const path = require('path');
    
    // Ensure the raw_logs directory exists
    const rawLogsDir = path.join(__dirname, 'raw_logs');
    if (!fs.existsSync(rawLogsDir)) {
        fs.mkdirSync(rawLogsDir, { recursive: true });
    }
    
    // TODO: This should be a dynamic file name based on the current date and time
    // NDJSON format
    const outPath = path.join(rawLogsDir, 'log.ndjson');

    // Start logging when entering game
    mod.game.on('enter_game', () => {
        startPositionLogging();
    });

    // Stop logging when leaving game
    mod.game.on('leave_game', () => {
        stopPositionLogging();
    });

    // Safe JSON stringify (handles BigInt and Buffer)
    function safeStringify(obj) {
      return JSON.stringify(
        obj,
        (key, value) => {
          if (typeof value === 'bigint') return value.toString();       // e.g., "12345678901234567890"
          if (Buffer.isBuffer(value)) return '0x' + value.toString('hex'); // raw bytes → hex
          return value;
        },
        2
      );
    }

    function filewrite(event, outPath) {
        try {
            // Only write if event is not null/undefined
            if (event !== null && event !== undefined) {
                // Create NDJSON format - each line is a complete JSON object
                const jsonLine = JSON.stringify(event, (key, value) => {
                    // Handle BigInt serialization
                    if (typeof value === 'bigint') {
                        return value.toString();
                    }
                    // Handle Buffer serialization
                    if (Buffer.isBuffer(value)) {
                        return '0x' + value.toString('hex');
                    }
                    // Handle circular references
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return '[Circular Reference]';
                        }
                        seen.add(value);
                    }
                    return value;
                }) + '\n';
                
                // Reset the seen set for next call
                seen.clear();
                
                fs.appendFileSync(outPath, jsonLine);
                mod.log(`[PlayerPosition] Appended data to ${outPath}`);
            }
        } catch (err) {
            mod.error(`Failed to write event dump: ${err.message}`);
        }
    }

    // Helper function to convert radians to degrees
    function radiansToDegrees(radians) {
        return (radians * 180) / Math.PI;
    }

    // ------------------------------- PLAYER LOCATION HOOKS -------------------------------
    // hook into player location packets to get real-time updates
    mod.hook('C_PLAYER_LOCATION', 5, (event) => {
        // Cache the latest position data for the pos command
        if (event && event.loc) {
            lastPosition = event.loc;
            lastFacingDirection = event.w;
            lastLookDirection = event.lookDirection;
            lastDestination = event.dest;
        }
        
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'C_PLAYER_LOCATION',
            data: event
        };
        filewrite(logData, outPath);
    });

    // hook into flying location packets
    mod.hook('C_PLAYER_FLYING_LOCATION', 4, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'C_PLAYER_FLYING_LOCATION',
            data: event
        };
        filewrite(logData, outPath);
    });

    // Hook into user aim packets for more accurate direction
    mod.hook('C_USER_AIM', 1, (event) => {
        // Cache the latest aim data for the pos command
        if (event) {
            lastAimData = event;
        }
        
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'C_USER_AIM',
            data: event
        };
        filewrite(logData, outPath);
    });

    // Hook into location in action packets
    mod.hook('C_NOTIFY_LOCATION_IN_ACTION', 4, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'C_NOTIFY_LOCATION_IN_ACTION',
            data: event
        };
        filewrite(logData, outPath);
    });

    // Hook into location in dash packets
    mod.hook('C_NOTIFY_LOCATION_IN_DASH', 4, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'C_NOTIFY_LOCATION_IN_DASH',
            data: event
        };
        filewrite(logData, outPath);
    });

    // ------------------------------- PLAYER COMBAT HOOKS -------------------------------
    mod.hook('C_START_SKILL', 7, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'C_START_SKILL',
            data: event
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_ACTION_STAGE', 9, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_ACTION_STAGE_9',
            data: event
        };
        filewrite(logData, outPath);
    });


    mod.hook('S_CANNOT_START_SKILL', 4, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_CANNOT_START_SKILL',
            data: event
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_CREATURE_CHANGE_HP', 6, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_CREATURE_CHANGE_HP',
            data: event
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_SHOW_HP', 3, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_SHOW_HP',
            data: event
        };
        filewrite(logData, outPath);
    });

    // Comment out version 17 due to parsing errors
    // mod.hook('S_PLAYER_STAT_UPDATE', 17, (event) => {
    //     const logData = {
    //         timestamp: new Date().toISOString(),
    //         hook: 'S_PLAYER_STAT_UPDATE',
    //         data: event
    //     };
    //     filewrite(logData, outPath);
    // });

    // Use version 16 instead (latest working version)
    mod.hook('S_PLAYER_STAT_UPDATE', 16, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_PLAYER_STAT_UPDATE_16',
            data: event
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_ABNORMALITY_BEGIN', 3, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_ABNORMALITY_BEGIN_3',
            data: event
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_ABNORMALITY_BEGIN', 4, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_ABNORMALITY_BEGIN_4',
            data: event
        };
        filewrite(logData, outPath);
    });

    // Comment out version 5 due to parsing errors
    // mod.hook('S_ABNORMALITY_BEGIN', 5, (event) => {
    //     const logData = {
    //         timestamp: new Date().toISOString(),
    //         hook: 'S_ABNORMALITY_BEGIN_5',
    //         data: event
    //     };
    //     filewrite(logData, outPath);
    // });

    mod.hook('S_ABNORMALITY_END', 1, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_ABNORMALITY_END',
            data: event
        };
        filewrite(logData, outPath);
    });

   mod.hook('S_EACH_SKILL_RESULT', 15, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_EACH_SKILL_RESULT_15',
            data: event
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_PLAYER_CHANGE_STAMINA', 1, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_PLAYER_CHANGE_STAMINA',
            data: event
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_HIT_COMBO', 1, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_HIT_COMBO',
            data: event
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_NPC_OCCUPIER_INFO', 1, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_NPC_OCCUPIER_INFO',
            data: event,
            note: 'npc | pid (enraging player) | cid (current player)'
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_DESPAWN_NPC', 3, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_DESPAWN_NPC',
            data: event,
            note: '1 is out of view, 5 is dead'
        };
        filewrite(logData, outPath);
    });

    mod.hook('S_NPC_STATUS', 2, (event) => {
        const logData = {
            timestamp: new Date().toISOString(),
            hook: 'S_NPC_STATUS',
            data: event
        };
        filewrite(logData, outPath);
    });

    // ------------------------------- OTHER -------------------------------
    function startPositionLogging() {
        mod.command.message('Player position logging started. Type /pos to get current position.');
    }

    function stopPositionLogging() {
        if (positionInterval) {
            clearInterval(positionInterval);
            positionInterval = null;
        }
    }

    // ------------------------------- TERA GAME STATE MANUAL LOGGING -------------------------------
    function logPlayer() {
        if (!mod.game.me) return; // Skip if player not loaded
        
        if (player == null) {
            player = mod.game.me;
            if (player !== null) {
                // Extract only the data we need, avoiding circular references
                const playerData = {
                    name: player.name,
                    level: player.level,
                    class: player.class,
                    zone: player.zone,
                    loc: player.loc ? {
                        x: player.loc.x,
                        y: player.loc.y,
                        z: player.loc.z,
                        w: player.loc.w
                    } : null
                };
                
                const logData = {
                    timestamp: new Date().toISOString(),
                    hook: 'INTERVAL_PLAYER_DATA',
                    data: playerData
                };
                filewrite(logData, outPath);
            }
        }
        if (mod.game.me != player) {
            player = mod.game.me;
            if (player !== null) {
                // Extract only the data we need, avoiding circular references
                const playerData = {
                    name: player.name,
                    level: player.level,
                    class: player.class,
                    zone: player.zone,
                    loc: player.loc ? {
                        x: player.loc.x,
                        y: player.loc.y,
                        z: player.loc.z,
                        w: player.loc.w
                    } : null
                };
                
                const logData = {
                    timestamp: new Date().toISOString(),
                    hook: 'INTERVAL_PLAYER_DATA',
                    data: playerData
                };
                filewrite(logData, outPath);
                // Log player change
            }
        }
    }

    function logZone() {
        if (!mod.game.me) return; // Skip if player not loaded
        
        if (zone == null) {
            zone = mod.game.me.zone;
            if (zone !== null) {
                const logData = {
                    timestamp: new Date().toISOString(),
                    hook: 'INTERVAL_ZONE_DATA',
                    data: zone
                };
                filewrite(logData, outPath);
            }
        }
        if (mod.game.me.zone != zone) {
            zone = mod.game.me.zone;
            if (zone !== null) {
                const logData = {
                    timestamp: new Date().toISOString(),
                    hook: 'INTERVAL_ZONE_DATA',
                    data: zone
                };
                filewrite(logData, outPath);
            }
        }
    }

    function logPlayerLevel() {
        if (!mod.game.me) return; // Skip if player not loaded
        
        if (player_level == null) {
            player_level = mod.game.me.level;
            if (player_level !== null) {
                const logData = {
                    timestamp: new Date().toISOString(),
                    hook: 'INTERVAL_PLAYER_LEVEL',
                    data: player_level
                };
                filewrite(logData, outPath);
            }
        }
        if (mod.game.me.level != player_level) {
            player_level = mod.game.me.level;
            if (player_level !== null) {
                const logData = {
                    timestamp: new Date().toISOString(),
                    hook: 'INTERVAL_PLAYER_LEVEL',
                    data: player_level
                };
                filewrite(logData, outPath);
            }
        }
    }

    // Store interval IDs for cleanup
    let playerInterval = null;
    let zoneInterval = null;
    let playerLevelInterval = null;

    // Run the functions every 1 second
    playerInterval = setInterval(logPlayer, 1000);
    zoneInterval = setInterval(logZone, 1000);
    playerLevelInterval = setInterval(logPlayerLevel, 1000);


    // ------------------------------- COMMANDS -------------------------------
    // Command to manually get current position
    mod.command.add('pos', () => {
        // Try cached position first, then fall back to game object
        const pos = lastPosition || (mod.game.me && mod.game.me.loc);
        const facing = lastFacingDirection || (mod.game.me && mod.game.me.loc && mod.game.me.loc.w);
        
        if (pos) {
            let message = `Position: X=${Math.round(pos.x * 100) / 100}, Y=${Math.round(pos.y * 100) / 100}, Z=${Math.round(pos.z * 100) / 100}`;
            
            if (facing !== undefined && facing !== 0) {
                const facingDegrees = radiansToDegrees(facing);
                message += `\nFacing: ${Math.round(facing * 100) / 100} rad (${Math.round(facingDegrees * 10) / 10}°)`;
            }
            
            if (lastLookDirection !== null && lastLookDirection !== 0) {
                const lookDegrees = radiansToDegrees(lastLookDirection);
                message += `\nLook: ${Math.round(lastLookDirection * 100) / 100} rad (${Math.round(lookDegrees * 10) / 10}°)`;
            }
            
            if (lastAimData) {
                const yawDegrees = radiansToDegrees(lastAimData.yaw);
                message += `\nAim: ${Math.round(lastAimData.yaw * 100) / 100} rad (${Math.round(yawDegrees * 10) / 10}°)`;
            }
            
            mod.command.message(message);
            console.log(`[PlayerPosition] ${message}`);
        } else {
            mod.command.message('Position data not available. Try moving around first.');
        }
    });

    // Command to show detailed position information including destination
    mod.command.add('posdetail', () => {
        // Try to get the most recent C_PLAYER_LOCATION data
        if (lastPosition) {
            let message = `Position: X=${Math.round(lastPosition.x * 100) / 100}, Y=${Math.round(lastPosition.y * 100) / 100}, Z=${Math.round(lastPosition.z * 100) / 100}`;
            
            if (lastFacingDirection !== undefined && lastFacingDirection !== 0) {
                const facingDegrees = radiansToDegrees(lastFacingDirection);
                message += `\nFacing: ${Math.round(lastFacingDirection * 100) / 100} rad (${Math.round(facingDegrees * 10) / 10}°)`;
            }
            
            if (lastLookDirection !== null && lastLookDirection !== 0) {
                const lookDegrees = radiansToDegrees(lastLookDirection);
                message += `\nLook: ${Math.round(lastLookDirection * 100) / 100} rad (${Math.round(lookDegrees * 10) / 10}°)`;
            }
            
            if (lastAimData) {
                const yawDegrees = radiansToDegrees(lastAimData.yaw);
                message += `\nAim: ${Math.round(lastAimData.yaw * 100) / 100} rad (${Math.round(yawDegrees * 10) / 10}°)`;
            }
            
            if (lastDestination) {
                message += `\nDestination: X=${Math.round(lastDestination.x * 100) / 100}, Y=${Math.round(lastDestination.y * 100) / 100}, Z=${Math.round(lastDestination.z * 100) / 100}`;
            }
            
            mod.command.message(message);
            console.log(`[PlayerPosition] ${message}`);
        } else {
            mod.command.message('Detailed position data not available. Try moving around first.');
        }
    });

    // Command to toggle position logging
    mod.command.add('poslog', () => {
        if (positionInterval) {
            stopPositionLogging();
            mod.command.message('Position logging stopped');
        } else {
            startPositionLogging();
        }
    });

    // Command to save current position to a separate file
    mod.command.add('savepos', () => {
        if (lastPosition) {
            const positionData = {
                timestamp: new Date().toISOString(),
                position: {
                    x: Math.round(lastPosition.x * 100) / 100,
                    y: Math.round(lastPosition.y * 100) / 100,
                    z: Math.round(lastPosition.z * 100) / 100
                },
                facing: lastFacingDirection ? Math.round(lastFacingDirection * 100) / 100 : null,
                lookDirection: lastLookDirection ? Math.round(lastLookDirection * 100) / 100 : null,
                destination: lastDestination ? {
                    x: Math.round(lastDestination.x * 100) / 100,
                    y: Math.round(lastDestination.y * 100) / 100,
                    z: Math.round(lastDestination.z * 100) / 100
                } : null
            };
            
            const savePath = path.join(rawLogsDir, 'last_C_PLAYER_LOCATION.json');
            fs.writeFileSync(savePath, JSON.stringify(positionData, null, 2));
            mod.command.message(`Position saved to ${savePath}`);
        } else {
            mod.command.message('No position data available to save.');
        }
    });

    // Debug command to test JSON writing
    mod.command.add('testjson', () => {
        const testData = {
            timestamp: new Date().toISOString(),
            hook: 'TEST_COMMAND',
            data: {
                test: true,
                message: 'JSON test successful'
            }
        };
        filewrite(testData, outPath);
        mod.command.message(`Test JSON written to ${outPath}`);
    });

    // Cleanup on module unload
    mod.destructor = () => {
        stopPositionLogging();
        
        // Clear all intervals
        if (playerInterval) {
            clearInterval(playerInterval);
            playerInterval = null;
        }
        if (zoneInterval) {
            clearInterval(zoneInterval);
            zoneInterval = null;
        }
        if (playerLevelInterval) {
            clearInterval(playerLevelInterval);
            playerLevelInterval = null;
        }
        
        mod.log('[PlayerPosition] All intervals cleared and module unloaded');
    };
};