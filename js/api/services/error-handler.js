// Enhanced Error Handler for Robust API Operations
// Provides fallback strategies and user-friendly error messaging

class APIErrorHandler {
    constructor(config = {}) {
        this.config = {
            // Retry configuration
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            retryBackoff: config.retryBackoff || 2, // Exponential backoff multiplier
            
            // Timeout configuration
            defaultTimeout: config.defaultTimeout || 10000,
            
            // Fallback data configuration
            enableFallbackData: config.enableFallbackData !== false,
            fallbackCacheKey: config.fallbackCacheKey || 'api-fallback-data',
            
            // User notification configuration
            showUserNotifications: config.showUserNotifications !== false,
            notificationDuration: config.notificationDuration || 5000
        };
        
        // Error statistics
        this.errorStats = {
            total: 0,
            byType: {},
            byEndpoint: {},
            fallbackUsed: 0,
            retrySuccessful: 0
        };
        
        console.log('🛡️ API Error Handler initialized');
    }
    
    // === PUBLIC API ===
    
    async executeWithRetry(operation, context = {}) {
        const { 
            endpoint = 'unknown',
            fallbackData = null,
            userMessage = null,
            retries = this.config.maxRetries 
        } = context;
        
        let lastError = null;
        let attempt = 0;
        
        while (attempt <= retries) {
            try {
                // Add timeout to operation if not already present
                const result = await this.withTimeout(operation(), context.timeout);
                
                // Track successful retry
                if (attempt > 0) {
                    this.errorStats.retrySuccessful++;
                    console.log(`✅ Operation succeeded on attempt ${attempt + 1} for ${endpoint}`);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                attempt++;
                
                // Track error statistics
                this.trackError(error, endpoint);
                
                console.error(`❌ Attempt ${attempt} failed for ${endpoint}:`, error.message);
                
                // Don't retry on certain types of errors
                if (this.isNonRetryableError(error) || attempt > retries) {
                    break;
                }
                
                // Wait before retrying with exponential backoff
                if (attempt <= retries) {
                    const delay = this.config.retryDelay * Math.pow(this.config.retryBackoff, attempt - 1);
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        
        // All retries failed, handle the error
        return this.handleFailedOperation(lastError, context);
    }
    
    async handleFailedOperation(error, context) {
        const { endpoint, fallbackData, userMessage } = context;
        
        console.error(`🚨 All retries failed for ${endpoint}:`, error);
        
        // Try to get fallback data
        const fallback = await this.getFallbackData(endpoint, fallbackData);
        
        if (fallback) {
            this.errorStats.fallbackUsed++;
            console.log(`📦 Using fallback data for ${endpoint}`);
            
            // Show user notification about using cached data
            if (this.config.showUserNotifications) {
                this.showUserNotification({
                    type: 'warning',
                    title: 'オフラインデータを使用中',
                    message: 'ネットワークエラーのため、キャッシュされたデータを表示しています。',
                    duration: this.config.notificationDuration
                });
            }
            
            return {
                data: fallback,
                isFromCache: true,
                error: error,
                endpoint: endpoint
            };
        }
        
        // No fallback available, show user-friendly error
        if (this.config.showUserNotifications) {
            const notification = this.getUserFriendlyError(error, userMessage);
            this.showUserNotification(notification);
        }
        
        // Return empty result instead of throwing
        return this.getEmptyResult(endpoint, error);
    }
    
    // === ERROR CLASSIFICATION ===
    
    isNonRetryableError(error) {
        // Client-side errors that shouldn't be retried
        const nonRetryablePatterns = [
            /4[0-9][0-9]/, // 4xx status codes
            /authentication/i,
            /authorization/i,
            /invalid.*key/i,
            /permission.*denied/i,
            /quota.*exceeded/i
        ];
        
        const errorMessage = error.message || error.toString();
        
        return nonRetryablePatterns.some(pattern => pattern.test(errorMessage));
    }
    
    getUserFriendlyError(error, customMessage) {
        if (customMessage) {
            return {
                type: 'error',
                title: 'エラーが発生しました',
                message: customMessage,
                duration: this.config.notificationDuration
            };
        }
        
        // Map technical errors to user-friendly messages
        const errorMessage = error.message || error.toString();
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return {
                type: 'error',
                title: 'ネットワークエラー',
                message: 'インターネット接続を確認してください。',
                duration: this.config.notificationDuration
            };
        }
        
        if (errorMessage.includes('timeout')) {
            return {
                type: 'error',
                title: 'タイムアウト',
                message: 'サーバーの応答に時間がかかっています。しばらく待ってから再試行してください。',
                duration: this.config.notificationDuration
            };
        }
        
        if (errorMessage.includes('404')) {
            return {
                type: 'warning',
                title: 'データが見つかりません',
                message: '指定された商品が見つかりませんでした。',
                duration: this.config.notificationDuration
            };
        }
        
        if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
            return {
                type: 'error',
                title: 'サーバーエラー',
                message: 'サーバーで一時的な問題が発生しています。しばらく待ってから再試行してください。',
                duration: this.config.notificationDuration
            };
        }
        
        // Generic error message
        return {
            type: 'error',
            title: 'エラーが発生しました',
            message: 'システムで問題が発生しました。ページを再読み込みしてください。',
            duration: this.config.notificationDuration
        };
    }
    
    // === FALLBACK DATA MANAGEMENT ===
    
    async getFallbackData(endpoint, providedFallback) {
        // First try provided fallback data
        if (providedFallback) {
            return providedFallback;
        }
        
        // Try to get from cache
        try {
            if (window.supplementAPI && window.supplementAPI.cacheManager) {
                const cacheKey = `fallback:${endpoint}`;
                const cached = await window.supplementAPI.cacheManager.get(cacheKey);
                if (cached) {
                    console.log(`📦 Retrieved fallback data from cache for ${endpoint}`);
                    return cached;
                }
            }
        } catch (error) {
            console.error('Failed to get fallback from cache:', error);
        }
        
        // Try localStorage as last resort
        try {
            const localFallback = localStorage.getItem(`${this.config.fallbackCacheKey}:${endpoint}`);
            if (localFallback) {
                console.log(`💾 Retrieved fallback data from localStorage for ${endpoint}`);
                return JSON.parse(localFallback);
            }
        } catch (error) {
            console.error('Failed to get fallback from localStorage:', error);
        }
        
        // Generate minimal fallback data based on endpoint
        return this.generateMinimalFallback(endpoint);
    }
    
    async saveFallbackData(endpoint, data) {
        if (!this.config.enableFallbackData || !data) {
            return;
        }
        
        try {
            // Save to cache if available
            if (window.supplementAPI && window.supplementAPI.cacheManager) {
                const cacheKey = `fallback:${endpoint}`;
                await window.supplementAPI.cacheManager.set(cacheKey, data, {
                    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
                    persistent: true
                });
            }
            
            // Also save to localStorage as backup
            localStorage.setItem(
                `${this.config.fallbackCacheKey}:${endpoint}`,
                JSON.stringify(data)
            );
            
            console.log(`💾 Saved fallback data for ${endpoint}`);
            
        } catch (error) {
            console.error('Failed to save fallback data:', error);
        }
    }
    
    generateMinimalFallback(endpoint) {
        // Generate basic fallback data structure based on endpoint type
        if (endpoint.includes('search') || endpoint.includes('products')) {
            return [];
        }
        
        if (endpoint.includes('product') || endpoint.includes('supplement')) {
            return {
                id: 'unknown',
                name: '商品情報を取得できませんでした',
                brand: '不明',
                category: 'その他',
                nutrients: [],
                images: { thumbnail: '', label: '' },
                servingSize: '不明',
                isOffline: true
            };
        }
        
        return null;
    }
    
    getEmptyResult(endpoint, error) {
        if (endpoint.includes('search') || endpoint.includes('products')) {
            return {
                data: [],
                isFromCache: false,
                error: error,
                endpoint: endpoint,
                isEmpty: true
            };
        }
        
        return {
            data: null,
            isFromCache: false,
            error: error,
            endpoint: endpoint,
            isEmpty: true
        };
    }
    
    // === UTILITY METHODS ===
    
    async withTimeout(promise, timeout = this.config.defaultTimeout) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
        });
        
