// Unified Supplement API Entry Point

// Import all necessary classes (in browser context, these would be loaded via script tags)
// const { NutritionFact, SupplementProduct } = require('./interfaces');
// const IMDAPIClient = require('./clients/imd-client');
// const IMDMapper = require('./mappers/imd-mapper');
// const DSLDMapper = require('./mappers/dsld-mapper');
// const UnifiedSupplementService = require('./services/unified-supplement-service');
// const { apiConfig, regionConfig } = require('./config');

// Initialize the unified API
let unifiedAPI = null;

// Initialize function to be called when the page loads
async function initializeUnifiedAPI() {
    try {
        console.log('🚀 Initializing Unified Supplement API...');
        
        // Create DSLD client (using existing implementation)
        const dsldClient = window.dsldApi || {
            searchProducts: async (query) => {
                // Fallback to existing DSLD implementation
                if (window.searchDSLD) {
                    return window.searchDSLD(query);
                }
                return [];
            },
            getProductByUPC: async (upc) => {
                // Fallback implementation
                return null;
            },
            healthCheck: async () => true
        };
        
        // Create IMD client
        const imdClient = new IMDAPIClient(apiConfig.imd);
        
        // Create unified service
        unifiedAPI = new UnifiedSupplementService(dsldClient, imdClient);
        
        // Test health check
        const health = await unifiedAPI.healthCheck();
        console.log('🏥 API Health Status:', health);
        
        // Make it globally available
        window.unifiedSupplementAPI = unifiedAPI;
        
        console.log('✅ Unified Supplement API initialized successfully');
        
        return unifiedAPI;
    } catch (error) {
        console.error('❌ Failed to initialize Unified Supplement API:', error);
        
        // Create a fallback API that only uses DSLD
        unifiedAPI = {
            searchProducts: async (query, region) => {
                if (region === 'JP') {
                    console.warn('⚠️ IMD API not available, returning empty results for JP region');
                    return [];
                }
                if (window.searchDSLD) {
                    const results = await window.searchDSLD(query);
                    return DSLDMapper.mapMultipleToUnified(results);
                }
                return [];
            },
            getProduct: async (identifier, region) => {
                if (region === 'JP') {
                    throw new Error('IMD API not available');
                }
                // Fallback implementation
                return null;
            },
            getProductImage: async (productId, region) => {
                return '';
            }
        };
        
        window.unifiedSupplementAPI = unifiedAPI;
        return unifiedAPI;
    }
}

// Helper function to get current region
function getCurrentRegion() {
    // Check localStorage for saved preference
    const savedRegion = localStorage.getItem('selectedRegion');
    if (savedRegion && (savedRegion === 'US' || savedRegion === 'JP')) {
        return savedRegion;
    }
    
    // Auto-detect based on browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('ja')) {
        return 'JP';
    }
    
    // Default to US
    return 'US';
}

// Helper function to set region
function setRegion(region) {
    if (region === 'US' || region === 'JP') {
        localStorage.setItem('selectedRegion', region);
        console.log(`🌍 Region set to: ${region}`);
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('regionChanged', { detail: { region } }));
    }
}

// Search function that uses current region
async function searchSupplements(query, options = {}) {
    if (!unifiedAPI) {
        await initializeUnifiedAPI();
    }
    
    const region = options.region || getCurrentRegion();
    return unifiedAPI.searchProducts(query, region, options);
}

// Get product function
async function getSupplementProduct(identifier, region) {
    if (!unifiedAPI) {
        await initializeUnifiedAPI();
    }
    
    region = region || getCurrentRegion();
    return unifiedAPI.getProduct(identifier, region);
}

// Auto-detect barcode region
async function getProductByBarcode(barcode) {
    if (!unifiedAPI) {
        await initializeUnifiedAPI();
    }
    
    return unifiedAPI.getProductByBarcode(barcode);
}

// Get popular products
async function getPopularSupplements(limit = 20) {
    if (!unifiedAPI) {
        await initializeUnifiedAPI();
    }
    
    const region = getCurrentRegion();
    return unifiedAPI.getPopularProducts(region, limit);
}

// Export functions for global use
window.supplementAPI = {
    initialize: initializeUnifiedAPI,
    search: searchSupplements,
    getProduct: getSupplementProduct,
    getProductByBarcode: getProductByBarcode,
    getPopular: getPopularSupplements,
    getCurrentRegion: getCurrentRegion,
    setRegion: setRegion,
    regionConfig: regionConfig
};

// Auto-initialize on load if config is available
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUnifiedAPI);
} else {
    initializeUnifiedAPI();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeUnifiedAPI,
        getCurrentRegion,
        setRegion,
        searchSupplements,
        getSupplementProduct,
        getProductByBarcode,
        getPopularSupplements
    };
}