// Brand Normalizer for Enhanced Manufacturer Search
// Provides comprehensive brand name mapping and search optimization

class BrandNormalizer {
    constructor() {
        // Comprehensive brand name mappings
        this.brandMappings = {
            // Major supplement brands with variations
            "nature's way": ["natures way", "nature way", "naturesway"],
            "now foods": ["now", "now supplements", "nowfoods"],
            "life extension": ["lifeextension", "life ext", "life-extension"],
            "jarrow formulas": ["jarrow", "jarrowformulas", "jarrow formula"],
            "garden of life": ["gardenoflife", "garden life", "garden-of-life"],
            "new chapter": ["newchapter", "new-chapter"],
            "country life": ["countrylife", "country-life"],
            "bluebonnet nutrition": ["bluebonnet", "blue bonnet", "bluebonnet-nutrition"],
            "solgar": ["solgar vitamins", "solgar supplements"],
            "thorne": ["thorne health", "thorne research"],
            "pure encapsulations": ["pureencapsulations", "pure-encapsulations", "pure encaps"],
            "nordic naturals": ["nordicnaturals", "nordic-naturals", "nordic"],
            "rainbow light": ["rainbowlight", "rainbow-light"],
            "source naturals": ["sourcenaturals", "source-naturals"],
            "doctor's best": ["doctors best", "dr best", "drbest", "doctors-best"],
            "kirkland signature": ["kirkland", "kirkland sig", "costco"],
            "vitacost": ["vita cost", "vita-cost"],
            "nature made": ["naturemade", "nature-made"],
            "centrum": ["centrum vitamins", "centrum multivitamin"],
            "one a day": ["oneaday", "one-a-day", "1 a day"],
            "alive!": ["alive", "alive vitamins"],
            "mega food": ["megafood", "mega-food"],
            "california gold nutrition": ["cal gold", "california gold", "cgn"],
            "sports research": ["sportsresearch", "sports-research", "sr"],
            "zhou nutrition": ["zhou", "zhounutrition"],
            "optimum nutrition": ["optimumnutrition", "optimum", "on"],
            "dymatize": ["dymatize nutrition"],
            "muscletech": ["muscle tech", "muscle-tech"],
            "bsn": ["bio-synergy nutrition"],
            "cellucor": ["cellucor supplements"],
            
            // Japanese brands
            "dhc": ["dhc corporation", "dhc japan"],
            "fancl": ["fancl corporation"],
            "asahi": ["asahi group", "asahi dear natura"],
            "takeda": ["takeda pharmaceutical", "takeda consumer"],
            "kobayashi": ["kobayashi pharmaceutical"],
            "suntory": ["suntory wellness"],
            "meiji": ["meiji pharma"],
            "eisai": ["eisai pharmaceutical"],
            "rohto": ["rohto pharmaceutical"],
            "kaneka": ["kaneka ubiquinol"],
            
            // Store brands
            "kirkland": ["kirkland signature", "costco kirkland"],
            "equate": ["walmart equate"],
            "up&up": ["target up&up", "target brand"],
            "amazon elements": ["amazon basic care", "amazon brand"],
            "spring valley": ["walmart spring valley"],
            "member's mark": ["sams club", "members mark"],
            
            // Generic/Unknown handling
            "unknown": ["unknown brand", "unbranded", "generic", "no brand"]
        };
        
        // Brand aliases for common misspellings and variations
        this.brandAliases = this.generateBrandAliases();
        
        // Brand categories for enhanced search
        this.brandCategories = {
            premium: ["thorne", "pure encapsulations", "life extension", "nordic naturals"],
            mainstream: ["nature's way", "now foods", "solgar", "jarrow formulas"],
            store_brand: ["kirkland", "equate", "up&up", "spring valley"],
            japanese: ["dhc", "fancl", "asahi", "takeda", "kobayashi"],
            sports: ["optimum nutrition", "dymatize", "muscletech", "bsn"]
        };
        
        console.log('🏷️ Brand Normalizer initialized with', Object.keys(this.brandMappings).length, 'brand mappings');
    }
    
    // Generate comprehensive brand aliases
    generateBrandAliases() {
        const aliases = new Map();
        
        Object.entries(this.brandMappings).forEach(([canonical, variations]) => {
            // Add canonical name
            aliases.set(canonical.toLowerCase(), canonical);
            
            // Add all variations
            variations.forEach(variation => {
                aliases.set(variation.toLowerCase(), canonical);
            });
            
            // Add common abbreviations
            const words = canonical.split(' ');
            if (words.length > 1) {
                // First letter abbreviation (e.g., "nw" for "nature's way")
                const abbreviation = words.map(word => word[0]).join('').toLowerCase();
                if (abbreviation.length >= 2) {
                    aliases.set(abbreviation, canonical);
                }
                
                // First word only
                aliases.set(words[0].toLowerCase(), canonical);
            }
        });
        
        return aliases;
    }
    