        return Promise.race([promise, timeoutPromise]);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    trackError(error, endpoint) {
        this.errorStats.total++;
        
        const errorType = this.categorizeError(error);
        this.errorStats.byType[errorType] = (this.errorStats.byType[errorType] || 0) + 1;
        this.errorStats.byEndpoint[endpoint] = (this.errorStats.byEndpoint[endpoint] || 0) + 1;
        
        // Log error pattern for debugging
        console.warn(`🔍 Error pattern: ${errorType} on ${endpoint}`);
    }
    
    categorizeError(error) {
        const message = error.message || error.toString();
        
        if (message.includes('network') || message.includes('fetch failed')) return 'network';
        if (message.includes('timeout')) return 'timeout';
        if (message.includes('404')) return 'not_found';
        if (message.includes('500')) return 'server_error';
        if (message.includes('401') || message.includes('403')) return 'auth_error';
        if (message.includes('cors')) return 'cors_error';
        
        return 'unknown';
    }
    
    showUserNotification(notification) {
        // Integration with notification system
        if (window.showNotification) {
            window.showNotification(notification);
        } else {
            // Fallback to console for development
            console.log(`🔔 Notification: ${notification.title} - ${notification.message}`);
        }
    }
    
    // === PUBLIC STATISTICS ===
    
    getErrorStats() {
        return {
            ...this.errorStats,
            errorRate: this.errorStats.total / (this.errorStats.total + this.errorStats.retrySuccessful + 1),
            fallbackRate: this.errorStats.fallbackUsed / (this.errorStats.total + 1)
        };
    }
    
    resetStats() {
        this.errorStats = {
            total: 0,
            byType: {},
            byEndpoint: {},
            fallbackUsed: 0,
            retrySuccessful: 0
        };
        console.log('📊 Error statistics reset');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIErrorHandler;
}