'use strict';

const EntityTracker = require('./EntityTracker');
const Entity = require('./Entity');
const FileOutputManager = require('./FileOutputManager');

/**
 * Performance testing utilities for the Tera Radar Mod
 * Tests entity tracking, distance calculations, and file I/O performance
 */
class PerformanceTest {
    constructor() {
        this.testResults = {};
    }

    /**
     * Run all performance tests
     * @returns {Object} Test results
     */
    async runAllTests() {
        console.log('[PerformanceTest] Starting comprehensive performance tests...');
        
        this.testResults = {
            entityTracking: await this.testEntityTracking(),
            distanceCalculations: await this.testDistanceCalculations(),
            spatialIndexing: await this.testSpatialIndexing(),
            fileOperations: await this.testFileOperations(),
            memoryUsage: await this.testMemoryUsage(),
            highEntityCount: await this.testHighEntityCount()
        };
        
        console.log('[PerformanceTest] All tests completed');
        return this.testResults;
    }

    /**
     * Test entity tracking performance
     */
    async testEntityTracking() {
        console.log('[PerformanceTest] Testing entity tracking performance...');
        
        const tracker = new EntityTracker(50);
        const entityCount = 100;
        const results = {
            addOperations: 0,
            updateOperations: 0,
            removeOperations: 0,
            averageAddTime: 0,
            averageUpdateTime: 0,
            averageRemoveTime: 0
        };

        // Test entity additions
        const addStartTime = Date.now();
        for (let i = 0; i < entityCount; i++) {
            const entityData = {
                gameId: i,
                name: `TestEntity${i}`,
                type: 'Monster',
                position: {
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    z: Math.random() * 100
                },
                hp: 100,
                maxHp: 100,
                level: Math.floor(Math.random() * 50) + 1
            };
            tracker.addEntity(entityData);
        }
        const addTime = Date.now() - addStartTime;
        results.addOperations = entityCount;
        results.averageAddTime = addTime / entityCount;

        // Test entity updates
        const updateStartTime = Date.now();
        for (let i = 0; i < entityCount; i++) {
            tracker.updateEntityPosition(i, {
                x: Math.random() * 100,
                y: Math.random() * 100,
                z: Math.random() * 100
            });
        }
        const updateTime = Date.now() - updateStartTime;
        results.updateOperations = entityCount;
        results.averageUpdateTime = updateTime / entityCount;

        // Test entity removals
        const removeStartTime = Date.now();
        for (let i = 0; i < entityCount; i++) {
            tracker.removeEntity(i);
        }
        const removeTime = Date.now() - removeStartTime;
        results.removeOperations = entityCount;
        results.averageRemoveTime = removeTime / entityCount;

        console.log(`[PerformanceTest] Entity tracking: Add=${results.averageAddTime.toFixed(3)}ms, Update=${results.averageUpdateTime.toFixed(3)}ms, Remove=${results.averageRemoveTime.toFixed(3)}ms`);
        return results;
    }

    /**
     * Test distance calculation performance
     */
    async testDistanceCalculations() {
        console.log('[PerformanceTest] Testing distance calculation performance...');
        
        const tracker = new EntityTracker(50);
        const entityCount = 500;
        const playerPosition = { x: 50, y: 50, z: 50 };
        
        // Add entities
        for (let i = 0; i < entityCount; i++) {
            tracker.addEntity({
                gameId: i,
                name: `TestEntity${i}`,
                position: {
                    x: Math.random() * 200,
                    y: Math.random() * 200,
                    z: Math.random() * 200
                }
            });
        }
        
        tracker.setPlayerPosition(playerPosition);
        
        // Test radius queries
        const queryStartTime = Date.now();
        const iterations = 100;
        
        for (let i = 0; i < iterations; i++) {
            tracker.getEntitiesInRadius();
        }
        
        const queryTime = Date.now() - queryStartTime;
        const averageQueryTime = queryTime / iterations;
        
        const stats = tracker.getStats();
        
        const results = {
            entityCount: entityCount,
            entitiesInRadius: stats.entitiesInRadius,
            iterations: iterations,
            totalQueryTime: queryTime,
            averageQueryTime: averageQueryTime,
            distanceCalculations: stats.performance.distanceCalculations,
            spatialQueries: stats.performance.spatialQueries
        };
        
        console.log(`[PerformanceTest] Distance calculations: ${averageQueryTime.toFixed(3)}ms per query, ${stats.entitiesInRadius} entities in radius`);
        return results;
    }

