// My Supps Page JavaScript

let currentUser = null;
let mySupplements = [];

// Check authentication on page load
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
    
    currentUser = await checkAuth();
    console.log('My Supps page - Current user:', currentUser);
    
    if (!currentUser) {
        document.getElementById('auth-check').style.display = 'block';
        document.getElementById('my-supps-content').style.display = 'none';
    } else {
        document.getElementById('auth-check').style.display = 'none';
        document.getElementById('my-supps-content').style.display = 'block';
        loadMySupplements();
    }
});

// Load user's supplements
async function loadMySupplements() {
    try {
        // Check if we're in demo mode
        if (window.isDemo) {
            // Load from localStorage for demo mode
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
            
            mySupplements = mockUserSupps
                .filter(us => us.user_id === currentUser.id && us.is_my_supps)
                .map(us => {
                    const supplement = mockSupplements.find(s => s.id === us.supplement_id);
                    return {
                        supplement_id: us.supplement_id,
                        supplements: supplement || { id: us.supplement_id, name_ja: 'Unknown', brand: 'Unknown' }
                    };
                });
        } else {
            const { data, error } = await supabase
                .from('user_supplements')
                .select(`
                    supplement_id,
                    supplements (
                        id,
                        name_ja,
                        brand,
                        image_url
                    )
                `)
                .eq('user_id', currentUser.id)
                .eq('is_my_supps', true);
            
            if (error) throw error;
            
            mySupplements = data || [];
        }
        
        displayMySupplements();
        updateStats();
        
    } catch (error) {
        console.error('Error loading supplements:', error);
    }
}

// Display user's supplements
function displayMySupplements() {
    const container = document.getElementById('my-supplements-list');
    
    if (mySupplements.length === 0) {
        container.innerHTML = '<p class="empty-message">まだサプリメントが登録されていません。</p>';
        return;
    }
    
    container.innerHTML = mySupplements.map(item => `
        <div class="supplement-card" id="supp-${item.supplements.id}">
            <h4>${item.supplements.name_ja}</h4>
            <p>${item.supplements.brand}</p>
            <button onclick="removeFromMySupps('${item.supplements.id}')" class="remove-btn">削除</button>
        </div>
    `).join('');
}

// Update statistics
function updateStats() {
    document.getElementById('total-count').textContent = mySupplements.length;
}

// Search supplements with advanced criteria
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
        
        console.log('🔍 My Supps Search:', { searchTerm, searchType });
        
        let results = [];
        
        // Try DSLD API first
        try {
            if (window.dsldApi) {
                console.log('🔍 Searching DSLD API for:', searchTerm);
                
                const dsldResponse = await window.dsldApi.searchProducts(searchTerm, { 
                    limit: 10 
                });
                
                if (dsldResponse && dsldResponse.hits && dsldResponse.hits.length > 0) {
                    console.log(`✅ Found ${dsldResponse.hits.length} products from DSLD API`);
                    results = dsldResponse.hits.map(hit => ({
                        id: hit._source.id || hit._id,
                        name_ja: hit._source.product_name || hit._source.fullName,
                        name_en: hit._source.full_name_original || hit._source.fullName,
                        brand: hit._source.brand_name || hit._source.brandName,
                        serving_size: hit._source.serving_size || '1 unit',
                        nutrients: hit._source.nutrients || []
                    }));
                } else {
                    console.log('⚠️ No results from DSLD API');
                }
            }
        } catch (apiError) {
            console.error('❌ DSLD API search failed:', apiError);
        }
        
        // Fallback to comprehensive mock data if no DSLD results
        if (results.length === 0) {
            console.log('🔄 Using fallback mock data for My Supps search');
            results = generateMySuppsSearchResults(searchTerm);
        }
        
        displaySearchResults(results);
        
    } catch (error) {
        console.error('Error searching supplements:', error);
        resultsContainer.innerHTML = '<p>検索エラーが発生しました。</p>';
    }
}

