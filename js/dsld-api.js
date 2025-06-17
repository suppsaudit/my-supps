// NIH DSLD API Integration Module
// Dietary Supplement Label Database API
// Base URL: https://dsldapi.od.nih.gov/
// License: CC0 (Public Domain)

class DSLDApi {
    constructor() {
        // 実際のDSLD APIエンドポイント（正式URL - 2024年11月版）
        this.baseUrl = 'https://api.ods.od.nih.gov/dsld/v9';
        this.searchUrl = `${this.baseUrl}/search-filter`;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // 実際のAPI使用（モックを無効化）
        this.demoMode = false;
    }

    // Generic API request with caching
    async request(endpoint, params = {}) {
        const url = new URL(endpoint, this.baseUrl);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        const cacheKey = url.toString();
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            console.log('DSLD API Request:', url.toString());
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`DSLD API Error: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the response
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('DSLD API Request failed:', error);
            throw error;
        }
    }

    // Search products by name, brand, or ingredient using actual DSLD API v9
    async searchProducts(query, options = {}) {
        try {
            console.log(`🔍 DSLD API v9 Search: "${query}"`);
            
            // Translate Japanese nutrient names to English for DSLD API
            const englishQuery = this.translateJapaneseToEnglish(query);
            console.log(`🔍 Translated query: "${englishQuery}"`);
            
            // DSLD API v9の正式エンドポイント（search-filter）
            const searchParams = new URLSearchParams({
                q: englishQuery,
                size: options.limit || 10,
                sort_by: '_score',
                sort_order: 'desc'
            });
            
            const searchUrl = `${this.searchUrl}?${searchParams}`;
            console.log('DSLD API v9 URL:', searchUrl);
            
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                console.error(`DSLD API Error: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`DSLD API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ DSLD API v9 Response:', data);
            
            // DSLD API v9のレスポンス形式に合わせて変換（iHerb形式の商品名）
            const transformedData = {
                hits: data.hits ? data.hits.map(hit => ({
                    _source: {
                        id: hit._id,
                        dsld_id: hit._id,
                        product_name: this.formatProductNameAsIHerb(hit._source),
                        brand_name: hit._source.brandName,
                        serving_size: this.extractServingSize(hit._source),
                        serving_form: this.extractServingForm(hit._source),
                        ingredients: hit._source.allIngredients || [],
                        nutrients: this.extractNutrients(hit._source.allIngredients || []),
                        upc_sku: hit._source.upcSku,
                        net_contents: hit._source.netContents || [],
                        claims: hit._source.claims || [],
                        off_market: hit._source.offMarket || 0,
                        full_name_original: hit._source.fullName
                    }
                })) : [],
                total: data.stats ? data.stats.count : 0
            };
            
            console.log(`✅ Found ${transformedData.hits.length} products from DSLD API v9`);
            return transformedData;
            
        } catch (error) {
            console.error('❌ DSLD API v9 Search failed:', error);
            console.log('🔄 Trying brand-based search...');
            
            // フォールバック: ブランド検索を試行
            return await this.fallbackBrandSearch(query, options);
        }
    }
    
    // ブランドベース検索フォールバック
    async fallbackBrandSearch(query, options = {}) {
        try {
            console.log(`🔄 Brand-based search for: "${query}"`);
            
            // ブランド名で検索を試行
            const searchParams = new URLSearchParams({
                brand: query,
                size: options.limit || 20,
                page: options.page || 0
            });
            
            const brandSearchUrl = `${this.searchUrl}?${searchParams}`;
            console.log('Brand search URL:', brandSearchUrl);
            
            const response = await fetch(brandSearchUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Brand search error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Brand search response:', data);
            
            return {
                hits: data.data ? data.data.map(item => ({
                    _source: {
                        id: item.dsldId,
                        dsld_id: item.dsldId,
                        product_name: item.productName,
                        brand_name: item.brandName,
                        serving_size: item.servingSize || '1 unit',
                        serving_form: item.servingForm || 'capsule',
                        ingredients: item.ingredients || [],
                        nutrients: item.nutrients || []
                    }
                })) : [],
                total: data.total || 0
            };
            
        } catch (error) {
            console.error('❌ Brand search also failed:', error);
            
            // 最後の手段：エラーメッセージと共に空の結果を返す
            console.log('⚠️ All DSLD API attempts failed. Returning empty results.');
            return {
                hits: [],
                total: 0,
                error: `DSLD API connection failed: ${error.message}`
            };
        }
    }
    
    // Get all products with pagination (for initial load)
    async getAllProducts(options = {}) {
        try {
            console.log(`🔍 DSLD API getAllProducts: from ${options.from || 0}, size ${options.size || 100}`);
            
            // ワイルドカード検索で全商品を取得
            const searchParams = new URLSearchParams({
                q: '*',  // ワイルドカード検索
                size: options.size || 100,
                from: options.from || 0,
                sort_by: 'entryDate',
                sort_order: 'desc',
                status: '1'  // オンマーケット商品のみ
            });
            
            const searchUrl = `${this.searchUrl}?${searchParams}`;
            console.log('DSLD getAllProducts URL:', searchUrl);
            
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                console.error(`DSLD API Error: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`DSLD API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ DSLD getAllProducts response: ${data.hits ? data.hits.length : 0} products`);
            
