// Advanced Cache Manager for API Cost Reduction
// Multi-layer caching strategy for optimal performance and cost efficiency

class CacheManager {
    constructor(config = {}) {
        this.config = {
            // Memory cache settings
            memoryMaxSize: config.memoryMaxSize || 100, // Max items in memory
            memoryTTL: config.memoryTTL || 5 * 60 * 1000, // 5 minutes
            
            // LocalStorage cache settings
            localStorageTTL: config.localStorageTTL || 60 * 60 * 1000, // 1 hour
            localStoragePrefix: config.localStoragePrefix || 'my-supps-cache',
            
            // IndexedDB cache settings (for large data)
            indexedDBName: config.indexedDBName || 'MySuppsCache',
            indexedDBVersion: config.indexedDBVersion || 1,
            indexedDBTTL: config.indexedDBTTL || 24 * 60 * 60 * 1000, // 24 hours
            
            // Performance settings
            compressionEnabled: config.compressionEnabled !== false,
            backgroundCleanup: config.backgroundCleanup !== false
        };
        
        // Memory cache
        this.memoryCache = new Map();
        this.memoryCacheStats = { hits: 0, misses: 0, sets: 0 };
        
        // IndexedDB promise
        this.indexedDBPromise = this.initIndexedDB();
        
        // Background cleanup
        if (this.config.backgroundCleanup) {
            this.startBackgroundCleanup();
        }
        
        console.log('💾 Cache Manager initialized with multi-layer strategy');
    }
    
    // === PUBLIC API ===
    
    async get(key) {
        const startTime = Date.now();
        
        try {
            // Layer 1: Memory cache (fastest)
            const memoryResult = this.getFromMemory(key);
            if (memoryResult) {
                this.memoryCacheStats.hits++;
                console.log(`📦 Cache HIT (memory): ${key} in ${Date.now() - startTime}ms`);
                return memoryResult;
            }
            
            // Layer 2: LocalStorage cache (fast)
            const localStorageResult = this.getFromLocalStorage(key);
            if (localStorageResult) {
                // Promote to memory cache
                this.setInMemory(key, localStorageResult);
                console.log(`📦 Cache HIT (localStorage): ${key} in ${Date.now() - startTime}ms`);
                return localStorageResult;
            }
            
            // Layer 3: IndexedDB cache (slower but larger)
            const indexedDBResult = await this.getFromIndexedDB(key);
            if (indexedDBResult) {
                // Promote to higher cache layers
                this.setInMemory(key, indexedDBResult);
                this.setInLocalStorage(key, indexedDBResult);
                console.log(`📦 Cache HIT (IndexedDB): ${key} in ${Date.now() - startTime}ms`);
                return indexedDBResult;
            }
            
            // Cache miss
            this.memoryCacheStats.misses++;
            console.log(`❌ Cache MISS: ${key} in ${Date.now() - startTime}ms`);
            return null;
            
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    async set(key, data, options = {}) {
        try {
            const ttl = options.ttl || this.config.memoryTTL;
            const size = this.estimateSize(data);
            
            // Always set in memory for fastest access
            this.setInMemory(key, data, ttl);
            this.memoryCacheStats.sets++;
            
            // Set in localStorage for persistence (if data is not too large)
            if (size < 1024 * 100) { // Less than 100KB
                this.setInLocalStorage(key, data);
            }
            
            // Set in IndexedDB for large data or long-term storage
            if (size > 1024 * 10 || options.persistent) { // More than 10KB or marked persistent
                await this.setInIndexedDB(key, data);
            }
            
            console.log(`💾 Cached: ${key} (${this.formatSize(size)}) across ${this.getStorageLayers(size).join(', ')}`);
            
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }
    
    async delete(key) {
        try {
            // Remove from all cache layers
            this.memoryCache.delete(key);
            localStorage.removeItem(`${this.config.localStoragePrefix}:${key}`);
            await this.deleteFromIndexedDB(key);
            
            console.log(`🗑️ Deleted from cache: ${key}`);
            
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }
    
    async clear() {
        try {
            // Clear all cache layers
            this.memoryCache.clear();
            this.clearLocalStorageCache();
            await this.clearIndexedDBCache();
            
            console.log('🧹 All caches cleared');
            
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
    
    getStats() {
        return {
            memory: {
                size: this.memoryCache.size,
                maxSize: this.config.memoryMaxSize,
                stats: this.memoryCacheStats
            },
            localStorage: {
                keys: this.getLocalStorageCacheKeys().length,
                estimatedSize: this.estimateLocalStorageSize()
            },
            hitRate: this.memoryCacheStats.hits / (this.memoryCacheStats.hits + this.memoryCacheStats.misses) || 0
        };
    }
    
    // === MEMORY CACHE ===
    
    getFromMemory(key) {
        const item = this.memoryCache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.memoryCache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    setInMemory(key, data, ttl = this.config.memoryTTL) {
        // Implement LRU eviction if cache is full
        if (this.memoryCache.size >= this.config.memoryMaxSize) {
            const oldestKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(oldestKey);
        }
        
        this.memoryCache.set(key, {
            data: data,
            expires: Date.now() + ttl,
            created: Date.now()
        });
    }
    
    // === LOCALSTORAGE CACHE ===
    
    getFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(`${this.config.localStoragePrefix}:${key}`);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            
            if (Date.now() > parsed.expires) {
                localStorage.removeItem(`${this.config.localStoragePrefix}:${key}`);
                return null;
            }
            
            return parsed.data;
            
        } catch (error) {
            console.error('LocalStorage cache error:', error);
            return null;
        }
    }
    
    setInLocalStorage(key, data) {
        try {
            const item = {
                data: data,
                expires: Date.now() + this.config.localStorageTTL,
                created: Date.now()
            };
            
            localStorage.setItem(`${this.config.localStoragePrefix}:${key}`, JSON.stringify(item));
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, cleaning up...');
                this.cleanupLocalStorageCache();
                // Try again after cleanup
                try {
                    localStorage.setItem(`${this.config.localStoragePrefix}:${key}`, JSON.stringify(item));
                } catch (secondError) {
                    console.error('LocalStorage still full after cleanup:', secondError);
                }
            } else {
                console.error('LocalStorage cache error:', error);
            }
        }
    }
    
    getLocalStorageCacheKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.config.localStoragePrefix)) {
                keys.push(key);
            }
        }
        return keys;
    }
    