    /**
     * Test spatial indexing performance
     */
    async testSpatialIndexing() {
        console.log('[PerformanceTest] Testing spatial indexing performance...');
        
        const tracker = new EntityTracker(100);
        const entityCount = 1000;
        const playerPosition = { x: 500, y: 500, z: 500 };
        
        // Add entities in a grid pattern
        let entityId = 0;
        for (let x = 0; x < 100; x += 10) {
            for (let y = 0; y < 100; y += 10) {
                for (let z = 0; z < 100; z += 10) {
                    if (entityId >= entityCount) break;
                    
                    tracker.addEntity({
                        gameId: entityId++,
                        name: `GridEntity${entityId}`,
                        position: { x: x + 400, y: y + 400, z: z + 400 }
                    });
                }
            }
        }
        
        tracker.setPlayerPosition(playerPosition);
        
        // Test spatial queries
        const spatialStartTime = Date.now();
        const spatialIterations = 200;
        
        for (let i = 0; i < spatialIterations; i++) {
            tracker.getEntitiesInRadius();
        }
        
        const spatialTime = Date.now() - spatialStartTime;
        const stats = tracker.getStats();
        
        const results = {
            entityCount: entityCount,
            spatialGridCells: stats.performance.spatialGridCells,
            iterations: spatialIterations,
            averageQueryTime: spatialTime / spatialIterations,
            spatialQueries: stats.performance.spatialQueries,
            memoryUsage: stats.performance.memoryUsage
        };
        
        console.log(`[PerformanceTest] Spatial indexing: ${results.averageQueryTime.toFixed(3)}ms per query, ${results.spatialGridCells} grid cells`);
        return results;
    }

    /**
     * Test file I/O performance
     */
    async testFileOperations() {
        console.log('[PerformanceTest] Testing file I/O performance...');
        
        const outputManager = new FileOutputManager('test_output.ndjson', 50);
        const testData = {
            timestamp: new Date().toISOString(),
            player: {
                position: { x: 100, y: 100, z: 100 },
                rotation: 1.57,
                isActive: true
            },
            entities: Array.from({ length: 50 }, (_, i) => ({
                gameId: i,
                name: `TestEntity${i}`,
                type: 'Monster',
                position: { x: Math.random() * 200, y: Math.random() * 200, z: Math.random() * 200 },
                distance: Math.random() * 50,
                isFriendly: false,
                hp: 100,
                maxHp: 100
            })),
            metadata: {
                entitiesInRadius: 50,
                radarRadius: 50,
                totalEntitiesTracked: 100
            }
        };
        
        // Test write operations
        const writeIterations = 100;
        const writeStartTime = Date.now();
        
        for (let i = 0; i < writeIterations; i++) {
            await outputManager.writeRadarData(testData);
        }
        
        const writeTime = Date.now() - writeStartTime;
        const config = outputManager.getConfig();
        
        const results = {
            iterations: writeIterations,
            totalWriteTime: writeTime,
            averageWriteTime: writeTime / writeIterations,
            performance: config.performance,
            complianceViolations: config.performance.complianceViolations,
            successRate: config.performance.successRate || 0
        };
        
        // Cleanup test file
        const fs = require('fs');
        try {
            if (fs.existsSync('test_output.ndjson')) {
                fs.unlinkSync('test_output.ndjson');
            }
        } catch (error) {
            console.warn(`[PerformanceTest] Failed to cleanup test file: ${error.message}`);
        }
        
        outputManager.destroy();
        
        console.log(`[PerformanceTest] File I/O: ${results.averageWriteTime.toFixed(3)}ms per write, ${results.complianceViolations} violations`);
        return results;
    }

