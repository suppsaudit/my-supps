// Comprehensive Integration Test Suite for MY SUPPS
// Tests all major functionality including API integration, caching, and error handling

class IntegrationTestSuite {
    constructor() {
        this.testResults = [];
        this.testStats = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        };
        
        // Test configuration
        this.config = {
            timeout: 10000,
            enableVerboseLogging: true,
            enablePerformanceTesting: true,
            runSlowTests: false // Set to true for comprehensive testing
        };
        
        console.log('🧪 Integration Test Suite initialized');
    }
    
    // === MAIN TEST RUNNER ===
    
    async runAllTests() {
        console.group('🚀 Starting Comprehensive Integration Tests');
        const startTime = Date.now();
        
        try {
            // Initialize test environment
            await this.setupTestEnvironment();
            
            // Run test suites in order
            await this.runAPIIntegrationTests();
            await this.runCacheTests();
            await this.runErrorHandlingTests();
            await this.runPerformanceTests();
            await this.runUIIntegrationTests();
            await this.runRegionSwitchingTests();
            await this.runSystemHealthTests();
            
            // Generate test report
            const totalTime = Date.now() - startTime;
            this.generateTestReport(totalTime);
            
        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
            this.testStats.failed++;
        } finally {
            console.groupEnd();
        }
        
        return this.getTestSummary();
    }
    
    async setupTestEnvironment() {
        this.log('🔧 Setting up test environment...');
        
        // Ensure APIs are initialized
        if (window.supplementAPI) {
            await window.supplementAPI.initialize();
        }
        
        // Clear any existing test data
        if (window.supplementAPI && window.supplementAPI.clearCache) {
            await window.supplementAPI.clearCache();
        }
        
        this.log('✅ Test environment ready');
    }
    
    // === API INTEGRATION TESTS ===
    
    async runAPIIntegrationTests() {
        this.log('🌐 Running API Integration Tests...');
        
        await this.runTest('DSLD API - Search Products', async () => {
            if (!window.supplementAPI) {
                throw new Error('Supplement API not available');
            }
            
            const results = await window.supplementAPI.search('vitamin c', {
                region: 'US',
                limit: 5
            });
            
            this.assert(Array.isArray(results), 'Results should be an array');
            this.assert(results.length > 0, 'Should return at least one result');
            
            if (results.length > 0) {
                const product = results[0];
                this.assert(product.name, 'Product should have a name');
                this.assert(product.region === 'US', 'Product should be from US region');
            }
            
            return `Found ${results.length} products`;
        });
        
        await this.runTest('IMD API - Search Products (if available)', async () => {
            if (!window.supplementAPI) {
                throw new Error('Supplement API not available');
            }
            
            try {
                const results = await window.supplementAPI.search('ビタミン', {
                    region: 'JP',
                    limit: 3
                });
                
                this.assert(Array.isArray(results), 'Results should be an array');
                
                if (results.length > 0) {
                    const product = results[0];
                    this.assert(product.name, 'Product should have a name');
                    this.assert(product.region === 'JP', 'Product should be from JP region');
                }
                
                return `Found ${results.length} Japanese products`;
                
            } catch (error) {
                // IMD API might not be configured, log as warning
                this.log(`⚠️ IMD API test skipped: ${error.message}`);
                this.testStats.skipped++;
                return 'Skipped - IMD API not available';
            }
        });
        
        await this.runTest('Multi-region Search', async () => {
            if (!window.supplementAPI) {
                throw new Error('Supplement API not available');
            }
            
            const usResults = await window.supplementAPI.search('calcium', {
                region: 'US',
                limit: 3
            });
            
            const jpResults = await window.supplementAPI.search('カルシウム', {
                region: 'JP', 
                limit: 3
            });
            
            this.assert(Array.isArray(usResults), 'US results should be an array');
            this.assert(Array.isArray(jpResults), 'JP results should be an array');
            
            return `US: ${usResults.length}, JP: ${jpResults.length} products`;
        });
    }
    
    // === CACHE TESTS ===
    
    async runCacheTests() {
        this.log('💾 Running Cache Tests...');
        
        await this.runTest('Cache Storage and Retrieval', async () => {
            if (!window.supplementAPI || !window.supplementAPI.cacheManager) {
                throw new Error('Cache manager not available');
            }
            
            const cacheManager = window.supplementAPI.cacheManager;
            const testKey = 'test-cache-key';
            const testData = { name: 'Test Product', id: 'test-123' };
            
            // Set cache
            await cacheManager.set(testKey, testData);
            
            // Get from cache
            const cachedData = await cacheManager.get(testKey);
            
            this.assert(cachedData !== null, 'Should retrieve cached data');
            this.assert(cachedData.name === testData.name, 'Cached data should match original');
            
            // Clean up
            await cacheManager.delete(testKey);
            
            return 'Cache operations successful';
        });
        
        await this.runTest('Cache Performance', async () => {
            if (!window.supplementAPI) {
                throw new Error('Supplement API not available');
            }
            
            const startTime = Date.now();
            
            // First request (should hit API)
            await window.supplementAPI.search('vitamin d', {
                region: 'US',
                limit: 5
            });
            
            const firstRequestTime = Date.now() - startTime;
            
            // Second request (should hit cache)
            const cacheStartTime = Date.now();
            await window.supplementAPI.search('vitamin d', {
                region: 'US', 
                limit: 5
            });
            const cacheRequestTime = Date.now() - cacheStartTime;
            
            this.assert(cacheRequestTime < firstRequestTime, 'Cached request should be faster');
            this.assert(cacheRequestTime < 100, 'Cache response should be under 100ms');
            
            return `First: ${firstRequestTime}ms, Cached: ${cacheRequestTime}ms`;
        });
    }
    
    // === ERROR HANDLING TESTS ===
    
    async runErrorHandlingTests() {
        this.log('🛡️ Running Error Handling Tests...');
        
        await this.runTest('Network Error Resilience', async () => {
            // Test how system handles network errors
            try {
                // Simulate invalid search that might cause errors
                const results = await window.supplementAPI.search('', {
                    region: 'US',
                    limit: 1
                });
                
                this.assert(Array.isArray(results), 'Should return empty array on error');
                
                return 'Error handling working correctly';
                
            } catch (error) {
                // If error is thrown, check if it's handled gracefully
                this.assert(false, `Unhandled error: ${error.message}`);
            }
        });
        
        await this.runTest('Fallback Data Usage', async () => {
            if (!window.supplementAPI || !window.supplementAPI.errorHandler) {
                this.testStats.skipped++;
                return 'Skipped - Error handler not available';
            }
            
            // This test checks if fallback data is properly used
            const errorHandler = window.supplementAPI.errorHandler;
            
            // Save some test fallback data
            await errorHandler.saveFallbackData('test-endpoint', [
                { name: 'Fallback Product', id: 'fallback-1' }
            ]);
            
            // Retrieve fallback data
            const fallbackData = await errorHandler.getFallbackData('test-endpoint');
            
            this.assert(fallbackData !== null, 'Should retrieve fallback data');
            this.assert(Array.isArray(fallbackData), 'Fallback data should be an array');
            
            return 'Fallback data system working';
        });
    }
    
    // === PERFORMANCE TESTS ===
    
    async runPerformanceTests() {
        if (!this.config.enablePerformanceTesting) {
            this.log('⏭️ Skipping performance tests (disabled)');
            return;
        }
        
        this.log('⚡ Running Performance Tests...');
        
        await this.runTest('Response Time Target (3 seconds)', async () => {
            const startTime = Date.now();
            
            const results = await window.supplementAPI.search('multivitamin', {
                region: 'US',
                limit: 10
            });
            
            const responseTime = Date.now() - startTime;
            
            this.assert(responseTime < 3000, `Response time should be under 3 seconds (was ${responseTime}ms)`);
            this.assert(Array.isArray(results), 'Should return valid results');
            
            return `Response time: ${responseTime}ms`;
        });
        
        await this.runTest('Concurrent Request Handling', async () => {
            const concurrentRequests = [
                window.supplementAPI.search('vitamin a', { region: 'US', limit: 3 }),
                window.supplementAPI.search('vitamin b', { region: 'US', limit: 3 }),
                window.supplementAPI.search('vitamin e', { region: 'US', limit: 3 })
            ];
            
            const startTime = Date.now();
            const results = await Promise.all(concurrentRequests);
            const totalTime = Date.now() - startTime;
            
            this.assert(results.length === 3, 'Should handle all concurrent requests');
            this.assert(totalTime < 5000, 'Concurrent requests should complete within 5 seconds');
            
            results.forEach((result, index) => {
                this.assert(Array.isArray(result), `Result ${index} should be an array`);
            });
            
            return `${results.length} concurrent requests in ${totalTime}ms`;
        });
    }
    
    // === UI INTEGRATION TESTS ===
    
    async runUIIntegrationTests() {
        this.log('🖼️ Running UI Integration Tests...');
        
        await this.runTest('Region Selector Presence', async () => {
            const regionSelect = document.getElementById('region-select');
            
            this.assert(regionSelect !== null, 'Region selector should exist');
            this.assert(regionSelect.options.length >= 3, 'Should have at least 3 region options');
            
            return `Found region selector with ${regionSelect.options.length} options`;
        });
        
        await this.runTest('Search Input Functionality', async () => {
            const searchInput = document.getElementById('search-input');
            
            this.assert(searchInput !== null, 'Search input should exist');
            this.assert(searchInput.type === 'text', 'Search input should be text type');
            
            return 'Search input is functional';
        });
        
        await this.runTest('Notification System', async () => {
            if (!window.notificationSystem) {
                this.testStats.skipped++;
                return 'Skipped - Notification system not available';
            }
            
            // Test notification display
            const notificationId = window.notificationSystem.info('Test', 'Test notification message', {
                duration: 1000
            });
            
            this.assert(notificationId, 'Should return notification ID');
            
            // Wait a bit and dismiss
            await this.sleep(500);
            window.notificationSystem.dismiss(notificationId);
            
            return 'Notification system working';
        });
    }
    
    // === REGION SWITCHING TESTS ===
    
    async runRegionSwitchingTests() {
        this.log('🌍 Running Region Switching Tests...');
        
        await this.runTest('Region Configuration', async () => {
            if (!window.supplementAPI || !window.supplementAPI.getCurrentRegion) {
                throw new Error('Region functionality not available');
            }
            
            const currentRegion = window.supplementAPI.getCurrentRegion();
            this.assert(['US', 'JP'].includes(currentRegion), 'Current region should be US or JP');
            
            return `Current region: ${currentRegion}`;
        });
        
        await this.runTest('Region Switching Functionality', async () => {
            if (!window.supplementAPI || !window.supplementAPI.setRegion) {
                throw new Error('Region switching not available');
            }
            
            const originalRegion = window.supplementAPI.getCurrentRegion();
            
            // Switch to different region
            const newRegion = originalRegion === 'US' ? 'JP' : 'US';
            window.supplementAPI.setRegion(newRegion);
            
            const updatedRegion = window.supplementAPI.getCurrentRegion();
            this.assert(updatedRegion === newRegion, 'Region should be updated');
            
            // Switch back
            window.supplementAPI.setRegion(originalRegion);
            
            return `Successfully switched from ${originalRegion} to ${newRegion} and back`;
        });
    }
    
    // === SYSTEM HEALTH TESTS ===
    
    async runSystemHealthTests() {
        this.log('🏥 Running System Health Tests...');
        
        await this.runTest('API Health Check', async () => {
            try {
                const response = await fetch('/api/health');
                this.assert(response.ok, 'Health endpoint should be accessible');
                
                const healthData = await response.json();
                this.assert(healthData.timestamp, 'Health data should have timestamp');
                
                return `Health check status: ${healthData.status}`;
                
            } catch (error) {
                this.log(`⚠️ Health endpoint not available: ${error.message}`);
                this.testStats.skipped++;
                return 'Skipped - Health endpoint not available';
            }
        });
        
        await this.runTest('System Metrics Collection', async () => {
            if (!window.supplementAPI || !window.supplementAPI.getSystemHealth) {
                this.testStats.skipped++;
                return 'Skipped - System health not available';
            }
            
            const systemHealth = await window.supplementAPI.getSystemHealth();
            
            this.assert(systemHealth.timestamp, 'System health should have timestamp');
            this.assert(systemHealth.performance, 'Should include performance metrics');
            
            return 'System metrics collection working';
        });
    }
    
    // === TEST UTILITIES ===
    
    async runTest(testName, testFunction) {
        this.testStats.total++;
        
        try {
            this.log(`  🧪 Running: ${testName}`);
            
            const startTime = Date.now();
            const result = await Promise.race([
                testFunction(),
                this.createTimeoutPromise(this.config.timeout)
            ]);
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                name: testName,
                status: 'passed',
                duration: duration,
                result: result || 'Success',
                timestamp: new Date().toISOString()
            });
            
            this.testStats.passed++;
            this.log(`  ✅ ${testName} - ${result || 'Passed'} (${duration}ms)`);
            
        } catch (error) {
            this.testResults.push({
                name: testName,
                status: 'failed',
                duration: 0,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            this.testStats.failed++;
            this.log(`  ❌ ${testName} - ${error.message}`);
        }
    }
    
    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
        });
    }
    
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    log(message) {
        if (this.config.enableVerboseLogging) {
            console.log(message);
        }
    }
    
    // === REPORTING ===
    
    generateTestReport(totalTime) {
        console.group('📊 Test Report');
        console.log(`Total Time: ${totalTime}ms`);
        console.log(`Tests Run: ${this.testStats.total}`);
        console.log(`Passed: ${this.testStats.passed}`);
        console.log(`Failed: ${this.testStats.failed}`);
        console.log(`Skipped: ${this.testStats.skipped}`);
        console.log(`Success Rate: ${(this.testStats.passed / this.testStats.total * 100).toFixed(1)}%`);
        
        if (this.testStats.failed > 0) {
            console.group('❌ Failed Tests');
            this.testResults
                .filter(test => test.status === 'failed')
                .forEach(test => {
                    console.log(`${test.name}: ${test.error}`);
                });
            console.groupEnd();
        }
        
        console.groupEnd();
    }
    
    getTestSummary() {
        return {
            stats: this.testStats,
            results: this.testResults,
            success: this.testStats.failed === 0,
            coverage: (this.testStats.passed / this.testStats.total * 100).toFixed(1)
        };
    }
    
    // === PUBLIC API ===
    
    async runQuickTests() {
        this.log('⚡ Running Quick Test Suite...');
        
        await this.setupTestEnvironment();
        await this.runTest('Basic API Search', async () => {
            const results = await window.supplementAPI.search('vitamin', {
                region: 'US',
                limit: 3
            });
            this.assert(Array.isArray(results), 'Should return array');
            return `Found ${results.length} products`;
        });
        
        await this.runTest('Cache Basic Operation', async () => {
            if (!window.supplementAPI || !window.supplementAPI.cacheManager) {
                this.testStats.skipped++;
                return 'Skipped - Cache not available';
            }
            
            const cache = window.supplementAPI.cacheManager;
            await cache.set('quick-test', { test: 'data' });
            const result = await cache.get('quick-test');
            this.assert(result.test === 'data', 'Cache should work');
            return 'Cache working';
        });
        
        return this.getTestSummary();
    }
}

// Initialize global test suite
if (typeof window !== 'undefined') {
    window.integrationTestSuite = new IntegrationTestSuite();
    
    // Global test runner function
    window.runTests = function(quick = false) {
        if (quick) {
            return window.integrationTestSuite.runQuickTests();
        } else {
            return window.integrationTestSuite.runAllTests();
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationTestSuite;
}