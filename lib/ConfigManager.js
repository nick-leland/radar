'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Configuration Manager for Tera Radar Mod
 * Handles loading, validation, and management of mod settings
 */
class ConfigManager {
    constructor(mod, configPath = 'config.json') {
        this.mod = mod;
        this.configPath = path.join(__dirname, '..', configPath);
        this.config = null;
        this.defaultConfig = {
            radarRadius: 50,           // meters
            updateInterval: 50,        // milliseconds
            outputFile: 'radar_output.ndjson',
            includeNPCs: true,
            includeMonsters: true,
            includePlayers: true,
            includeHealthData: true,
            logLevel: 'info'
        };
    }

    /**
     * Load configuration from file with validation
     * Falls back to defaults if file doesn't exist or is invalid
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                const parsedConfig = JSON.parse(configData);
                
                // Validate and merge with defaults
                this.config = this.validateAndMergeConfig(parsedConfig);
                this.mod.log(`[ConfigManager] Configuration loaded from ${this.configPath}`);
            } else {
                // Create default config file
                this.config = { ...this.defaultConfig };
                this.saveConfig();
                this.mod.log(`[ConfigManager] Created default configuration at ${this.configPath}`);
            }
        } catch (error) {
            this.mod.error(`[ConfigManager] Failed to load config: ${error.message}`);
            this.mod.log(`[ConfigManager] Using default configuration`);
            this.config = { ...this.defaultConfig };
        }
        
        return this.config;
    }

    /**
     * Validate configuration values and merge with defaults
     */
    validateAndMergeConfig(userConfig) {
        const validatedConfig = { ...this.defaultConfig };
        
        // Validate radarRadius
        if (typeof userConfig.radarRadius === 'number' && userConfig.radarRadius > 0) {
            validatedConfig.radarRadius = userConfig.radarRadius;
        }
        
        // Validate updateInterval
        if (typeof userConfig.updateInterval === 'number' && userConfig.updateInterval >= 10) {
            validatedConfig.updateInterval = userConfig.updateInterval;
        }
        
        // Validate outputFile
        if (typeof userConfig.outputFile === 'string' && userConfig.outputFile.length > 0) {
            validatedConfig.outputFile = userConfig.outputFile;
        }
        
        // Validate boolean flags
        if (typeof userConfig.includeNPCs === 'boolean') {
            validatedConfig.includeNPCs = userConfig.includeNPCs;
        }
        if (typeof userConfig.includeMonsters === 'boolean') {
            validatedConfig.includeMonsters = userConfig.includeMonsters;
        }
        if (typeof userConfig.includePlayers === 'boolean') {
            validatedConfig.includePlayers = userConfig.includePlayers;
        }
        if (typeof userConfig.includeHealthData === 'boolean') {
            validatedConfig.includeHealthData = userConfig.includeHealthData;
        }
        
        // Validate logLevel
        const validLogLevels = ['error', 'warn', 'info', 'debug'];
        if (typeof userConfig.logLevel === 'string' && validLogLevels.includes(userConfig.logLevel)) {
            validatedConfig.logLevel = userConfig.logLevel;
        }
        
        return validatedConfig;
    }

    /**
     * Save current configuration to file
     */
    saveConfig() {
        try {
            const configJson = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(this.configPath, configJson, 'utf8');
            this.mod.log(`[ConfigManager] Configuration saved to ${this.configPath}`);
        } catch (error) {
            this.mod.error(`[ConfigManager] Failed to save config: ${error.message}`);
        }
    }

    /**
     * Get configuration value
     */
    get(key) {
        return this.config ? this.config[key] : this.defaultConfig[key];
    }

    /**
     * Set configuration value with validation
     */
    set(key, value) {
        if (!this.config) {
            this.config = { ...this.defaultConfig };
        }
        
        // Validate the new value
        const tempConfig = { ...this.config, [key]: value };
        const validatedConfig = this.validateAndMergeConfig(tempConfig);
        
        // Only update if validation passed (value didn't revert to default)
        if (validatedConfig[key] === value) {
            this.config[key] = value;
            return true;
        }
        
        return false;
    }

    /**
     * Get all configuration values
     */
    getAll() {
        return this.config ? { ...this.config } : { ...this.defaultConfig };
    }

    /**
     * Reset configuration to defaults
     */
    resetToDefaults() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
    }
}

module.exports = ConfigManager;