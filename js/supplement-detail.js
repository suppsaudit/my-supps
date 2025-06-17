// Supplement Detail Page JavaScript
// Individual supplement analysis with DSLD integration

let currentProduct = null;
let currentUser = null;
let nutrientsChart = null;
let viewMode = 'serving'; // 'serving' or 'unit'
let allProducts = []; // For related products

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Set demo mode for development
    window.isDemo = true;
    
    currentUser = await checkAuth();
    updateUserMenu();
    
    // Get product ID from URL parameter
    const productId = getProductIdFromUrl();
    
    if (productId) {
        await loadProductDetail(productId);
    } else {
        showErrorState();
    }
});

// Get product ID from URL parameter
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load product detail data
async function loadProductDetail(productId) {
    try {
        showLoadingState();
        
        // Generate all products for lookup
        allProducts = generateMockProducts();
        
        // Find the specific product
        currentProduct = allProducts.find(p => p.id === productId);
        
        if (!currentProduct) {
            showErrorState();
            return;
        }
        
        // Display product information
        displayProductInfo();
        displayNutrientsChart();
        displayNutrientsBreakdown();
        loadRelatedProducts();
        
        showContentState();
        
    } catch (error) {
        console.error('Error loading product detail:', error);
        showErrorState();
    }
}

// Generate product image URL from actual supplement images
function generateProductImageUrl(id, brand, productName, dsldId) {
    // 実際のサプリメント商品画像URLマッピング
    const productKey = `${brand} ${productName}`.toLowerCase();
    
    // iHerbの実際の商品画像URL
    const realProductImages = {
        "nature's way vitamin c": "https://s3.images-iherb.com/now/now01182/y/17.jpg",
        "nature's way vitamin c 1000mg": "https://s3.images-iherb.com/now/now03115/y/17.jpg", 
        "nature's way buffered vitamin c": "https://s3.images-iherb.com/now/now03119/y/17.jpg",
        "nature's way vitamin d3": "https://s3.images-iherb.com/now/now00334/y/17.jpg",
        "nature's way vitamin d3 5000 iu": "https://s3.images-iherb.com/now/now00335/y/17.jpg",
        "nature's way magnesium": "https://s3.images-iherb.com/now/now01474/y/17.jpg",
        "nature's way magnesium glycinate": "https://s3.images-iherb.com/now/now01476/y/17.jpg",
        "nature's way omega-3": "https://s3.images-iherb.com/now/now01482/y/17.jpg",
        "nature's way fish oil": "https://s3.images-iherb.com/now/now01593/y/17.jpg",
        "nature's way zinc": "https://s3.images-iherb.com/now/now01626/y/17.jpg",
        "nature's way zinc picolinate": "https://s3.images-iherb.com/now/now01627/y/17.jpg",
        "nature's way iron": "https://s3.images-iherb.com/now/now01378/y/17.jpg",
        "nature's way iron bisglycinate": "https://s3.images-iherb.com/now/now01379/y/17.jpg",
        "nature's way b-complex": "https://s3.images-iherb.com/now/now00556/y/17.jpg",
        "nature's way vitamin b12": "https://s3.images-iherb.com/now/now00547/y/17.jpg",
        "nature's way calcium": "https://s3.images-iherb.com/now/now01213/y/17.jpg",
        "nature's way calcium magnesium": "https://s3.images-iherb.com/now/now01216/y/17.jpg",
        "nature's way multivitamin": "https://s3.images-iherb.com/now/now04047/y/17.jpg",
        "nature's way daily multi": "https://s3.images-iherb.com/now/now04046/y/17.jpg",
        "nature's way probiotics": "https://s3.images-iherb.com/now/now03348/y/17.jpg",
        "nature's way probiotic 50 billion": "https://s3.images-iherb.com/now/now03349/y/17.jpg",
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
    
    // 完全一致を試す
    if (realProductImages[productKey]) {
        return realProductImages[productKey];
    }
    
    // 部分一致を試す
    for (const [key, url] of Object.entries(realProductImages)) {
        if (productKey.includes(key.split(' ')[0]) && productKey.includes(key.split(' ')[2])) {
            return url;
        }
    }
    
    // デフォルト画像
    const defaultImages = Object.values(realProductImages);
    return defaultImages[parseInt(id) % defaultImages.length];
}

// Generate mock products (same as products-page.js)
function generateMockProducts() {
    const mockBrands = [
        "Nature's Way", "NOW Foods", "Doctor's Best", "Nordic Naturals",
        "Thorne", "Life Extension", "Garden of Life", "Solgar",
        "Pure Encapsulations", "Jarrow Formulas"
    ];
    
    const productTemplates = [
        { name: "Vitamin C", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Vitamin C 1000mg", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Buffered Vitamin C", category: "vitamins", nutrients: ["ビタミンC"] },
        { name: "Vitamin D3", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Vitamin D3 5000 IU", category: "vitamins", nutrients: ["ビタミンD3"] },
        { name: "Magnesium", category: "minerals", nutrients: ["マグネシウム"] },
        { name: "Magnesium Glycinate", category: "minerals", nutrients: ["マグネシウム"] },
        { name: "Omega-3", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        { name: "Fish Oil", category: "omega", nutrients: ["EPA", "DHA", "オメガ3"] },
        { name: "Zinc", category: "minerals", nutrients: ["亜鉛"] },
        { name: "Zinc Picolinate", category: "minerals", nutrients: ["亜鉛"] },
        { name: "Iron", category: "minerals", nutrients: ["鉄"] },
        { name: "Iron Bisglycinate", category: "minerals", nutrients: ["鉄"] },
        { name: "B-Complex", category: "vitamins", nutrients: ["ビタミンB6", "ビタミンB12", "葉酸"] },
        { name: "Vitamin B12", category: "vitamins", nutrients: ["ビタミンB12"] },
        { name: "Calcium", category: "minerals", nutrients: ["カルシウム"] },
        { name: "Calcium Magnesium", category: "minerals", nutrients: ["カルシウム", "マグネシウム"] },
        { name: "Multivitamin", category: "vitamins", nutrients: ["ビタミンC", "ビタミンD3", "ビタミンE"] },
        { name: "Daily Multi", category: "vitamins", nutrients: ["ビタミンC", "ビタミンD3", "ビタミンB12"] },
        { name: "Probiotics", category: "probiotics", nutrients: ["乳酸菌"] },
        { name: "Probiotic 50 Billion", category: "probiotics", nutrients: ["乳酸菌"] }
    ];
    
    const servingForms = ["capsule", "tablet", "softgel", "powder", "liquid"];
    const products = [];
    
    let id = 1;
    mockBrands.forEach(brand => {
        productTemplates.forEach(template => {
            const servingForm = servingForms[Math.floor(Math.random() * servingForms.length)];
            const servingSize = Math.floor(Math.random() * 4) + 1;
            
            const jaTranslations = {
                'Vitamin C': 'ビタミンC',
                'Vitamin C 1000mg': 'ビタミンC 1000mg',
                'Buffered Vitamin C': 'バッファードビタミンC',
                'Vitamin D3': 'ビタミンD3',
                'Vitamin D3 5000 IU': 'ビタミンD3 5000 IU',
                'Magnesium': 'マグネシウム',
                'Magnesium Glycinate': 'マグネシウムグリシネート',
                'Omega-3': 'オメガ3',
                'Fish Oil': 'フィッシュオイル',
                'Zinc': '亜鉛',
                'Zinc Picolinate': '亜鉛ピコリネート',
                'Iron': '鉄',
                'Iron Bisglycinate': '鉄ビスグリシネート',
                'B-Complex': 'Bコンプレックス',
                'Vitamin B12': 'ビタミンB12',
                'Calcium': 'カルシウム',
                'Calcium Magnesium': 'カルシウム・マグネシウム',
                'Multivitamin': 'マルチビタミン',
                'Daily Multi': 'デイリーマルチ',
                'Probiotics': 'プロバイオティクス',
                'Probiotic 50 Billion': 'プロバイオティクス 500億'
            };
            
            const productName = `${brand} ${template.name}`;
            products.push({
                id: id.toString(),
                dsld_id: `DSLD_${id}`,
                name_en: productName,
                name_ja: `${brand} ${jaTranslations[template.name] || template.name}`,
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
            'マグネシウム': () => Math.random() * 300 + 100,
            'カルシウム': () => Math.random() * 600 + 200,
            '亜鉛': () => Math.random() * 30 + 5,
            '鉄': () => Math.random() * 25 + 5,
            'EPA': () => Math.random() * 600 + 200,
            'DHA': () => Math.random() * 400 + 100,
            'オメガ3': () => Math.random() * 1000 + 300,
            '葉酸': () => Math.random() * 800 + 200,
            '乳酸菌': () => Math.random() * 10 + 1
        };
        
        const units = {
            'ビタミンC': 'mg',
            'ビタミンD3': 'IU',
            'ビタミンE': 'IU',
            'ビタミンB6': 'mg',
            'ビタミンB12': 'mcg',
            'マグネシウム': 'mg',
            'カルシウム': 'mg',
            '亜鉛': 'mg',
            '鉄': 'mg',
            'EPA': 'mg',
            'DHA': 'mg',
            'オメガ3': 'mg',
            '葉酸': 'mcg',
            '乳酸菌': 'billion CFU'
        };
        
        return {
            name_ja: name,
            amount: amounts[name] ? amounts[name]() : Math.random() * 100 + 10,
            unit: units[name] || 'mg'
        };
    });
}

// Display product information
function displayProductInfo() {
    // Update page title and metadata
    document.title = `${currentProduct.name_ja} - MY SUPPS`;
    document.getElementById('page-title').textContent = `${currentProduct.name_ja} - MY SUPPS`;
    document.getElementById('page-description').setAttribute('content', 
        `${currentProduct.name_ja}の詳細な栄養成分データと科学的分析`);
    
    // Update structured data
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": currentProduct.name_ja,
        "description": `${currentProduct.name_ja}の栄養成分詳細`,
        "brand": {
            "@type": "Brand",
            "name": currentProduct.brand
        },
        "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock"
        }
    };
    document.getElementById('structured-data').textContent = JSON.stringify(structuredData);
    
    // Update breadcrumb
    document.getElementById('breadcrumb-category').textContent = getCategoryName(currentProduct.category);
    document.getElementById('breadcrumb-product').textContent = currentProduct.name_ja;
    
    // Update product header
    document.getElementById('product-name').textContent = currentProduct.name_ja;
    document.getElementById('product-brand').textContent = currentProduct.brand;
    document.getElementById('brand-badge').textContent = currentProduct.brand;
    
    // Update product image
    const productImage = document.querySelector('.supplement-image');
    const categoryIconFallback = document.querySelector('.category-icon-fallback');
    
    if (currentProduct.image_url) {
        productImage.src = currentProduct.image_url;
        productImage.alt = currentProduct.name_ja;
        productImage.style.display = 'block';
        categoryIconFallback.style.display = 'none';
    } else {
        productImage.style.display = 'none';
        categoryIconFallback.style.display = 'flex';
        categoryIconFallback.textContent = getCategoryIcon(currentProduct.category);
        categoryIconFallback.className = `category-icon-fallback ${currentProduct.category}`;
    }
    
    // Update product meta
    document.getElementById('product-category').textContent = getCategoryName(currentProduct.category);
    document.getElementById('product-form').textContent = getServingFormName(currentProduct.serving_form);
    document.getElementById('product-serving').textContent = `${currentProduct.serving_size}${getServingText(currentProduct.serving_form)}`;
}

// Display nutrients chart
function displayNutrientsChart() {
    const canvas = document.getElementById('nutrients-chart');
    const placeholder = document.getElementById('chart-placeholder');
    
    if (!currentProduct.nutrients || currentProduct.nutrients.length === 0) {
        return;
    }
    
    // Hide placeholder and show chart
    placeholder.style.display = 'none';
    canvas.style.display = 'block';
    
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
    
    currentProduct.nutrients.forEach(nutrient => {
        let amount = nutrient.amount;
        
        // Adjust amount based on view mode
        if (viewMode === 'unit' && currentProduct.serving_size) {
            amount = amount / currentProduct.serving_size;
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

// Display nutrients breakdown
function displayNutrientsBreakdown() {
    const container = document.getElementById('nutrients-list');
    const nutrients = calculateNutrientPercentages();
    
    container.innerHTML = Object.entries(nutrients)
        .sort(([,a], [,b]) => b.rdaPercent - a.rdaPercent)
        .map(([name, data]) => {
            const percentClass = data.rdaPercent >= 100 ? 'adequate' : 
                               data.rdaPercent >= 50 ? 'moderate' : 'low';
            
            return `
                <div class="nutrient-item ${percentClass}">
                    <div class="nutrient-header">
                        <span class="nutrient-name">${name}</span>
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

// Load related products
function loadRelatedProducts() {
    const relatedProducts = allProducts
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 6);
    
    const container = document.getElementById('related-products-grid');
    
    container.innerHTML = relatedProducts.map(product => `
        <div class="related-product-card" onclick="viewProduct('${product.id}')">
            <div class="related-card-image">
                <div class="category-icon ${product.category}">${getCategoryIcon(product.category)}</div>
            </div>
            <div class="related-card-title">${product.name_ja}</div>
            <div class="related-card-brand">${product.brand}</div>
            <div class="related-card-actions">
                <button onclick="event.stopPropagation(); viewProduct('${product.id}')" class="btn btn-outline">詳細</button>
                <button onclick="event.stopPropagation(); addRelatedToMySupps('${product.id}')" class="btn btn-primary">追加</button>
            </div>
        </div>
    `).join('');
}

// Toggle serving mode
function toggleServingMode(mode) {
    viewMode = mode;
    
    // Update button states
    document.getElementById('serving-btn').classList.toggle('active', mode === 'serving');
    document.getElementById('unit-btn').classList.toggle('active', mode === 'unit');
    
    // Update chart and breakdown
    displayNutrientsChart();
    displayNutrientsBreakdown();
}

// Add to My Supps
async function addToMySupps() {
    if (!currentUser) {
        alert('MY SUPPSに追加するにはログインが必要です。');
        window.location.href = '../auth.html';
        return;
    }
    
    try {
        if (window.isDemo) {
            const mockUserSupps = JSON.parse(localStorage.getItem('mockUserSupplements') || '[]');
            const newEntry = {
                user_id: currentUser.id,
                supplement_id: currentProduct.id,
                is_my_supps: true,
                is_selected: false
            };
            
            const existingIndex = mockUserSupps.findIndex(
                us => us.user_id === currentUser.id && us.supplement_id === currentProduct.id
            );
            
            if (existingIndex >= 0) {
                alert('既にMY SUPPSに追加されています。');
                return;
            }
            
            mockUserSupps.push(newEntry);
            localStorage.setItem('mockUserSupplements', JSON.stringify(mockUserSupps));
        }
        
        alert(`${currentProduct.name_ja}をMY SUPPSに追加しました！`);
        
        // Update button state
        const button = document.getElementById('add-to-my-supps-btn');
        button.innerHTML = '<span class="btn-icon">✓</span>MY SUPPSに追加済み';
        button.disabled = true;
        
    } catch (error) {
        console.error('Error adding to My Supps:', error);
        alert('MY SUPPSへの追加に失敗しました。');
    }
}

// Add to Supps Audit
function addToSuppsAudit() {
    // Add to selected supplements for Supps Audit
    const selectedSupps = JSON.parse(localStorage.getItem('selectedSupplements') || '[]');
    
    const existingIndex = selectedSupps.findIndex(s => s.id === currentProduct.id);
    if (existingIndex >= 0) {
        alert('既にSupps Auditに追加されています。');
        return;
    }
    
    selectedSupps.push({
        id: currentProduct.id,
        name: currentProduct.name_ja,
        brand: currentProduct.brand,
        serving_size: currentProduct.serving_size,
        nutrients: currentProduct.nutrients
    });
    
    localStorage.setItem('selectedSupplements', JSON.stringify(selectedSupps));
    
    if (confirm(`${currentProduct.name_ja}をSupps Auditに追加しました。\nSupps Auditページで分析しますか？`)) {
        window.location.href = '../supps-audit.html';
    }
}

// View product
function viewProduct(productId) {
    window.location.href = `detail.html?id=${productId}`;
}

// Add related product to My Supps
async function addRelatedToMySupps(productId) {
    if (!currentUser) {
        alert('MY SUPPSに追加するにはログインが必要です。');
        return;
    }
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
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
        
        alert(`${product.name_ja}をMY SUPPSに追加しました！`);
        
    } catch (error) {
        console.error('Error adding to My Supps:', error);
        alert('MY SUPPSへの追加に失敗しました。');
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

function getServingFormName(form) {
    const names = {
        capsule: 'カプセル',
        tablet: 'タブレット',
        softgel: 'ソフトジェル',
        powder: 'パウダー',
        liquid: 'リキッド'
    };
    return names[form] || 'カプセル';
}

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

// State management
function showLoadingState() {
    document.getElementById('loading-state').style.display = 'block';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('supplement-content').style.display = 'none';
}

function showErrorState() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('supplement-content').style.display = 'none';
}

function showContentState() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('supplement-content').style.display = 'block';
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
            <a href="../auth.html" class="login-btn">ログイン</a>
        `;
    }
}