    /**
     * Test memory usage patterns
     */
    async testMemoryUsage() {
        console.log('[PerformanceTest] Testing memory usage patterns...');
        
        const tracker = new EntityTracker(50);
        const initialMemory = process.memoryUsage();
        
        // Add many entities
        const entityCount = 2000;
        for (let i = 0; i < entityCount; i++) {
            tracker.addEntity({
                gameId: i,
                name: `MemoryTestEntity${i}`,
                position: {
                    x: Math.random() * 1000,
                    y: Math.random() * 1000,
                    z: Math.random() * 1000
                },
                hp: Math.random() * 1000,
                maxHp: 1000,
                level: Math.floor(Math.random() * 100)
            });
        }
        
        const peakMemory = process.memoryUsage();
        const stats = tracker.getStats();
        
        // Test cleanup
        tracker.cleanupStaleEntities(0); // Force cleanup of all entities
        
        const postCleanupMemory = process.memoryUsage();
        const postCleanupStats = tracker.getStats();
        
        const results = {
            initialMemory: initialMemory.heapUsed,
            peakMemory: peakMemory.heapUsed,
            postCleanupMemory: postCleanupMemory.heapUsed,
            memoryIncrease: peakMemory.heapUsed - initialMemory.heapUsed,
            memoryRecovered: peakMemory.heapUsed - postCleanupMemory.heapUsed,
            entitiesAdded: entityCount,
            entitiesAfterCleanup: postCleanupStats.totalEntities,
            estimatedEntityMemory: stats.performance.memoryUsage.totalEstimatedBytes
        };
        
        console.log(`[PerformanceTest] Memory usage: +${(results.memoryIncrease / 1024 / 1024).toFixed(2)}MB peak, -${(results.memoryRecovered / 1024 / 1024).toFixed(2)}MB recovered`);
        return results;
    }

    /**
     * Test performance with high entity counts
     */
    async testHighEntityCount() {
        console.log('[PerformanceTest] Testing high entity count performance...');
        
        const tracker = new EntityTracker(100);
        const entityCount = 5000;
        const playerPosition = { x: 2500, y: 2500, z: 2500 };
        
        // Add entities in a large area
        const addStartTime = Date.now();
        for (let i = 0; i < entityCount; i++) {
            tracker.addEntity({
                gameId: i,
                name: `HighCountEntity${i}`,
                position: {
                    x: Math.random() * 5000,
                    y: Math.random() * 5000,
                    z: Math.random() * 5000
                },
                type: i % 3 === 0 ? 'Player' : i % 3 === 1 ? 'NPC' : 'Monster',
                hp: Math.random() * 1000,
                maxHp: 1000
            });
        }
        const addTime = Date.now() - addStartTime;
        
        tracker.setPlayerPosition(playerPosition);
        
        // Test rapid position updates
        const updateStartTime = Date.now();
        const updateIterations = 1000;
        
        for (let i = 0; i < updateIterations; i++) {
            const entityId = Math.floor(Math.random() * entityCount);
            tracker.updateEntityPosition(entityId, {
                x: Math.random() * 5000,
                y: Math.random() * 5000,
                z: Math.random() * 5000
            });
        }
        const updateTime = Date.now() - updateStartTime;
        
        // Test radius queries under load
        const queryStartTime = Date.now();
        const queryIterations = 50;
        
        for (let i = 0; i < queryIterations; i++) {
            tracker.getEntitiesInRadius();
        }
        const queryTime = Date.now() - queryStartTime;
        
        const stats = tracker.getStats();
        
        const results = {
            entityCount: entityCount,
            addTime: addTime,
            averageAddTime: addTime / entityCount,
            updateIterations: updateIterations,
            updateTime: updateTime,
            averageUpdateTime: updateTime / updateIterations,
            queryIterations: queryIterations,
            queryTime: queryTime,
            averageQueryTime: queryTime / queryIterations,
            entitiesInRadius: stats.entitiesInRadius,
            performance: stats.performance
        };
        
        console.log(`[PerformanceTest] High entity count: ${entityCount} entities, ${results.averageQueryTime.toFixed(3)}ms per query`);
        return results;
    }

