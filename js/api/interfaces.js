// Unified Supplement API Interfaces and Data Structures

// Nutrition fact structure
class NutritionFact {
    constructor(name, amount, unit, dailyValue = null) {
        this.name = name;
        this.amount = amount;
        this.unit = unit;
        this.dailyValue = dailyValue; // %DV for US, 日本基準 for JP
    }
}

// Unified supplement product structure
class SupplementProduct {
    constructor() {
        this.id = '';
        this.name = '';
        this.brand = '';
        this.identifier = ''; // UPC(US) or JANCode(JP)
        this.servingSize = '';
        this.container = '';
        this.images = {
            thumbnail: '',
            label: ''
        };
        this.nutritionFacts = [];
        this.usage = {
            servingAmount: '',
            instructions: '',
            warnings: []
        };
        this.region = 'US'; // 'US' | 'JP'
        this.source = 'DSLD'; // 'DSLD' | 'IMD'
    }
}

// Abstract unified API interface
class UnifiedSupplementAPI {
    async getProduct(identifier, region) {
        throw new Error('getProduct must be implemented');
    }
    
    async searchProducts(query, region) {
        throw new Error('searchProducts must be implemented');
    }
    
    async getProductImage(productId, region) {
        throw new Error('getProductImage must be implemented');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NutritionFact, SupplementProduct, UnifiedSupplementAPI };
}