const fs = require('fs');
const path = require('path');

/**
 * FileOutputManager handles atomic file operations for radar data output
 * Ensures data consistency and prevents partial reads by external scripts
 */
class FileOutputManager {
    constructor(outputPath = 'radar_output.ndjson', updateInterval = 50) {
        this.outputPath = outputPath;
        this.updateInterval = updateInterval;
        this.tempPath = `${outputPath}.tmp`;
        this.isWriting = false;
        this.pendingData = null;
        this.writeTimer = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 10; // ms
        
        // Performance monitoring
        this.performanceMetrics = {
            totalWrites: 0,
            successfulWrites: 0,
            failedWrites: 0,
            averageWriteTime: 0,
            maxWriteTime: 0,
            lastWriteTime: 0,
            complianceViolations: 0, // Writes that took > 10ms
            retryOperations: 0
        };
        
        // Ensure output directory exists
        this.ensureOutputDirectory();
    }

    /**
     * Ensure the output directory exists
     */
    ensureOutputDirectory() {
        const dir = path.dirname(this.outputPath);
        if (dir && dir !== '.') {
            try {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            } catch (error) {
                console.error(`[FileOutputManager] Failed to create output directory: ${error.message}`);
            }
        }
    }

    /**
     * Write radar data using atomic operations
     * @param {Object} radarSnapshot - Complete radar state data
     * @returns {Promise<boolean>} - Success status
     */
    async writeRadarData(radarSnapshot) {
        if (!radarSnapshot) {
            console.log('[FileOutputManager] No radar snapshot provided');
            return false;
        }

        // Store the latest data for atomic write
        this.pendingData = radarSnapshot;
        
        // If already writing, the pending data will be written in the next cycle
        if (this.isWriting) {
            return true;
        }

        return await this.performAtomicWrite();
    }

    /**
     * Perform atomic write operation with retry logic and performance monitoring
     * @returns {Promise<boolean>} - Success status
     */
    async performAtomicWrite() {
        if (!this.pendingData) {
            return false;
        }

        this.isWriting = true;
        const startTime = Date.now();
        this.performanceMetrics.totalWrites++;
        
        try {
            // Convert data to NDJSON format (single line)
            const jsonData = JSON.stringify(this.pendingData);
            
            // Write to temporary file first
            await this.writeToTempFile(jsonData);
            
            // Atomic rename operation
            await this.atomicRename();
            
            // Update performance metrics
            const duration = Date.now() - startTime;
            this.updatePerformanceMetrics(duration, true);
            
            // Check if operation completed within 10ms requirement
            if (duration > 10) {
                this.performanceMetrics.complianceViolations++;
                console.warn(`[FileOutputManager] Write operation took ${duration.toFixed(2)}ms (exceeds 10ms requirement)`);
            }
            
            this.retryCount = 0;
            this.pendingData = null;
            this.isWriting = false;
            
            return true;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            this.updatePerformanceMetrics(duration, false);
            this.isWriting = false;
            return await this.handleWriteError(error);
        }
    }

