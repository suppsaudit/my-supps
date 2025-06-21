// DSLD Data Mapper Implementation

class DSLDMapper {
    static mapToUnified(dsldData) {
        if (!dsldData) {
            console.warn('⚠️ DSLD data is null or undefined');
            return null;
        }
        
        const product = new SupplementProduct();
        
        // Basic information
        product.id = dsldData.dsld_id || dsldData.id || '';
        product.name = dsldData.product_name || dsldData.name || '';
        product.brand = dsldData.brand_name || dsldData.brand || '';
        product.identifier = dsldData.upc || dsldData.gtin || '';
        
        // Serving information
        product.servingSize = dsldData.serving_size || dsldData.net_contents || '';
        product.container = dsldData.container_size || dsldData.net_contents || '';
        
        // Images
        product.images = {
            thumbnail: this.extractThumbnail(dsldData),
            label: this.extractLabelImage(dsldData)
        };
        
        // Nutrition facts
        product.nutritionFacts = this.mapNutritionFacts(dsldData);
        
        // Usage information
        product.usage = {
            servingAmount: dsldData.serving_instructions?.amount || dsldData.serving_size || '',
            instructions: dsldData.serving_instructions?.directions || dsldData.suggested_use || '',
            warnings: this.extractWarnings(dsldData)
        };
        
        // Metadata
        product.region = 'US';
        product.source = 'DSLD';
        
        console.log(`✅ Mapped DSLD product: ${product.name}`);
        return product;
    }
    
    static extractThumbnail(dsldData) {
        if (dsldData.label_images?.thumbnail) {
            return dsldData.label_images.thumbnail;
        }
        if (dsldData.image_url) {
            return dsldData.image_url;
        }
        return '';
    }
    
    static extractLabelImage(dsldData) {
        if (dsldData.label_images?.detail) {
            return dsldData.label_images.detail;
        }
        if (dsldData.label_images?.full) {
            return dsldData.label_images.full;
        }
        if (dsldData.label_url) {
            return dsldData.label_url;
        }
        return this.extractThumbnail(dsldData);
    }
    
    static extractWarnings(dsldData) {
        const warnings = [];
        
        if (dsldData.warnings) {
            if (Array.isArray(dsldData.warnings)) {
                warnings.push(...dsldData.warnings);
            } else {
                warnings.push(dsldData.warnings);
            }
        }
        
        if (dsldData.cautions) {
            warnings.push(dsldData.cautions);
        }
        
        if (dsldData.allergen_statement) {
            warnings.push(`Allergens: ${dsldData.allergen_statement}`);
        }
        
        return warnings;
    }
    
    static mapNutritionFacts(dsldData) {
        const facts = [];
        
        // Handle different DSLD data formats
        if (dsldData.nutrition_facts && Array.isArray(dsldData.nutrition_facts)) {
            dsldData.nutrition_facts.forEach(fact => {
                if (fact.nutrient_name && fact.amount !== undefined) {
                    facts.push(new NutritionFact(
                        fact.nutrient_name,
                        fact.amount,
                        fact.unit || 'mg',
                        fact.daily_value_percent || null
                    ));
                }
            });
        }
        
        // Alternative format: ingredients array
        if (dsldData.ingredients && Array.isArray(dsldData.ingredients)) {
            dsldData.ingredients.forEach(ingredient => {
                if (ingredient.name && ingredient.amount !== undefined) {
                    facts.push(new NutritionFact(
                        ingredient.name,
                        ingredient.amount,
                        ingredient.unit || 'mg',
                        ingredient.percent_dv || null
                    ));
                }
            });
        }
        
        // Alternative format: supplement facts
        if (dsldData.supplement_facts) {
            // Handle vitamins
            if (dsldData.supplement_facts.vitamins) {
                Object.entries(dsldData.supplement_facts.vitamins).forEach(([name, data]) => {
                    if (data.amount !== undefined) {
                        facts.push(new NutritionFact(
                            name,
                            data.amount,
                            data.unit || 'mg',
                            data.percent_dv || null
                        ));
                    }
                });
            }
            
            // Handle minerals
            if (dsldData.supplement_facts.minerals) {
                Object.entries(dsldData.supplement_facts.minerals).forEach(([name, data]) => {
                    if (data.amount !== undefined) {
                        facts.push(new NutritionFact(
                            name,
                            data.amount,
                            data.unit || 'mg',
                            data.percent_dv || null
                        ));
                    }
                });
            }
            
            // Handle other ingredients
            if (dsldData.supplement_facts.other) {
                Object.entries(dsldData.supplement_facts.other).forEach(([name, data]) => {
                    if (data.amount !== undefined) {
                        facts.push(new NutritionFact(
                            name,
                            data.amount,
                            data.unit || 'mg',
                            data.percent_dv || null
                        ));
                    }
                });
            }
        }
        
        console.log(`📊 Mapped ${facts.length} nutrition facts for ${dsldData.product_name}`);
        return facts;
    }
    
    // Utility method to map multiple products
    static mapMultipleToUnified(dsldDataArray) {
        if (!Array.isArray(dsldDataArray)) {
            console.warn('⚠️ DSLD data array is not an array');
            return [];
        }
        
        return dsldDataArray
            .map(data => this.mapToUnified(data))
            .filter(product => product !== null);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DSLDMapper;
}