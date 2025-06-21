// Unified Supplement Service Implementation

class UnifiedSupplementService {
    constructor(dsldClient, imdClient) {
        this.dsldClient = dsldClient;
        this.imdClient = imdClient;
        
        // Advanced cache manager for cost reduction
        this.cacheManager = new CacheManager({
            memoryMaxSize: 200,
            memoryTTL: 10 * 60 * 1000, // 10 minutes
            localStorageTTL: 2 * 60 * 60 * 1000, // 2 hours
            indexedDBTTL: 24 * 60 * 60 * 1000, // 24 hours
            compressionEnabled: true
        });
        
        // Enhanced error handler for robust operations
        this.errorHandler = new APIErrorHandler({
            maxRetries: 3,
            retryDelay: 1000,
            retryBackoff: 2,
            enableFallbackData: true,
            showUserNotifications: true
        });
        
        // Performance optimizer for 3-second response target
        this.performanceOptimizer = new PerformanceOptimizer({
            targetResponseTime: 3000,
            warningThreshold: 2000,
            enableRequestCoalescing: true,
            enablePreloading: true,
            enablePrefetching: true,
            maxConcurrentRequests: 6
        });
        
        // Legacy cache for backward compatibility
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        console.log('🌐 Unified Supplement Service initialized with advanced caching and error handling');
    }
    
    async getProduct(identifier, region = 'US') {
        const cacheKey = CacheManager.generateKey('product', { identifier, region });
        
        return this.performanceOptimizer.optimizedRequest(
            () => this.errorHandler.executeWithRetry(
                async () => {
                    // Check advanced cache first
                    const cached = await this.cacheManager.get(cacheKey);
                    if (cached) {
                        console.log(`📦 Returning cached product: ${cached.name}`);
                        // Trigger prefetching for related data
                        this.performanceOptimizer.prefetchRelatedData(cached, region);
                        return cached;
                    }
                    
                    console.log(`🔍 Fetching product ${identifier} for region ${region}`);
                    
                    let product;
                    if (region === 'JP') {
                        const imdData = await this.imdClient.getProductByJAN(identifier);
                        product = IMDMapper.mapToUnified(imdData);
                    } else {
                        const dsldData = await this.dsldClient.getProductByUPC(identifier);
                        product = DSLDMapper.mapToUnified(dsldData);
                    }
                    
                    // Cache the result and save as fallback
                    if (product) {
                        await this.cacheManager.set(cacheKey, product, {
                            persistent: true
                        });
                        await this.errorHandler.saveFallbackData(`product-${region}`, [product]);
                        
                        // Trigger prefetching for related data
                        this.performanceOptimizer.prefetchRelatedData(product, region);
                    }
                    
                    return product;
                },
                {
                    endpoint: `getProduct-${region}`,
                    userMessage: '商品情報の取得に失敗しました。キャッシュされたデータを表示します。',
                    timeout: 8000
                }
            ),
            cacheKey,
            { timeout: 3000 }
        );
    }
    
    async searchProducts(query, region = 'US', options = {}) {
        const cacheKey = CacheManager.generateKey('search', { query, region, options });
        
        const result = await this.performanceOptimizer.optimizedRequest(
            () => this.errorHandler.executeWithRetry(
                async () => {
                    // Check advanced cache first
                    const cached = await this.cacheManager.get(cacheKey);
                    if (cached) {
                        console.log(`📦 Returning cached search results for: ${query}`);
                        return cached;
                    }
                    
                    console.log(`🔍 Searching products "${query}" for region ${region}`);
                    
                    let products = [];
                    
                    if (region === 'JP') {
                        const imdResults = await this.imdClient.searchProducts(query);
                        products = IMDMapper.mapMultipleToUnified(imdResults);
                    } else {
                        const dsldResults = await this.dsldClient.searchProducts(query);
                        products = DSLDMapper.mapMultipleToUnified(dsldResults);
                    }
                    
                    // Apply any additional filters from options
                    if (options.category) {
                        products = products.filter(p => 
                            p.category?.toLowerCase().includes(options.category.toLowerCase())
                        );
                    }
                    
                    if (options.brand) {
                        products = products.filter(p => 
                            p.brand?.toLowerCase().includes(options.brand.toLowerCase())
                        );
                    }
                    
                    // Sort by relevance (basic implementation)
                    products = this.sortByRelevance(products, query);
                    
                    // Limit results if specified
                    if (options.limit) {
                        products = products.slice(0, options.limit);
                    }
                    
                    // Cache the results and save as fallback
                    await this.cacheManager.set(cacheKey, products, {
                        ttl: 15 * 60 * 1000
                    });
                    
                    if (products.length > 0) {
                        await this.errorHandler.saveFallbackData(`search-${region}`, products.slice(0, 10));
                    }
                    
                    console.log(`✅ Found ${products.length} products for "${query}" in ${region}`);
                    return products;
                },
                {
                    endpoint: `searchProducts-${region}`,
                    userMessage: `「${query}」の検索に失敗しました。キャッシュされた結果を表示します。`,
                    timeout: 10000,
                    fallbackData: []
                }
            ),
            cacheKey,
            { timeout: 3000 }
        );
        
        // Handle error handler response format
        return result.data || result || [];
    }
    
    async getProductImage(productId, region = 'US') {
        try {
            const product = await this.getProduct(productId, region);
            return product.images.label || product.images.thumbnail || '';
        } catch (error) {
            console.error(`❌ Failed to get product image for ${productId}:`, error);
            return '';
        }
    }
    
