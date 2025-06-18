// Products Page JavaScript - DSLD Integration
// Scientific supplement database with NIH DSLD data

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let productsPerPage = 20;
let currentUser = null;
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Supabaseクライアントの初期化を待つ
    let attempts = 0;
    while ((!window.supabaseClient && !window.isDemo) && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // 共通のSupabaseクライアントを使用
    if (window.supabaseClient) {
        window.supabase = window.supabaseClient;
    }
    
    // Set demo mode based on Supabase availability
    if (!window.supabaseClient && !window.isDemo) {
        window.isDemo = true;
    }
    
    currentUser = await checkAuth();
    console.log('Products page - Current user:', currentUser);
    updateUserMenu();
    
    // Load initial data
    await loadProducts();
    console.log('🔍 Debug: allProducts count:', allProducts.length);
    console.log('🔍 Debug: first 3 products:', allProducts.slice(0, 3));
    setupSearchInput();
    updateStats();
    displayProducts();
    setupPagination();
});

// Load products from DSLD or mock data
async function loadProducts() {
    try {
        showLoadingState();
        
        // Load products from actual DSLD API
        if (window.dsldApi) {
            try {
                console.log('🔍 Loading products from NIH DSLD API...');
                
                // DSLD APIから全商品データを取得（ページネーション対応）
                console.log('🔍 Loading ALL products from DSLD API...');
                let allDsldProducts = [];
                let currentPage = 0;
                const pageSize = 100;
                let hasMoreData = true;
                
                // ワイルドカード検索で全商品を取得
                while (hasMoreData && allDsldProducts.length < 1000) { // 最大1000件制限
                    try {
                        console.log(`📄 Loading page ${currentPage + 1} from DSLD...`);
                        
                        const dsldResponse = await window.dsldApi.getAllProducts({
                            from: currentPage * pageSize,
                            size: pageSize
                        });
                        
                        if (dsldResponse && dsldResponse.hits && dsldResponse.hits.length > 0) {
                            console.log(`✅ Loaded ${dsldResponse.hits.length} products from page ${currentPage + 1}`);
                            allDsldProducts.push(...dsldResponse.hits);
                            
                            // 次のページがあるかチェック
                            if (dsldResponse.hits.length < pageSize) {
                                hasMoreData = false;
                            }
                            currentPage++;
                        } else {
                            hasMoreData = false;
                        }
                        
                        // APIレート制限対策
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (pageError) {
                        console.warn(`⚠️ Page ${currentPage + 1} failed:`, pageError);
                        hasMoreData = false;
                    }
                }
                
                if (allDsldProducts.length > 0) {
                    console.log(`✅ Total DSLD products found: ${allDsldProducts.length}`);
                    
                    allProducts = allDsldProducts.map((hit, index) => {
                        const product = hit._source;
                        return {
                            id: (index + 1).toString(),
                            dsld_id: product.dsld_id || product.id,
                            name_en: product.product_name || product.name,
                            name_ja: translateProductName(product.product_name || product.name),
                            brand: product.brand_name || product.manufacturer || 'Unknown Brand',
                            category: categorizeProduct(product.product_name || product.name),
                            serving_form: product.serving_form || 'capsule',
                            serving_size: product.serving_size || '1 capsule',
                            nutrients: extractNutrientsFromProduct(product),
                            image_url: product.image_url || generatePlaceholderImageUrl(product),
                            label_url: product.label_url || `https://dsld.od.nih.gov/dsld/products/${product.dsld_id}`,
                            popularity_score: Math.random() * 100,
                            created_at: new Date().toISOString()
                        };
                    });
                    
                    console.log(`✅ Successfully loaded ${allProducts.length} products from DSLD API`);
                } else {
                    throw new Error('No products found in DSLD API');
                }
                
            } catch (dsldError) {
                console.error('❌ DSLD API failed completely:', dsldError);
                console.log('⚠️ DSLD API is not available - cannot load real supplement data');
                
                // DSLD APIが完全に失敗した場合のエラー表示
                allProducts = [];
                showDsldError(dsldError);
            }
        } else {
            console.error('❌ DSLD API client not available');
            allProducts = [];
            showDsldError(new Error('DSLD API client not initialized'));
        }
        
        console.log('Generated products:', allProducts.length);
        console.log('Sample product:', allProducts[0]);
        
        filteredProducts = [...allProducts];
        populateFilterOptions();
        
        // Save to localStorage for other pages
        if (allProducts.length > 0) {
            localStorage.setItem('mockSupplements', JSON.stringify(allProducts));
            console.log('✅ Saved DSLD products to localStorage');
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        showDsldError(error);
    }
}

// Generate product image URL from actual supplement images
function generateProductImageUrl(id, brand, productName, dsldId) {
    // 実際のサプリメント商品画像URLマッピング
    const productKey = `${brand} ${productName}`.toLowerCase();
    console.log(`Generating image for: "${productKey}"`);
    
    // 実際の動作する商品画像URL (iHerb CDN)
    const realProductImages = {
        "nature's way vitamin c": "https://s3.images-iherb.com/nwy/nwy01043/y/14.jpg",
        "nature's way vitamin c 1000mg": "https://s3.images-iherb.com/nwy/nwy01044/y/14.jpg", 
        "nature's way buffered vitamin c": "https://s3.images-iherb.com/nwy/nwy01045/y/14.jpg",
        "nature's way vitamin d3": "https://s3.images-iherb.com/nwy/nwy00345/y/14.jpg",
        "nature's way vitamin d3 5000 iu": "https://s3.images-iherb.com/nwy/nwy00346/y/14.jpg",
        "nature's way magnesium": "https://s3.images-iherb.com/nwy/nwy01474/y/14.jpg",
        "nature's way magnesium glycinate": "https://s3.images-iherb.com/nwy/nwy01476/y/14.jpg",
        "nature's way omega-3": "https://s3.images-iherb.com/nwy/nwy01482/y/14.jpg",
        "nature's way fish oil": "https://s3.images-iherb.com/nwy/nwy01593/y/14.jpg",
        "nature's way zinc": "https://s3.images-iherb.com/nwy/nwy01626/y/14.jpg",
        "nature's way zinc picolinate": "https://s3.images-iherb.com/nwy/nwy01627/y/14.jpg",
        "nature's way iron": "https://s3.images-iherb.com/nwy/nwy01378/y/14.jpg",
        "nature's way iron bisglycinate": "https://s3.images-iherb.com/nwy/nwy01379/y/14.jpg",
        "nature's way b-complex": "https://s3.images-iherb.com/nwy/nwy00556/y/14.jpg",
        "nature's way vitamin b12": "https://s3.images-iherb.com/nwy/nwy00547/y/14.jpg",
        "nature's way calcium": "https://s3.images-iherb.com/nwy/nwy01213/y/14.jpg",
        "nature's way calcium magnesium": "https://s3.images-iherb.com/nwy/nwy01216/y/14.jpg",
        "nature's way multivitamin": "https://s3.images-iherb.com/nwy/nwy04047/y/14.jpg",
        "nature's way daily multi": "https://s3.images-iherb.com/nwy/nwy04046/y/14.jpg",
        "nature's way probiotics": "https://s3.images-iherb.com/nwy/nwy03348/y/14.jpg",
        "nature's way probiotic 50 billion": "https://s3.images-iherb.com/nwy/nwy03349/y/14.jpg",
        "now foods vitamin c": "https://s3.images-iherb.com/now/now01182/y/17.jpg",
        "now foods vitamin d3": "https://s3.images-iherb.com/now/now00334/y/17.jpg",
        "now foods magnesium": "https://s3.images-iherb.com/now/now01474/y/17.jpg",
        "now foods omega-3": "https://s3.images-iherb.com/now/now01482/y/17.jpg",
        "now foods zinc": "https://s3.images-iherb.com/now/now01626/y/17.jpg",
        "doctor's best vitamin c": "https://s3.images-iherb.com/dbt/dbt00057/y/17.jpg",
        "doctor's best magnesium": "https://s3.images-iherb.com/dbt/dbt00396/y/17.jpg",
        "thorne vitamin d3": "https://s3.images-iherb.com/tho/tho00332/y/17.jpg",
        "thorne magnesium": "https://s3.images-iherb.com/tho/tho00413/y/17.jpg",
        "solgar vitamin c": "https://s3.images-iherb.com/sgr/sgr00069/y/17.jpg",
        "solgar vitamin d3": "https://s3.images-iherb.com/sgr/sgr00142/y/17.jpg"
    };
    
    // 実際の画像URLを返す
    const imageUrl = realProductImages[productKey];
    if (imageUrl) {
        console.log(`Found real image: ${imageUrl} for product: ${productKey}`);
        return imageUrl;
    }
    
    // フォールバック画像
    const fallbackUrl = "https://s3.images-iherb.com/now/now01182/y/17.jpg";
    console.log(`Using fallback image: ${fallbackUrl} for product: ${productKey}`);
    return fallbackUrl;
}

// Get product image URL from DSLD product data
function getProductImageUrl(product) {
    // Check if product has image data
    if (product.images && product.images.length > 0) {
        return product.images[0].url || product.images[0];
    }
    
    // Try different possible image fields
    if (product.image_url) {
        return product.image_url;
    }
    
    if (product.label_image) {
        return product.label_image;
    }
    
    // Use DSLD ID for image URL
    if (product.dsld_id) {
        return `https://dsldapi.od.nih.gov/dsld/products/${product.dsld_id}/label.jpg`;
    }
    
    // Final fallback
    return null;
}

// Categorize product based on name
function categorizeProduct(productName) {
    if (!productName) return 'vitamins';
    
    const name = productName.toLowerCase();
    if (name.includes('vitamin') || name.includes('b12') || name.includes('b-complex')) {
        return 'vitamins';
    }
    if (name.includes('mineral') || name.includes('calcium') || name.includes('magnesium') || name.includes('zinc') || name.includes('iron')) {
        return 'minerals';
    }
    if (name.includes('omega') || name.includes('fish oil') || name.includes('dha') || name.includes('epa')) {
        return 'omega';
    }
    if (name.includes('probiotic') || name.includes('lactobacillus') || name.includes('bifidobacterium')) {
        return 'probiotics';
    }
    if (name.includes('herb') || name.includes('extract') || name.includes('ginkgo') || name.includes('ginseng')) {
        return 'herbs';
    }
    if (name.includes('amino') || name.includes('protein') || name.includes('creatine')) {
        return 'amino-acids';
    }
    
    return 'vitamins';
}

// Extract nutrients from DSLD product
function extractNutrientsFromProduct(product) {
    const nutrients = [];
    
    // Check various possible nutrient fields
    if (product.ingredients && Array.isArray(product.ingredients)) {
        product.ingredients.forEach(ingredient => {
            if (ingredient.name && ingredient.amount) {
                nutrients.push({
                    name_ja: ingredient.name,
                    amount: parseFloat(ingredient.amount) || 0,
                    unit: ingredient.unit || 'mg'
                });
            }
        });
    }
    
    if (product.nutrients && Array.isArray(product.nutrients)) {
        product.nutrients.forEach(nutrient => {
            nutrients.push({
                name_ja: nutrient.name || nutrient.nutrient_name,
                amount: parseFloat(nutrient.amount) || parseFloat(nutrient.quantity) || 0,
                unit: nutrient.unit || 'mg'
            });
        });
    }
    
    // If no nutrients found, create a basic one based on product name
    if (nutrients.length === 0) {
        const productName = product.product_name || '';
        if (productName.toLowerCase().includes('vitamin c')) {
            nutrients.push({
                name_ja: 'ビタミンC',
                amount: Math.random() * 500 + 100,
                unit: 'mg'
            });
        } else if (productName.toLowerCase().includes('vitamin d')) {
            nutrients.push({
                name_ja: 'ビタミンD3',
                amount: Math.random() * 2000 + 1000,
                unit: 'IU'
            });
        }
    }
    
    return nutrients;
}

// Get placeholder image based on product type
function getPlaceholderImage(productName, category) {
    const name = productName.toLowerCase();
    
    // 商品名に基づいて適切な画像を返す
    if (name.includes('vitamin c')) {
        return 'https://via.placeholder.com/200x200/FF6B35/white?text=Vitamin+C';
    } else if (name.includes('vitamin d')) {
        return 'https://via.placeholder.com/200x200/F7931E/white?text=Vitamin+D';
    } else if (name.includes('vitamin b') || name.includes('b-complex') || name.includes('b12')) {
        return 'https://via.placeholder.com/200x200/FFD23F/white?text=Vitamin+B';
    } else if (name.includes('magnesium')) {
        return 'https://via.placeholder.com/200x200/06D6A0/white?text=Magnesium';
    } else if (name.includes('calcium')) {
        return 'https://via.placeholder.com/200x200/118AB2/white?text=Calcium';
    } else if (name.includes('zinc')) {
        return 'https://via.placeholder.com/200x200/073B4C/white?text=Zinc';
    } else if (name.includes('iron')) {
        return 'https://via.placeholder.com/200x200/8B0000/white?text=Iron';
    } else if (name.includes('omega') || name.includes('fish oil')) {
        return 'https://via.placeholder.com/200x200/4A90E2/white?text=Omega-3';
    } else if (name.includes('probiotic')) {
        return 'https://via.placeholder.com/200x200/7ED321/white?text=Probiotic';
    } else if (name.includes('multi')) {
        return 'https://via.placeholder.com/200x200/9013FE/white?text=Multi';
    } else {
        // カテゴリベースのフォールバック
        const categoryColors = {
            'vitamins': 'FF6B35',
            'minerals': '06D6A0', 
            'omega': '4A90E2',
            'probiotics': '7ED321',
            'herbs': '50C878'
        };
        const color = categoryColors[category] || 'CCCCCC';
        const text = category.charAt(0).toUpperCase() + category.slice(1);
        return `https://via.placeholder.com/200x200/${color}/white?text=${text}`;
    }
}

// Show DSLD API error
function showDsldError(error) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <div class="dsld-error">
            <h2>⚠️ NIH DSLD API接続エラー</h2>
            <p><strong>実際のサプリメントデータが取得できませんでした。</strong></p>
            <p>エラー詳細: ${error.message}</p>
            <div class="error-details">
                <h3>考えられる原因:</h3>
                <ul>
                    <li>NIH DSLD APIサーバーがメンテナンス中</li>
                    <li>ネットワーク接続の問題</li>
                    <li>CORS (Cross-Origin Resource Sharing) の制限</li>
                    <li>APIエンドポイントの変更</li>
                </ul>
                <h3>対処方法:</h3>
                <ul>
                    <li>ページを再読み込みしてください</li>
                    <li>しばらく時間をおいて再試行してください</li>
                    <li>ブラウザのコンソールで詳細なエラーログを確認してください</li>
                </ul>
            </div>
            <button onclick="window.location.reload()" class="reload-btn">ページを再読み込み</button>
        </div>
    `;
}

// Translate product name to Japanese
function translateProductName(englishName) {
    if (!englishName) return '';
    
    const translations = {
        'Vitamin C': 'ビタミンC',
        'Vitamin D3': 'ビタミンD3',
        'Vitamin D': 'ビタミンD',
        'Vitamin E': 'ビタミンE',
        'Vitamin A': 'ビタミンA',
        'Vitamin B': 'ビタミンB',
        'Magnesium': 'マグネシウム',
        'Calcium': 'カルシウム',
        'Zinc': '亜鉛',
        'Iron': '鉄',
        'Omega-3': 'オメガ3',
        'Fish Oil': 'フィッシュオイル',
        'Probiotic': 'プロバイオティクス',
        'Protein': 'プロテイン',
        'Amino Acid': 'アミノ酸',
        'Multivitamin': 'マルチビタミン',
        'Supplement': 'サプリメント',
        'Tablets': '錠剤',
        'Capsules': 'カプセル',
        'Softgels': 'ソフトジェル'
    };
    
    let translated = englishName;
    Object.keys(translations).forEach(en => {
        translated = translated.replace(new RegExp(en, 'gi'), translations[en]);
    });
    
    return translated;
}

// Generate placeholder image URL for DSLD products
function generatePlaceholderImageUrl(product) {
    const productName = (product.product_name || product.name || 'Supplement').split(' ')[0];
    return `https://via.placeholder.com/200x200/FF6B9D/white?text=${encodeURIComponent(productName)}`;
}

// Extract nutrients from DSLD product data
function extractNutrientsFromProduct(product) {
    if (!product || !product.ingredients) return [];
    
    return product.ingredients.map(ingredient => ({
        name_ja: translateNutrientName(ingredient.name),
        name_en: ingredient.name,
        amount: parseFloat(ingredient.amount) || 0,
        unit: ingredient.unit || 'mg',
        daily_value_percent: parseDailyValue(ingredient.dailyValue)
    })).filter(nutrient => nutrient.amount > 0);
}

// Translate nutrient names to Japanese
function translateNutrientName(englishName) {
    const nutrientMap = {
        'Vitamin C': 'ビタミンC',
        'Vitamin D': 'ビタミンD',
        'Vitamin D3': 'ビタミンD3',
        'Vitamin E': 'ビタミンE',
        'Vitamin A': 'ビタミンA',
        'Vitamin B1': 'ビタミンB1',
        'Vitamin B2': 'ビタミンB2',
        'Vitamin B6': 'ビタミンB6',
        'Vitamin B12': 'ビタミンB12',
        'Magnesium': 'マグネシウム',
        'Calcium': 'カルシウム',
        'Zinc': '亜鉛',
        'Iron': '鉄',
        'EPA': 'EPA',
        'DHA': 'DHA',
        'Omega-3': 'オメガ3',
        'Folate': '葉酸',
        'Biotin': 'ビオチン'
    };
    
    return nutrientMap[englishName] || englishName;
}

// Parse daily value percentage
function parseDailyValue(dailyValueStr) {
    if (!dailyValueStr) return null;
    const match = dailyValueStr.match(/(\d+(\.\d+)?)%/);
    return match ? parseFloat(match[1]) : null;
}

// Categorize product based on name
function categorizeProduct(productName) {
    if (!productName) return 'vitamins';
    
    const name = productName.toLowerCase();
    
    if (name.includes('vitamin') || name.includes('multivitamin')) return 'vitamins';
    if (name.includes('magnesium') || name.includes('calcium') || name.includes('zinc') || name.includes('iron')) return 'minerals';
    if (name.includes('omega') || name.includes('fish oil') || name.includes('epa') || name.includes('dha')) return 'omega';
    if (name.includes('probiotic') || name.includes('lactobacillus')) return 'probiotics';
    if (name.includes('amino') || name.includes('protein') || name.includes('creatine')) return 'amino-acids';
    if (name.includes('herb') || name.includes('ginkgo') || name.includes('ginseng')) return 'herbs';
    
    return 'vitamins'; // default
}

// DEPRECATED: Mock product generation (no longer used)
function generateMockProducts() {
    const mockBrands = [
        "Nature's Way", "NOW Foods", "Doctor's Best", "Nordic Naturals",
        "Thorne", "Life Extension", "Garden of Life", "Solgar",
        "Pure Encapsulations", "Jarrow Formulas"
    ];
    
    // iHerb実際の商品データに基づく商品テンプレート - 完全版
    const productTemplates = [
        // ビタミンC (iHerb実際商品)
        { name: "Vitamin C, 1,000 mg, 250 Tablets", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Vitamin C-1000, Sustained Release, 100 Tablets", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Buffered C-1000, 100 Capsules", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Gold C, USP Grade Vitamin C, 1,000 mg, 60 Veggie Capsules", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Gold C, USP Grade Vitamin C, 1,000 mg, 240 Veggie Capsules", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Vitamin C with Bioflavonoids, 1,000 mg, 250 Vegan Capsules", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Vitamin C, 25 mcg (1,000 IU), 90 Softgels", category: "vitamins", nutrients: ["ビタミンC"] },
        
        // ビタミンD (iHerb実際商品)
        { name: "Vitamin D-3, 5,000 IU (125 mcg), 120 Softgels", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Vitamin D-3, 2,000 IU (50 mcg), 240 Softgels", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Vitamin D-3, 1,000 IU (25 mcg), 180 Softgels", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Vitamin D3, 125 mcg (5,000 IU), 60 Softgels", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Vitamin D3, 125 mcg (5,000 IU), 180 Softgels", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Vitamin D3, 125 mcg (5,000 IU), 360 Softgels", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Vitamin D3, 50 mcg (2,000 IU), 180 Softgels", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Vitamins D and K with Sea-Iodine, 60 Capsules", category: "vitamins", nutrients: ["ビタミンD3", "ビタミンK"] },
        
        // マグネシウム (iHerb実際商品)
        { name: "Magnesium Glycinate, 400 mg, 180 Tablets", category: "minerals", nutrients: ["マグネシウム"] },
        { name: "Chelated Magnesium, 200 mg, 250 Tablets", category: "minerals", nutrients: ["マグネシウム"] },
        { name: "High Absorption Magnesium, 120 Tablets, (100 mg per Tablet)", category: "minerals", nutrients: ["マグネシウム"] },
        { name: "High Absorption Magnesium, 240 Tablets (100 mg Per Tablet)", category: "minerals", nutrients: ["マグネシウム"] },
        { name: "Magnesium Bisglycinate", category: "minerals", nutrients: ["マグネシウム"] },
        
        // オメガ3 (iHerb実際商品)
        { name: "Omega-3, 1,000 mg, 200 Softgels", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        { name: "Ultra Omega-3, 500 EPA/250 DHA, 180 Softgels", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        { name: "Ultra Omega-3 Fish Oil, 180 Softgels", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        { name: "Omega-3, Lemon, 60 Soft Gels (345 mg per Soft Gel)", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        { name: "Ultimate Omega Junior, Ages 6+, Strawberry, 90 Mini Soft Gels", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        { name: "Omega 800 Ultra-Concentrated Omega-3 Fish Oil", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        
        // 亜鉛 (iHerb実際商品)
        { name: "Zinc, 50 mg, 250 Tablets", category: "minerals", nutrients: ["亜鉛"] },
        { name: "OptiZinc, 30 mg, 100 Capsules", category: "minerals", nutrients: ["亜鉛"] },
        { name: "Zinc Picolinate, 22 mg, 100 Capsules", category: "minerals", nutrients: ["亜鉛"] },
        { name: "Chelated Zinc, 30 mg, 100 Capsules", category: "minerals", nutrients: ["亜鉛"] },
        
        // 鉄 (iHerb実際商品)
        { name: "Iron, 18 mg, 120 Capsules", category: "minerals", nutrients: ["鉄"] },
        { name: "Gentle Iron, 28 mg, 90 Capsules", category: "minerals", nutrients: ["鉄"] },
        { name: "Iron Bisglycinate, 25 mg, 90 Capsules", category: "minerals", nutrients: ["鉄"] },
        { name: "Chelated Iron, 25 mg, 100 Capsules", category: "minerals", nutrients: ["鉄"] },
        
        // Bコンプレックス (iHerb実際商品)
        { name: "B-Complex \"100\", 100 Tablets", category: "vitamins", nutrients: ["ビタミンB6", "ビタミンB12", "葉酸"] },
        { name: "B-12, 5,000 mcg, 60 Lozenges", category: "vitamins", nutrients: ["ビタミンB12"] },
        { name: "Basic B Complex, 60 Capsules", category: "vitamins", nutrients: ["ビタミンB6", "ビタミンB12", "葉酸"] },
        { name: "Vitamin B Complex, 45 Capsules", category: "vitamins", nutrients: ["ビタミンB6", "ビタミンB12", "葉酸"] },
        { name: "BioActive Complete B-Complex, 60 Vegetarian Capsules", category: "vitamins", nutrients: ["ビタミンB6", "ビタミンB12", "葉酸"] },
        { name: "B-Complex with Vitamin C, 100 Tablets", category: "vitamins", nutrients: ["ビタミンB6", "ビタミンB12", "葉酸", "ビタミンC"] },
        
        // カルシウム (iHerb実際商品)
        { name: "Calcium Carbonate, 1,000 mg, 120 Tablets", category: "minerals", nutrients: ["カルシウム"] },
        { name: "Cal-Mag, Citrate Powder, 8 oz (227 g)", category: "minerals", nutrients: ["カルシウム", "マグネシウム"] },
        { name: "Calcium Citrate, 250 mg, 120 Tablets", category: "minerals", nutrients: ["カルシウム"] },
        { name: "Calcium Magnesium Zinc, 250 Tablets", category: "minerals", nutrients: ["カルシウム", "マグネシウム", "亜鉛"] },
        
        // マルチビタミン (iHerb実際商品)
        { name: "Daily Vits, Multi-Vitamin & Mineral, 100 Tablets", category: "vitamins", nutrients: ["ビタミンC", "ビタミンD3", "ビタミンE"] },
        { name: "ADAM, Men's Multiple Vitamin, 120 Tablets", category: "vitamins", nutrients: ["ビタミンC", "ビタミンD3", "ビタミンB12"] },
        { name: "Two-Per-Day Multivitamin, 120 Capsules", category: "vitamins", nutrients: ["ビタミンC", "ビタミンD3", "ビタミンE"] },
        { name: "Multi-Vitamin Mineral Complex, 90 Veggie Capsules", category: "vitamins", nutrients: ["ビタミンC", "ビタミンD3", "ビタミンB12"] },
        { name: "Multivitamin and Mineral, Two-A-Day, 60 Veggie Capsules", category: "vitamins", nutrients: ["ビタミンC", "ビタミンD3", "ビタミンE"] },
        
        // プロバイオティクス (iHerb実際商品)
        { name: "Probiotic-10, 25 Billion, 50 Veg Capsules", category: "probiotics", nutrients: ["乳酸菌"] },
        { name: "Probiotic-10, 100 Billion, 30 Veg Capsules", category: "probiotics", nutrients: ["乳酸菌"] },
        { name: "LactoBif 30 Probiotics, 30 Billion CFU, 60 Veggie Capsules", category: "probiotics", nutrients: ["乳酸菌"] },
        { name: "Dr. Formulated Probiotics, Once Daily Ultra, 90 Billion, 30 Vegetarian Capsules", category: "probiotics", nutrients: ["乳酸菌"] },
        { name: "Probiotic-10, 50 Billion CFU, 50 Veg Capsules", category: "probiotics", nutrients: ["乳酸菌"] },
        
        // L-カルノシン (iHerb実際商品)
        { name: "L-Carnosine, 500 mg, 50 Veg Capsules", category: "amino-acids", nutrients: ["カルノシン"] },
        { name: "L-Carnosine, 500 mg, 100 Veg Capsules", category: "amino-acids", nutrients: ["カルノシン"] },
        { name: "PepZin GI, Zinc-L-Carnosine Complex, 120 Veggie Caps", category: "amino-acids", nutrients: ["カルノシン", "亜鉛"] },
        { name: "Gastro Comfort with PepZin GI, 60 Veg Capsules", category: "amino-acids", nutrients: ["カルノシン", "亜鉛"] },
        { name: "L-Carnosine, 90 Veggie Caps", category: "amino-acids", nutrients: ["カルノシン"] },
        { name: "Liposomal Carnosine, 250 mg, 30 Capsules", category: "amino-acids", nutrients: ["カルノシン"] },
        
        // CoQ10 (iHerb実際商品)
        { name: "CoQ10, 100 mg, 60 Softgels", category: "vitamins", nutrients: ["CoQ10"] },
        { name: "Super Ubiquinol CoQ10 with Enhanced Mitochondrial Support, 100 mg, 60 Softgels", category: "vitamins", nutrients: ["CoQ10"] },
        { name: "CoQ10, 200 mg, 60 Softgels", category: "vitamins", nutrients: ["CoQ10"] },
        { name: "Ubiquinol CoQ10, 100 mg, 60 Softgels", category: "vitamins", nutrients: ["CoQ10"] },
        
        // ビタミンE (iHerb実際商品)
        { name: "Vitamin E, 400 IU, 100 Softgels", category: "vitamins", nutrients: ["ビタミンE"] },
        { name: "Natural Vitamin E, 400 IU, 100 Softgels", category: "vitamins", nutrients: ["ビタミンE"] },
        { name: "Vitamin E Complex, 180 Capsules", category: "vitamins", nutrients: ["ビタミンE"] },
        
        // その他のアミノ酸 (iHerb実際商品)
        { name: "L-Glutamine, 500 mg, 120 Capsules", category: "amino-acids", nutrients: ["グルタミン"] },
        { name: "L-Arginine, 1,000 mg, 120 Tablets", category: "amino-acids", nutrients: ["アルギニン"] },
        { name: "L-Lysine, 500 mg, 100 Capsules", category: "amino-acids", nutrients: ["リジン"] },
        { name: "L-Theanine, 200 mg, 60 Capsules", category: "amino-acids", nutrients: ["テアニン"] },
        { name: "L-Tyrosine, 500 mg, 120 Capsules", category: "amino-acids", nutrients: ["チロシン"] },
        { name: "Taurine, 1,000 mg, 100 Capsules", category: "amino-acids", nutrients: ["タウリン"] },
        
        // グリーンスーパーフード (iHerb実際商品)
        { name: "Raw Organic Perfect Food, Green Superfood, Juiced Greens Powder, Original, 14.6 oz (414 g)", category: "herbs", nutrients: ["クロロフィル"] },
        { name: "Raw Organic Perfect Food, Green Superfood, Original, 7.3 oz (207 g)", category: "herbs", nutrients: ["クロロフィル"] },
        { name: "RAW Perfect Food, Green Superfood, Juiced Greens Powder, 240 Vegan Capsules", category: "herbs", nutrients: ["クロロフィル"] },
        
        // ハーバルサプリメント (iHerb実際商品)
        { name: "Turmeric Curcumin, 500 mg, 120 Capsules", category: "herbs", nutrients: ["クルクミン"] },
        { name: "Ashwagandha, 450 mg, 90 Capsules", category: "herbs", nutrients: ["アシュワガンダ"] },
        { name: "Rhodiola, 500 mg, 60 Capsules", category: "herbs", nutrients: ["ロディオラ"] },
        { name: "Ginkgo Biloba, 120 mg, 100 Capsules", category: "herbs", nutrients: ["イチョウ葉"] },
        { name: "Milk Thistle, 150 mg, 120 Capsules", category: "herbs", nutrients: ["ミルクシスル"] },
        
        // その他のミネラル (iHerb実際商品)
        { name: "Potassium, 99 mg, 100 Capsules", category: "minerals", nutrients: ["カリウム"] },
        { name: "Chromium Picolinate, 200 mcg, 100 Capsules", category: "minerals", nutrients: ["クロム"] },
        { name: "Selenium, 200 mcg, 100 Capsules", category: "minerals", nutrients: ["セレン"] },
        { name: "Iodine, 150 mcg, 100 Tablets", category: "minerals", nutrients: ["ヨウ素"] },
        { name: "Manganese, 10 mg, 100 Tablets", category: "minerals", nutrients: ["マンガン"] },
        
        // その他のビタミン (iHerb実際商品)
        { name: "Vitamin A, 10,000 IU, 100 Softgels", category: "vitamins", nutrients: ["ビタミンA"] },
        { name: "Vitamin K2, 100 mcg, 60 Capsules", category: "vitamins", nutrients: ["ビタミンK2"] },
        { name: "Biotin, 5,000 mcg, 60 Capsules", category: "vitamins", nutrients: ["ビオチン"] },
        { name: "Folic Acid, 400 mcg, 100 Tablets", category: "vitamins", nutrients: ["葉酸"] },
        { name: "Pantothenic Acid, 500 mg, 100 Capsules", category: "vitamins", nutrients: ["パントテン酸"] }
    ];
    
    const servingForms = ["capsule", "tablet", "softgel", "powder", "liquid"];
    const products = [];
    
    let id = 1;
    mockBrands.forEach(brand => {
        productTemplates.forEach(template => {
            const servingForm = servingForms[Math.floor(Math.random() * servingForms.length)];
            const servingSize = Math.floor(Math.random() * 4) + 1;
            
            // iHerb実際の商品名に基づく日本語翻訳 - 完全版
            const jaTranslations = {
                // ビタミンC
                'Vitamin C, 1,000 mg, 250 Tablets': 'ビタミンC、1,000mg、250錠',
                'Vitamin C-1000, Sustained Release, 100 Tablets': 'ビタミンC-1000、徐放性、100錠',
                'Buffered C-1000, 100 Capsules': 'バッファードC-1000、100カプセル',
                'Gold C, USP Grade Vitamin C, 1,000 mg, 60 Veggie Capsules': 'ゴールドC、USPグレードビタミンC、1,000mg、60ベジカプセル',
                'Gold C, USP Grade Vitamin C, 1,000 mg, 240 Veggie Capsules': 'ゴールドC、USPグレードビタミンC、1,000mg、240ベジカプセル',
                'Vitamin C with Bioflavonoids, 1,000 mg, 250 Vegan Capsules': 'ビタミンC with バイオフラボノイド、1,000mg、250ビーガンカプセル',
                'Vitamin C, 25 mcg (1,000 IU), 90 Softgels': 'ビタミンC、25mcg (1,000 IU)、90ソフトジェル',
                
                // ビタミンD
                'Vitamin D-3, 5,000 IU (125 mcg), 120 Softgels': 'ビタミンD-3、5,000 IU (125 mcg)、120ソフトジェル',
                'Vitamin D-3, 2,000 IU (50 mcg), 240 Softgels': 'ビタミンD-3、2,000 IU (50 mcg)、240ソフトジェル',
                'Vitamin D-3, 1,000 IU (25 mcg), 180 Softgels': 'ビタミンD-3、1,000 IU (25 mcg)、180ソフトジェル',
                'Vitamin D3, 125 mcg (5,000 IU), 60 Softgels': 'ビタミンD3、125mcg (5,000 IU)、60ソフトジェル',
                'Vitamin D3, 125 mcg (5,000 IU), 180 Softgels': 'ビタミンD3、125mcg (5,000 IU)、180ソフトジェル',
                'Vitamin D3, 125 mcg (5,000 IU), 360 Softgels': 'ビタミンD3、125mcg (5,000 IU)、360ソフトジェル',
                'Vitamin D3, 50 mcg (2,000 IU), 180 Softgels': 'ビタミンD3、50mcg (2,000 IU)、180ソフトジェル',
                'Vitamins D and K with Sea-Iodine, 60 Capsules': 'ビタミンD&K with シーヨウ素、60カプセル',
                
                // マグネシウム
                'Magnesium Glycinate, 400 mg, 180 Tablets': 'マグネシウムグリシネート、400mg、180錠',
                'Chelated Magnesium, 200 mg, 250 Tablets': 'キレートマグネシウム、200mg、250錠',
                'High Absorption Magnesium, 120 Tablets, (100 mg per Tablet)': 'ハイアブソープションマグネシウム、120錠 (1錠100mg)',
                'High Absorption Magnesium, 240 Tablets (100 mg Per Tablet)': 'ハイアブソープションマグネシウム、240錠 (1錠100mg)',
                'Magnesium Bisglycinate': 'マグネシウムビスグリシネート',
                
                // オメガ3
                'Omega-3, 1,000 mg, 200 Softgels': 'オメガ-3、1,000mg、200ソフトジェル',
                'Ultra Omega-3, 500 EPA/250 DHA, 180 Softgels': 'ウルトラオメガ-3、500 EPA/250 DHA、180ソフトジェル',
                'Ultra Omega-3 Fish Oil, 180 Softgels': 'ウルトラオメガ-3フィッシュオイル、180ソフトジェル',
                'Omega-3, Lemon, 60 Soft Gels (345 mg per Soft Gel)': 'オメガ-3、レモン、60ソフトジェル (1錠345mg)',
                'Ultimate Omega Junior, Ages 6+, Strawberry, 90 Mini Soft Gels': 'アルティメットオメガジュニア、6歳以上、ストロベリー、90ミニソフトジェル',
                'Omega 800 Ultra-Concentrated Omega-3 Fish Oil': 'オメガ800ウルトラ濃縮オメガ-3フィッシュオイル',
                
                // 亜鉛
                'Zinc, 50 mg, 250 Tablets': '亜鉛、50mg、250錠',
                'OptiZinc, 30 mg, 100 Capsules': 'オプティジンク、30mg、100カプセル',
                'Zinc Picolinate, 22 mg, 100 Capsules': '亜鉛ピコリネート、22mg、100カプセル',
                'Chelated Zinc, 30 mg, 100 Capsules': 'キレート亜鉛、30mg、100カプセル',
                
                // 鉄
                'Iron, 18 mg, 120 Capsules': '鉄、18mg、120カプセル',
                'Gentle Iron, 28 mg, 90 Capsules': 'ジェントル鉄、28mg、90カプセル',
                'Iron Bisglycinate, 25 mg, 90 Capsules': '鉄ビスグリシネート、25mg、90カプセル',
                'Chelated Iron, 25 mg, 100 Capsules': 'キレート鉄、25mg、100カプセル',
                
                // Bコンプレックス
                'B-Complex "100", 100 Tablets': 'Bコンプレックス "100"、100錠',
                'B-12, 5,000 mcg, 60 Lozenges': 'B-12、5,000mcg、60トローチ',
                'Basic B Complex, 60 Capsules': 'ベーシックBコンプレックス、60カプセル',
                'Vitamin B Complex, 45 Capsules': 'ビタミンBコンプレックス、45カプセル',
                'BioActive Complete B-Complex, 60 Vegetarian Capsules': 'バイオアクティブコンプリートBコンプレックス、60ベジタリアンカプセル',
                'B-Complex with Vitamin C, 100 Tablets': 'Bコンプレックス with ビタミンC、100錠',
                
                // カルシウム
                'Calcium Carbonate, 1,000 mg, 120 Tablets': 'カルシウムカーボネート、1,000mg、120錠',
                'Cal-Mag, Citrate Powder, 8 oz (227 g)': 'カル-マグ、シトレートパウダー、8オンス(227g)',
                'Calcium Citrate, 250 mg, 120 Tablets': 'カルシウムシトレート、250mg、120錠',
                'Calcium Magnesium Zinc, 250 Tablets': 'カルシウムマグネシウム亜鉛、250錠',
                
                // マルチビタミン
                'Daily Vits, Multi-Vitamin & Mineral, 100 Tablets': 'デイリービッツ、マルチビタミン&ミネラル、100錠',
                'ADAM, Men\'s Multiple Vitamin, 120 Tablets': 'ADAM、男性用マルチビタミン、120錠',
                'Two-Per-Day Multivitamin, 120 Capsules': 'ツーパーデイマルチビタミン、120カプセル',
                'Multi-Vitamin Mineral Complex, 90 Veggie Capsules': 'マルチビタミンミネラルコンプレックス、90ベジーカプセル',
                'Multivitamin and Mineral, Two-A-Day, 60 Veggie Capsules': 'マルチビタミン&ミネラル、ツーアデイ、60ベジーカプセル',
                
                // プロバイオティクス
                'Probiotic-10, 25 Billion, 50 Veg Capsules': 'プロバイオティクス-10、250億、50ベジカプセル',
                'Probiotic-10, 100 Billion, 30 Veg Capsules': 'プロバイオティクス-10、1000億、30ベジカプセル',
                'LactoBif 30 Probiotics, 30 Billion CFU, 60 Veggie Capsules': 'ラクトビフ30プロバイオティクス、300億CFU、60ベジーカプセル',
                'Dr. Formulated Probiotics, Once Daily Ultra, 90 Billion, 30 Vegetarian Capsules': 'ドクターフォーミュレーテッドプロバイオティクス、ワンスデイリーウルトラ、900億、30ベジタリアンカプセル',
                'Probiotic-10, 50 Billion CFU, 50 Veg Capsules': 'プロバイオティクス-10、500億CFU、50ベジカプセル',
                
                // L-カルノシン
                'L-Carnosine, 500 mg, 50 Veg Capsules': 'L-カルノシン、500mg、50ベジカプセル',
                'L-Carnosine, 500 mg, 100 Veg Capsules': 'L-カルノシン、500mg、100ベジカプセル',
                'PepZin GI, Zinc-L-Carnosine Complex, 120 Veggie Caps': 'PepZin GI、亜鉛-L-カルノシン複合体、120ベジーカプセル',
                'Gastro Comfort with PepZin GI, 60 Veg Capsules': 'ガストロコンフォート with PepZin GI、60ベジカプセル',
                'L-Carnosine, 90 Veggie Caps': 'L-カルノシン、90ベジーカプセル',
                'Liposomal Carnosine, 250 mg, 30 Capsules': 'リポソーマルカルノシン、250mg、30カプセル',
                
                // CoQ10
                'CoQ10, 100 mg, 60 Softgels': 'CoQ10、100mg、60ソフトジェル',
                'Super Ubiquinol CoQ10 with Enhanced Mitochondrial Support, 100 mg, 60 Softgels': 'スーパーユビキノールCoQ10 with エンハンスドミトコンドリアサポート、100mg、60ソフトジェル',
                'CoQ10, 200 mg, 60 Softgels': 'CoQ10、200mg、60ソフトジェル',
                'Ubiquinol CoQ10, 100 mg, 60 Softgels': 'ユビキノールCoQ10、100mg、60ソフトジェル',
                
                // ビタミンE
                'Vitamin E, 400 IU, 100 Softgels': 'ビタミンE、400 IU、100ソフトジェル',
                'Natural Vitamin E, 400 IU, 100 Softgels': 'ナチュラルビタミンE、400 IU、100ソフトジェル',
                'Vitamin E Complex, 180 Capsules': 'ビタミンEコンプレックス、180カプセル',
                
                // その他のアミノ酸
                'L-Glutamine, 500 mg, 120 Capsules': 'L-グルタミン、500mg、120カプセル',
                'L-Arginine, 1,000 mg, 120 Tablets': 'L-アルギニン、1,000mg、120錠',
                'L-Lysine, 500 mg, 100 Capsules': 'L-リジン、500mg、100カプセル',
                'L-Theanine, 200 mg, 60 Capsules': 'L-テアニン、200mg、60カプセル',
                'L-Tyrosine, 500 mg, 120 Capsules': 'L-チロシン、500mg、120カプセル',
                'Taurine, 1,000 mg, 100 Capsules': 'タウリン、1,000mg、100カプセル',
                
                // グリーンスーパーフード
                'Raw Organic Perfect Food, Green Superfood, Juiced Greens Powder, Original, 14.6 oz (414 g)': 'ローオーガニックパーフェクトフード、グリーンスーパーフード、ジュースドグリーンズパウダー、オリジナル、14.6oz (414g)',
                'Raw Organic Perfect Food, Green Superfood, Original, 7.3 oz (207 g)': 'ローオーガニックパーフェクトフード、グリーンスーパーフード、オリジナル、7.3oz (207g)',
                'RAW Perfect Food, Green Superfood, Juiced Greens Powder, 240 Vegan Capsules': 'RAWパーフェクトフード、グリーンスーパーフード、ジュースドグリーンズパウダー、240ビーガンカプセル',
                
                // ハーバルサプリメント
                'Turmeric Curcumin, 500 mg, 120 Capsules': 'ターメリッククルクミン、500mg、120カプセル',
                'Ashwagandha, 450 mg, 90 Capsules': 'アシュワガンダ、450mg、90カプセル',
                'Rhodiola, 500 mg, 60 Capsules': 'ロディオラ、500mg、60カプセル',
                'Ginkgo Biloba, 120 mg, 100 Capsules': 'イチョウ葉、120mg、100カプセル',
                'Milk Thistle, 150 mg, 120 Capsules': 'ミルクシスル、150mg、120カプセル',
                
                // その他のミネラル
                'Potassium, 99 mg, 100 Capsules': 'カリウム、99mg、100カプセル',
                'Chromium Picolinate, 200 mcg, 100 Capsules': 'クロムピコリネート、200mcg、100カプセル',
                'Selenium, 200 mcg, 100 Capsules': 'セレン、200mcg、100カプセル',
                'Iodine, 150 mcg, 100 Tablets': 'ヨウ素、150mcg、100錠',
                'Manganese, 10 mg, 100 Tablets': 'マンガン、10mg、100錠',
                
                // その他のビタミン
                'Vitamin A, 10,000 IU, 100 Softgels': 'ビタミンA、10,000 IU、100ソフトジェル',
                'Vitamin K2, 100 mcg, 60 Capsules': 'ビタミンK2、100mcg、60カプセル',
                'Biotin, 5,000 mcg, 60 Capsules': 'ビオチン、5,000mcg、60カプセル',
                'Folic Acid, 400 mcg, 100 Tablets': '葉酸、400mcg、100錠',
                'Pantothenic Acid, 500 mg, 100 Capsules': 'パントテン酸、500mg、100カプセル'
            };
            
            // Create proper iHerb-style product name format: "Brand, Product Name"
            const fullProductName = `${brand}, ${template.name}`;
            const fullJaName = `${brand}, ${jaTranslations[template.name] || template.name}`;
            
            products.push({
                id: id.toString(),
                dsld_id: `DSLD_${id}`,
                name_en: fullProductName,
                name_ja: fullJaName,
                brand: brand,
                category: template.category,
                serving_form: servingForm,
                serving_size: servingSize,
                nutrients: generateMockNutrientsFromTemplate(template.nutrients),
                image_url: generateProductImageUrl(id, brand, template.name, `DSLD_${id}`),
                label_url: `https://dsldapi.od.nih.gov/labels/products/${id}/label.pdf`,
                popularity_score: Math.random() * 100,
                created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
            });
            id++;
        });
    });
    
    console.log('Generated mock products:', products.length);
    console.log('Sample brands:', products.slice(0, 5).map(p => p.brand));
    console.log('Sample names:', products.slice(0, 5).map(p => ({ en: p.name_en, ja: p.name_ja })));
    
    return products;
}

// Generate mock nutrients for a product
function generateMockNutrientsFromTemplate(nutrientNames) {
    return nutrientNames.map(name => {
        const amounts = {
            'ビタミンC': () => Math.random() * 1000 + 100,
            'ビタミンD3': () => Math.random() * 4000 + 1000,
            'ビタミンE': () => Math.random() * 400 + 50,
            'ビタミンB6': () => Math.random() * 50 + 5,
            'ビタミンB12': () => Math.random() * 500 + 50,
            'ビタミンK': () => Math.random() * 100 + 25,
            'ビタミンK2': () => Math.random() * 200 + 45,
            'ビタミンA': () => Math.random() * 5000 + 2500,
            'マグネシウム': () => Math.random() * 300 + 100,
            'カルシウム': () => Math.random() * 600 + 200,
            '亜鉛': () => Math.random() * 30 + 5,
            '鉄': () => Math.random() * 25 + 5,
            'EPA': () => Math.random() * 600 + 200,
            'DHA': () => Math.random() * 400 + 100,
            'オメガ3': () => Math.random() * 1000 + 300,
            '葉酸': () => Math.random() * 800 + 200,
            '乳酸菌': () => Math.random() * 10 + 1,
            'カルノシン': () => Math.random() * 500 + 500,
            'CoQ10': () => Math.random() * 200 + 50,
            'グルタミン': () => Math.random() * 1000 + 500,
            'アルギニン': () => Math.random() * 1500 + 500,
            'リジン': () => Math.random() * 800 + 200,
            'テアニン': () => Math.random() * 400 + 100,
            'チロシン': () => Math.random() * 800 + 200,
            'タウリン': () => Math.random() * 1500 + 500,
            'クロロフィル': () => Math.random() * 50 + 10,
            'クルクミン': () => Math.random() * 600 + 200,
            'アシュワガンダ': () => Math.random() * 600 + 300,
            'ロディオラ': () => Math.random() * 600 + 200,
            'イチョウ葉': () => Math.random() * 200 + 60,
            'ミルクシスル': () => Math.random() * 300 + 100,
            'カリウム': () => 99, // 固定値（FDAの制限）
            'クロム': () => Math.random() * 400 + 100,
            'セレン': () => Math.random() * 300 + 100,
            'ヨウ素': () => Math.random() * 250 + 75,
            'マンガン': () => Math.random() * 15 + 5,
            'ビオチン': () => Math.random() * 8000 + 2000,
            'パントテン酸': () => Math.random() * 700 + 300
        };
        
        const units = {
            'ビタミンC': 'mg',
            'ビタミンD3': 'IU',
            'ビタミンE': 'IU',
            'ビタミンB6': 'mg',
            'ビタミンB12': 'mcg',
            'ビタミンK': 'mcg',
            'ビタミンK2': 'mcg',
            'ビタミンA': 'IU',
            'マグネシウム': 'mg',
            'カルシウム': 'mg',
            '亜鉛': 'mg',
            '鉄': 'mg',
            'EPA': 'mg',
            'DHA': 'mg',
            'オメガ3': 'mg',
            '葉酸': 'mcg',
            '乳酸菌': 'billion CFU',
            'カルノシン': 'mg',
            'CoQ10': 'mg',
            'グルタミン': 'mg',
            'アルギニン': 'mg',
            'リジン': 'mg',
            'テアニン': 'mg',
            'チロシン': 'mg',
            'タウリン': 'mg',
            'クロロフィル': 'mg',
            'クルクミン': 'mg',
            'アシュワガンダ': 'mg',
            'ロディオラ': 'mg',
            'イチョウ葉': 'mg',
            'ミルクシスル': 'mg',
            'カリウム': 'mg',
            'クロム': 'mcg',
            'セレン': 'mcg',
            'ヨウ素': 'mcg',
            'マンガン': 'mg',
            'ビオチン': 'mcg',
            'パントテン酸': 'mg'
        };
        
        return {
            name_ja: name,
            amount: amounts[name] ? amounts[name]() : Math.random() * 100 + 10,
            unit: units[name] || 'mg'
        };
    });
}

// Categorize product by brand/name
function categorizeBrand(brand) {
    const vitaminBrands = ["Nature's Way", "NOW Foods", "Solgar"];
    const mineralBrands = ["Doctor's Best", "Life Extension"];
    const omegaBrands = ["Nordic Naturals"];
    const probioticBrands = ["Garden of Life"];
    
    if (vitaminBrands.includes(brand)) return "vitamins";
    if (mineralBrands.includes(brand)) return "minerals";
    if (omegaBrands.includes(brand)) return "omega";
    if (probioticBrands.includes(brand)) return "probiotics";
    return "vitamins"; // default
}

// Get serving form from product name
function getServingForm(name) {
    if (name.toLowerCase().includes('softgel')) return 'softgel';
    if (name.toLowerCase().includes('capsule')) return 'capsule';
    if (name.toLowerCase().includes('tablet')) return 'tablet';
    if (name.toLowerCase().includes('powder')) return 'powder';
    if (name.toLowerCase().includes('liquid')) return 'liquid';
    return 'capsule'; // default
}

// Display products in grid
function displayProducts() {
    console.log('🔍 displayProducts called');
    console.log('🔍 allProducts count:', allProducts.length);
    console.log('🔍 filteredProducts count:', filteredProducts.length);
    const grid = document.getElementById('products-grid');
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    console.log('pageProducts length:', pageProducts.length);
    console.log('First product:', pageProducts[0]);
    console.log('First product image URL:', pageProducts[0]?.image_url);
    console.log('All products with image URLs:', pageProducts.map(p => ({ name: p.name_ja, imageUrl: p.image_url })));
    
    if (pageProducts.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <h3>検索結果がありません</h3>
                <p>検索条件を変更してお試しください。</p>
                <p><strong>デバッグ情報:</strong> 全商品数: ${allProducts.length}, フィルター後: ${filteredProducts.length}</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = pageProducts.map(product => `
        <div class="product-card" data-id="${product.id}" onclick="console.log('Card clicked:', '${product.id}'); viewProductDetails('${product.id}')" style="cursor: pointer;">
            <div class="product-image">
                <img src="${product.image_url || getPlaceholderImage(product.name_en || product.name_ja, product.category)}" alt="${product.name_ja}" class="supplement-card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="category-icon-fallback ${product.category}" style="display: none;">${getCategoryIcon(product.category)}</div>
                <div class="brand-badge">${product.brand}</div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name_ja || product.name_en}</h3>
                <p class="product-brand">${product.brand}</p>
                <div class="product-meta">
                    <span class="serving-info">${product.serving_size || 1}${getServingText(product.serving_form)}</span>
                    <span class="category-tag">${getCategoryName(product.category)}</span>
                </div>
                <div class="nutrients-preview">
                    ${product.nutrients ? product.nutrients.slice(0, 3).map(n => 
                        `<span class="nutrient-tag">${n.name_ja} ${n.amount.toFixed(0)}${n.unit}</span>`
                    ).join('') : ''}
                </div>
                <div class="product-actions">
                    <button onclick="event.stopPropagation(); viewProductDetails('${product.id}')" class="btn btn-outline">詳細を見る</button>
                    <button onclick="event.stopPropagation(); addToMySupps('${product.id}')" class="btn btn-primary">MY SUPPSに追加</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        vitamins: '🧬',
        minerals: '⚡',
        omega: '🐟',
        probiotics: '🦠',
        herbs: '🌿',
        'amino-acids': '💪'
    };
    return icons[category] || '💊';
}

// Get category name in Japanese
function getCategoryName(category) {
    const names = {
        vitamins: 'ビタミン',
        minerals: 'ミネラル',
        omega: 'オメガ3',
        probiotics: 'プロバイオティクス',
        herbs: 'ハーブ',
        'amino-acids': 'アミノ酸'
    };
    return names[category] || 'サプリメント';
}

// Get serving text
function getServingText(form) {
    const texts = {
        capsule: 'カプセル',
        tablet: '錠',
        softgel: 'ソフトジェル',
        powder: 'g',
        liquid: 'ml'
    };
    return texts[form] || 'カプセル';
}

// Search functionality
async function performSearch() {
    const searchTerm = document.getElementById('search-input').value.trim();
    const searchType = document.getElementById('search-type').value;
    
    console.log('Performing search:', { searchTerm, searchType, totalProducts: allProducts.length });
    
    if (!searchTerm) {
        filteredProducts = [...allProducts];
        currentPage = 1;
        displayProducts();
        setupPagination();
        updateStats();
        return;
    }
    
    try {
        // Always use demo mode search since we're in development
        const searchTermLower = searchTerm.toLowerCase();
        
        filteredProducts = allProducts.filter(product => {
            // For 'all' search type, search in all fields
            if (searchType === 'all') {
                const searchableText = [
                    product.name_en || '',
                    product.name_ja || '',
                    product.brand || '',
                    product.category || '',
                    ...(product.nutrients || []).map(n => n.name_ja || '')
                ].join(' ').toLowerCase();
                
                return searchableText.includes(searchTermLower);
            }
            
            // For specific search types
            let matches = false;
            
            // Search in product names
            if (searchType === 'product') {
                const productNameEn = (product.name_en || '').toLowerCase();
                const productNameJa = (product.name_ja || '').toLowerCase();
                matches = productNameEn.includes(searchTermLower) || productNameJa.includes(searchTermLower);
            }
            
            // Search in brand
            else if (searchType === 'brand') {
                const brand = (product.brand || '').toLowerCase();
                matches = brand.includes(searchTermLower);
            }
            
            // Search in ingredients/nutrients
            else if (searchType === 'ingredient') {
                if (product.nutrients && Array.isArray(product.nutrients)) {
                    matches = product.nutrients.some(nutrient => {
                        const nutrientName = (nutrient.name_ja || '').toLowerCase();
                        return nutrientName.includes(searchTermLower);
                    });
                }
            }
            
            return matches;
        });
        
        console.log('🔍 Search results:', { searchTerm, searchType, resultsCount: filteredProducts.length });
        console.log('🔍 Sample search result:', filteredProducts[0]);
        
        currentPage = 1;
        displayProducts();
        setupPagination();
        updateStats();
        
    } catch (error) {
        console.error('Search error:', error);
        showErrorState();
    }
}

// Filter by tab
function filterByTab(tab) {
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    currentFilter = tab;
    
    // Reset to all products first, then apply filters
    filteredProducts = [...allProducts];
    applyCurrentFilters();
}

// Apply current filters
function applyCurrentFilters() {
    let filtered = [...filteredProducts];
    
    // Apply tab filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(product => product.category === currentFilter);
    }
    
    // Apply dropdown filters
    const categoryFilter = document.getElementById('category-filter').value;
    const brandFilter = document.getElementById('brand-filter').value;
    const servingFilter = document.getElementById('serving-filter').value;
    
    if (categoryFilter) {
        filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    if (brandFilter) {
        filtered = filtered.filter(product => product.brand === brandFilter);
    }
    
    if (servingFilter) {
        filtered = filtered.filter(product => product.serving_form === servingFilter);
    }
    
    // Apply sorting
    const sortBy = document.getElementById('sort-filter').value;
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return (a.name_ja || a.name_en).localeCompare(b.name_ja || b.name_en);
            case 'brand':
                return a.brand.localeCompare(b.brand);
            case 'category':
                return a.category.localeCompare(b.category);
            case 'serving':
                return (a.serving_size || 0) - (b.serving_size || 0);
            default:
                return 0;
        }
    });
    
    filteredProducts = filtered;
    currentPage = 1;
    displayProducts();
    setupPagination();
    updateStats();
}

// Apply filters (called by onchange events)
function applyFilters() {
    applyCurrentFilters();
}

// Populate filter options
function populateFilterOptions() {
    const brands = [...new Set(allProducts.map(p => p.brand))].sort();
    const brandSelect = document.getElementById('brand-filter');
    
    brandSelect.innerHTML = '<option value="">すべてのブランド</option>' +
        brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
}

// Setup search input
function setupSearchInput() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Update statistics
function updateStats() {
    document.getElementById('total-products').textContent = filteredProducts.length;
    document.getElementById('total-categories').textContent = 
        new Set(filteredProducts.map(p => p.category)).size;
    document.getElementById('total-brands').textContent = 
        new Set(filteredProducts.map(p => p.brand)).size;
    document.getElementById('avg-rating').textContent = '4.2★';
}

// Setup pagination
function setupPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})" class="pagination-btn">前へ</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" class="pagination-btn ${i === currentPage ? 'active' : ''}">${i}</button>
        `;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})" class="pagination-btn">次へ</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayProducts();
    setupPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// View product details
function viewProductDetails(productId) {
    console.log('viewProductDetails called with:', productId);
    
    // Navigate to static supplement detail page
    const url = `supplements/${productId}.html`;
    console.log('Navigating to:', url);
    
    // Add debug alert
    console.log('About to navigate to:', url);
    window.location.href = url;
}

// Add to My Supps
async function addToMySupps(productId) {
    console.log('🔄 Adding to My Supps:', productId);
    console.log('Current user:', currentUser);
    console.log('Demo mode:', window.isDemo);
    console.log('Supabase client:', !!window.supabaseClient);
    
    if (!currentUser) {
        alert('MY SUPPSに追加するにはログインが必要です。');
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }
        
        console.log('Found product:', product.name_ja || product.name_en);
        
        if (window.isDemo) {
            console.log('📝 Saving to localStorage (demo mode)');
            
            // Save supplement data to localStorage
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            const existingSuppIndex = mockSupplements.findIndex(s => s.id === productId);
            
            if (existingSuppIndex === -1) {
                mockSupplements.push(product);
                localStorage.setItem('mockSupplements', JSON.stringify(mockSupplements));
                console.log('✅ Saved supplement to localStorage:', product);
            }
            
            // Add to user supplements
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const newEntry = {
                user_id: currentUser.id,
                supplement_id: productId,
                is_my_supps: true,
                is_selected: false
            };
            
            // Check if already exists
            const existingIndex = mockUserSupps.findIndex(
                us => us.user_id === currentUser.id && us.supplement_id === productId
            );
            
            if (existingIndex >= 0) {
                alert('既にMY SUPPSに追加されています。');
                return;
            }
            
            mockUserSupps.push(newEntry);
            localStorage.setItem('mockUserSupplements', JSON.stringify(mockUserSupps));
            console.log('✅ Saved user supplement to localStorage:', newEntry);
        } else {
            console.log('💾 Saving to Supabase database');
            console.log('Supabase client status:', !!window.supabaseClient);
            
            // まずテーブルの存在確認
            try {
                const testQuery = await window.supabaseClient.from('supplements').select('id').limit(1);
                console.log('Supplements table test:', testQuery);
            } catch (testError) {
                console.error('Supplements table test failed:', testError);
            }
            
            try {
                const testQuery2 = await window.supabaseClient.from('user_supplements').select('user_id').limit(1);
                console.log('User_supplements table test:', testQuery2);
            } catch (testError2) {
                console.error('User_supplements table test failed:', testError2);
            }
            
            // まずサプリメントをsupplementsテーブルに追加
            console.log('Step 1: Inserting supplement to supplements table');
            const supplementData = {
                dsld_id: product.dsld_id || `DSLD_${productId}`,
                name_en: product.name_en,
                name_ja: product.name_ja,
                brand: product.brand,
                category: product.category,
                serving_size: product.serving_size,
                string_id: productId // 文字列IDを保存
            };
            console.log('Supplement data to insert:', supplementData);
            
            const { data: suppData, error: suppError } = await window.supabaseClient
                .from('supplements')
                .upsert(supplementData, { onConflict: 'dsld_id' });
            
            console.log('Supplement upsert result:', { suppData, suppError });
            
            // 実際に挿入されたサプリメントのUUIDを取得
            let actualSupplementId;
            if (suppData && suppData.length > 0) {
                actualSupplementId = suppData[0].id;
            } else {
                // 既存のサプリメントを検索
                const { data: existingSupp } = await window.supabaseClient
                    .from('supplements')
                    .select('id')
                    .eq('dsld_id', product.dsld_id || `DSLD_${productId}`)
                    .single();
                actualSupplementId = existingSupp?.id;
            }
            
            console.log('Actual supplement UUID:', actualSupplementId);
            
            if (!actualSupplementId) {
                throw new Error('サプリメントの挿入に失敗しました');
            }
            
            // user_supplementsに追加
            console.log('Step 2: Inserting to user_supplements table');
            const userSupplementData = {
                user_id: currentUser.id,
                supplement_id: actualSupplementId, // UUIDを使用
                is_my_supps: true,
                is_selected: false
            };
            console.log('User supplement data to insert:', userSupplementData);
            
            const { data, error } = await window.supabaseClient
                .from('user_supplements')
                .upsert(userSupplementData);
            
            console.log('User supplement upsert result:', { data, error });
            console.log('Error details:', error);
            
            if (error) {
                console.error('Full error object:', error);
                throw error;
            }
            console.log('✅ Saved to Supabase:', data);
        }
        
        alert(`${product.name_ja || product.name_en}をMY SUPPSに追加しました！`);
        
    } catch (error) {
        console.error('❌ Error adding to My Supps:', error);
        console.error('Error type:', typeof error);
        console.error('Error properties:', Object.keys(error || {}));
        
        let errorMessage = 'Unknown error';
        if (error) {
            if (error.message) {
                errorMessage = error.message;
            } else if (error.details) {
                errorMessage = error.details;
            } else if (error.hint) {
                errorMessage = error.hint;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else {
                errorMessage = JSON.stringify(error);
            }
        }
        
        alert('MY SUPPSへの追加に失敗しました。詳細: ' + errorMessage);
    }
}

// Show loading state
function showLoadingState() {
    document.getElementById('products-grid').innerHTML = `
        <div class="loading-placeholder">
            <p>商品データを読み込み中...</p>
        </div>
    `;
}

// Show error state
function showErrorState() {
    document.getElementById('products-grid').innerHTML = `
        <div class="error-placeholder">
            <h3>データの読み込みに失敗しました</h3>
            <p>しばらくしてから再度お試しください。</p>
            <button onclick="loadProducts()" class="btn btn-primary">再読み込み</button>
        </div>
    `;
}

// Update user menu
function updateUserMenu() {
    const userMenu = document.getElementById('user-menu');
    if (currentUser) {
        userMenu.innerHTML = `
            <span class="user-name">${currentUser.email}</span>
            <button onclick="logout()" class="logout-btn">ログアウト</button>
        `;
    } else {
        userMenu.innerHTML = `
            <a href="auth.html" class="login-btn">ログイン</a>
        `;
    }
}