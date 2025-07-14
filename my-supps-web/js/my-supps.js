// My Supps Page JavaScript

let currentUser = null;
let mySupplements = [];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    let attempts = 0;
    while (!window.supabaseClient && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
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
        // デモモード分岐を完全削除
        const { data, error } = await window.supabaseClient
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
        console.log('APIレスポンス: user_supplements load', { data, error });
        if (error) throw error;
        mySupplements = data || [];
        displayMySupplements();
        updateStats();
    } catch (error) {
        console.error('Error loading supplements:', error);
        document.getElementById('my-supplements-list').innerHTML = '<p class="error-message">サプリメントデータの取得に失敗しました。管理者に連絡してください。</p>';
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
        
        // 第一步: Supabaseデータベースで検索（バーコード、商品名、ブランド）
        try {
            console.log('🔍 Searching Supabase database for:', searchTerm);
            
            // バーコードかどうかを判定（数字のみかつ長さが8-14桁）
            const isBarcode = /^\d{8,14}$/.test(searchTerm);
            
            let query = window.supabaseClient.from('supplements');
            
            if (isBarcode) {
                // バーコード検索（dsld_idで検索、barcodeカラムが存在しない場合に対応）
                console.log('🔍 Detected barcode search:', searchTerm);
                query = query.eq('dsld_id', `DSLD_${searchTerm}`);
            } else {
                // テキスト検索（商品名、ブランド）
                query = query.or(`name_ja.ilike.%${searchTerm}%,name_en.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
            }
            
            const { data: supabaseResults, error } = await query
                .select('id, dsld_id, name_ja, name_en, brand, serving_size, category')
                .limit(20);
            
            if (error) {
                console.error('❌ Supabase search error:', error);
            } else if (supabaseResults && supabaseResults.length > 0) {
                console.log(`✅ Found ${supabaseResults.length} products from Supabase`);
                results = supabaseResults.map(item => ({
                    id: item.id,
                    dsld_id: item.dsld_id,
                    name_ja: item.name_ja,
                    name_en: item.name_en,
                    brand: item.brand,
                    serving_size: item.serving_size,
                    category: item.category,
                    source: 'database'
                }));
            } else {
                console.log('⚠️ No results from Supabase database');
            }
        } catch (dbError) {
            console.error('❌ Supabase database search failed:', dbError);
        }
        
        // 第二步: Supabaseで結果がない場合のDSLD API検索
        if (results.length === 0) {
            try {
                if (window.dsldApi) {
                    console.log('🔍 Searching DSLD API for:', searchTerm);
                    const dsldResponse = await window.dsldApi.searchProducts(searchTerm, { limit: 10 });
                    if (dsldResponse && dsldResponse.hits && dsldResponse.hits.length > 0) {
                        console.log(`✅ Found ${dsldResponse.hits.length} products from DSLD API`);
                        results = dsldResponse.hits.map(hit => ({
                            id: hit._source.id || hit._id,
                            name_ja: hit._source.product_name || hit._source.fullName,
                            name_en: hit._source.full_name_original || hit._source.fullName,
                            brand: hit._source.brand_name || hit._source.brandName,
                            serving_size: hit._source.serving_size || '1 unit',
                            nutrients: hit._source.nutrients || [],
                            source: 'dsld_api'
                        }));
                    } else {
                        console.log('⚠️ No results from DSLD API');
                    }
                }
            } catch (apiError) {
                console.error('❌ DSLD API search failed:', apiError);
                if (results.length === 0) {
                    resultsContainer.innerHTML = '<p>検索結果がありません。バーコードまたは商品名で再度お試しください。</p>';
                    return;
                }
            }
        }
        
        displaySearchResults(results);
    } catch (error) {
        console.error('Error searching supplements:', error);
        resultsContainer.innerHTML = '<p>検索エラーが発生しました。</p>';
    }
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
                    ${supplement.dsld_id ? `<p class="dsld-info">DSLD ID: ${supplement.dsld_id}</p>` : ''}
                    ${supplement.category ? `<p class="category-info">カテゴリ: ${supplement.category}</p>` : ''}
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
            const { error } = await window.supabaseClient
                .from('user_supplements')
                .upsert({
                    user_id: currentUser.id,
                    supplement_id: supplementId,
                    is_my_supps: true,
                    is_selected: false
                });
            console.log('APIレスポンス: user_supplements add', { error });
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
            const { error } = await window.supabaseClient
                .from('user_supplements')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('supplement_id', supplementId);
            console.log('APIレスポンス: user_supplements remove', { error });
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
            
            const { data, error } = await window.supabaseClient
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
            
            console.log('APIレスポンス: supplement_nutrients analyze', { data, error });
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