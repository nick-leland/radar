'use strict';

const ConfigManager = require('./ConfigManager');
const DataProcessor = require('./DataProcessor');
const EntityTracker = require('./EntityTracker');
const PacketInterceptor = require('./PacketInterceptor');
const FileOutputManager = require('./FileOutputManager');
const Entity = require('./Entity');

/**
 * Main Tera Radar Mod class
 * Coordinates all components and manages mod lifecycle
 */
class TeraRadarMod {
    constructor(mod) {
        mod.log('[TeraRadarMod] Constructor called');
        this.mod = mod;

        mod.log('[TeraRadarMod] Creating ConfigManager...');
        this.configManager = new ConfigManager(mod);
        this.config = null;

        mod.log('[TeraRadarMod] Creating DataProcessor...');
        // Initialize components
        this.dataProcessor = new DataProcessor();
        this.entityTracker = null; // Will be initialized with config
        this.packetInterceptor = null; // Will be initialized after entityTracker
        this.fileOutputManager = null; // Will be initialized with config

        mod.log('[TeraRadarMod] Calling initialize...');
        // Initialize the mod
        this.initialize();

        mod.log('[TeraRadarMod] Constructor completed');
    }

    /**
     * Initialize the mod and all its components
     */
    initialize() {
        try {
            this.mod.log('[TeraRadarMod] Loading configuration...');
            // Load configuration
            this.config = this.configManager.loadConfig();
            this.mod.log(`[TeraRadarMod] Initialized with config: ${JSON.stringify(this.config)}`);

            this.mod.log('[TeraRadarMod] Creating EntityTracker...');
            // Initialize EntityTracker with radar radius from config
            this.entityTracker = new EntityTracker(this.config.radarRadius);

            this.mod.log('[TeraRadarMod] Creating PacketInterceptor...');
            // Initialize PacketInterceptor with dependencies
            this.packetInterceptor = new PacketInterceptor(
                this.mod,
                this.dataProcessor,
                this.entityTracker
            );

            this.mod.log('[TeraRadarMod] Creating FileOutputManager...');
            // Initialize FileOutputManager with config
            this.fileOutputManager = new FileOutputManager(
                this.config.outputFile,
                this.config.updateInterval
            );

            // Initialize game state
            this.mod.game.initialize(['me']);

            // Set up game event handlers
            this.setupGameEvents();

            // Commands are now registered in index.js for better compatibility

            this.mod.log('[TeraRadarMod] Initialization complete');
        } catch (error) {
            this.mod.error(`[TeraRadarMod] Initialization failed: ${error.message}`);
        }
    }

    /**
     * Set up game event handlers
     */
    setupGameEvents() {
        this.mod.game.on('enter_game', () => {
            this.onEnterGame();
        });

        this.mod.game.on('leave_game', () => {
            this.onLeaveGame();
        });
    }

    /**
     * Handle entering game
     */
    onEnterGame() {
        this.mod.log('[TeraRadarMod] Entered game');

        // Initialize packet interceptors
        if (this.packetInterceptor) {
            this.packetInterceptor.initializeHooks();
        }

        // Register commands after entering game
        this.registerCommands();

        // Note: File output system is now controlled manually via radarstart command
        // This allows users to control when data output begins

        if (this.packetInterceptor) {
            this.mod.command.message('Tera Radar Mod loaded! Use radar start to begin output, radar status for info.');
        } else {
            this.mod.command.message('Tera Radar Mod loaded! Configuration system active.');
        }
    }

