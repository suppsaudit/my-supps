// IMD API Client Implementation

class IMDAPIClient {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
        this.vpsEndpoint = config.vpsEndpoint;
        this.sourceIP = config.sourceIP || 'client-side';
        
        console.log('🇯🇵 IMD API Client initialized');
    }
    
    async searchProducts(query) {
        try {
            console.log(`🔍 Searching IMD for: ${query}`);
            
            const response = await fetch(`${this.baseURL}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Source-IP': this.getSourceIP()
                },
                body: JSON.stringify({
                    query: query,
                    search_type: 'comprehensive',
                    include_images: true,
                    include_nutrition: true,
                    max_results: 50
                })
            });
            
            if (!response.ok) {
                throw new Error(`IMD API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ IMD search returned ${data.results?.length || 0} results`);
            
            return data.results || [];
        } catch (error) {
            console.error('❌ IMD search error:', error);
            // Return empty array instead of throwing to allow fallback
            return [];
        }
    }
    
    async getProductByJAN(janCode) {
        try {
            console.log(`📦 Fetching IMD product by JAN: ${janCode}`);
            
            const response = await fetch(`${this.baseURL}/product/jan/${janCode}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Source-IP': this.getSourceIP()
                }
            });
            
            if (!response.ok) {
                throw new Error(`IMD API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ IMD product found: ${data.名称}`);
            
            return data;
        } catch (error) {
            console.error('❌ IMD product fetch error:', error);
            throw error;
        }
    }
    
    async getProductById(productId) {
        try {
            console.log(`📦 Fetching IMD product by ID: ${productId}`);
            
            const response = await fetch(`${this.baseURL}/product/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Source-IP': this.getSourceIP()
                }
            });
            
            if (!response.ok) {
                throw new Error(`IMD API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ IMD product found: ${data.名称}`);
            
            return data;
        } catch (error) {
            console.error('❌ IMD product fetch error:', error);
            throw error;
        }
    }
    
    getSourceIP() {
        // In client-side context, this would be handled by a proxy server
        // For now, return a placeholder
        return this.sourceIP || 'client-proxy';
    }
    
    // Additional utility methods
    
    async getCategories() {
        try {
            const response = await fetch(`${this.baseURL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Source-IP': this.getSourceIP()
                }
            });
            
            if (!response.ok) {
                throw new Error(`IMD API Error: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('❌ IMD categories fetch error:', error);
            return [];
        }
    }
    
    async getBrands() {
        try {
            const response = await fetch(`${this.baseURL}/brands`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Source-IP': this.getSourceIP()
                }
            });
            
            if (!response.ok) {
                throw new Error(`IMD API Error: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('❌ IMD brands fetch error:', error);
            return [];
        }
    }
    
    // Health check method
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('❌ IMD health check failed:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IMDAPIClient;
}