    /**
     * Generate performance report
     * @returns {string} Formatted performance report
     */
    generateReport() {
        if (!this.testResults || Object.keys(this.testResults).length === 0) {
            return 'No test results available. Run tests first.';
        }
        
        let report = '\n=== TERA RADAR MOD PERFORMANCE REPORT ===\n\n';
        
        // Entity Tracking Performance
        const et = this.testResults.entityTracking;
        report += `Entity Tracking Performance:\n`;
        report += `  Add Operations: ${et.averageAddTime.toFixed(3)}ms average\n`;
        report += `  Update Operations: ${et.averageUpdateTime.toFixed(3)}ms average\n`;
        report += `  Remove Operations: ${et.averageRemoveTime.toFixed(3)}ms average\n\n`;
        
        // Distance Calculations
        const dc = this.testResults.distanceCalculations;
        report += `Distance Calculation Performance:\n`;
        report += `  Query Time: ${dc.averageQueryTime.toFixed(3)}ms average\n`;
        report += `  Entities in Radius: ${dc.entitiesInRadius}/${dc.entityCount}\n`;
        report += `  Distance Calculations: ${dc.distanceCalculations}\n\n`;
        
        // Spatial Indexing
        const si = this.testResults.spatialIndexing;
        report += `Spatial Indexing Performance:\n`;
        report += `  Query Time: ${si.averageQueryTime.toFixed(3)}ms average\n`;
        report += `  Grid Cells: ${si.spatialGridCells}\n`;
        report += `  Memory Usage: ${(si.memoryUsage.totalEstimatedBytes / 1024).toFixed(2)}KB\n\n`;
        
        // File I/O Performance
        const fo = this.testResults.fileOperations;
        report += `File I/O Performance:\n`;
        report += `  Write Time: ${fo.averageWriteTime.toFixed(3)}ms average\n`;
        report += `  Compliance Violations: ${fo.complianceViolations}\n`;
        report += `  Success Rate: ${fo.performance.successRate}%\n\n`;
        
        // Memory Usage
        const mu = this.testResults.memoryUsage;
        report += `Memory Usage:\n`;
        report += `  Peak Increase: ${(mu.memoryIncrease / 1024 / 1024).toFixed(2)}MB\n`;
        report += `  Memory Recovered: ${(mu.memoryRecovered / 1024 / 1024).toFixed(2)}MB\n`;
        report += `  Cleanup Efficiency: ${((mu.memoryRecovered / mu.memoryIncrease) * 100).toFixed(1)}%\n\n`;
        
        // High Entity Count
        const hec = this.testResults.highEntityCount;
        report += `High Entity Count Performance:\n`;
        report += `  Entity Count: ${hec.entityCount}\n`;
        report += `  Query Time: ${hec.averageQueryTime.toFixed(3)}ms average\n`;
        report += `  Update Time: ${hec.averageUpdateTime.toFixed(3)}ms average\n`;
        report += `  Entities in Radius: ${hec.entitiesInRadius}\n\n`;
        
        // Compliance Summary
        report += `=== COMPLIANCE SUMMARY ===\n`;
        report += `Update Frequency Compliance: ${fo.averageWriteTime <= 50 ? 'PASS' : 'FAIL'} (${fo.averageWriteTime.toFixed(3)}ms <= 50ms)\n`;
        report += `File I/O Compliance: ${fo.averageWriteTime <= 10 ? 'PASS' : 'FAIL'} (${fo.averageWriteTime.toFixed(3)}ms <= 10ms)\n`;
        
        const memoryRecoveryRate = mu.memoryIncrease > 0 ? (mu.memoryRecovered / mu.memoryIncrease) * 100 : 100;
        report += `Memory Management: ${memoryRecoveryRate > 80 ? 'PASS' : 'FAIL'} (${memoryRecoveryRate.toFixed(1)}% recovery)\n`;
        
        return report;
    }
}

module.exports = PerformanceTest;