    /**
     * Register commands after game connection
     */
    registerCommands() {
        try {
            this.mod.log('[TeraRadarMod] Registering commands after game connection...');

            // Register main radar command
            this.mod.command.add('radar', (cmd, ...args) => {
                try {
                    if (cmd) cmd = cmd.toLowerCase();

                    switch (cmd) {
                        case 'start':
                        case 'on':
                            this.handleRadarStartCommand();
                            break;
                        case 'stop':
                        case 'off':
                            this.handleRadarStopCommand();
                            break;
                        case 'status':
                        case 's':
                            this.handleStatusCommand();
                            break;
                        case 'output':
                        case 'out':
                            this.handleRadarOutputCommand();
                            break;
                        case 'config':
                        case 'cfg':
                            this.handleConfigCommand(args[0], args[1]);
                            break;
                        case 'radius':
                            this.handleRadiusCommand(args[0]);
                            break;
                        case 'perf':
                        case 'performance':
                            this.handlePerformanceCommand();
                            break;
                        case 'bench':
                        case 'benchmark':
                            this.handleBenchmarkCommand();
                            break;
                        case 'test':
                            this.mod.command.message('Radar test command works! Mod is loaded and active.');
                            break;
                        default:
                            // If no subcommand or if it's a number, treat as radius for radar scan
                            if (cmd && !isNaN(parseFloat(cmd))) {
                                this.handleRadarCommand(parseFloat(cmd));
                            } else {
                                this.handleRadarCommand();
                            }
                            break;
                    }
                } catch (error) {
                    this.mod.command.message(`Command error: ${error.message}`);
                    this.mod.error(`[TeraRadarMod] Command execution error: ${error.message}`);
                }
            });

            // Register short alias
            this.mod.command.add('r', (cmd, ...args) => {
                try {
                    if (cmd) cmd = cmd.toLowerCase();

                    switch (cmd) {
                        case 'start':
                        case 'on':
                            this.handleRadarStartCommand();
                            break;
                        case 'stop':
                        case 'off':
                            this.handleRadarStopCommand();
                            break;
                        case 'status':
                        case 's':
                            this.handleStatusCommand();
                            break;
                        default:
                            // Default behavior for 'r' without subcommand is radar scan
                            if (cmd && !isNaN(parseFloat(cmd))) {
                                this.handleRadarCommand(parseFloat(cmd));
                            } else {
                                this.handleRadarCommand();
                            }
                            break;
                    }
                } catch (error) {
                    this.mod.command.message(`Command error: ${error.message}`);
                    this.mod.error(`[TeraRadarMod] Command execution error: ${error.message}`);
                }
            });

            this.mod.log('[TeraRadarMod] Commands registered successfully after game connection');

        } catch (error) {
            this.mod.error(`[TeraRadarMod] Failed to register commands: ${error.message}`);
        }
    }

    /**
     * Handle leaving game
     */
    onLeaveGame() {
        this.mod.log('[TeraRadarMod] Left game');

        // Stop file output system
        if (this.fileOutputManager) {
            this.fileOutputManager.stopPeriodicUpdates();
            this.mod.log('[TeraRadarMod] File output system stopped');
        }

        // Clear entity tracking data
        if (this.entityTracker) {
            this.entityTracker.clear();
        }

        // Cleanup packet interceptor
        if (this.packetInterceptor) {
            this.packetInterceptor.cleanup();
        }
    }

    /**
     * Set up mod commands
     */
    setupCommands() {
        try {
            this.mod.log('[TeraRadarMod] Setting up commands...');

            // Simple command registration - test if basic registration works
            this.mod.command.add('radartest', () => {
                this.mod.command.message('Radar mod commands are working!');
            });

            this.mod.command.add('radar', (radius) => {
                this.handleRadarCommand(radius);
            });

            this.mod.command.add('radarstatus', () => {
                this.handleStatusCommand();
            });

            this.mod.command.add('radarstart', () => {
                this.handleRadarStartCommand();
            });

            this.mod.command.add('radarstop', () => {
                this.handleRadarStopCommand();
            });

            this.mod.command.add('radarconfig', (key, value) => {
                this.handleConfigCommand(key, value);
            });

            this.mod.command.add('radarradius', (radius) => {
                this.handleRadiusCommand(radius);
            });

            this.mod.command.add('radaroutput', () => {
                this.handleRadarOutputCommand();
            });

            this.mod.command.add('radarperf', () => {
                this.handlePerformanceCommand();
            });

            this.mod.command.add('radarbench', () => {
                this.handleBenchmarkCommand();
            });

            this.mod.log('[TeraRadarMod] Commands registered successfully');
        } catch (error) {
            this.mod.error(`[TeraRadarMod] Failed to register commands: ${error.message}`);
        }
    }