            // 同じ変換ロジックを使用
            const transformedData = {
                hits: data.hits ? data.hits.map(hit => ({
                    _source: {
                        id: hit._id,
                        dsld_id: hit._id,
                        product_name: this.formatProductNameAsIHerb(hit._source),
                        brand_name: hit._source.brandName,
                        serving_size: this.extractServingSize(hit._source),
                        serving_form: this.extractServingForm(hit._source),
                        ingredients: hit._source.allIngredients || [],
                        nutrients: this.extractNutrients(hit._source.allIngredients || []),
                        upc_sku: hit._source.upcSku,
                        net_contents: hit._source.netContents || [],
                        claims: hit._source.claims || [],
                        off_market: hit._source.offMarket || 0,
                        full_name_original: hit._source.fullName
                    }
                })) : [],
                total: data.stats ? data.stats.count : 0
            };
            
            return transformedData;
            
        } catch (error) {
            console.error('❌ DSLD getAllProducts failed:', error);
            throw error;
        }
    }
    
    // Format product name to iHerb style
    formatProductNameAsIHerb(source) {
        const brandName = source.brandName || 'Unknown Brand';
        const productName = source.fullName || 'Unknown Product';
        const netContents = source.netContents && source.netContents.length > 0 
            ? `, ${source.netContents[0].quantity} ${source.netContents[0].unit}` 
            : '';
        
        // iHerb形式: "Brand, Product Name, Quantity Unit"
        return `${brandName}, ${productName}${netContents}`;
    }
    
    // Extract serving size from DSLD data
    extractServingSize(source) {
        if (source.servingSizes && source.servingSizes.length > 0) {
            const serving = source.servingSizes[0];
            return `${serving.minQuantity} ${serving.unit}`;
        }
        if (source.netContents && source.netContents.length > 0) {
            const content = source.netContents[0];
            return `1 ${content.unit}`;
        }
        return '1 unit';
    }
    
    // Extract serving form from DSLD data
    extractServingForm(source) {
        if (source.physicalState && source.physicalState.langualCodeDescription) {
            const form = source.physicalState.langualCodeDescription.toLowerCase();
            if (form.includes('tablet')) return 'tablet';
            if (form.includes('capsule')) return 'capsule';
            if (form.includes('softgel')) return 'softgel';
            if (form.includes('powder')) return 'powder';
            if (form.includes('liquid')) return 'liquid';
        }
        return 'capsule';
    }
    
    // Extract nutrients from DSLD ingredients
    extractNutrients(ingredients) {
        return ingredients
            .filter(ing => ing.category === 'vitamin' || ing.category === 'mineral')
            .map(ing => ({
                name_ja: this.getJapaneseName(ing.name),
                name_en: ing.name,
                amount: this.parseNutrientAmount(ing.notes),
                unit: this.parseNutrientUnit(ing.notes),
                category: ing.category,
                ingredient_group: ing.ingredientGroup
            }));
    }
    
    // Parse nutrient amount from notes
    parseNutrientAmount(notes) {
        if (!notes) return 0;
        const match = notes.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|IU)/i);
        return match ? parseFloat(match[1]) : 0;
    }
    
    // Parse nutrient unit from notes
    parseNutrientUnit(notes) {
        if (!notes) return 'mg';
        const match = notes.match(/\d+(?:\.\d+)?\s*(mg|mcg|g|IU)/i);
        return match ? match[1] : 'mg';
    }
    
    // Mock search results for demo mode
    getMockSearchResults(query, options = {}) {
        const mockProducts = [
            {
                id: 'DSLD-12345',
                name: 'Vitamin C 1000mg Tablets',
                brand: 'Nature\'s Way',
                manufacturer: 'Nature\'s Way',
                servingSize: '1 tablet',
                servingsPerContainer: 100,
                upcSku: '033674157855',
                ingredients: [
                    {
                        name: 'Vitamin C (as Ascorbic Acid)',
                        amount: 1000,
                        unit: 'mg',
                        dailyValue: '1111%'
                    }
                ],
                productForm: 'Tablet',
                targetAge: 'Adult',
                category: 'Vitamin C'
            },
            {
                id: 'DSLD-12346',
                name: 'Vitamin D3 5000 IU Softgels',
                brand: 'NOW Foods',
                manufacturer: 'NOW Foods',
                servingSize: '1 softgel',
                servingsPerContainer: 120,
                upcSku: '733739003737',
                ingredients: [
                    {
                        name: 'Vitamin D3 (as Cholecalciferol)',
                        amount: 5000,
                        unit: 'IU',
                        dailyValue: '1250%'
                    }
                ],
                productForm: 'Softgel',
                targetAge: 'Adult',
                category: 'Vitamin D'
            },
            {
                id: 'DSLD-12347',
                name: 'Magnesium Glycinate 200mg',
                brand: 'Doctor\'s Best',
                manufacturer: 'Doctor\'s Best',
                servingSize: '2 tablets',
                servingsPerContainer: 120,
                upcSku: '753950002227',
                ingredients: [
                    {
                        name: 'Magnesium (as Magnesium Glycinate)',
                        amount: 200,
                        unit: 'mg',
                        dailyValue: '48%'
                    }
                ],
                productForm: 'Tablet',
                targetAge: 'Adult',
                category: 'Magnesium'
            },
            {
                id: 'DSLD-12348',
                name: 'Omega-3 Fish Oil 1000mg',
                brand: 'Nordic Naturals',
                manufacturer: 'Nordic Naturals',
                servingSize: '2 softgels',
                servingsPerContainer: 60,
                upcSku: '768990752001',
                ingredients: [
                    {
                        name: 'Total Omega-3 Fatty Acids',
                        amount: 690,
                        unit: 'mg',
                        dailyValue: '*'
                    },
                    {
                        name: 'EPA (Eicosapentaenoic Acid)',
                        amount: 325,
                        unit: 'mg',
                        dailyValue: '*'
                    },
                    {
                        name: 'DHA (Docosahexaenoic Acid)',
                        amount: 225,
                        unit: 'mg',
                        dailyValue: '*'
                    }
                ],
                productForm: 'Softgel',
                targetAge: 'Adult',
                category: 'Omega-3'
            },
            {
                id: 'DSLD-12349',
                name: 'Zinc Picolinate 50mg',
                brand: 'Thorne',
                manufacturer: 'Thorne Health',
                servingSize: '1 capsule',
                servingsPerContainer: 60,
                upcSku: '693749005094',
                ingredients: [
                    {
                        name: 'Zinc (as Zinc Picolinate)',
                        amount: 15,
                        unit: 'mg',
                        dailyValue: '136%'
                    }
                ],
                productForm: 'Capsule',
                targetAge: 'Adult',
                category: 'Zinc'
            }
        ];
        
        // Filter by search query
        const filteredProducts = mockProducts.filter(product => {
            const searchTerm = query.toLowerCase();
            return product.name.toLowerCase().includes(searchTerm) ||
                   product.brand.toLowerCase().includes(searchTerm) ||
                   product.category.toLowerCase().includes(searchTerm) ||
                   product.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm));
        });
        
        const limit = options.limit || 20;
        return {
            hits: filteredProducts.slice(0, limit).map(product => ({
                _source: product
            })),
            total: filteredProducts.length
        };
    }

    // Get product details by ID
    async getProduct(productId) {
        return await this.request(`/products/${productId}`);
    }

    // Search by ingredient/nutrient
    async searchByIngredient(ingredient, options = {}) {
        const params = {
            ingredient: ingredient,
            limit: options.limit || 20,
            offset: options.offset || 0
        };

        return await this.request('/products/by-ingredient', params);
    }

    // Get all available nutrients
    async getNutrients() {
        return await this.request('/nutrients');
    }

    // Get popular supplements containing a specific nutrient
    async getSupplementsByNutrient(nutrientName, limit = 10) {
        return await this.searchByIngredient(nutrientName, { limit });
    }

    // Advanced search with multiple criteria
    async advancedSearch(criteria) {
        const params = {};
        
        if (criteria.productName) {
            params.search = criteria.productName;
        }
        
        if (criteria.brand) {
            params.brand = criteria.brand;
        }
        
        if (criteria.ingredient) {
            params.ingredient = criteria.ingredient;
        }
        
        params.limit = criteria.limit || 20;
        params.offset = criteria.offset || 0;

        return await this.request('/products/advanced-search', params);
    }

    // Transform DSLD data to our app format
    transformProduct(dsldProduct) {
        return {
            id: dsldProduct.id,
            dsld_id: dsldProduct.id,
            name_en: dsldProduct.name,
            name_ja: this.translateToJapanese(dsldProduct.name),
            brand: dsldProduct.manufacturer || dsldProduct.brand,
            serving_size: dsldProduct.servingSize,
            servings_per_container: dsldProduct.servingsPerContainer,
            image_url: dsldProduct.imageUrl,
            label_url: dsldProduct.labelUrl,
            upc: dsldProduct.upcSku,
            product_form: dsldProduct.productForm,
            target_age: dsldProduct.targetAge,
            category: dsldProduct.category,
            ingredients: dsldProduct.ingredients || [],
            nutrients: this.extractNutrients(dsldProduct.ingredients || []),
            dosage_instructions: this.generateDosageInstructions(dsldProduct)
        };
    }
    
    // Generate dosage instructions from serving size
    generateDosageInstructions(product) {
        if (!product.servingSize) return '1日1回';
        
        const serving = product.servingSize.toLowerCase();
        if (serving.includes('2')) {
            return '1日2回';
        } else if (serving.includes('3')) {
            return '1日3回';
        } else if (serving.includes('twice')) {
            return '朝晩2回';
        } else {
            return '1日1回';
        }
    }
    
    // Simple Japanese translation for common supplement names
    translateToJapanese(englishName) {
        const translations = {
            'Vitamin C': 'ビタミンC',
            'Vitamin D3': 'ビタミンD3',
            'Vitamin D': 'ビタミンD',
            'Magnesium': 'マグネシウム',
            'Omega-3': 'オメガ3',
            'Fish Oil': 'フィッシュオイル',
            'Zinc': '亜鉛',
            'Calcium': 'カルシウム',
            'Iron': '鉄分',
            'Tablets': 'タブレット',
            'Softgels': 'ソフトジェル',
            'Capsules': 'カプセル',
            'mg': 'mg',
            'IU': 'IU'
        };
        
        let translated = englishName;
        Object.keys(translations).forEach(en => {
            translated = translated.replace(new RegExp(en, 'gi'), translations[en]);
        });
        
        return translated;
    }

    // Extract and normalize nutrient data
    extractNutrients(ingredients) {
        return ingredients.map(ingredient => ({
            name: ingredient.name,
            amount: parseFloat(ingredient.amount) || 0,
            unit: ingredient.unit || 'mg',
            daily_value_percent: this.parseDailyValue(ingredient.dailyValue)
        })).filter(nutrient => nutrient.amount > 0);
    }

    // Parse daily value percentage from strings like "100%", "1111%"
    parseDailyValue(dailyValueStr) {
        if (!dailyValueStr) return null;
        const match = dailyValueStr.match(/(\d+(\.\d+)?)%/);
        return match ? parseFloat(match[1]) : null;
    }

    // Get Japanese nutrient name mapping (for localization)
    getNutrientNameMapping() {
        return {
            'Vitamin C': 'ビタミンC',
            'Vitamin D': 'ビタミンD',
            'Vitamin D3': 'ビタミンD3',
            'Vitamin E': 'ビタミンE',
            'Vitamin A': 'ビタミンA',
            'Vitamin B1': 'ビタミンB1',
            'Vitamin B2': 'ビタミンB2',
            'Vitamin B6': 'ビタミンB6',
            'Vitamin B12': 'ビタミンB12',
            'Thiamine': 'チアミン',
            'Riboflavin': 'リボフラビン',
            'Niacin': 'ナイアシン',
            'Folate': '葉酸',
            'Folic Acid': '葉酸',
            'Biotin': 'ビオチン',
            'Pantothenic Acid': 'パントテン酸',
            'Calcium': 'カルシウム',
            'Iron': '鉄',
            'Magnesium': 'マグネシウム',
            'Zinc': '亜鉛',
            'Selenium': 'セレン',
            'Copper': '銅',
            'Manganese': 'マンガン',
            'Chromium': 'クロム',
            'Molybdenum': 'モリブデン',
            'Potassium': 'カリウム',
            'Phosphorus': 'リン',
            'Iodine': 'ヨウ素',
            'Omega-3': 'オメガ3',
            'EPA': 'EPA',
            'DHA': 'DHA',
            'Coenzyme Q10': 'コエンザイムQ10',
            'CoQ10': 'コエンザイムQ10',
            'Lutein': 'ルテイン',
            'Lycopene': 'リコピン',
            'Beta-Carotene': 'ベータカロテン',
            'Astaxanthin': 'アスタキサンチン',
            'Creatine': 'クレアチン',
            'Protein': 'プロテイン',
            'Collagen': 'コラーゲン',
            'Glucosamine': 'グルコサミン',
            'Chondroitin': 'コンドロイチン',
            'Resveratrol': 'レスベラトロール',
            'Curcumin': 'クルクミン',
            'Quercetin': 'ケルセチン'
        };
    }

    // Get Japanese name for nutrient
    getJapaneseName(englishName) {
        const mapping = this.getNutrientNameMapping();
        return mapping[englishName] || englishName;
    }

    // Translate Japanese nutrient names to English for DSLD API searches
    translateJapaneseToEnglish(japaneseQuery) {
        const queryLower = japaneseQuery.toLowerCase();
        
        const reverseMapping = {
            // ビタミン類
            'ビタミンc': 'vitamin c',
            'ビタミンd': 'vitamin d',
            'ビタミンd3': 'vitamin d3',
            'ビタミンe': 'vitamin e',
            'ビタミンa': 'vitamin a',
            'ビタミンb': 'vitamin b',
            'ビタミンb1': 'vitamin b1',
            'ビタミンb2': 'vitamin b2',
            'ビタミンb6': 'vitamin b6',
            'ビタミンb12': 'vitamin b12',
            'チアミン': 'thiamine',
            'リボフラビン': 'riboflavin',
            'ナイアシン': 'niacin',
            '葉酸': 'folic acid',
            'ビオチン': 'biotin',
            'パントテン酸': 'pantothenic acid',
            
            // ミネラル類
            'カルシウム': 'calcium',
            '鉄': 'iron',
            'マグネシウム': 'magnesium',
            '亜鉛': 'zinc',
            'セレン': 'selenium',
            '銅': 'copper',
            'マンガン': 'manganese',
            'クロム': 'chromium',
            'モリブデン': 'molybdenum',
            'カリウム': 'potassium',
            'リン': 'phosphorus',
            'ヨウ素': 'iodine',
            
            // 脂肪酸・オメガ系
            'オメガ3': 'omega-3',
            'オメガ': 'omega',
            'epa': 'epa',
            'dha': 'dha',
            'フィッシュオイル': 'fish oil',
            '魚油': 'fish oil',
            
            // 特殊成分・アミノ酸
            'コエンザイムq10': 'coenzyme q10',
            'coq10': 'coq10',
            'ルテイン': 'lutein',
            'リコピン': 'lycopene',
            'ベータカロテン': 'beta-carotene',
            'アスタキサンチン': 'astaxanthin',
            'クレアチン': 'creatine',
            'プロテイン': 'protein',
            'コラーゲン': 'collagen',
            'グルコサミン': 'glucosamine',
            'コンドロイチン': 'chondroitin',
            'レスベラトロール': 'resveratrol',
            'クルクミン': 'curcumin',
            'ケルセチン': 'quercetin',
            'カルノシン': 'carnosine',
            
            // プロバイオティクス・その他
            'プロバイオティクス': 'probiotics',
            'プロバイオ': 'probiotics',
            '乳酸菌': 'probiotics',
            
            // ハーブ・植物エキス
            'アシュワガンダ': 'ashwagandha',
            'ウコン': 'turmeric',
            'ターメリック': 'turmeric',
            'ギンコ': 'ginkgo',
            'イチョウ葉': 'ginkgo',
            'エキナセア': 'echinacea',
            'ガーリック': 'garlic',
            'にんにく': 'garlic',
            'ジンセン': 'ginseng',
            '高麗人参': 'ginseng',
            
            // 一般的な検索語
            'ミネラル': 'mineral',
            'アミノ酸': 'amino acid',
            'ハーブ': 'herbal',
            '植物': 'botanical',
            'エキス': 'extract'
        };
        
        // Direct mapping
        if (reverseMapping[queryLower]) {
            return reverseMapping[queryLower];
        }
        
        // Partial matching for compound terms
        for (const [japanese, english] of Object.entries(reverseMapping)) {
            if (queryLower.includes(japanese) || japanese.includes(queryLower)) {
                return english;
            }
        }
        
        // Return original query if no translation found
        return japaneseQuery;
    }

    // Get product image using Barcode Lookup API
    async getBarcodeImage(upc) {
        if (!upc) return null;
        
        const cacheKey = `barcode_${upc}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const url = `${this.barcodeApiUrl}?barcode=${upc}&formatted=y&key=${this.barcodeApiKey}`;
            console.log('Barcode Lookup API Request:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Barcode API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Barcode API Response:', data);
            
            let imageUrl = null;
            if (data.products && data.products.length > 0) {
                const product = data.products[0];
                imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
            }
            
            // Cache the response
            this.cache.set(cacheKey, {
                data: imageUrl,
                timestamp: Date.now()
            });

            return imageUrl;
        } catch (error) {
            console.error('Barcode API Request failed:', error);
            return null;
        }
    }

    // Get product image from barcode API (fallback)
    async getProductImageByBarcode(barcode) {
        if (!barcode) return null;
        
        const cacheKey = `barcode_${barcode}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const url = `${this.barcodeApiUrl}?barcode=${barcode}&formatted=y&key=${this.barcodeApiKey}`;
            console.log('Barcode API Request:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Barcode API Error: ${response.status}`);
            }

            const data = await response.json();
            
            let imageUrl = null;
            if (data.products && data.products.length > 0) {
                const product = data.products[0];
                imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
            }
            
            // Cache the response
            this.cache.set(cacheKey, {
                data: imageUrl,
                timestamp: Date.now()
            });

            return imageUrl;
        } catch (error) {
            console.error('Barcode API Request failed:', error);
            return null;
        }
    }

    // Get supplement with image using your suggested approach
    async getSupplementWithImage(query) {
        try {
            console.log(`Getting supplement with image for query: ${query}`);
            
            // DSLDで基本情報
            const dsldData = await fetch(`${this.baseUrl}/products?q=${query}`);
            if (!dsldData.ok) {
                throw new Error(`DSLD API Error: ${dsldData.status}`);
            }
            
            const supplement = await dsldData.json();
            console.log('DSLD supplement data:', supplement);
            
            if (!supplement || !supplement.hits || supplement.hits.length === 0) {
                return null;
            }
            
            const firstSupplement = supplement.hits[0]._source;
            
            // UPCで画像取得 - Barcode Lookup APIを使用
            let imageUrl = null;
            if (firstSupplement.upcSku) {
                console.log(`Fetching image for UPC: ${firstSupplement.upcSku}`);
                imageUrl = await this.getBarcodeImage(firstSupplement.upcSku);
                console.log('Final image URL:', imageUrl);
            }
            
            return {
                ...firstSupplement,
                image: imageUrl
            };
        } catch (error) {
            console.error('getSupplementWithImage failed:', error);
            return null;
        }
    }

    // Get complete product data with image from multiple APIs
    async getCompleteProductData(query, options = {}) {
        try {
            console.log('Using new getSupplementWithImage approach');
            
            const supplementWithImage = await this.getSupplementWithImage(query);
            if (!supplementWithImage) {
                return null;
            }
            
            // Transform to expected format
            const transformedProduct = {
                ...this.transformProduct(supplementWithImage),
                image_url: supplementWithImage.image
            };
            
            return {
                hits: [{
                    _source: transformedProduct
                }]
            };
        } catch (error) {
            console.error('Complete product data request failed:', error);
            return null;
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other modules
window.DSLDApi = DSLDApi;

// Create global instance
window.dsldApi = new DSLDApi();