// Supps Audit Page JavaScript
// Combined supplement nutrient analysis with DSLD integration

let selectedSupplements = [];
let currentUser = null;
let combinedChart = null;
let viewMode = 'serving'; // 'unit' or 'serving' - デフォルトを'serving'に戻す

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Supps Audit page initializing...');
    
    currentUser = await checkAuth();
    updateUserMenu();
    loadSelectedSupplements();
    updateSelectedCount();
    initializeCombinedChart();
    
    // デバッグ: DOM要素の確認
    const chartSection = document.getElementById('chart-section');
    const placeholder = document.getElementById('chart-placeholder');
    const canvas = document.getElementById('combined-chart');
    
    console.log('📊 Chart elements check:', {
        chartSection: !!chartSection,
        placeholder: !!placeholder,
        canvas: !!canvas
    });
    
    // Set up search input event listener
    const searchInput = document.getElementById('supplement-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchSupplements();
            }
        });
    }
});

// Initialize combined chart with placeholder
function initializeCombinedChart() {
    console.log('📈 Initializing combined chart...');
    
    const placeholder = document.getElementById('chart-placeholder');
    const canvas = document.getElementById('combined-chart');
    const legend = document.getElementById('chart-legend');
    
    if (placeholder) {
        console.log('✅ Placeholder found, ensuring visibility');
        placeholder.style.display = 'flex';
        console.log('📊 Placeholder styles:', window.getComputedStyle(placeholder));
    } else {
        console.error('❌ Placeholder not found!');
    }
    
    if (canvas) {
        console.log('✅ Canvas found, hiding initially');
        canvas.style.display = 'none';
    } else {
        console.error('❌ Canvas not found!');
    }
    
    if (legend) {
        legend.style.display = 'none';
    }
    
    // デフォルト状態を確実に表示
    showChartPlaceholder();
    
    // ボタンの初期状態を設定
    const btn = document.getElementById('view-mode-btn');
    if (btn) {
        // viewMode='serving'の時、ボタンは'1回分表示'（unitモードに切り替える）
        btn.textContent = viewMode === 'serving' ? '1回分表示' : '1日分表示';
        console.log('🔘 Initial button text set to:', btn.textContent, 'for mode:', viewMode);
    }
}

// Toggle view mode between serving and unit
function toggleViewMode() {
    console.log('🔄 Toggle view mode called. Current mode:', viewMode);
    
    viewMode = viewMode === 'serving' ? 'unit' : 'serving';
    const btn = document.getElementById('view-mode-btn');
    
    // ボタンテキストを現在のモードに合わせて更新
    btn.textContent = viewMode === 'serving' ? '1回分表示' : '1日分表示';
    
    console.log('🔄 New mode:', viewMode, 'Button text:', btn.textContent);
    
    // 既存のサプリメントがあれば再計算、なければプレースホルダーを表示
    if (selectedSupplements.length > 0) {
        console.log('📊 Recalculating with', selectedSupplements.length, 'supplements');
        calculateCombinedNutrients();
    } else {
        console.log('📊 No supplements selected, showing placeholder');
        showChartPlaceholder();
    }
}

// Load selected supplements from localStorage
function loadSelectedSupplements() {
    console.log('📋 Loading selected supplements from localStorage...');
    const saved = localStorage.getItem('selectedSupplements');
    if (saved) {
        selectedSupplements = JSON.parse(saved);
        console.log('📋 Loaded', selectedSupplements.length, 'supplements from localStorage');
        updateSelectedCount();
        displaySelectedSupplements();
        calculateCombinedNutrients();
    } else {
        console.log('📋 No saved supplements found, initializing empty state');
        // デフォルト状態でもチャート初期化
        showChartPlaceholder();
        showNutrientsPlaceholder();
    }
}

// Save selected supplements to localStorage
function saveSelectedSupplements() {
    localStorage.setItem('selectedSupplements', JSON.stringify(selectedSupplements));
}

// Search supplements using same logic as products page
async function searchSupplements() {
    const searchTerm = document.getElementById('supplement-search').value.trim();
    const searchType = document.getElementById('search-type').value;
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchTerm) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    try {
        resultsContainer.innerHTML = '<div class="loading">検索中...</div>';
        
        console.log('🔍 Supps Audit Search:', { searchTerm, searchType });
        
        // DSLD APIから直接検索（リアルタイム検索）
        console.log('🔍 Searching DSLD API directly for:', searchTerm);
        
        let dsldResults = [];
        
        try {
            // DSLD APIで直接検索（改良されたAPI統合）
            const dsldResponse = await window.dsldApi.searchProducts(searchTerm, { 
                limit: 50 
            });
            
            if (dsldResponse && dsldResponse.hits && dsldResponse.hits.length > 0) {
                console.log(`✅ Found ${dsldResponse.hits.length} products from improved API`);
                dsldResults = dsldResponse.hits.map(hit => hit._source);
            } else {
                console.log('⚠️ No results found');
                dsldResults = [];
            }
        } catch (apiError) {
            console.error('❌ API search failed:', apiError);
            // This should not happen with the new comprehensive fallback system
            dsldResults = [];
        }
        
        // Use DSLD results directly - they're already filtered by the API
        const filteredProducts = dsldResults;
        
        console.log('🔍 Search results:', { searchTerm, resultsCount: filteredProducts.length });
        
        // Limit results and display
        const limitedResults = filteredProducts.slice(0, 15);
        displaySearchResults(limitedResults);
        
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="error">検索エラーが発生しました。</div>';
    }
}

// Display search results
function displaySearchResults(results) {
    const container = document.getElementById('search-results');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">検索結果がありません。</div>';
        return;
    }
    
    container.innerHTML = results.map(supplement => {
        const isSelected = selectedSupplements.some(s => s.id === supplement.id);
        // iHerb形式の商品名を使用
        const displayName = supplement.product_name || supplement.name_ja || supplement.name_en || supplement.name;
        const brand = supplement.brand_name || supplement.brand || 'Unknown Brand';
        const serving = supplement.serving_size || supplement.servingSize || '';
        
        return `
            <div class="search-result-item ${isSelected ? 'selected' : ''}" data-id="${supplement.id}" data-nutrients='${JSON.stringify(supplement.nutrients || [])}'>
                <div class="supplement-info">
                    <h4>${displayName}</h4>
                    <p><strong>${brand}</strong></p>
                    ${serving ? `<p class="serving-info">摂取量: ${serving}</p>` : ''}
                    ${supplement.ingredients && supplement.ingredients.length > 0 ? 
                        `<p class="ingredients-preview">成分: ${supplement.ingredients.slice(0, 3).map(ing => ing.name || ing.ingredientGroup).join(', ')}${supplement.ingredients.length > 3 ? '...' : ''}</p>` 
                        : ''}
                </div>
                <button 
                    onclick="toggleSupplementSelection('${supplement.id}', '${displayName.replace(/'/g, "\\'")}', '${brand.replace(/'/g, "\\'")}', '${serving}')" 
                    class="selection-btn ${isSelected ? 'selected' : ''}"
                >
                    ${isSelected ? '選択解除' : '選択'}
                </button>
            </div>
        `;
    }).join('');
}