// Generate comprehensive search results for My Supps
function generateMySuppsSearchResults(searchTerm) {
    const searchTermLower = searchTerm.toLowerCase();
    
    const mockProducts = [
        // ビタミン類
        {
            id: 'my-supp-1',
            name_ja: 'ビタミンC 1000mg',
            name_en: 'Vitamin C 1000mg',
            brand: 'Nature\'s Way',
            serving_size: '1 capsule',
            nutrients: [{ name_ja: 'ビタミンC', amount: 1000, unit: 'mg' }]
        },
        {
            id: 'my-supp-2',
            name_ja: 'ビタミンD3 5000 IU',
            name_en: 'Vitamin D3 5000 IU',
            brand: 'NOW Foods',
            serving_size: '1 softgel',
            nutrients: [{ name_ja: 'ビタミンD3', amount: 5000, unit: 'IU' }]
        },
        {
            id: 'my-supp-3',
            name_ja: 'ビタミンE 400 IU',
            name_en: 'Vitamin E 400 IU',
            brand: 'Solgar',
            serving_size: '1 softgel',
            nutrients: [{ name_ja: 'ビタミンE', amount: 400, unit: 'IU' }]
        },
        {
            id: 'my-supp-4',
            name_ja: 'ビタミンBコンプレックス',
            name_en: 'B-Complex Vitamins',
            brand: 'Garden of Life',
            serving_size: '1 capsule',
            nutrients: [
                { name_ja: 'ビタミンB1', amount: 25, unit: 'mg' },
                { name_ja: 'ビタミンB6', amount: 25, unit: 'mg' },
                { name_ja: 'ビタミンB12', amount: 100, unit: 'mcg' }
            ]
        },
        // ミネラル類
        {
            id: 'my-supp-5',
            name_ja: 'マグネシウム グリシネート 200mg',
            name_en: 'Magnesium Glycinate 200mg',
            brand: 'Doctor\'s Best',
            serving_size: '2 tablets',
            nutrients: [{ name_ja: 'マグネシウム', amount: 200, unit: 'mg' }]
        },
        {
            id: 'my-supp-6',
            name_ja: '亜鉛 ピコリネート 15mg',
            name_en: 'Zinc Picolinate 15mg',
            brand: 'Thorne',
            serving_size: '1 capsule',
            nutrients: [{ name_ja: '亜鉛', amount: 15, unit: 'mg' }]
        },
        {
            id: 'my-supp-7',
            name_ja: '鉄分 28mg',
            name_en: 'Iron 28mg',
            brand: 'Life Extension',
            serving_size: '1 capsule',
            nutrients: [{ name_ja: '鉄', amount: 28, unit: 'mg' }]
        },
        {
            id: 'my-supp-8',
            name_ja: 'カルシウム 1000mg',
            name_en: 'Calcium 1000mg',
            brand: 'NOW Foods',
            serving_size: '1 tablet',
            nutrients: [{ name_ja: 'カルシウム', amount: 1000, unit: 'mg' }]
        },
        // オメガ系
        {
            id: 'my-supp-9',
            name_ja: 'オメガ3 フィッシュオイル',
            name_en: 'Omega-3 Fish Oil',
            brand: 'Nordic Naturals',
            serving_size: '2 softgels',
            nutrients: [
                { name_ja: 'EPA', amount: 650, unit: 'mg' },
                { name_ja: 'DHA', amount: 450, unit: 'mg' }
            ]
        },
        // プロバイオティクス
        {
            id: 'my-supp-10',
            name_ja: 'プロバイオティクス 85億CFU',
            name_en: 'Probiotics 85 Billion CFU',
            brand: 'Garden of Life',
            serving_size: '1 capsule',
            nutrients: [{ name_ja: 'プロバイオティクス', amount: 85, unit: 'billion CFU' }]
        },
        // 特殊成分
        {
            id: 'my-supp-11',
            name_ja: 'カルノシン 500mg',
            name_en: 'L-Carnosine 500mg',
            brand: 'NOW Foods',
            serving_size: '1 capsule',
            nutrients: [{ name_ja: 'カルノシン', amount: 500, unit: 'mg' }]
        },
        {
            id: 'my-supp-12',
            name_ja: 'コエンザイムQ10 100mg',
            name_en: 'CoQ10 100mg',
            brand: 'Jarrow Formulas',
            serving_size: '1 capsule',
            nutrients: [{ name_ja: 'コエンザイムQ10', amount: 100, unit: 'mg' }]
        },
        {
            id: 'my-supp-13',
            name_ja: 'コラーゲン ペプチド',
            name_en: 'Collagen Peptides',
            brand: 'Sports Research',
            serving_size: '1 scoop',
            nutrients: [{ name_ja: 'コラーゲン', amount: 10000, unit: 'mg' }]
        },
        // ハーブ・植物エキス
        {
            id: 'my-supp-14',
            name_ja: 'クルクミン ウコン 1000mg',
            name_en: 'Turmeric Curcumin 1000mg',
            brand: 'Nature\'s Bounty',
            serving_size: '1 capsule',
            nutrients: [{ name_ja: 'クルクミン', amount: 950, unit: 'mg' }]
        },
        {
            id: 'my-supp-15',
            name_ja: 'アシュワガンダ 450mg',
            name_en: 'Ashwagandha 450mg',
            brand: 'Swanson',
            serving_size: '1 capsule',
            nutrients: [{ name_ja: 'アシュワガンダ', amount: 450, unit: 'mg' }]
        }
    ];
    
    // Enhanced search with multiple criteria
    return mockProducts.filter(product => {
        const searchableText = [
            product.name_ja,
            product.name_en,
            product.brand,
            ...product.nutrients.map(n => n.name_ja)
        ].join(' ').toLowerCase();
        
        // Direct text matching
        if (searchableText.includes(searchTermLower)) {
            return true;
        }
        
        // Japanese-English translation matching
        const translateMap = {
            'ビタミンc': ['vitamin c', 'ビタミンc'],
            'ビタミンd': ['vitamin d', 'ビタミンd'],
            'ビタミンe': ['vitamin e', 'ビタミンe'],
            'ビタミンb': ['vitamin b', 'ビタミンb', 'b-complex'],
            'マグネシウム': ['magnesium', 'マグネシウム'],
            '亜鉛': ['zinc', '亜鉛'],
            '鉄': ['iron', '鉄'],
            'カルシウム': ['calcium', 'カルシウム'],
            'オメガ': ['omega', 'オメガ', 'fish oil'],
            'プロバイオティクス': ['probiotics', 'プロバイオティクス'],
            'カルノシン': ['carnosine', 'カルノシン'],
            'コエンザイム': ['coq10', 'coenzyme', 'コエンザイム'],
            'コラーゲン': ['collagen', 'コラーゲン'],
            'クルクミン': ['curcumin', 'turmeric', 'クルクミン', 'ウコン'],
            'アシュワガンダ': ['ashwagandha', 'アシュワガンダ']
        };
        
        for (const [japanese, englishTerms] of Object.entries(translateMap)) {
            if (searchTermLower.includes(japanese)) {
                return englishTerms.some(term => searchableText.includes(term.toLowerCase()));
            }
        }
        
        return false;
    });
}