    clearLocalStorageCache() {
        const keys = this.getLocalStorageCacheKeys();
        keys.forEach(key => localStorage.removeItem(key));
    }
    
    cleanupLocalStorageCache() {
        const keys = this.getLocalStorageCacheKeys();
        const items = [];
        
        keys.forEach(key => {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                items.push({ key, created: item.created, expires: item.expires });
            } catch (error) {
                // Remove corrupted items
                localStorage.removeItem(key);
            }
        });
        
        // Remove expired items first
        const now = Date.now();
        items.forEach(item => {
            if (now > item.expires) {
                localStorage.removeItem(item.key);
            }
        });
        
        // If still need space, remove oldest items
        const validItems = items.filter(item => now <= item.expires);
        if (validItems.length > 50) { // Keep only 50 most recent items
            validItems.sort((a, b) => a.created - b.created);
            const toRemove = validItems.slice(0, validItems.length - 50);
            toRemove.forEach(item => localStorage.removeItem(item.key));
        }
    }
    
    estimateLocalStorageSize() {
        const keys = this.getLocalStorageCacheKeys();
        let totalSize = 0;
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                totalSize += value.length * 2; // Rough UTF-16 estimation
            }
        });
        
        return totalSize;
    }
    
    // === INDEXEDDB CACHE ===
    
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported');
                resolve(null);
                return;
            }
            
            const request = indexedDB.open(this.config.indexedDBName, this.config.indexedDBVersion);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                resolve(null);
            };
            
            request.onsuccess = () => {
                console.log('💾 IndexedDB initialized');
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('cache')) {
                    const store = db.createObjectStore('cache', { keyPath: 'key' });
                    store.createIndex('expires', 'expires', { unique: false });
                    store.createIndex('created', 'created', { unique: false });
                }
            };
        });
    }
    
    async getFromIndexedDB(key) {
        try {
            const db = await this.indexedDBPromise;
            if (!db) return null;
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['cache'], 'readonly');
                const store = transaction.objectStore('cache');
                const request = store.get(key);
                
                request.onsuccess = () => {
                    const item = request.result;
                    if (!item || Date.now() > item.expires) {
                        if (item) {
                            // Delete expired item
                            this.deleteFromIndexedDB(key);
                        }
                        resolve(null);
                    } else {
                        resolve(item.data);
                    }
                };
                
                request.onerror = () => resolve(null);
            });
            
        } catch (error) {
            console.error('IndexedDB get error:', error);
            return null;
        }
    }
    
    async setInIndexedDB(key, data) {
        try {
            const db = await this.indexedDBPromise;
            if (!db) return;
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['cache'], 'readwrite');
                const store = transaction.objectStore('cache');
                
                const item = {
                    key: key,
                    data: data,
                    expires: Date.now() + this.config.indexedDBTTL,
                    created: Date.now(),
                    size: this.estimateSize(data)
                };
                
                const request = store.put(item);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
        } catch (error) {
            console.error('IndexedDB set error:', error);
        }
    }
    
    async deleteFromIndexedDB(key) {
        try {
            const db = await this.indexedDBPromise;
            if (!db) return;
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['cache'], 'readwrite');
                const store = transaction.objectStore('cache');
                const request = store.delete(key);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
        } catch (error) {
            console.error('IndexedDB delete error:', error);
        }
    }
    
    async clearIndexedDBCache() {
        try {
            const db = await this.indexedDBPromise;
            if (!db) return;
            
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['cache'], 'readwrite');
                const store = transaction.objectStore('cache');
                const request = store.clear();
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            
        } catch (error) {
            console.error('IndexedDB clear error:', error);
        }
    }
    
    // === UTILITY METHODS ===
    
    estimateSize(obj) {
        try {
            return JSON.stringify(obj).length * 2; // Rough UTF-16 estimation
        } catch (error) {
            return 0;
        }
    }
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }
    
    getStorageLayers(size) {
        const layers = ['memory'];
        
        if (size < 1024 * 100) {
            layers.push('localStorage');
        }
        
        if (size > 1024 * 10) {
            layers.push('IndexedDB');
        }
        
        return layers;
    }
    
    // Background cleanup
    startBackgroundCleanup() {
        // Clean up expired items every 5 minutes
        setInterval(() => {
            this.cleanupExpiredItems();
        }, 5 * 60 * 1000);
    }
    
    cleanupExpiredItems() {
        // Clean memory cache
        const now = Date.now();
        for (const [key, item] of this.memoryCache.entries()) {
            if (now > item.expires) {
                this.memoryCache.delete(key);
            }
        }
        
        // Clean localStorage cache
        this.cleanupLocalStorageCache();
        
        console.log('🧹 Background cleanup completed');
    }
    
    // Smart cache key generation
    static generateKey(prefix, params) {
        const sortedParams = Object.keys(params).sort().reduce((result, key) => {
            result[key] = params[key];
            return result;
        }, {});
        
        return `${prefix}:${JSON.stringify(sortedParams)}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}