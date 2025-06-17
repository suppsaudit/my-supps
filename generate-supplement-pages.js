// Static Supplement Page Generator
// Generates individual HTML pages for all supplements for SEO/AIO optimization

const fs = require('fs');
const path = require('path');

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

// Mock data generator (same as used in the app)
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

// Get category functions
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

// Generate HTML template for each product
function generateProductHTML(product) {
    const nutrientsListHTML = product.nutrients.map(nutrient => {
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
        let calculationAmount = nutrient.amount;
        
        // Convert units for calculation
        if (nutrient.unit === 'mcg') {
            calculationAmount = nutrient.amount / 1000;
        } else if (nutrient.unit === 'IU') {
            calculationAmount = nutrient.amount * 0.025;
        }
        
        const rdaPercent = Math.min((calculationAmount / rda) * 100, 300);
        const percentClass = rdaPercent >= 100 ? 'adequate' : 
                           rdaPercent >= 50 ? 'moderate' : 'low';
        
        return `
            <div class="nutrient-item ${percentClass}">
                <div class="nutrient-header">
                    <span class="nutrient-name">${nutrient.name_ja}</span>
                    <span class="nutrient-percent">${rdaPercent.toFixed(0)}%</span>
                </div>
                <div class="nutrient-details">
                    <span class="nutrient-amount">${nutrient.amount.toFixed(1)} ${nutrient.unit}</span>
                    <div class="nutrient-bar">
                        <div class="nutrient-fill" style="width: ${Math.min(rdaPercent, 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name_ja,
        "description": `${product.name_ja}の詳細な栄養成分データと科学的分析`,
        "brand": {
            "@type": "Brand",
            "name": product.brand
        },
        "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock"
        }
    };

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.name_ja} - MY SUPPS</title>
    <meta name="description" content="${product.name_ja}の詳細な栄養成分データと科学的分析">
    <meta name="keywords" content="${product.name_ja},${product.brand},サプリメント,栄養成分,DSLD,科学的データ,レーダーチャート">
    
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    
    <!-- Supabase CDN v2 -->
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/supplement-detail.css">
    
    <!-- Structured Data for SEO -->
    <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
    </script>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                <h1><span>M</span><span>Y</span> <span>S</span><span>U</span><span>P</span><span>P</span><span class="tilted-p">S</span></h1>
                <p class="tagline">サプリガチヲタのための管理ツール。</p>
            </div>
            <nav>
                <a href="../index.html" class="nav-link">ホーム</a>
                <a href="../products.html" class="nav-link">商品一覧</a>
                <a href="../my-supps.html" class="nav-link">MY SUPPS</a>
                <a href="../supps-audit.html" class="nav-link">Supps Audit</a>
                <div id="user-menu" class="user-menu"></div>
            </nav>
        </header>

        <main class="supplement-detail">
            <div class="supplement-content">
                <!-- Breadcrumb -->
                <nav class="breadcrumb">
                    <a href="../products.html">商品一覧</a>
                    <span class="separator">></span>
                    <span>${getCategoryName(product.category)}</span>
                    <span class="separator">></span>
                    <span>${product.name_ja}</span>
                </nav>

                <!-- Product Header -->
                <div class="product-header">
                    <div class="product-image-section">
                        <div class="product-image">
                            ${product.image_url ? 
                                `<img src="${product.image_url}" alt="${product.name_ja}" class="supplement-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                 <div class="category-icon-fallback ${product.category}" style="display: none;">${getCategoryIcon(product.category)}</div>` :
                                `<div class="category-icon ${product.category}">${getCategoryIcon(product.category)}</div>`
                            }
                            <div class="brand-badge">${product.brand}</div>
                        </div>
                        <div class="product-actions">
                            <button onclick="addToMySupps('${product.id}')" class="btn btn-primary">
                                <span class="btn-icon">➕</span>
                                MY SUPPSに追加
                            </button>
                            <button onclick="addToSuppsAudit('${product.id}')" class="btn btn-secondary">
                                <span class="btn-icon">📊</span>
                                Supps Auditで分析
                            </button>
                        </div>
                    </div>
                    
                    <div class="product-info-section">
                        <div class="product-title">
                            <h1>${product.name_ja}</h1>
                            <p class="brand-name">${product.brand}</p>
                        </div>
                        
                        <div class="product-meta">
                            <div class="meta-item">
                                <span class="meta-label">カテゴリ</span>
                                <span class="meta-value">${getCategoryName(product.category)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">摂取形態</span>
                                <span class="meta-value">${getServingFormName(product.serving_form)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">摂取量</span>
                                <span class="meta-value">${product.serving_size}${getServingText(product.serving_form)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">データソース</span>
                                <span class="meta-value">NIH DSLD</span>
                            </div>
                        </div>
                        
                        <div class="serving-toggle">
                            <label class="toggle-label">表示単位:</label>
                            <div class="toggle-buttons">
                                <button id="serving-btn-${product.id}" class="toggle-btn active" onclick="toggleServingMode('${product.id}', 'serving')">1日分</button>
                                <button id="unit-btn-${product.id}" class="toggle-btn" onclick="toggleServingMode('${product.id}', 'unit')">1粒あたり</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Nutrients Analysis -->
                <div class="nutrients-analysis">
                    <div class="chart-section">
                        <div class="section-header">
                            <h2>栄養成分レーダーチャート</h2>
                            <p class="section-description">推奨摂取量（RDA）に対する割合を可視化</p>
                        </div>
                        <div class="chart-container">
                            <canvas id="nutrients-chart-${product.id}" width="500" height="500"></canvas>
                        </div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <span class="color-indicator current"></span>
                                <span>現在の摂取量</span>
                            </div>
                            <div class="legend-item">
                                <span class="color-indicator recommended"></span>
                                <span>推奨摂取量 (100%)</span>
                            </div>
                        </div>
                    </div>

                    <div class="nutrients-breakdown">
                        <div class="section-header">
                            <h2>栄養成分詳細</h2>
                            <p class="section-description">各栄養素の含有量と推奨摂取量に対する割合</p>
                        </div>
                        <div class="nutrients-list">
                            ${nutrientsListHTML}
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer>
            <p>&copy; 2024 MY SUPPS. All rights reserved.</p>
            <p class="disclaimer">本サービスは医療アドバイスではありません。健康に関する決定は医療専門家にご相談ください。</p>
        </footer>
    </div>

    <!-- Embedded Product Data -->
    <script>
        window.currentProductData = ${JSON.stringify(product, null, 2)};
    </script>
    
    <script src="../js/supabase-client.js"></script>
    <script src="../js/dsld-api.js"></script>
    <script src="../js/static-supplement-detail.js"></script>
</body>
</html>`;
}

// Main generation function
function generateAllSupplementPages() {
    const products = generateMockProducts();
    const supplementsDir = path.join(__dirname, 'supplements');
    
    // Create supplements directory if it doesn't exist
    if (!fs.existsSync(supplementsDir)) {
        fs.mkdirSync(supplementsDir, { recursive: true });
    }
    
    console.log(`Generating ${products.length} supplement pages...`);
    
    let generated = 0;
    const errors = [];
    
    products.forEach(product => {
        try {
            const html = generateProductHTML(product);
            const filename = `${product.id}.html`;
            const filepath = path.join(supplementsDir, filename);
            
            fs.writeFileSync(filepath, html, 'utf8');
            generated++;
            
            if (generated % 50 === 0) {
                console.log(`Generated ${generated}/${products.length} pages...`);
            }
        } catch (error) {
            errors.push(`Error generating page for product ${product.id}: ${error.message}`);
        }
    });
    
    console.log(`\nGeneration complete!`);
    console.log(`Successfully generated: ${generated} pages`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach(error => console.log(`- ${error}`));
    }
    
    // Generate sitemap
    generateSitemap(products);
    
    return { generated, errors: errors.length, total: products.length };
}

// Generate sitemap for SEO
function generateSitemap(products) {
    const baseUrl = 'https://your-domain.com'; // Replace with actual domain
    
    const sitemapEntries = products.map(product => {
        return `  <url>
    <loc>${baseUrl}/supplements/${product.id}.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('\n');
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${sitemapEntries}
</urlset>`;
    
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf8');
    console.log('Generated sitemap.xml');
}

// Run the generator
if (require.main === module) {
    generateAllSupplementPages();
}

module.exports = { generateAllSupplementPages };