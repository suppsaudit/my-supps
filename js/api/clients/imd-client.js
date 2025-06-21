// IMD API Client Implementation

class IMDAPIClient {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
        this.vpsEndpoint = config.vpsEndpoint;
        this.sourceIP = config.sourceIP || 'client-side';
        
        // Use proxy for global access
        this.useProxy = config.useProxy !== false; // Default to true
        this.proxyURL = config.proxyURL || '/api/imd-proxy';
        
        console.log('🇯🇵 IMD API Client initialized', this.useProxy ? '(via proxy)' : '(direct)');
    }
    
    async searchProducts(query) {
        try {
            console.log(`🔍 Searching IMD for: ${query}`);
            
            let url, requestOptions;
            
            if (this.useProxy) {
                // Use Vercel proxy for global access
                url = `${this.proxyURL}?endpoint=search`;
                requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: query,
                        search_type: 'comprehensive',
                        include_images: true,
                        include_nutrition: true,
                        max_results: 50
                    })
                };
            } else {
                // Direct API call
                url = `${this.baseURL}/search`;
                requestOptions = {
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
                };
            }
            
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                throw new Error(`IMD API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Handle proxy response format
            const results = this.useProxy ? data.data?.results || data.data || [] : data.results || [];
            
            console.log(`✅ IMD search returned ${results.length || 0} results`);
            
            return results;
        } catch (error) {
            console.error('❌ IMD search error:', error);
            // Return empty array instead of throwing to allow fallback
            return [];
        }
    }
    
    async getProductByJAN(janCode) {
        try {
            console.log(`📦 Fetching IMD product by JAN: ${janCode}`);
            
            let url, requestOptions;
            
            if (this.useProxy) {
                // Use Vercel proxy for global access
                url = `${this.proxyURL}?endpoint=barcode&code=${janCode}`;
                requestOptions = {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
            } else {
                // Direct API call
                url = `${this.baseURL}/product/jan/${janCode}`;
                requestOptions = {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Source-IP': this.getSourceIP()
                    }
                };
            }
            
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                throw new Error(`IMD API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Handle proxy response format
            const productData = this.useProxy ? data.data : data;
            
            console.log(`✅ IMD product found: ${productData.名称 || productData.name}`);
            
            return productData;
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