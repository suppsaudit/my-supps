// Advanced Search Module for MY SUPPS
// Supports product name, brand, and ingredient search

class AdvancedSearch {
    constructor() {
        this.dsldApi = window.dsldApi;
        this.isDemo = window.isDemo || false;
    }

    // Main search function with multiple criteria
    async search(criteria) {
        if (this.isDemo) {
            return this.searchMockData(criteria);
        } else {
            return this.searchDSLD(criteria);
        }
    }

    // Search using DSLD API
    async searchDSLD(criteria) {
        try {
            let searchQuery = '';
            
            // Build search query from criteria
            if (criteria.productName) {
                searchQuery = criteria.productName;
            } else if (criteria.ingredient) {
                searchQuery = criteria.ingredient;
            } else if (criteria.brand) {
                searchQuery = criteria.brand;
            }
            
            if (!searchQuery) {
                return { data: [], total: 0 };
            }
            
            const results = await this.dsldApi.searchProducts(searchQuery, {
                limit: criteria.limit || 20,
                brand: criteria.brand
            });
            
            // Transform results to consistent format
            const transformedResults = (results.hits || results.data || []).map(item => {
                const source = item._source || item;
                return this.dsldApi.transformProduct(source);
            });

            return {
                data: transformedResults,
                total: transformedResults.length,
                source: 'dsld'
            };

        } catch (error) {
            console.error('DSLD search error:', error);
            return {
                data: [],
                total: 0,
                error: error.message,
                source: 'dsld'
            };
        }
    }

    // Search mock data for demo mode
    searchMockData(criteria) {
        const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
        
        let results = mockSupplements.filter(supplement => {
            let matches = true;

            if (criteria.productName) {
                const productNameMatch = 
                    supplement.name_en.toLowerCase().includes(criteria.productName.toLowerCase()) ||
                    supplement.name_ja.toLowerCase().includes(criteria.productName.toLowerCase());
                matches = matches && productNameMatch;
            }

            if (criteria.brand) {
                const brandMatch = supplement.brand.toLowerCase().includes(criteria.brand.toLowerCase());
                matches = matches && brandMatch;
            }

            if (criteria.ingredient) {
                // Mock ingredient search - check if product name contains ingredient
                const ingredientMatch = 
                    supplement.name_en.toLowerCase().includes(criteria.ingredient.toLowerCase()) ||
                    supplement.name_ja.toLowerCase().includes(criteria.ingredient.toLowerCase());
                matches = matches && ingredientMatch;
            }

            return matches;
        });

        return {
            data: results.slice(0, criteria.limit || 20),
            total: results.length,
            source: 'mock'
        };
    }

    // Quick search for autocomplete
    async quickSearch(query, type = 'all') {
        if (!query || query.length < 2) {
            return { data: [], total: 0 };
        }

        const criteria = {};
        
        switch (type) {
            case 'product':
                criteria.productName = query;
                break;
            case 'brand':
                criteria.brand = query;
                break;
            case 'ingredient':
                criteria.ingredient = query;
                break;
            default:
                // Search all types
                criteria.productName = query;
                break;
        }

        criteria.limit = 10; // Limit for quick search
        return await this.search(criteria);
    }

    // Search by specific nutrient
    async searchByNutrient(nutrientName) {
        return await this.search({
            ingredient: nutrientName,
            limit: 20
        });
    }

    // Get popular supplements containing a nutrient (for Supps Note pages)
    async getPopularByNutrient(nutrientName, limit = 10) {
        const results = await this.searchByNutrient(nutrientName);
        
        // Sort by some popularity criteria (mock implementation)
        if (results.data) {
            results.data.sort((a, b) => {
                // Mock popularity based on name recognition
                const popularBrands = ['Nature\'s Way', 'NOW Foods', 'Doctor\'s Best', 'Nordic Naturals'];
                const aScore = popularBrands.indexOf(a.brand) !== -1 ? 1 : 0;
                const bScore = popularBrands.indexOf(b.brand) !== -1 ? 1 : 0;
                return bScore - aScore;
            });
        }

        return {
            ...results,
            data: results.data.slice(0, limit)
        };
    }

    // Remove duplicate items from array based on key
    removeDuplicates(array, key) {
        const seen = new Set();
        return array.filter(item => {
            const keyValue = item[key];
            if (seen.has(keyValue)) {
                return false;
            }
            seen.add(keyValue);
            return true;
        });
    }

    // Search filters for advanced UI
    getSearchFilters() {
        return {
            types: [
                { value: 'all', label: '全て', label_en: 'All' },
                { value: 'product', label: '商品名', label_en: 'Product Name' },
                { value: 'brand', label: 'ブランド', label_en: 'Brand' },
                { value: 'ingredient', label: '成分', label_en: 'Ingredient' }
            ],
            popularBrands: [
                'Nature\'s Way',
                'NOW Foods',
                'Doctor\'s Best',
                'Nordic Naturals',
                'Thorne',
                'Life Extension',
                'Garden of Life',
                'Solgar'
            ],
            popularIngredients: [
                { en: 'Vitamin C', ja: 'ビタミンC' },
                { en: 'Vitamin D3', ja: 'ビタミンD3' },
                { en: 'Magnesium', ja: 'マグネシウム' },
                { en: 'Omega-3', ja: 'オメガ3' },
                { en: 'Zinc', ja: '亜鉛' },
                { en: 'Iron', ja: '鉄' },
                { en: 'Calcium', ja: 'カルシウム' },
                { en: 'Coenzyme Q10', ja: 'コエンザイムQ10' }
            ]
        };
    }

    // Format search results for display
    formatResults(results) {
        if (!results.data) return [];

        return results.data.map(item => ({
            id: item.id || item.dsld_id,
            title: item.name_ja || item.name_en || item.name,
            subtitle: item.brand,
            serving: item.serving_size,
            image: item.image_url,
            source: results.source
        }));
    }
}

// Export for global use
window.AdvancedSearch = AdvancedSearch;
window.advancedSearch = new AdvancedSearch();