    // Advanced search with multi-region support
    async searchMultiRegion(query, options = {}) {
        try {
            console.log(`🌍 Searching across multiple regions for: ${query}`);
            
            const results = await Promise.allSettled([
                this.searchProducts(query, 'US', options),
                this.searchProducts(query, 'JP', options)
            ]);
            
            const allProducts = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    allProducts.push(...result.value);
                } else {
                    console.error(`❌ Search failed for region ${index === 0 ? 'US' : 'JP'}:`, result.reason);
                }
            });
            
            // Remove duplicates based on identifier
            const uniqueProducts = this.removeDuplicates(allProducts);
            
            console.log(`✅ Found ${uniqueProducts.length} unique products across regions`);
            return uniqueProducts;
        } catch (error) {
            console.error('❌ Multi-region search failed:', error);
            return [];
        }
    }
    
    // Get product by barcode (auto-detect region)
    async getProductByBarcode(barcode) {
        try {
            console.log(`📷 Auto-detecting region for barcode: ${barcode}`);
            
            // Japanese JAN codes typically start with 45 or 49
            const isJapanese = barcode.startsWith('45') || barcode.startsWith('49');
            const region = isJapanese ? 'JP' : 'US';
            
            console.log(`🎯 Detected region: ${region}`);
            return this.getProduct(barcode, region);
        } catch (error) {
            console.error(`❌ Failed to get product by barcode ${barcode}:`, error);
            throw error;
        }
    }
    
    // Get popular products by region
    async getPopularProducts(region = 'US', limit = 20) {
        try {
            const cacheKey = CacheManager.generateKey('popular', { region, limit });
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }
            
            console.log(`⭐ Fetching popular products for ${region}`);
            
            // This would typically query a popularity endpoint
            // For now, we'll search for common terms
            const popularTerms = region === 'JP' 
                ? ['ビタミン', 'カルシウム', 'DHA', 'コラーゲン', '乳酸菌']
                : ['vitamin', 'calcium', 'omega', 'probiotics', 'multivitamin'];
            
            const allProducts = [];
            
            for (const term of popularTerms) {
                const products = await this.searchProducts(term, region, { limit: 5 });
                allProducts.push(...products);
            }
            
            // Remove duplicates and limit
            const uniqueProducts = this.removeDuplicates(allProducts).slice(0, limit);
            
            // Cache popular products for longer (4 hours)
            await this.cacheManager.set(cacheKey, uniqueProducts, {
                ttl: 4 * 60 * 60 * 1000,
                persistent: true
            });
            
            return uniqueProducts;
        } catch (error) {
            console.error(`❌ Failed to get popular products for ${region}:`, error);
            return [];
        }
    }
    
    // Utility methods
    
    sortByRelevance(products, query) {
        const queryLower = query.toLowerCase();
        
        return products.sort((a, b) => {
            // Exact name match gets highest priority
            const aNameMatch = a.name.toLowerCase() === queryLower ? 1000 : 0;
            const bNameMatch = b.name.toLowerCase() === queryLower ? 1000 : 0;
            
            // Name contains query
            const aNameContains = a.name.toLowerCase().includes(queryLower) ? 100 : 0;
            const bNameContains = b.name.toLowerCase().includes(queryLower) ? 100 : 0;
            
            // Brand match
            const aBrandMatch = a.brand.toLowerCase().includes(queryLower) ? 50 : 0;
            const bBrandMatch = b.brand.toLowerCase().includes(queryLower) ? 50 : 0;
            
            // Calculate total scores
            const aScore = aNameMatch + aNameContains + aBrandMatch;
            const bScore = bNameMatch + bNameContains + bBrandMatch;
            
            return bScore - aScore;
        });
    }
    
    removeDuplicates(products) {
        const seen = new Set();
        return products.filter(product => {
            const key = `${product.identifier}-${product.region}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    
    // Cache management
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }
    
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    async clearCache() {
        // Clear both legacy and advanced cache
        this.cache.clear();
        await this.cacheManager.clear();
        console.log('🧹 All caches cleared');
    }
    
    // Get cache statistics
    getCacheStats() {
        return this.cacheManager.getStats();
    }
    
    // Get performance metrics
    getPerformanceMetrics() {
        return this.performanceOptimizer.getMetrics();
    }
    
    // Get error statistics
    getErrorStats() {
        return this.errorHandler.getErrorStats();
    }
    
    // Comprehensive system health check
    async getSystemHealth() {
        const [health, cacheStats, performanceMetrics, errorStats] = await Promise.allSettled([
            this.healthCheck(),
            Promise.resolve(this.getCacheStats()),
            Promise.resolve(this.getPerformanceMetrics()),
            Promise.resolve(this.getErrorStats())
        ]);
        
        return {
            apis: health.status === 'fulfilled' ? health.value : null,
            cache: cacheStats.status === 'fulfilled' ? cacheStats.value : null,
            performance: performanceMetrics.status === 'fulfilled' ? performanceMetrics.value : null,
            errors: errorStats.status === 'fulfilled' ? errorStats.value : null,
            timestamp: new Date().toISOString()
        };
    }
    
    // Health check
    async healthCheck() {
        const results = {
            dsld: false,
            imd: false
        };
        
        try {
            // Check DSLD
            if (this.dsldClient && this.dsldClient.healthCheck) {
                results.dsld = await this.dsldClient.healthCheck();
            }
        } catch (error) {
            console.error('DSLD health check failed:', error);
        }
        
        try {
            // Check IMD
            if (this.imdClient && this.imdClient.healthCheck) {
                results.imd = await this.imdClient.healthCheck();
            }
        } catch (error) {
            console.error('IMD health check failed:', error);
        }
        
        console.log('🏥 Health check results:', results);
        return results;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedSupplementService;
}