// Toggle supplement selection
function toggleSupplementSelection(id, name, brand, serving) {
    const existingIndex = selectedSupplements.findIndex(s => s.id === id);
    
    if (existingIndex >= 0) {
        // Remove from selection
        selectedSupplements.splice(existingIndex, 1);
    } else {
        // Add to selection
        // Find the product to get its nutrients
        const searchResultItem = document.querySelector(`.search-result-item[data-id="${id}"]`);
        let productNutrients = [];
        
        if (searchResultItem && searchResultItem.dataset.nutrients) {
            try {
                productNutrients = JSON.parse(searchResultItem.dataset.nutrients);
                console.log('📊 Found nutrients for product:', id, productNutrients);
            } catch (error) {
                console.error('Error parsing nutrients:', error);
                productNutrients = [];
            }
        }
        
        // If no nutrients found, generate based on product name
        if (!productNutrients || productNutrients.length === 0) {
            console.log('⚠️ No nutrients found, generating based on product name:', name);
            productNutrients = generateNutrientsFromProductName(name);
        }
        
        selectedSupplements.push({
            id: id,
            name: name,
            brand: brand,
            serving_size: serving,
            nutrients: productNutrients
        });
    }
    
    saveSelectedSupplements();
    updateSelectedCount();
    displaySelectedSupplements();
    calculateCombinedNutrients();
    
    // Update search results display
    const searchResults = document.querySelectorAll('.search-result-item');
    searchResults.forEach(item => {
        if (item.dataset.id === id) {
            const button = item.querySelector('.selection-btn');
            const isSelected = selectedSupplements.some(s => s.id === id);
            
            item.classList.toggle('selected', isSelected);
            button.classList.toggle('selected', isSelected);
            button.textContent = isSelected ? '選択解除' : '選択';
        }
    });
}