// Auto-complete suggestions
async function showSuggestions() {
    const searchTerm = document.getElementById('supplement-search').value.trim();
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (searchTerm.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    try {
        const results = await window.advancedSearch.quickSearch(searchTerm);
        
        if (results.data && results.data.length > 0) {
            const suggestionsHtml = results.data.slice(0, 5).map(item => `
                <div class="suggestion-item" onclick="selectSuggestion('${item.name_en || item.name_ja}')">
                    <div class="suggestion-type">${item.brand}</div>
                    <div class="suggestion-text">${item.name_ja || item.name_en}</div>
                </div>
            `).join('');
            
            suggestionsContainer.innerHTML = suggestionsHtml;
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Error getting suggestions:', error);
        suggestionsContainer.style.display = 'none';
    }
}

// Select suggestion
function selectSuggestion(suggestion) {
    document.getElementById('supplement-search').value = suggestion;
    document.getElementById('search-suggestions').style.display = 'none';
    searchSupplements();
}

// Display search results
function displaySearchResults(results) {
    const container = document.getElementById('search-results');
    
    if (results.length === 0) {
        container.innerHTML = '<p>検索結果がありません。</p>';
        return;
    }
    
    container.innerHTML = results.map(supplement => {
        const isAdded = mySupplements.some(s => s.supplement_id === supplement.id);
        const displayName = supplement.name_ja || supplement.name_en || supplement.name;
        const serving = supplement.serving_size || supplement.servingSize || '';
        
        return `
            <div class="search-result-item">
                <div class="supplement-info">
                    <h4>${displayName}</h4>
                    <p><strong>${supplement.brand}</strong></p>
                    ${serving ? `<p class="serving-info">摂取量: ${serving}</p>` : ''}
                </div>
                <button 
                    onclick="addToMySupps('${supplement.id}')" 
                    class="add-btn"
                    ${isAdded ? 'disabled' : ''}
                >
                    ${isAdded ? '追加済み' : '追加'}
                </button>
            </div>
        `;
    }).join('');
}

// Add supplement to My Supps
async function addToMySupps(supplementId) {
    try {
        if (window.isDemo) {
            // Add to localStorage for demo mode
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const newEntry = {
                user_id: currentUser.id,
                supplement_id: supplementId,
                is_my_supps: true,
                is_selected: false
            };
            
            // Check if already exists
            const existingIndex = mockUserSupps.findIndex(
                us => us.user_id === currentUser.id && us.supplement_id === supplementId
            );
            
            if (existingIndex >= 0) {
                mockUserSupps[existingIndex] = newEntry;
            } else {
                mockUserSupps.push(newEntry);
            }
            
            localStorage.setItem('mockUserSupplements', JSON.stringify(mockUserSupps));
        } else {
            const { error } = await supabase
                .from('user_supplements')
                .upsert({
                    user_id: currentUser.id,
                    supplement_id: supplementId,
                    is_my_supps: true,
                    is_selected: false
                });
            
            if (error) throw error;
            
            // Auto-generate intake schedule
            if (window.scheduleGenerator) {
                await window.scheduleGenerator.autoGenerateSchedule(currentUser.id, supplementId);
            }
        }
        
        // Reload supplements
        loadMySupplements();
        
        // Update search results
        const searchTerm = document.getElementById('supplement-search').value;
        if (searchTerm) searchSupplements();
        
    } catch (error) {
        console.error('Error adding supplement:', error);
        alert('サプリメントの追加に失敗しました。');
    }
}

// Remove supplement from My Supps
async function removeFromMySupps(supplementId) {
    if (!confirm('このサプリメントを削除しますか？')) return;
    
    try {
        if (window.isDemo) {
            // Remove from localStorage for demo mode
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const filtered = mockUserSupps.filter(
                us => !(us.user_id === currentUser.id && us.supplement_id === supplementId)
            );
            localStorage.setItem('mockUserSupplements', JSON.stringify(filtered));
        } else {
            const { error } = await supabase
                .from('user_supplements')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('supplement_id', supplementId);
            
            if (error) throw error;
        }
        
        // Reload supplements
        loadMySupplements();
        
    } catch (error) {
        console.error('Error removing supplement:', error);
        alert('サプリメントの削除に失敗しました。');
    }
}

// Analyze My Supps nutrients
async function analyzeMySupps() {
    if (mySupplements.length === 0) {
        alert('サプリメントを追加してください。');
        return;
    }
    
    try {
        let nutrientTotals = {};
        
        if (window.isDemo) {
            // Mock nutrient data for demo mode
            const mockNutrients = {
                '1': [
                    { name_ja: 'ビタミンC', amount: 1000, unit: 'mg' }
                ],
                '2': [
                    { name_ja: 'ビタミンD3', amount: 5000, unit: 'IU' }
                ],
                '3': [
                    { name_ja: 'マグネシウム', amount: 200, unit: 'mg' }
                ],
                '4': [
                    { name_ja: 'オメガ3', amount: 1000, unit: 'mg' },
                    { name_ja: 'EPA', amount: 600, unit: 'mg' },
                    { name_ja: 'DHA', amount: 400, unit: 'mg' }
                ],
                '5': [
                    { name_ja: '亜鉛', amount: 50, unit: 'mg' }
                ]
            };
            
            mySupplements.forEach(supplement => {
                const nutrients = mockNutrients[supplement.supplement_id] || [];
                nutrients.forEach(nutrient => {
                    if (!nutrientTotals[nutrient.name_ja]) {
                        nutrientTotals[nutrient.name_ja] = {
                            amount: 0,
                            unit: nutrient.unit
                        };
                    }
                    nutrientTotals[nutrient.name_ja].amount += nutrient.amount;
                });
            });
        } else {
            // Get nutrient data for all supplements
            const supplementIds = mySupplements.map(s => s.supplement_id);
            
            const { data, error } = await supabase
                .from('supplement_nutrients')
                .select(`
                    supplement_id,
                    amount_per_serving,
                    nutrients (
                        name_ja,
                        unit
                    )
                `)
                .in('supplement_id', supplementIds);
            
            if (error) throw error;
            
            // Calculate combined nutrients
            data.forEach(item => {
                const name = item.nutrients.name_ja;
                const unit = item.nutrients.unit;
                
                if (!nutrientTotals[name]) {
                    nutrientTotals[name] = {
                        amount: 0,
                        unit: unit
                    };
                }
                
                nutrientTotals[name].amount += item.amount_per_serving;
            });
        }
        
        // Display nutrition summary
        displayNutritionSummary(nutrientTotals);
        
    } catch (error) {
        console.error('Error analyzing nutrients:', error);
    }
}

// Display nutrition summary
function displayNutritionSummary(nutrients) {
    document.getElementById('nutrition-summary').style.display = 'block';
    
    // Create chart
    const ctx = document.getElementById('my-supps-chart').getContext('2d');
    
    const labels = Object.keys(nutrients).slice(0, 8); // Show top 8 nutrients
    const data = labels.map(label => nutrients[label].amount);
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '栄養成分',
                data: data,
                backgroundColor: 'rgba(255, 20, 147, 0.2)',
                borderColor: 'rgba(255, 20, 147, 1)',
                pointBackgroundColor: 'rgba(255, 20, 147, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 20, 147, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Display nutrient details
    const detailsContainer = document.getElementById('nutrient-details');
    detailsContainer.innerHTML = Object.entries(nutrients).map(([name, data]) => `
        <div class="nutrient-item">
            <div class="nutrient-name">${name}</div>
            <div class="nutrient-amount">
                ${data.amount.toFixed(1)}
                <span class="nutrient-unit">${data.unit}</span>
            </div>
        </div>
    `).join('');
    
    // Scroll to summary
    document.getElementById('nutrition-summary').scrollIntoView({ behavior: 'smooth' });
}

// Handle Enter key in search and auto-suggestions
document.getElementById('supplement-search')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchSupplements();
    }
});

