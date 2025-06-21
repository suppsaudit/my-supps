// Performance Optimizer for 3-Second Response Time Target
// Implements various optimization strategies for API operations

class PerformanceOptimizer {
    constructor(config = {}) {
        this.config = {
            // Performance targets
            targetResponseTime: config.targetResponseTime || 3000, // 3 seconds
            warningThreshold: config.warningThreshold || 2000, // 2 seconds
            
            // Optimization strategies
            enableRequestCoalescing: config.enableRequestCoalescing !== false,
            enablePreloading: config.enablePreloading !== false,
            enablePrefetching: config.enablePrefetching !== false,
            enableParallelization: config.enableParallelization !== false,
            
            // Resource management
            maxConcurrentRequests: config.maxConcurrentRequests || 6,
            requestQueue: [],
            activeRequests: new Set(),
            
            // Preloading configuration
            preloadPopularProducts: config.preloadPopularProducts !== false,
            preloadCriticalData: config.preloadCriticalData !== false
        };
        
        // Performance metrics
        this.metrics = {
            requestTimes: [],
            cacheHitRate: 0,
            totalRequests: 0,
            slowRequests: 0,
            averageResponseTime: 0,
            p95ResponseTime: 0
        };
        
        // Request deduplication map
        this.pendingRequests = new Map();
        
        console.log('⚡ Performance Optimizer initialized');
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        // Initialize preloading if enabled
        if (this.config.enablePreloading) {
            this.initializePreloading();
        }
    }
    
    // === REQUEST OPTIMIZATION ===
    
    async optimizedRequest(requestFunction, cacheKey, options = {}) {
        const startTime = Date.now();
        
        try {
            // Check for duplicate requests (request coalescing)
            if (this.config.enableRequestCoalescing && this.pendingRequests.has(cacheKey)) {
                console.log(`🔄 Coalescing request for: ${cacheKey}`);
                return await this.pendingRequests.get(cacheKey);
            }
            
            // Create request promise
            const requestPromise = this.executeOptimizedRequest(requestFunction, options);
            
            // Store pending request for coalescing
            if (this.config.enableRequestCoalescing) {
                this.pendingRequests.set(cacheKey, requestPromise);
            }
            
            const result = await requestPromise;
            
            // Record performance metrics
            const responseTime = Date.now() - startTime;
            this.recordMetrics(responseTime, cacheKey, result);
            
            // Cleanup pending request
            this.pendingRequests.delete(cacheKey);
            
            return result;
            
        } catch (error) {
            // Cleanup on error
            this.pendingRequests.delete(cacheKey);
            
            const responseTime = Date.now() - startTime;
            this.recordMetrics(responseTime, cacheKey, null, error);
            
            throw error;
        }
    }
    