// Generate mock products for audit search (simplified version)
function generateMockProductsForAudit() {
    const mockBrands = [
        "Nature's Way", "NOW Foods", "Doctor's Best", "Nordic Naturals",
        "Thorne", "Life Extension", "Garden of Life", "Solgar"
    ];
    
    const productTemplates = [
        { name: "Gold C™, USP Grade Vitamin C, 1,000 mg, 60 Veggie Capsules", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Vitamin C-1000, Sustained Release, 100 Tablets", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Vitamin D3, 5000 IU, 120 Softgels", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Magnesium Glycinate, High Absorption, 200 mg, 120 Tablets", category: "minerals", nutrients: ["マグネシウム"] },
        { name: "Ultimate Omega, 1280 mg, 60 Softgels", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        { name: "Zinc Picolinate, 50 mg, 100 Capsules", category: "minerals", nutrients: ["亜鉛"] },
        { name: "Iron Bisglycinate, 25 mg, 90 Capsules", category: "minerals", nutrients: ["鉄"] },
        { name: "B-Complex #12, Energy Complex, 100 Capsules", category: "vitamins", nutrients: ["ビタミンB6", "ビタミンB12", "葉酸"] },
        { name: "Carnosine, 500 mg, 50 Capsules", category: "amino-acids", nutrients: ["カルノシン"] },
        { name: "L-Carnosine Premium, 1000mg, 60 Tablets", category: "amino-acids", nutrients: ["カルノシン"] }
    ];
    
    const jaTranslations = {
        'Gold C™, USP Grade Vitamin C, 1,000 mg, 60 Veggie Capsules': 'ゴールドC™ USPグレード ビタミンC 1,000mg 60ベジカプセル',
        'Vitamin C-1000, Sustained Release, 100 Tablets': 'ビタミンC-1000 徐放性 100錠',
        'Vitamin D3, 5000 IU, 120 Softgels': 'ビタミンD3 5000 IU 120ソフトジェル',
        'Magnesium Glycinate, High Absorption, 200 mg, 120 Tablets': 'マグネシウムグリシネート 高吸収 200mg 120錠',
        'Ultimate Omega, 1280 mg, 60 Softgels': 'アルティメットオメガ 1280mg 60ソフトジェル',
        'Zinc Picolinate, 50 mg, 100 Capsules': '亜鉛ピコリネート 50mg 100カプセル',
        'Iron Bisglycinate, 25 mg, 90 Capsules': '鉄ビスグリシネート 25mg 90カプセル',
        'B-Complex #12, Energy Complex, 100 Capsules': 'Bコンプレックス#12 エナジーコンプレックス 100カプセル',
        'Carnosine, 500 mg, 50 Capsules': 'カルノシン 500mg 50カプセル',
        'L-Carnosine Premium, 1000mg, 60 Tablets': 'L-カルノシン プレミアム 1000mg 60錠'
    };
    
    const products = [];
    let id = 1;
    
    mockBrands.forEach(brand => {
        productTemplates.forEach(template => {
            products.push({
                id: id.toString(),
                dsld_id: `DSLD_${id}`,
                name_en: template.name,
                name_ja: jaTranslations[template.name] || template.name,
                brand: brand,
                category: template.category,
                serving_size: "1 capsule",
                nutrients: generateMockNutrientsFromTemplate(template.nutrients),
                image_url: `https://via.placeholder.com/200x200/FF6B9D/white?text=${encodeURIComponent(template.name.split(',')[0])}`,
                popularity_score: Math.random() * 100
            });
            id++;
        });
    });
    
    return products;
}

function generateMockNutrientsFromTemplate(nutrientNames) {
    const nutrientData = {
        'ビタミンC': { amount: 1000, unit: 'mg' },
        'ビタミンD3': { amount: 5000, unit: 'IU' },
        'マグネシウム': { amount: 200, unit: 'mg' },
        'EPA': { amount: 600, unit: 'mg' },
        'DHA': { amount: 400, unit: 'mg' },
        'オメガ3': { amount: 1000, unit: 'mg' },
        '亜鉛': { amount: 50, unit: 'mg' },
        '鉄': { amount: 25, unit: 'mg' },
        'ビタミンB6': { amount: 10, unit: 'mg' },
        'ビタミンB12': { amount: 100, unit: 'mcg' },
        '葉酸': { amount: 400, unit: 'mcg' },
        'カルノシン': { amount: 500, unit: 'mg' }
    };
    
    return nutrientNames.map(name => ({
        name_ja: name,
        amount: nutrientData[name]?.amount || 100,
        unit: nutrientData[name]?.unit || 'mg'
    }));
}

// Generate mock search results for fallback
function generateMockSearchResults(searchTerm) {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Comprehensive mock products database
    const mockProducts = [
        // ビタミン類
        {
            id: 'mock-1',
            product_name: 'Nature\'s Way, Vitamin C 1000mg, 100 Capsules',
            brand_name: 'Nature\'s Way',
            serving_size: '1 capsule',
            ingredients: [{ name: 'Vitamin C', ingredientGroup: 'Vitamin C' }],
            nutrients: [{ name_ja: 'ビタミンC', amount: 1000, unit: 'mg' }]
        },
        {
            id: 'mock-2',
            product_name: 'NOW Foods, Vitamin D3 5000 IU, 120 Softgels',
            brand_name: 'NOW Foods',
            serving_size: '1 softgel',
            ingredients: [{ name: 'Vitamin D3', ingredientGroup: 'Vitamin D' }],
            nutrients: [{ name_ja: 'ビタミンD3', amount: 5000, unit: 'IU' }]
        },
        {
            id: 'mock-3',
            product_name: 'Solgar, Vitamin E 400 IU, 100 Softgels',
            brand_name: 'Solgar',
            serving_size: '1 softgel',
            ingredients: [{ name: 'Vitamin E', ingredientGroup: 'Vitamin E' }],
            nutrients: [{ name_ja: 'ビタミンE', amount: 400, unit: 'IU' }]
        },
        {
            id: 'mock-4',
            product_name: 'Garden of Life, Vitamin B Complex, 60 Capsules',
            brand_name: 'Garden of Life',
            serving_size: '1 capsule',
            ingredients: [{ name: 'B-Complex', ingredientGroup: 'B Vitamins' }],
            nutrients: [
                { name_ja: 'ビタミンB1', amount: 25, unit: 'mg' },
                { name_ja: 'ビタミンB2', amount: 25, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 25, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 100, unit: 'mcg' },
                { name_ja: '葉酸', amount: 400, unit: 'mcg' }
            ]
        },
        // ミネラル類
        {
            id: 'mock-5',
            product_name: 'Doctor\'s Best, Magnesium Glycinate 200mg, 120 Tablets',
            brand_name: 'Doctor\'s Best',
            serving_size: '2 tablets',
            ingredients: [{ name: 'Magnesium', ingredientGroup: 'Magnesium' }],
            nutrients: [{ name_ja: 'マグネシウム', amount: 200, unit: 'mg' }]
        },
        {
            id: 'mock-6',
            product_name: 'Thorne, Zinc Picolinate 15mg, 60 Capsules',
            brand_name: 'Thorne',
            serving_size: '1 capsule',
            ingredients: [{ name: 'Zinc', ingredientGroup: 'Zinc' }],
            nutrients: [{ name_ja: '亜鉛', amount: 15, unit: 'mg' }]
        },
        {
            id: 'mock-7',
            product_name: 'Life Extension, Iron Protein Plus, 300 Capsules',
            brand_name: 'Life Extension',
            serving_size: '1 capsule',
            ingredients: [{ name: 'Iron', ingredientGroup: 'Iron' }],
            nutrients: [{ name_ja: '鉄', amount: 28, unit: 'mg' }]
        },
        {
            id: 'mock-8',
            product_name: 'NOW Foods, Calcium Carbonate 1000mg, 120 Tablets',
            brand_name: 'NOW Foods',
            serving_size: '1 tablet',
            ingredients: [{ name: 'Calcium', ingredientGroup: 'Calcium' }],
            nutrients: [{ name_ja: 'カルシウム', amount: 1000, unit: 'mg' }]
        },
        // オメガ・脂肪酸類
        {
            id: 'mock-9',
            product_name: 'Nordic Naturals, Ultimate Omega 1280mg, 60 Softgels',
            brand_name: 'Nordic Naturals',
            serving_size: '2 softgels',
            ingredients: [{ name: 'Omega-3', ingredientGroup: 'Omega-3' }],
            nutrients: [
                { name_ja: 'EPA', amount: 650, unit: 'mg' },
                { name_ja: 'DHA', amount: 450, unit: 'mg' },
                { name_ja: 'オメガ3', amount: 1280, unit: 'mg' }
            ]
        },
        {
            id: 'mock-10',
            product_name: 'Carlson Labs, Fish Oil Omega-3, 180 Softgels',
            brand_name: 'Carlson Labs',
            serving_size: '1 softgel',
            ingredients: [{ name: 'Fish Oil', ingredientGroup: 'Omega-3' }],
            nutrients: [
                { name_ja: 'EPA', amount: 500, unit: 'mg' },
                { name_ja: 'DHA', amount: 300, unit: 'mg' }
            ]
        },
        // プロバイオティクス
        {
            id: 'mock-11',
            product_name: 'Garden of Life, Raw Probiotics Women, 90 Capsules',
            brand_name: 'Garden of Life',
            serving_size: '1 capsule',
            ingredients: [{ name: 'Probiotics', ingredientGroup: 'Probiotics' }],
            nutrients: [{ name_ja: 'プロバイオティクス', amount: 85, unit: 'billion CFU' }]
        },
        {
            id: 'mock-12',
            product_name: 'Align, Probiotic Supplement, 28 Capsules',
            brand_name: 'Align',
            serving_size: '1 capsule',
            ingredients: [{ name: 'Probiotics', ingredientGroup: 'Probiotics' }],
            nutrients: [{ name_ja: 'プロバイオティクス', amount: 1, unit: 'billion CFU' }]
        },
        // マルチビタミン（重要！）
        {
            id: 'mock-13',
            product_name: 'Nature\'s Way, Alive! Once Daily Men\'s Multivitamin, 60 Tablets',
            brand_name: 'Nature\'s Way',
            serving_size: '1 tablet',
            ingredients: [
                { name: 'Multivitamin', ingredientGroup: 'Multivitamin' },
                { name: 'Vitamin A', ingredientGroup: 'Vitamin A' },
                { name: 'Vitamin C', ingredientGroup: 'Vitamin C' },
                { name: 'Vitamin D3', ingredientGroup: 'Vitamin D' },
                { name: 'Vitamin E', ingredientGroup: 'Vitamin E' },
                { name: 'B-Complex', ingredientGroup: 'B Vitamins' }
            ],
            nutrients: [
                { name_ja: 'ビタミンA', amount: 5000, unit: 'IU' },
                { name_ja: 'ビタミンC', amount: 120, unit: 'mg' },
                { name_ja: 'ビタミンD3', amount: 2000, unit: 'IU' },
                { name_ja: 'ビタミンE', amount: 30, unit: 'IU' },
                { name_ja: 'ビタミンB1', amount: 1.5, unit: 'mg' },
                { name_ja: 'ビタミンB2', amount: 1.7, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 2, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 6, unit: 'mcg' },
                { name_ja: '葉酸', amount: 400, unit: 'mcg' },
                { name_ja: 'ナイアシン', amount: 20, unit: 'mg' },
                { name_ja: 'パントテン酸', amount: 10, unit: 'mg' },
                { name_ja: 'ビオチン', amount: 30, unit: 'mcg' }
            ]
        },
        {
            id: 'mock-14',
            product_name: 'Centrum, Adults Multivitamin & Multimineral, 365 Tablets',
            brand_name: 'Centrum',
            serving_size: '1 tablet',
            ingredients: [
                { name: 'Multivitamin', ingredientGroup: 'Multivitamin' },
                { name: 'Multimineral', ingredientGroup: 'Multimineral' }
            ],
            nutrients: [
                { name_ja: 'ビタミンA', amount: 3500, unit: 'IU' },
                { name_ja: 'ビタミンC', amount: 90, unit: 'mg' },
                { name_ja: 'ビタミンD3', amount: 1000, unit: 'IU' },
                { name_ja: 'ビタミンE', amount: 22.5, unit: 'IU' },
                { name_ja: 'ビタミンK', amount: 25, unit: 'mcg' },
                { name_ja: 'ビタミンB1', amount: 1.2, unit: 'mg' },
                { name_ja: 'ビタミンB2', amount: 1.3, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 1.7, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 2.4, unit: 'mcg' },
                { name_ja: '葉酸', amount: 400, unit: 'mcg' },
                { name_ja: 'カルシウム', amount: 200, unit: 'mg' },
                { name_ja: '鉄', amount: 18, unit: 'mg' },
                { name_ja: 'マグネシウム', amount: 100, unit: 'mg' },
                { name_ja: '亜鉛', amount: 11, unit: 'mg' }
            ]
        },
        {
            id: 'mock-15',
            product_name: 'ONE A DAY, Men\'s Health Formula Multivitamin, 200 Tablets',
            brand_name: 'ONE A DAY',
            serving_size: '1 tablet',
            ingredients: [
                { name: 'Multivitamin', ingredientGroup: 'Multivitamin' },
                { name: 'Men\'s Formula', ingredientGroup: 'Men\'s Health' }
            ],
            nutrients: [
                { name_ja: 'ビタミンA', amount: 3500, unit: 'IU' },
                { name_ja: 'ビタミンC', amount: 90, unit: 'mg' },
                { name_ja: 'ビタミンD', amount: 700, unit: 'IU' },
                { name_ja: 'ビタミンE', amount: 22.5, unit: 'IU' },
                { name_ja: 'ビタミンB1', amount: 1.2, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 1.7, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 2.4, unit: 'mcg' },
                { name_ja: '葉酸', amount: 300, unit: 'mcg' },
                { name_ja: 'マグネシウム', amount: 120, unit: 'mg' },
                { name_ja: '亜鉛', amount: 15, unit: 'mg' },
                { name_ja: 'セレン', amount: 55, unit: 'mcg' }
            ]
        },
        {
            id: 'mock-16',
            product_name: 'Garden of Life, Vitamin Code Raw One for Women, 75 Capsules',
            brand_name: 'Garden of Life',
            serving_size: '1 capsule',
            ingredients: [
                { name: 'Raw Multivitamin', ingredientGroup: 'Multivitamin' },
                { name: 'Women\'s Formula', ingredientGroup: 'Women\'s Health' }
            ],
            nutrients: [
                { name_ja: 'ビタミンA', amount: 2500, unit: 'IU' },
                { name_ja: 'ビタミンC', amount: 120, unit: 'mg' },
                { name_ja: 'ビタミンD3', amount: 1000, unit: 'IU' },
                { name_ja: 'ビタミンE', amount: 15, unit: 'IU' },
                { name_ja: 'ビタミンK', amount: 40, unit: 'mcg' },
                { name_ja: 'ビタミンB1', amount: 1, unit: 'mg' },
                { name_ja: 'ビタミンB2', amount: 1, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 1.3, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 2.5, unit: 'mcg' },
                { name_ja: '葉酸', amount: 400, unit: 'mcg' },
                { name_ja: '鉄', amount: 18, unit: 'mg' },
                { name_ja: 'マグネシウム', amount: 25, unit: 'mg' },
                { name_ja: '亜鉛', amount: 5, unit: 'mg' }
            ]
        },
        {
            id: 'mock-17',
            product_name: 'Optimum Nutrition, Opti-Men Multivitamin, 150 Tablets',
            brand_name: 'Optimum Nutrition',
            serving_size: '3 tablets',
            ingredients: [
                { name: 'Sports Multivitamin', ingredientGroup: 'Sports Nutrition' },
                { name: 'Amino Acid Blend', ingredientGroup: 'Amino Acids' }
            ],
            nutrients: [
                { name_ja: 'ビタミンA', amount: 5000, unit: 'IU' },
                { name_ja: 'ビタミンC', amount: 300, unit: 'mg' },
                { name_ja: 'ビタミンD', amount: 300, unit: 'IU' },
                { name_ja: 'ビタミンE', amount: 200, unit: 'IU' },
                { name_ja: 'ビタミンB1', amount: 75, unit: 'mg' },
                { name_ja: 'ビタミンB2', amount: 75, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 50, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 100, unit: 'mcg' },
                { name_ja: '葉酸', amount: 400, unit: 'mcg' },
                { name_ja: 'マグネシウム', amount: 80, unit: 'mg' },
                { name_ja: '亜鉛', amount: 15, unit: 'mg' }
            ]
        },
        {
            id: 'mock-18',
            product_name: 'MegaFood, Women Over 40 One Daily, 60 Tablets',
            brand_name: 'MegaFood',
            serving_size: '1 tablet',
            ingredients: [
                { name: 'Whole Food Multivitamin', ingredientGroup: 'Whole Food' },
                { name: 'Women 40+ Formula', ingredientGroup: 'Women\'s Health' }
            ],
            nutrients: [
                { name_ja: 'ビタミンA', amount: 1500, unit: 'IU' },
                { name_ja: 'ビタミンC', amount: 60, unit: 'mg' },
                { name_ja: 'ビタミンD3', amount: 1000, unit: 'IU' },
                { name_ja: 'ビタミンE', amount: 15, unit: 'IU' },
                { name_ja: 'ビタミンB6', amount: 3, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 8, unit: 'mcg' },
                { name_ja: '葉酸', amount: 400, unit: 'mcg' },
                { name_ja: '鉄', amount: 9, unit: 'mg' },
                { name_ja: 'マグネシウム', amount: 60, unit: 'mg' },
                { name_ja: '亜鉛', amount: 5, unit: 'mg' }
            ]
        },
        // アミノ酸・特殊成分
        {
            id: 'mock-19',
            product_name: 'NOW Foods, L-Carnosine 500mg, 50 Capsules',
            brand_name: 'NOW Foods',
            serving_size: '1 capsule',
            ingredients: [{ name: 'L-Carnosine', ingredientGroup: 'Amino Acids' }],
            nutrients: [{ name_ja: 'カルノシン', amount: 500, unit: 'mg' }]
        },
        {
            id: 'mock-20',
            product_name: 'Jarrow Formulas, CoQ10 100mg, 60 Capsules',
            brand_name: 'Jarrow Formulas',
            serving_size: '1 capsule',
            ingredients: [{ name: 'Coenzyme Q10', ingredientGroup: 'CoQ10' }],
            nutrients: [{ name_ja: 'コエンザイムQ10', amount: 100, unit: 'mg' }]
        },
        {
            id: 'mock-21',
            product_name: 'Sports Research, Collagen Peptides, 454g Powder',
            brand_name: 'Sports Research',
            serving_size: '1 scoop (11g)',
            ingredients: [{ name: 'Collagen', ingredientGroup: 'Protein' }],
            nutrients: [{ name_ja: 'コラーゲン', amount: 10000, unit: 'mg' }]
        },
        // 植物エキス・ハーブ
        {
            id: 'mock-16',
            product_name: 'Nature\'s Bounty, Turmeric Curcumin 1000mg, 60 Capsules',
            brand_name: 'Nature\'s Bounty',
            serving_size: '1 capsule',
            ingredients: [{ name: 'Turmeric', ingredientGroup: 'Herbal' }],
            nutrients: [{ name_ja: 'クルクミン', amount: 950, unit: 'mg' }]
        },
        {
            id: 'mock-17',
            product_name: 'Swanson, Ashwagandha 450mg, 100 Capsules',
            brand_name: 'Swanson',
            serving_size: '1 capsule',
            ingredients: [{ name: 'Ashwagandha', ingredientGroup: 'Herbal' }],
            nutrients: [{ name_ja: 'アシュワガンダ', amount: 450, unit: 'mg' }]
        }
    ];
    
    // Enhanced search logic with multiple criteria
    return mockProducts.filter(product => {
        const searchableText = [
            product.product_name,
            product.brand_name,
            ...product.ingredients.map(ing => ing.name),
            ...product.ingredients.map(ing => ing.ingredientGroup),
            ...product.nutrients.map(n => n.name_ja)
        ].join(' ').toLowerCase();
        
        // Direct text matching
        if (searchableText.includes(searchTermLower)) {
            return true;
        }
        
        // Translation-based matching
        const translateMap = {
            // マルチビタミン関連（最重要）
            'マルチビタミン': 'multivitamin multi vitamin',
            'マルチ': 'multivitamin multi',
            '総合ビタミン': 'multivitamin multi vitamin',
            'オールインワン': 'multivitamin multi all-in-one',
            
            // 個別ビタミン類
            'ビタミンc': 'vitamin c',
            'ビタミンd': 'vitamin d',
            'ビタミンe': 'vitamin e',
            'ビタミンb': 'vitamin b',
            'ビタミンa': 'vitamin a',
            'ビタミンk': 'vitamin k',
            
            // ミネラル類
            'マグネシウム': 'magnesium',
            '亜鉛': 'zinc',
            '鉄': 'iron',
            'カルシウム': 'calcium',
            'セレン': 'selenium',
            '銅': 'copper',
            'マンガン': 'manganese',
            'クロム': 'chromium',
            'ヨウ素': 'iodine',
            
            // その他重要成分
            'オメガ': 'omega',
            'プロバイオティクス': 'probiotics',
            'カルノシン': 'carnosine',
            'コエンザイムq10': 'coq10',
            'コラーゲン': 'collagen',
            'クルクミン': 'curcumin turmeric',
            'アシュワガンダ': 'ashwagandha',
            
            // ブランド関連
            'センタム': 'centrum',
            'ネイチャーズウェイ': 'nature way',
            'ナウフーズ': 'now foods',
            'ドクターズベスト': 'doctor best',
            'ガーデンオブライフ': 'garden life',
            'ソルガー': 'solgar'
        };
        
        const translatedTerm = translateMap[searchTermLower];
        if (translatedTerm && searchableText.includes(translatedTerm)) {
            return true;
        }
        
        // Partial matching for complex terms
        const partialMatches = [
            { search: 'multivitamin', terms: ['マルチビタミン', 'マルチ', '総合ビタミン', 'multivitamin', 'multi', 'all-in-one'] },
            { search: 'vitamin', terms: ['ビタミン', 'vitamin'] },
            { search: 'mineral', terms: ['ミネラル', 'mineral', 'magnesium', 'zinc', 'iron', 'calcium'] },
            { search: 'omega', terms: ['オメガ', 'omega', 'fish oil', 'epa', 'dha'] },
            { search: 'probiotic', terms: ['プロバイオティクス', 'probiotics'] }
        ];
        
        for (const match of partialMatches) {
            if (match.terms.some(term => searchTermLower.includes(term.toLowerCase()) || 
                                        searchableText.includes(term.toLowerCase()))) {
                return true;
            }
        }
        
        return false;
    });
}

// Generate nutrients based on product name
function generateNutrientsFromProductName(productName) {
    const nameLower = productName.toLowerCase();
    const nutrients = [];
    
    // Pattern matching for common supplements
    const nutrientPatterns = {
        // マルチビタミン（最重要パターン）
        'multivitamin': {
            multiple: [
                { name_ja: 'ビタミンA', amount: 3500, unit: 'IU' },
                { name_ja: 'ビタミンC', amount: 90, unit: 'mg' },
                { name_ja: 'ビタミンD3', amount: 1000, unit: 'IU' },
                { name_ja: 'ビタミンE', amount: 22.5, unit: 'IU' },
                { name_ja: 'ビタミンK', amount: 25, unit: 'mcg' },
                { name_ja: 'ビタミンB1', amount: 1.2, unit: 'mg' },
                { name_ja: 'ビタミンB2', amount: 1.3, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 1.7, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 2.4, unit: 'mcg' },
                { name_ja: '葉酸', amount: 400, unit: 'mcg' },
                { name_ja: 'ナイアシン', amount: 20, unit: 'mg' },
                { name_ja: 'パントテン酸', amount: 10, unit: 'mg' },
                { name_ja: 'ビオチン', amount: 30, unit: 'mcg' },
                { name_ja: 'カルシウム', amount: 200, unit: 'mg' },
                { name_ja: '鉄', amount: 18, unit: 'mg' },
                { name_ja: 'マグネシウム', amount: 100, unit: 'mg' },
                { name_ja: '亜鉛', amount: 11, unit: 'mg' }
            ]
        },
        'multi': {
            multiple: [
                { name_ja: 'ビタミンA', amount: 3500, unit: 'IU' },
                { name_ja: 'ビタミンC', amount: 90, unit: 'mg' },
                { name_ja: 'ビタミンD3', amount: 1000, unit: 'IU' },
                { name_ja: 'ビタミンE', amount: 22.5, unit: 'IU' },
                { name_ja: 'ビタミンB1', amount: 1.2, unit: 'mg' },
                { name_ja: 'ビタミンB2', amount: 1.3, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 1.7, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 2.4, unit: 'mcg' },
                { name_ja: '葉酸', amount: 400, unit: 'mcg' },
                { name_ja: 'マグネシウム', amount: 100, unit: 'mg' },
                { name_ja: '亜鉛', amount: 11, unit: 'mg' }
            ]
        },
        // 個別ビタミン
        'vitamin c': { name_ja: 'ビタミンC', amount: 1000, unit: 'mg' },
        'vitamin d': { name_ja: 'ビタミンD3', amount: 5000, unit: 'IU' },
        'vitamin d3': { name_ja: 'ビタミンD3', amount: 5000, unit: 'IU' },
        'vitamin e': { name_ja: 'ビタミンE', amount: 400, unit: 'IU' },
        'vitamin b': { 
            multiple: [
                { name_ja: 'ビタミンB1', amount: 25, unit: 'mg' },
                { name_ja: 'ビタミンB2', amount: 25, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 25, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 100, unit: 'mcg' }
            ]
        },
        'magnesium': { name_ja: 'マグネシウム', amount: 200, unit: 'mg' },
        'zinc': { name_ja: '亜鉛', amount: 15, unit: 'mg' },
        'iron': { name_ja: '鉄', amount: 18, unit: 'mg' },
        'calcium': { name_ja: 'カルシウム', amount: 1000, unit: 'mg' },
        'omega': {
            multiple: [
                { name_ja: 'EPA', amount: 650, unit: 'mg' },
                { name_ja: 'DHA', amount: 450, unit: 'mg' },
                { name_ja: 'オメガ3', amount: 1280, unit: 'mg' }
            ]
        },
        'fish oil': {
            multiple: [
                { name_ja: 'EPA', amount: 500, unit: 'mg' },
                { name_ja: 'DHA', amount: 300, unit: 'mg' }
            ]
        },
        'probiotics': { name_ja: 'プロバイオティクス', amount: 10, unit: 'billion CFU' },
        'carnosine': { name_ja: 'カルノシン', amount: 500, unit: 'mg' },
        'coq10': { name_ja: 'コエンザイムQ10', amount: 100, unit: 'mg' },
        'coenzyme q10': { name_ja: 'コエンザイムQ10', amount: 100, unit: 'mg' },
        'collagen': { name_ja: 'コラーゲン', amount: 10000, unit: 'mg' },
        'curcumin': { name_ja: 'クルクミン', amount: 500, unit: 'mg' },
        'turmeric': { name_ja: 'クルクミン', amount: 500, unit: 'mg' },
        'ashwagandha': { name_ja: 'アシュワガンダ', amount: 450, unit: 'mg' }
    };
    
    // Extract amount from product name if present
    const amountMatch = nameLower.match(/(\d+)\s*(mg|iu|mcg|g)/i);
    let extractedAmount = null;
    let extractedUnit = null;
    
    if (amountMatch) {
        extractedAmount = parseInt(amountMatch[1]);
        extractedUnit = amountMatch[2].toLowerCase();
    }
    
    // Check each pattern
    for (const [pattern, nutrientData] of Object.entries(nutrientPatterns)) {
        if (nameLower.includes(pattern)) {
            if (nutrientData.multiple) {
                // Multiple nutrients (like B-complex or Omega)
                nutrients.push(...nutrientData.multiple);
            } else {
                // Single nutrient
                const nutrient = { ...nutrientData };
                
                // Override with extracted amount if found
                if (extractedAmount && extractedUnit) {
                    nutrient.amount = extractedAmount;
                    nutrient.unit = extractedUnit;
                }
                
                nutrients.push(nutrient);
            }
            break; // Only use first match
        }
    }
    
    // If no nutrients found, generate generic ones
    if (nutrients.length === 0) {
        console.log('⚠️ No pattern match found for:', productName);
        nutrients.push({ 
            name_ja: 'サプリメント', 
            amount: 100, 
            unit: 'mg' 
        });
    }
    
    return nutrients;
}

// Generate mock nutrients for demonstration
function generateMockNutrients(supplementId) {
    const nutrientPools = [
        { name_ja: 'ビタミンC', amount: Math.random() * 1000 + 100, unit: 'mg' },
        { name_ja: 'ビタミンD3', amount: Math.random() * 4000 + 1000, unit: 'IU' },
        { name_ja: 'ビタミンE', amount: Math.random() * 400 + 50, unit: 'IU' },
        { name_ja: 'ビタミンB6', amount: Math.random() * 50 + 5, unit: 'mg' },
        { name_ja: 'ビタミンB12', amount: Math.random() * 500 + 50, unit: 'mcg' },
        { name_ja: 'マグネシウム', amount: Math.random() * 300 + 100, unit: 'mg' },
        { name_ja: 'カルシウム', amount: Math.random() * 600 + 200, unit: 'mg' },
        { name_ja: '亜鉛', amount: Math.random() * 30 + 5, unit: 'mg' },
        { name_ja: '鉄', amount: Math.random() * 25 + 5, unit: 'mg' },
        { name_ja: 'オメガ3', amount: Math.random() * 1000 + 300, unit: 'mg' }
    ];
    
    // Select 3-6 random nutrients for each supplement
    const numNutrients = Math.floor(Math.random() * 4) + 3;
    const selectedNutrients = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numNutrients; i++) {
        let index;
        do {
            index = Math.floor(Math.random() * nutrientPools.length);
        } while (usedIndices.has(index));
        
        usedIndices.add(index);
        selectedNutrients.push({...nutrientPools[index]});
    }
    
    return selectedNutrients;
}

// Display selected supplements
function displaySelectedSupplements() {
    const container = document.getElementById('selected-list');
    
    if (selectedSupplements.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>まだサプリメントが選択されていません。</p></div>';
        return;
    }
    
    container.innerHTML = selectedSupplements.map(supplement => `
        <div class="selected-supplement-item" data-id="${supplement.id}">
            <div class="supplement-details">
                <h4>${supplement.name}</h4>
                <p>${supplement.brand}</p>
                ${supplement.serving_size ? `<span class="serving">${supplement.serving_size}</span>` : ''}
            </div>
            <button onclick="removeSupplementSelection('${supplement.id}')" class="remove-btn">
                <span>×</span>
            </button>
        </div>
    `).join('');
}

// Remove supplement from selection
function removeSupplementSelection(id) {
    selectedSupplements = selectedSupplements.filter(s => s.id !== id);
    saveSelectedSupplements();
    updateSelectedCount();
    displaySelectedSupplements();
    calculateCombinedNutrients();
    
    // Update search results if visible
    const searchResultItem = document.querySelector(`[data-id="${id}"]`);
    if (searchResultItem) {
        const button = searchResultItem.querySelector('.selection-btn');
        searchResultItem.classList.remove('selected');
        button.classList.remove('selected');
        button.textContent = '選択';
    }
}

// Update selected supplements count
function updateSelectedCount() {
    document.getElementById('count').textContent = selectedSupplements.length;
}

// Duplicate function removed - using the main one above

// Removed duplicate function - using the main initializeCombinedChart above

// Calculate combined nutrients from selected supplements
async function calculateCombinedNutrients() {
    console.log('📊 Calculating combined nutrients for', selectedSupplements.length, 'supplements');
    console.log('📊 Current view mode:', viewMode);
    
    if (selectedSupplements.length === 0) {
        console.log('📊 No supplements selected, showing placeholders');
        showChartPlaceholder();
        showNutrientsPlaceholder();
        return;
    }
    
    const combinedNutrients = {};
    
    selectedSupplements.forEach(supplement => {
        console.log('Processing supplement:', supplement.name, 'with nutrients:', supplement.nutrients);
        
        if (supplement.nutrients && Array.isArray(supplement.nutrients)) {
            supplement.nutrients.forEach(nutrient => {
                const name = nutrient.name_ja || nutrient.name;
                let amount = parseFloat(nutrient.amount) || 0;
                const unit = nutrient.unit || 'mg';
                
                // Adjust amount based on view mode
                if (viewMode === 'serving' && supplement.serving_size) {
                    // serving mode: use the recommended daily amount (per serving)
                    // Amount is already per serving, so no adjustment needed
                    // This is the default display mode
                } else if (viewMode === 'unit') {
                    // unit mode: show per unit amount
                    const servingMatch = supplement.serving_size ? supplement.serving_size.match(/(\d+)/) : null;
                    const servingSize = servingMatch ? parseInt(servingMatch[1]) : 1;
                    if (servingSize > 1) {
                        amount = amount / servingSize;
                    }
                }
                
                console.log(`📊 Nutrient ${name}: ${amount}${unit} (mode: ${viewMode})`);
                
                if (!combinedNutrients[name]) {
                    combinedNutrients[name] = {
                        amount: 0,
                        unit: unit,
                        rdaPercent: 0
                    };
                }
                
                combinedNutrients[name].amount += amount;
            });
        }
    });
    
    console.log('📊 Combined nutrients:', combinedNutrients);
    
    // Calculate RDA percentages with proper unit handling
    Object.keys(combinedNutrients).forEach(name => {
        const rdaValues = {
            'ビタミンC': 100,        // mg
            'ビタミンD3': 800,       // IU (20mcg)
            'ビタミンE': 15,         // mg
            'ビタミンA': 900,        // mcg
            'ビタミンB1': 1.2,       // mg
            'ビタミンB2': 1.3,       // mg
            'ビタミンB6': 1.7,       // mg
            'ビタミンB12': 2.4,      // mcg
            '葉酸': 400,             // mcg
            'マグネシウム': 400,     // mg
            'カルシウム': 1000,      // mg
            '亜鉛': 11,              // mg
            '鉄': 18,                // mg
            'EPA': 250,              // mg
            'DHA': 250,              // mg
            'オメガ3': 1600,         // mg
            'カルノシン': 500,       // mg (no official RDA)
            'コエンザイムQ10': 100,  // mg (no official RDA)
            'コラーゲン': 10000,     // mg (no official RDA)
            'クルクミン': 500,       // mg (no official RDA)
            'アシュワガンダ': 600,   // mg (no official RDA)
        };
        
        // Special handling for probiotics
        if (name === 'プロバイオティクス') {
            // For probiotics, use amount directly as percentage (assuming 10 billion CFU = 100%)
            const amount = combinedNutrients[name].amount;
            combinedNutrients[name].rdaPercent = Math.min((amount / 10) * 100, 300);
            return;
        }
        
        const rda = rdaValues[name];
        if (!rda) {
            // For nutrients without RDA, show relative amount
            combinedNutrients[name].rdaPercent = Math.min(100, 300);
            return;
        }
        
        let amount = combinedNutrients[name].amount;
        const unit = combinedNutrients[name].unit;
        
        // Convert units for calculation if necessary
        if (unit === 'mcg' && !['ビタミンB12', '葉酸', 'ビタミンA'].includes(name)) {
            amount = amount / 1000; // Convert mcg to mg for comparison
        } else if (unit === 'IU') {
            // IU conversion depends on nutrient
            if (name === 'ビタミンD3') {
                amount = amount; // RDA is already in IU
            } else if (name === 'ビタミンE') {
                amount = amount * 0.67; // 1 IU = 0.67mg for d-alpha-tocopherol
            }
        } else if (unit === 'g') {
            amount = amount * 1000; // Convert g to mg
        }
        
        combinedNutrients[name].rdaPercent = Math.min((amount / rda) * 100, 300); // Cap at 300%
    });
    
    console.log('📊 Final combined nutrients before display:', combinedNutrients);
    console.log('📊 About to call displayCombinedChart with', Object.keys(combinedNutrients).length, 'nutrients');
    
    displayCombinedChart(combinedNutrients);
    displayNutrientsBreakdown(combinedNutrients);
    
    console.log('📊 calculateCombinedNutrients completed successfully');
}

// Display combined nutrients chart
function displayCombinedChart(nutrients) {
    console.log('📈 Displaying chart with nutrients:', nutrients);
    console.log('📈 Number of nutrients:', Object.keys(nutrients).length);
    
    const canvas = document.getElementById('combined-chart');
    const placeholder = document.getElementById('chart-placeholder');
    const legend = document.getElementById('chart-legend');
    
    console.log('📈 Elements found:', {
        canvas: !!canvas,
        placeholder: !!placeholder,
        legend: !!legend
    });
    
    if (Object.keys(nutrients).length === 0) {
        console.log('⚠️ No nutrients to display');
        showChartPlaceholder();
        return;
    }
    
    // Hide placeholder and show chart
    console.log('📈 Showing chart, hiding placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
        console.log('✅ Placeholder hidden');
    }
    if (legend) {
        legend.style.display = 'block';
        console.log('✅ Legend shown');
    }
    if (canvas) {
        canvas.style.display = 'block';
        console.log('✅ Canvas shown');
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (combinedChart) {
        combinedChart.destroy();
    }
    
    const labels = Object.keys(nutrients);
    const data = labels.map(label => nutrients[label].rdaPercent);
    
    // レーダーチャートを完全な円にするために最低16個のデータポイントを確保
    const minPoints = 16;
    const originalLength = labels.length;
    while (labels.length < minPoints) {
        labels.push(''); // 空のラベルで仮想ポイント
        data.push(0);
    }
    
    // レスポンシブ対応：画面サイズに応じてCanvasサイズを調整
    // Prevent reflow during chart updates
    const container = canvas.parentElement;
    const containerSize = Math.min(container.offsetWidth, container.offsetHeight, 500);
    
    // Only resize if dimensions actually changed
    if (canvas.width !== containerSize || canvas.height !== containerSize) {
        canvas.width = containerSize;
        canvas.height = containerSize;
    }
    
    combinedChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '摂取量 (% RDA)',
                data: data,
                backgroundColor: 'rgba(255, 20, 147, 0.2)',
                borderColor: 'rgba(255, 20, 147, 1)',
                pointBackgroundColor: 'rgba(255, 20, 147, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 20, 147, 1)',
                pointRadius: 6,
                pointHoverRadius: 8,
                lineWidth: 3
            }, {
                label: '推奨摂取量 (100%)',
                data: labels.map(() => 100),
                backgroundColor: 'rgba(0, 206, 209, 0.1)',
                borderColor: 'rgba(0, 206, 209, 0.8)',
                pointBackgroundColor: 'rgba(0, 206, 209, 0.8)',
                pointBorderColor: '#fff',
                pointRadius: 4,
                lineWidth: 2,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Prevent resize observer from causing layout shifts
            resizeDelay: 100,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 200,
                    ticks: {
                        stepSize: 50,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        font: {
                            size: 12
                        },
                        color: '#fff',
                        callback: function(label, index) {
                            // 実際の栄養素のみラベルを表示
                            return label !== '' ? label : '';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // 自動凡例を無効化
                },
                tooltip: {
                    filter: function(tooltipItem) {
                        // 仮想栄養素のツールチップを非表示
                        return tooltipItem.label !== '';
                    },
                    callbacks: {
                        label: function(context) {
                            const nutrientName = context.label;
                            const nutrient = nutrients[nutrientName];
                            if (!nutrient) return '';
                            return `${nutrientName}: ${nutrient.amount.toFixed(1)}${nutrient.unit} (${context.parsed.r.toFixed(0)}% RDA)`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart',
                // Prevent scroll jumps during animation
                onComplete: function() {
                    // Ensure no scroll position changes after chart animation
                    const currentScroll = window.scrollY;
                    requestAnimationFrame(() => {
                        if (window.scrollY !== currentScroll) {
                            window.scrollTo(0, currentScroll);
                        }
                    });
                }
            }
        }
    });
}

// Display nutrients breakdown
function displayNutrientsBreakdown(nutrients) {
    const container = document.getElementById('nutrients-list');
    
    if (Object.keys(nutrients).length === 0) {
        showNutrientsPlaceholder();
        return;
    }
    
    container.innerHTML = Object.entries(nutrients)
        .sort(([,a], [,b]) => b.rdaPercent - a.rdaPercent) // Sort by RDA percentage
        .map(([name, data]) => {
            const percentClass = data.rdaPercent >= 100 ? 'adequate' : 
                               data.rdaPercent >= 50 ? 'moderate' : 'low';
            
            return `
                <div class="nutrient-item ${percentClass}">
                    <div class="nutrient-header">
                        <h4>${name}</h4>
                        <span class="nutrient-percent">${data.rdaPercent.toFixed(0)}%</span>
                    </div>
                    <div class="nutrient-details">
                        <span class="nutrient-amount">${data.amount.toFixed(1)} ${data.unit}</span>
                        <div class="nutrient-bar">
                            <div class="nutrient-fill" style="width: ${Math.min(data.rdaPercent, 100)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
}

// Show chart placeholder
function showChartPlaceholder() {
    const canvas = document.getElementById('combined-chart');
    const placeholder = document.getElementById('chart-placeholder');
    const legend = document.getElementById('chart-legend');
    
    if (canvas) canvas.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    if (legend) legend.style.display = 'none';
    
    if (combinedChart) {
        combinedChart.destroy();
        combinedChart = null;
    }
}

// Show nutrients placeholder
function showNutrientsPlaceholder() {
    const container = document.getElementById('nutrients-list');
    container.innerHTML = `
        <div class="empty-state">
            <p>サプリメントを選択すると、詳細な栄養成分が表示されます。</p>
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

// Clear all selections
function clearAllSelections() {
    if (selectedSupplements.length === 0) return;
    
    if (confirm('すべての選択を解除しますか？')) {
        selectedSupplements = [];
        saveSelectedSupplements();
        updateSelectedCount();
        displaySelectedSupplements();
        calculateCombinedNutrients();
        
        // Update search results display
        document.querySelectorAll('.search-result-item.selected').forEach(item => {
            const button = item.querySelector('.selection-btn');
            item.classList.remove('selected');
            button.classList.remove('selected');
            button.textContent = '選択';
        });
    }
}