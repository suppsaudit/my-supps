// Static Supplement Detail Page JavaScript
// For pre-generated individual supplement pages

let currentUser = null;
let nutrientsChart = null;
let viewMode = 'serving'; // 'serving' or 'unit'

// Initialize page with embedded product data
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
    window.isDemo = !window.supabaseClient;
    
    currentUser = await checkAuth();
    console.log('Static supplement detail - Current user:', currentUser);
    updateUserMenu();
    
    // Product data is embedded in the HTML via window.currentProductData
    if (window.currentProductData) {
        await loadProductFromData(window.currentProductData);
    } else {
        showErrorState();
    }
});

// Load product from embedded data
async function loadProductFromData(productData) {
    try {
        window.currentProduct = productData;
        
        // Display product information
        displayNutrientsChart();
        loadRelatedProducts();
        
    } catch (error) {
        console.error('Error loading product data:', error);
        showErrorState();
    }
}

// Display nutrients chart
function displayNutrientsChart() {
    const canvas = document.getElementById(`nutrients-chart-${window.currentProduct.id}`);
    
    if (!canvas || !window.currentProduct.nutrients || window.currentProduct.nutrients.length === 0) {
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (nutrientsChart) {
        nutrientsChart.destroy();
    }
    
    const nutrients = calculateNutrientPercentages();
    const labels = Object.keys(nutrients);
    const data = labels.map(label => nutrients[label].rdaPercent);
    
    nutrientsChart = new Chart(ctx, {
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
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 300,
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
                        color: '#fff'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const nutrientName = context.label;
                            const nutrient = nutrients[nutrientName];
                            return `${nutrientName}: ${nutrient.amount.toFixed(1)}${nutrient.unit} (${context.parsed.r.toFixed(0)}% RDA)`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Calculate nutrient percentages
function calculateNutrientPercentages() {
    const nutrients = {};
    
    window.currentProduct.nutrients.forEach(nutrient => {
        let amount = nutrient.amount;
        
        // Adjust amount based on view mode
        if (viewMode === 'unit' && window.currentProduct.serving_size) {
            amount = amount / window.currentProduct.serving_size;
        }
        
        // RDA values (mock)
        const rdaValues = {
            'ビタミンC': 100,
            'ビタミンD3': 800,
            'ビタミンE': 10,
            'ビタミンB6': 1.4,
            'ビタミンB12': 2.4,
            'マグネシウム': 400,
            'カルシウム': 800,
            '亜鉛': 10,
            '鉄': 10,
            'EPA': 250,
            'DHA': 250,
            'オメガ3': 1000,
            '葉酸': 400,
            '乳酸菌': 1
        };
        
        const rda = rdaValues[nutrient.name_ja] || 100;
        let calculationAmount = amount;
        
        // Convert units for calculation
        if (nutrient.unit === 'mcg') {
            calculationAmount = amount / 1000;
        } else if (nutrient.unit === 'IU') {
            calculationAmount = amount * 0.025;
        }
        
        const rdaPercent = Math.min((calculationAmount / rda) * 100, 300);
        
        nutrients[nutrient.name_ja] = {
            amount: amount,
            unit: nutrient.unit,
            rdaPercent: rdaPercent
        };
    });
    
    return nutrients;
}

// Load related products (simplified for static pages)
function loadRelatedProducts() {
    // For static pages, we'll show a placeholder or link to the main products page
    const container = document.getElementById('related-products-grid');
    if (container) {
        container.innerHTML = `
            <div class="related-placeholder">
                <h4>関連商品を見る</h4>
                <p>同じカテゴリの他の商品をお探しですか？</p>
                <a href="../products.html?category=${window.currentProduct.category}" class="btn btn-primary">
                    ${getCategoryName(window.currentProduct.category)}の商品を見る
                </a>
            </div>
        `;
    }
}

// Toggle serving mode
function toggleServingMode(productId, mode) {
    viewMode = mode;
    
    // Update button states
    const servingBtn = document.getElementById(`serving-btn-${productId}`);
    const unitBtn = document.getElementById(`unit-btn-${productId}`);
    
    if (servingBtn && unitBtn) {
        servingBtn.classList.toggle('active', mode === 'serving');
        unitBtn.classList.toggle('active', mode === 'unit');
    }
    
    // Update chart
    displayNutrientsChart();
}

// Add to My Supps
async function addToMySupps(productId) {
    // 認証状態を再確認
    const user = await checkAuth();
    console.log('Add to My Supps - User check:', user);
    
    if (!user) {
        alert('MY SUPPSに追加するにはログインが必要です。');
        window.location.href = '../auth.html';
        return;
    }
    
    currentUser = user; // Update current user
    
    try {
        if (window.isDemo) {
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const newEntry = {
                user_id: currentUser.id,
                supplement_id: productId,
                is_my_supps: true,
                is_selected: false
            };
            
            const existingIndex = mockUserSupps.findIndex(
                us => us.user_id === currentUser.id && us.supplement_id === productId
            );
            
            if (existingIndex >= 0) {
                alert('既にMY SUPPSに追加されています。');
                return;
            }
            
            mockUserSupps.push(newEntry);
            localStorage.setItem('mockUserSupplements', JSON.stringify(mockUserSupps));
        }
        
        alert(`${window.currentProduct.name_ja}をMY SUPPSに追加しました！`);
        
    } catch (error) {
        console.error('Error adding to My Supps:', error);
        alert('MY SUPPSへの追加に失敗しました。');
    }
}

// Add to Supps Audit
function addToSuppsAudit(productId) {
    // Add to selected supplements for Supps Audit
    const selectedSupps = JSON.parse(localStorage.getItem('selectedSupplements') || '[]');
    
    const existingIndex = selectedSupps.findIndex(s => s.id === productId);
    if (existingIndex >= 0) {
        alert('既にSupps Auditに追加されています。');
        return;
    }
    
    selectedSupps.push({
        id: window.currentProduct.id,
        name: window.currentProduct.name_ja,
        brand: window.currentProduct.brand,
        serving_size: window.currentProduct.serving_size,
        nutrients: window.currentProduct.nutrients
    });
    
    localStorage.setItem('selectedSupplements', JSON.stringify(selectedSupps));
    
    if (confirm(`${window.currentProduct.name_ja}をSupps Auditに追加しました。\\nSupps Auditページで分析しますか？`)) {
        window.location.href = '../supps-audit.html';
    }
}

// Helper functions
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

// Show error state
function showErrorState() {
    document.body.innerHTML = `
        <div class="container">
            <div class="error-state" style="text-align: center; padding: 4rem 2rem;">
                <div class="error-icon">⚠️</div>
                <h3>サプリメントが見つかりません</h3>
                <p>指定されたサプリメントは存在しないか、削除された可能性があります。</p>
                <a href="../products.html" class="btn btn-primary">商品一覧に戻る</a>
            </div>
        </div>
    `;
}

// Update user menu
function updateUserMenu() {
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        if (currentUser) {
            userMenu.innerHTML = `
                <span class="user-name">${currentUser.email}</span>
                <button onclick="logout()" class="logout-btn">ログアウト</button>
            `;
        } else {
            userMenu.innerHTML = `
                <a href="../auth.html" class="login-btn">ログイン</a>
            `;
        }
    }
}