    async executeOptimizedRequest(requestFunction, options) {
        // Wait for available slot if max concurrent requests reached
        await this.waitForSlot();
        
        const requestId = `req-${Date.now()}-${Math.random()}`;
        this.activeRequests.add(requestId);
        
        try {
            // Add timeout to prevent hanging requests
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), this.config.targetResponseTime);
            });
            
            const result = await Promise.race([
                requestFunction(),
                timeoutPromise
            ]);
            
            return result;
            
        } finally {
            this.activeRequests.delete(requestId);
            this.processQueue();
        }
    }
    
    async waitForSlot() {
        if (this.activeRequests.size < this.config.maxConcurrentRequests) {
            return; // Slot available
        }
        
        // Wait for a slot to become available
        return new Promise((resolve) => {
            this.config.requestQueue.push(resolve);
        });
    }
    
    processQueue() {
        if (this.config.requestQueue.length > 0 && this.activeRequests.size < this.config.maxConcurrentRequests) {
            const nextRequest = this.config.requestQueue.shift();
            nextRequest();
        }
    }
    
    // === PARALLEL PROCESSING ===
    
    async parallelRequests(requests, options = {}) {
        if (!this.config.enableParallelization || requests.length <= 1) {
            // Sequential execution
            const results = [];
            for (const request of requests) {
                results.push(await request());
            }
            return results;
        }
        
        console.log(`⚡ Executing ${requests.length} requests in parallel`);
        
        // Use Promise.allSettled for parallel execution with error tolerance
        const results = await Promise.allSettled(
            requests.map(request => this.executeOptimizedRequest(request, options))
        );
        
        return results.map(result => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error('Parallel request failed:', result.reason);
                return null;
            }
        }).filter(result => result !== null);
    }
    
    // === PRELOADING AND PREFETCHING ===
    
    async initializePreloading() {
        try {
            console.log('🚀 Starting critical data preloading...');
            
            // Preload popular products for both regions
            if (this.config.preloadPopularProducts) {
                this.preloadPopularProducts();
            }
            
            // Preload critical configuration data
            if (this.config.preloadCriticalData) {
                this.preloadCriticalData();
            }
            
        } catch (error) {
            console.error('Preloading failed:', error);
        }
    }
    
    async preloadPopularProducts() {
        try {
            const regions = ['US', 'JP'];
            const preloadPromises = regions.map(async (region) => {
                if (window.supplementAPI) {
                    const products = await window.supplementAPI.getPopular(10);
                    console.log(`📦 Preloaded ${products.length} popular products for ${region}`);
                    return products;
                }
                return [];
            });
            
            await Promise.allSettled(preloadPromises);
            
        } catch (error) {
            console.error('Popular products preloading failed:', error);
        }
    }
    
    async preloadCriticalData() {
        try {
            // Preload health check data
            if (window.fetch) {
                fetch('/api/health', { method: 'GET' })
                    .then(response => response.json())
                    .then(data => {
                        console.log('🏥 Health check data preloaded');
                    })
                    .catch(error => {
                        console.warn('Health check preload failed:', error);
                    });
            }
            
        } catch (error) {
            console.error('Critical data preloading failed:', error);
        }
    }
    
    // Intelligent prefetching based on user behavior
    async prefetchRelatedData(currentProduct, region) {
        if (!this.config.enablePrefetching || !currentProduct) {
            return;
        }
        
        try {
            console.log(`🔮 Prefetching related data for: ${currentProduct.name}`);
            
            // Prefetch related products by category
            if (currentProduct.category && window.supplementAPI) {
                setTimeout(async () => {
                    try {
                        await window.supplementAPI.search(currentProduct.category, {
                            region: region,
                            limit: 5
                        });
                        console.log(`📦 Prefetched related products for category: ${currentProduct.category}`);
                    } catch (error) {
                        console.warn('Related products prefetch failed:', error);
                    }
                }, 1000); // Delay to not interfere with current request
            }
            
            // Prefetch products from same brand
            if (currentProduct.brand && window.supplementAPI) {
                setTimeout(async () => {
                    try {
                        await window.supplementAPI.search(currentProduct.brand, {
                            region: region,
                            limit: 3
                        });
                        console.log(`📦 Prefetched products for brand: ${currentProduct.brand}`);
                    } catch (error) {
                        console.warn('Brand products prefetch failed:', error);
                    }
                }, 2000);
            }
            
        } catch (error) {
            console.error('Prefetching failed:', error);
        }
    }
    
    // === PERFORMANCE MONITORING ===
    
    recordMetrics(responseTime, cacheKey, result, error = null) {
        this.metrics.totalRequests++;
        this.metrics.requestTimes.push(responseTime);
        
        if (responseTime > this.config.warningThreshold) {
            this.metrics.slowRequests++;
            console.warn(`⚠️ Slow request: ${cacheKey} took ${responseTime}ms`);
        }
        
        if (responseTime > this.config.targetResponseTime) {
            console.error(`🐌 Request exceeded target: ${cacheKey} took ${responseTime}ms`);
        }
        
        // Update running averages
        this.updateAverages();
        
        // Log successful fast requests
        if (!error && responseTime < this.config.warningThreshold) {
            console.log(`⚡ Fast request: ${cacheKey} in ${responseTime}ms`);
        }
    }
    
    updateAverages() {
        const times = this.metrics.requestTimes;
        
        if (times.length === 0) return;
        
        // Calculate average
        this.metrics.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
        
        // Calculate P95 (95th percentile)
        const sorted = [...times].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        this.metrics.p95ResponseTime = sorted[p95Index] || 0;
        
        // Keep only recent metrics (last 100 requests)
        if (times.length > 100) {
            this.metrics.requestTimes = times.slice(-100);
        }
    }
    
    startPerformanceMonitoring() {
        // Log performance summary every 30 seconds
        setInterval(() => {
            this.logPerformanceSummary();
        }, 30000);
    }
    
    logPerformanceSummary() {
        if (this.metrics.totalRequests === 0) return;
        
        const slowRequestRate = (this.metrics.slowRequests / this.metrics.totalRequests * 100).toFixed(1);
        
        console.group('📊 Performance Summary');
        console.log(`Total Requests: ${this.metrics.totalRequests}`);
        console.log(`Average Response Time: ${Math.round(this.metrics.averageResponseTime)}ms`);
        console.log(`P95 Response Time: ${Math.round(this.metrics.p95ResponseTime)}ms`);
        console.log(`Slow Request Rate: ${slowRequestRate}%`);
        console.log(`Active Requests: ${this.activeRequests.size}`);
        console.log(`Queued Requests: ${this.config.requestQueue.length}`);
        console.groupEnd();
        
        // Show warning if performance is degrading
        if (this.metrics.averageResponseTime > this.config.warningThreshold) {
            console.warn('⚠️ Performance degradation detected. Consider optimization strategies.');
        }
    }
    
    // === RESOURCE MANAGEMENT ===
    
    async optimizeMemoryUsage() {
        try {
            // Clear old cache entries
            if (window.supplementAPI && window.supplementAPI.cacheManager) {
                const stats = window.supplementAPI.cacheManager.getStats();
                
                // Clear cache if memory usage is high
                if (stats.memory.size > stats.memory.maxSize * 0.8) {
                    console.log('🧹 Clearing cache due to high memory usage');
                    await window.supplementAPI.cacheManager.clear();
                }
            }
            
            // Force garbage collection if available
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
                console.log('🗑️ Garbage collection triggered');
            }
            
        } catch (error) {
            console.error('Memory optimization failed:', error);
        }
    }
    
    // === PUBLIC API ===
    
    getMetrics() {
        return {
            ...this.metrics,
            performanceGrade: this.calculatePerformanceGrade(),
            recommendations: this.getPerformanceRecommendations()
        };
    }
    
    calculatePerformanceGrade() {
        if (this.metrics.averageResponseTime <= 1000) return 'A';
        if (this.metrics.averageResponseTime <= 2000) return 'B';
        if (this.metrics.averageResponseTime <= 3000) return 'C';
        if (this.metrics.averageResponseTime <= 5000) return 'D';
        return 'F';
    }
    
    getPerformanceRecommendations() {
        const recommendations = [];
        
        if (this.metrics.averageResponseTime > this.config.targetResponseTime) {
            recommendations.push('Consider implementing more aggressive caching');
        }
        
        if (this.metrics.slowRequests / this.metrics.totalRequests > 0.2) {
            recommendations.push('High slow request rate - check network conditions');
        }
        
        if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
            recommendations.push('Consider increasing max concurrent requests');
        }
        
        return recommendations;
    }
    
    resetMetrics() {
        this.metrics = {
            requestTimes: [],
            cacheHitRate: 0,
            totalRequests: 0,
            slowRequests: 0,
            averageResponseTime: 0,
            p95ResponseTime: 0
        };
        console.log('📊 Performance metrics reset');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}