    // Normalize brand name to canonical form
    normalizeBrandName(brandName) {
        if (!brandName || typeof brandName !== 'string') {
            return 'Unknown Brand';
        }
        
        const cleanBrand = brandName.trim().toLowerCase();
        
        // Direct lookup in aliases
        if (this.brandAliases.has(cleanBrand)) {
            return this.brandAliases.get(cleanBrand);
        }
        
        // Fuzzy matching for partial matches
        for (const [alias, canonical] of this.brandAliases.entries()) {
            if (cleanBrand.includes(alias) || alias.includes(cleanBrand)) {
                return canonical;
            }
        }
        
        // Clean and capitalize properly if no match found
        return this.capitalizeProperName(brandName);
    }
    
    // Search for brands matching query
    searchBrands(query) {
        if (!query || typeof query !== 'string') {
            return [];
        }
        
        const queryLower = query.toLowerCase().trim();
        const matches = new Set();
        
        // Exact matches first
        for (const [alias, canonical] of this.brandAliases.entries()) {
            if (alias === queryLower) {
                matches.add(canonical);
            }
        }
        
        // Partial matches
        for (const [alias, canonical] of this.brandAliases.entries()) {
            if (alias.includes(queryLower) || queryLower.includes(alias)) {
                matches.add(canonical);
            }
        }
        
        return Array.from(matches);
    }
    
    // Check if a product matches brand search
    matchesBrandSearch(product, searchQuery) {
        if (!product || !searchQuery) {
            return false;
        }
        
        const productBrand = this.normalizeBrandName(product.brand || '');
        const matchingBrands = this.searchBrands(searchQuery);
        
        // Direct brand match
        if (matchingBrands.some(brand => 
            productBrand.toLowerCase().includes(brand.toLowerCase()) ||
            brand.toLowerCase().includes(productBrand.toLowerCase())
        )) {
            return true;
        }
        
        // Check if product name contains brand information
        const productName = (product.name_en || product.name_ja || '').toLowerCase();
        return matchingBrands.some(brand => 
            productName.includes(brand.toLowerCase())
        );
    }
    
    // Enhanced brand extraction from product data
    extractBrandFromProduct(product) {
        if (!product) return 'Unknown Brand';
        
        // Try different fields that might contain brand info
        const brandSources = [
            product.brand_name,
            product.manufacturer,
            product.brand,
            product.company,
            product.supplier
        ];
        
        // Extract brand from product name if present
        const productName = product.product_name || product.name || '';
        const extractedFromName = this.extractBrandFromName(productName);
        if (extractedFromName) {
            brandSources.unshift(extractedFromName);
        }
        
        // Find first valid brand
        for (const source of brandSources) {
            if (source && typeof source === 'string' && source.trim() !== '') {
                const normalized = this.normalizeBrandName(source);
                if (normalized && normalized !== 'Unknown Brand') {
                    return normalized;
                }
            }
        }
        
        return 'Unknown Brand';
    }
    
    // Extract brand from product name
    extractBrandFromName(productName) {
        if (!productName) return null;
        
        // Look for known brands in the product name
        const nameLower = productName.toLowerCase();
        
        for (const [canonical, variations] of Object.entries(this.brandMappings)) {
            // Check canonical name
            if (nameLower.includes(canonical.toLowerCase())) {
                return canonical;
            }
            
            // Check variations
            for (const variation of variations) {
                if (nameLower.includes(variation.toLowerCase())) {
                    return canonical;
                }
            }
        }
        
        // Extract from beginning of product name (common pattern)
        const words = productName.split(' ');
        if (words.length >= 2) {
            const firstTwoWords = words.slice(0, 2).join(' ');
            if (this.brandAliases.has(firstTwoWords.toLowerCase())) {
                return this.brandAliases.get(firstTwoWords.toLowerCase());
            }
        }
        
        return null;
    }
    
    // Capitalize proper names
    capitalizeProperName(name) {
        if (!name) return '';
        
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    
    // Get brand suggestions for autocomplete
    getBrandSuggestions(query, limit = 10) {
        if (!query) return [];
        
        const matches = this.searchBrands(query);
        return matches.slice(0, limit);
    }
    
    // Get all canonical brand names
    getAllBrands() {
        return Object.keys(this.brandMappings);
    }
    
    // Get brands by category
    getBrandsByCategory(category) {
        return this.brandCategories[category] || [];
    }
    
    // Get brand statistics
    getBrandStats() {
        return {
            totalMappings: Object.keys(this.brandMappings).length,
            totalAliases: this.brandAliases.size,
            categories: Object.keys(this.brandCategories).length,
            premiumBrands: this.brandCategories.premium?.length || 0,
            japaneseBrands: this.brandCategories.japanese?.length || 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrandNormalizer;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BrandNormalizer = BrandNormalizer;
}