    /**
     * Write data to temporary file
     * @param {string} jsonData - JSON string to write
     */
    async writeToTempFile(jsonData) {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.tempPath, jsonData, 'utf8', (error) => {
                if (error) {
                    reject(new Error(`Failed to write temp file: ${error.message}`));
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Perform atomic rename from temp file to target file
     */
    async atomicRename() {
        return new Promise((resolve, reject) => {
            fs.rename(this.tempPath, this.outputPath, (error) => {
                if (error) {
                    reject(new Error(`Failed to rename temp file: ${error.message}`));
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Handle write errors with retry logic and performance tracking
     * @param {Error} error - The error that occurred
     * @returns {Promise<boolean>} - Success status after retry
     */
    async handleWriteError(error) {
        console.error(`[FileOutputManager] Write error (attempt ${this.retryCount + 1}): ${error.message}`);
        
        // Clean up temp file if it exists
        try {
            if (fs.existsSync(this.tempPath)) {
                fs.unlinkSync(this.tempPath);
            }
        } catch (cleanupError) {
            console.error(`[FileOutputManager] Failed to cleanup temp file: ${cleanupError.message}`);
        }
        
        // Retry logic with exponential backoff
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.performanceMetrics.retryOperations++;
            const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
            
            return new Promise((resolve) => {
                setTimeout(async () => {
                    const success = await this.performAtomicWrite();
                    resolve(success);
                }, delay);
            });
        }
        
        // Max retries exceeded
        console.error(`[FileOutputManager] Max retries exceeded, dropping data`);
        this.performanceMetrics.failedWrites++;
        this.retryCount = 0;
        this.pendingData = null;
        return false;
    }

    /**
     * Start periodic updates at configured interval
     * @param {Function} dataProvider - Function that returns radar data
     */
    startPeriodicUpdates(dataProvider) {
        if (!dataProvider || typeof dataProvider !== 'function') {
            throw new Error('Data provider must be a function');
        }

        if (this.writeTimer) {
            this.stopPeriodicUpdates();
        }
        
        // Store data provider for configuration updates
        this._currentDataProvider = dataProvider;
        
        this.writeTimer = setInterval(async () => {
            try {
                const data = dataProvider();
                console.log(`[FileOutputManager] Got data from provider:`, data ? 'Data available' : 'No data');
                if (data) {
                    console.log(`[FileOutputManager] Writing data with ${data.entities ? data.entities.length : 0} entities`);
                    await this.writeRadarData(data);
                } else {
                    console.log(`[FileOutputManager] No data to write`);
                }
            } catch (error) {
                console.error(`[FileOutputManager] Error in periodic update: ${error.message}`);
            }
        }, this.updateInterval);
        
        console.log(`[FileOutputManager] Started periodic updates every ${this.updateInterval}ms`);
    }

    /**
     * Stop periodic updates
     */
    stopPeriodicUpdates() {
        if (this.writeTimer) {
            clearInterval(this.writeTimer);
            this.writeTimer = null;
            this._currentDataProvider = null;
            console.log(`[FileOutputManager] Stopped periodic updates`);
        }
    }

    /**
     * Ensure atomic write operation completes
     * Used for graceful shutdown
     * @returns {Promise<void>}
     */
    async flush() {
        if (this.pendingData && !this.isWriting) {
            await this.performAtomicWrite();
        }
        
        // Wait for any ongoing write to complete
        while (this.isWriting) {
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }

    /**
     * Get current configuration including performance metrics
     * @returns {Object} Current configuration and performance data
     */
    getConfig() {
        return {
            outputPath: this.outputPath,
            updateInterval: this.updateInterval,
            tempPath: this.tempPath,
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay,
            performance: { ...this.performanceMetrics }
        };
    }

    /**
     * Update performance metrics
     * @param {number} duration - Operation duration in ms
     * @param {boolean} success - Whether operation was successful
     */
    updatePerformanceMetrics(duration, success) {
        this.performanceMetrics.lastWriteTime = duration;
        
        if (success) {
            this.performanceMetrics.successfulWrites++;
        } else {
            this.performanceMetrics.failedWrites++;
        }
        
        // Update average (simple moving average)
        if (this.performanceMetrics.averageWriteTime === 0) {
            this.performanceMetrics.averageWriteTime = duration;
        } else {
            this.performanceMetrics.averageWriteTime = 
                (this.performanceMetrics.averageWriteTime * 0.9) + (duration * 0.1);
        }
        
        // Update max
        if (duration > this.performanceMetrics.maxWriteTime) {
            this.performanceMetrics.maxWriteTime = duration;
        }
    }

    /**
     * Check if file operations are compliant with 10ms requirement
     * @returns {boolean} True if compliant
     */
    isPerformanceCompliant() {
        return this.performanceMetrics.averageWriteTime <= 10 && 
               this.performanceMetrics.complianceViolations === 0;
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        const totalOperations = this.performanceMetrics.totalWrites;
        const successRate = totalOperations > 0 ? 
            (this.performanceMetrics.successfulWrites / totalOperations) * 100 : 0;
        
        return {
            ...this.performanceMetrics,
            successRate: Math.round(successRate * 100) / 100,
            isCompliant: this.isPerformanceCompliant(),
            complianceRate: totalOperations > 0 ? 
                ((totalOperations - this.performanceMetrics.complianceViolations) / totalOperations) * 100 : 100
        };
    }

    /**
     * Update configuration
     * @param {Object} config - New configuration options
     */
    updateConfig(config) {
        if (config.outputPath && config.outputPath !== this.outputPath) {
            this.outputPath = config.outputPath;
            this.tempPath = `${config.outputPath}.tmp`;
            this.ensureOutputDirectory();
        }
        
        if (config.updateInterval && config.updateInterval !== this.updateInterval) {
            this.updateInterval = config.updateInterval;
            
            // Restart periodic updates if they're running
            if (this.writeTimer) {
                const dataProvider = this._currentDataProvider;
                this.stopPeriodicUpdates();
                if (dataProvider) {
                    this.startPeriodicUpdates(dataProvider);
                }
            }
        }
        
        if (config.maxRetries !== undefined) {
            this.maxRetries = config.maxRetries;
        }
        
        if (config.retryDelay !== undefined) {
            this.retryDelay = config.retryDelay;
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopPeriodicUpdates();
        
        // Clean up temp file if it exists
        try {
            if (fs.existsSync(this.tempPath)) {
                fs.unlinkSync(this.tempPath);
            }
        } catch (error) {
            console.error(`[FileOutputManager] Failed to cleanup temp file on destroy: ${error.message}`);
        }
    }
}

module.exports = FileOutputManager;