// Add input event for auto-suggestions
document.getElementById('supplement-search')?.addEventListener('input', (e) => {
    showSuggestions();
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        document.getElementById('search-suggestions').style.display = 'none';
    }
});

// QuaggaJSの読み込み
let quaggaLoaded = false;
function loadQuagga(callback) {
    if (quaggaLoaded) return callback();
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js';
    script.onload = () => { quaggaLoaded = true; callback(); };
    document.head.appendChild(script);
}

// バーコードモーダルの開閉
window.closeBarcodeModal = function() {
    document.getElementById('barcode-modal').style.display = 'none';
    if (window.Quagga) window.Quagga.stop();
};

function openBarcodeModal() {
    document.getElementById('barcode-modal').style.display = 'flex';
    document.getElementById('barcode-result').textContent = '';
    loadQuagga(() => {
        window.Quagga.init({
            inputStream: {
                name: 'Live',
                type: 'LiveStream',
                target: document.getElementById('barcode-scanner'),
                constraints: { facingMode: 'environment' }
            },
            decoder: { readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader'] }
        }, err => {
            if (err) {
                document.getElementById('barcode-result').textContent = 'カメラの起動に失敗しました: ' + err;
                return;
            }
            window.Quagga.start();
        });
        window.Quagga.onDetected(data => {
            const code = data.codeResult.code;
            document.getElementById('barcode-result').textContent = 'バーコード検出: ' + code;
            document.getElementById('supplement-search').value = code;
            closeBarcodeModal();
            searchSupplements();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const barcodeBtn = document.getElementById('barcode-btn');
    if (barcodeBtn) {
        barcodeBtn.addEventListener('click', openBarcodeModal);
    }
});