    /**
     * Handle configuration command
     */
    handleConfigCommand(key, value) {
        if (!key) {
            // Show all configuration
            const config = this.configManager.getAll();
            let message = 'Current configuration:\n';
            for (const [k, v] of Object.entries(config)) {
                message += `${k}: ${v}\n`;
            }
            this.mod.command.message(message);
            return;
        }

        if (!value) {
            // Show specific configuration value
            const currentValue = this.configManager.get(key);
            if (currentValue !== undefined) {
                this.mod.command.message(`${key}: ${currentValue}`);
            } else {
                this.mod.command.message(`Configuration key '${key}' not found.`);
            }
            return;
        }

        // Set configuration value
        let parsedValue = value;

        // Try to parse as number or boolean
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(value)) parsedValue = parseFloat(value);

        if (this.configManager.set(key, parsedValue)) {
            this.configManager.saveConfig();
            this.config = this.configManager.getAll(); // Refresh local config

            // Update FileOutputManager configuration if relevant
            if (this.fileOutputManager && (key === 'outputFile' || key === 'updateInterval')) {
                this.fileOutputManager.updateConfig({
                    outputPath: this.config.outputFile,
                    updateInterval: this.config.updateInterval
                });
            }

            this.mod.command.message(`Configuration updated: ${key} = ${parsedValue}`);
        } else {
            this.mod.command.message(`Failed to set ${key} to ${parsedValue}. Invalid value.`);
        }
    }

    /**
     * Handle status command
     */
    handleStatusCommand() {
        try {
            const config = this.configManager.getAll();
            let message = `Tera Radar Mod Status:\n`;
            message += `Radar Radius: ${config.radarRadius}m (${Entity.metersToTeraUnits(config.radarRadius).toFixed(1)} TERA units)\n`;
            message += `Update Interval: ${config.updateInterval}ms\n`;
            message += `Output File: ${config.outputFile}\n`;
            message += `Include NPCs: ${config.includeNPCs}\n`;
            message += `Include Monsters: ${config.includeMonsters}\n`;
            message += `Include Players: ${config.includePlayers}\n`;
            message += `Include Health Data: ${config.includeHealthData}\n`;
            message += `Log Level: ${config.logLevel}\n`;

            // Add packet interceptor status
            if (this.packetInterceptor) {
                try {
                    const playerPosition = this.packetInterceptor.getPlayerPosition();
                    const playerAim = this.packetInterceptor.getPlayerAimData();
                    message += `Packet Interceptor: ${this.packetInterceptor.isInitialized() ? 'Active' : 'Inactive'}\n`;
                    message += `Player Position: ${playerPosition ? 'Available' : 'Not available'}\n`;
                    message += `Player Aim Data: ${playerAim ? 'Available' : 'Not available'}\n`;
                } catch (error) {
                    message += `Packet Interceptor: Error getting status\n`;
                }
            } else {
                message += `Packet Interceptor: Not initialized\n`;
            }

            // Add entity tracker status
            if (this.entityTracker) {
                try {
                    const stats = this.entityTracker.getStats();
                    message += `Tracked Entities: ${stats.totalEntities}\n`;
                    message += `Entities in Radius: ${stats.entitiesInRadius}\n`;
                } catch (error) {
                    message += `Entity Tracker: Error getting stats\n`;
                }
            } else {
                message += `Entity Tracker: Not initialized\n`;
            }

            // Add file output manager status
            if (this.fileOutputManager) {
                try {
                    const outputConfig = this.fileOutputManager.getConfig();
                    message += `Output System: ${this.fileOutputManager.writeTimer ? 'Active' : 'Inactive'}\n`;
                    message += `Output Path: ${outputConfig.outputPath}`;
                } catch (error) {
                    message += `Output System: Error getting status`;
                }
            } else {
                message += `Output System: Not initialized`;
            }

            this.mod.command.message(message);
        } catch (error) {
            this.mod.command.message(`Error getting status: ${error.message}`);
            this.mod.error(`[TeraRadarMod] Error in handleStatusCommand: ${error.message}`);
        }
    }

    /**
     * Handle radar scanning command
     */
    handleRadarCommand(radius) {
        if (!this.entityTracker || !this.packetInterceptor) {
            this.mod.command.message('Radar system not initialized. Please wait for game to load.');
            return;
        }

        const playerPosition = this.packetInterceptor.getPlayerPosition();
        if (!playerPosition) {
            this.mod.command.message('No player position available. Try moving around first.');
            return;
        }

        const entitiesInRadius = this.entityTracker.getEntitiesInRadius();

        if (entitiesInRadius.length === 0) {
            const stats = this.entityTracker.getStats();
            this.mod.command.message(`No entities found within ${stats.radarRadius}m radius. Total entities tracked: ${stats.totalEntities}`);
        } else {
            let message = `Radar scan (${this.entityTracker.radarRadius}m radius):\n`;

            entitiesInRadius.forEach(entity => {
                const distance = entity.calculateDistanceFrom(playerPosition);
                const distanceStr = `${distance.toFixed(2)}m`;
                const hpStr = entity.hp && entity.maxHp ? ` (${entity.hp}/${entity.maxHp})` : '';
                const levelStr = entity.level ? ` Lv.${entity.level}` : '';
                const classStr = entity.class ? ` ${entity.class}` : '';
                const relationStr = entity.isFriendly ? ' [Friendly]' : ' [Hostile]';

                message += `${distanceStr} : ${entity.name}${levelStr}${classStr}${hpStr}${relationStr}\n`;
            });

            this.mod.command.message(message);
        }
    }

    /**
     * Handle radar radius command
     */
    handleRadiusCommand(radius) {
        if (radius) {
            const newRadius = parseInt(radius);
            if (!isNaN(newRadius) && newRadius > 0) {
                if (this.configManager.set('radarRadius', newRadius)) {
                    this.configManager.saveConfig();
                    this.config = this.configManager.getAll();

                    // Update EntityTracker radius
                    if (this.entityTracker) {
                        this.entityTracker.setRadarRadius(newRadius);
                    }

                    this.mod.command.message(`Radar radius set to ${newRadius}m.`);
                } else {
                    this.mod.command.message('Failed to set radar radius. Invalid value.');
                }
            } else {
                this.mod.command.message('Please enter a valid positive number for the radar radius.');
            }
        } else {
            const currentRadius = this.configManager.get('radarRadius');
            this.mod.command.message(`Current radar radius: ${currentRadius}m. Usage: radarradius <new_radius>`);
        }
    }

    /**
     * Handle radar start command - begins continuous file output
     */
    handleRadarStartCommand() {
        if (!this.fileOutputManager) {
            this.mod.command.message('File output manager not initialized. Please wait for game to load.');
            return;
        }

        if (this.fileOutputManager.writeTimer) {
            this.mod.command.message('Radar output is already running.');
            return;
        }

        try {
            // Start file output system
            this.fileOutputManager.startPeriodicUpdates(() => this.getRadarSnapshot());

            const config = this.fileOutputManager.getConfig();
            this.mod.command.message(`Radar output started. Writing to: ${config.outputPath} every ${config.updateInterval}ms`);
            this.mod.log('[TeraRadarMod] Radar output started via command');
        } catch (error) {
            this.mod.command.message(`Failed to start radar output: ${error.message}`);
            this.mod.error(`[TeraRadarMod] Failed to start radar output: ${error.message}`);
        }
    }

    /**
     * Handle radar stop command - halts file output
     */
    handleRadarStopCommand() {
        if (!this.fileOutputManager) {
            this.mod.command.message('File output manager not initialized.');
            return;
        }

        if (!this.fileOutputManager.writeTimer) {
            this.mod.command.message('Radar output is not currently running.');
            return;
        }

        try {
            // Stop file output system
            this.fileOutputManager.stopPeriodicUpdates();

            this.mod.command.message('Radar output stopped.');
            this.mod.log('[TeraRadarMod] Radar output stopped via command');
        } catch (error) {
            this.mod.command.message(`Failed to stop radar output: ${error.message}`);
            this.mod.error(`[TeraRadarMod] Failed to stop radar output: ${error.message}`);
        }
    }

    /**
     * Handle radar output command - shows current output status and file location
     */
    handleRadarOutputCommand() {
        if (!this.fileOutputManager) {
            this.mod.command.message('File output manager not initialized.');
            return;
        }

        try {
            const config = this.fileOutputManager.getConfig();
            const isRunning = this.fileOutputManager.writeTimer !== null;

            let message = `Radar Output Status:\n`;
            message += `Status: ${isRunning ? 'Running' : 'Stopped'}\n`;
            message += `Output File: ${config.outputPath}\n`;
            message += `Update Interval: ${config.updateInterval}ms\n`;

            // Add current data snapshot info
            const snapshot = this.getRadarSnapshot();
            if (snapshot) {
                message += `Current Entities: ${snapshot.entities.length}\n`;
                message += `Player Active: ${snapshot.player.isActive ? 'Yes' : 'No'}`;
            } else {
                message += `Current Data: Not available`;
            }

            this.mod.command.message(message);
        } catch (error) {
            this.mod.command.message(`Failed to get radar output status: ${error.message}`);
            this.mod.error(`[TeraRadarMod] Failed to get radar output status: ${error.message}`);
        }
    }

    /**
     * Handle performance monitoring command
     */
    handlePerformanceCommand() {
        if (!this.entityTracker || !this.fileOutputManager) {
            this.mod.command.message('Performance monitoring not available. System not fully initialized.');
            return;
        }

        const entityStats = this.entityTracker.getStats();
        const fileStats = this.fileOutputManager.getPerformanceStats();

        let message = `Performance Metrics:\n\n`;

        // Entity Tracker Performance
        message += `Entity Tracker:\n`;
        message += `  Updates: ${entityStats.performance.entityUpdates}\n`;
        message += `  Distance Calculations: ${entityStats.performance.distanceCalculations}\n`;
        message += `  Spatial Queries: ${entityStats.performance.spatialQueries}\n`;
        message += `  Average Update Time: ${entityStats.performance.averageUpdateTime.toFixed(3)}ms\n`;
        message += `  Max Update Time: ${entityStats.performance.maxUpdateTime.toFixed(3)}ms\n`;
        message += `  Distance Cache Size: ${entityStats.performance.distanceCacheSize}\n`;
        message += `  Spatial Grid Cells: ${entityStats.performance.spatialGridCells}\n`;
        message += `  Memory Usage: ${(entityStats.performance.memoryUsage.totalEstimatedBytes / 1024).toFixed(2)}KB\n\n`;

        // File Output Performance
        message += `File Output Manager:\n`;
        message += `  Total Writes: ${fileStats.totalWrites}\n`;
        message += `  Successful Writes: ${fileStats.successfulWrites}\n`;
        message += `  Failed Writes: ${fileStats.failedWrites}\n`;
        message += `  Success Rate: ${fileStats.successRate.toFixed(2)}%\n`;
        message += `  Average Write Time: ${fileStats.averageWriteTime.toFixed(3)}ms\n`;
        message += `  Max Write Time: ${fileStats.maxWriteTime.toFixed(3)}ms\n`;
        message += `  Compliance Violations: ${fileStats.complianceViolations}\n`;
        message += `  Compliance Rate: ${fileStats.complianceRate.toFixed(2)}%\n`;
        message += `  Retry Operations: ${fileStats.retryOperations}\n\n`;

        // Compliance Status
        message += `Compliance Status:\n`;
        message += `  Update Frequency: ${entityStats.performance.averageUpdateTime <= 50 ? 'COMPLIANT' : 'NON-COMPLIANT'}\n`;
        message += `  File I/O Speed: ${fileStats.averageWriteTime <= 10 ? 'COMPLIANT' : 'NON-COMPLIANT'}\n`;
        message += `  Overall Status: ${fileStats.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`;

        this.mod.command.message(message);
    }

    /**
     * Handle benchmark command - runs quick performance test
     */
    handleBenchmarkCommand() {
        if (!this.entityTracker) {
            this.mod.command.message('Benchmark not available. Entity tracker not initialized.');
            return;
        }

        this.mod.command.message('Running performance benchmark...');

        // Quick benchmark test
        const startTime = Date.now();
        const iterations = 100;

        // Test entity queries
        for (let i = 0; i < iterations; i++) {
            this.entityTracker.getEntitiesInRadius();
        }

        const queryTime = Date.now() - startTime;
        const averageQueryTime = queryTime / iterations;

        // Test radar snapshot generation
        const snapshotStartTime = Date.now();
        const snapshotIterations = 50;

        for (let i = 0; i < snapshotIterations; i++) {
            this.getRadarSnapshot();
        }

        const snapshotTime = Date.now() - snapshotStartTime;
        const averageSnapshotTime = snapshotTime / snapshotIterations;

        const stats = this.entityTracker.getStats();

        let message = `Benchmark Results:\n`;
        message += `  Entity Query Time: ${averageQueryTime.toFixed(3)}ms average (${iterations} iterations)\n`;
        message += `  Snapshot Generation: ${averageSnapshotTime.toFixed(3)}ms average (${snapshotIterations} iterations)\n`;
        message += `  Entities Tracked: ${stats.totalEntities}\n`;
        message += `  Entities in Radius: ${stats.entitiesInRadius}\n`;
        message += `  Performance Status: ${averageQueryTime <= 5 && averageSnapshotTime <= 10 ? 'EXCELLENT' : averageQueryTime <= 10 && averageSnapshotTime <= 20 ? 'GOOD' : 'NEEDS OPTIMIZATION'}`;

        this.mod.command.message(message);
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Get complete radar snapshot with player state
     * This method will be used by FileOutputManager for periodic updates
     * @returns {Object|null} Complete radar data snapshot or null if not ready
     */
    getRadarSnapshot() {
        try {
            if (!this.entityTracker) {
                console.log('[TeraRadarMod] getRadarSnapshot: No entity tracker');
                return null;
            }

            // Get player state from PacketInterceptor (if available)
            let playerState = null;
            if (this.packetInterceptor) {
                try {
                    playerState = this.packetInterceptor.getPlayerState();
                } catch (error) {
                    // If getPlayerState fails, continue with null player state
                    this.mod.log(`[TeraRadarMod] Warning: Could not get player state: ${error.message}`);
                }
            }

            // Get radar snapshot with enhanced player data
            const snapshot = this.entityTracker.getRadarSnapshot(playerState);

            // Ensure all fields have consistent null handling for reliable parsing
            if (snapshot) {
                // Ensure player object always exists with all expected fields
                snapshot.player = {
                    position: snapshot.player?.position || null,
                    rotation: snapshot.player?.rotation !== undefined ? snapshot.player.rotation : null,
                    yaw: snapshot.player?.yaw !== undefined ? snapshot.player.yaw : null,
                    pitch: snapshot.player?.pitch !== undefined ? snapshot.player.pitch : null,
                    isActive: snapshot.player?.isActive !== undefined ? snapshot.player.isActive : false
                };

                // Ensure entities array always exists
                snapshot.entities = snapshot.entities || [];

                // Ensure metadata object always exists with all expected fields
                snapshot.metadata = {
                    entitiesInRadius: snapshot.metadata?.entitiesInRadius || 0,
                    radarRadius: snapshot.metadata?.radarRadius || this.config?.radarRadius || 50,
                    totalEntitiesTracked: snapshot.metadata?.totalEntitiesTracked || 0
                };
            }

            console.log(`[TeraRadarMod] Generated snapshot with ${snapshot.entities.length} entities`);
            return snapshot;
        } catch (error) {
            this.mod.error(`[TeraRadarMod] Error generating radar snapshot: ${error.message}`);
            return null;
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.mod.log('[TeraRadarMod] Cleaning up resources');

        // Cleanup file output manager
        if (this.fileOutputManager) {
            this.fileOutputManager.destroy();
        }

        // Cleanup entity tracker
        if (this.entityTracker) {
            this.entityTracker.clear();
        }

        // Cleanup packet interceptor
        if (this.packetInterceptor) {
            this.packetInterceptor.cleanup();
        }
    }
}

module.exports = TeraRadarMod;