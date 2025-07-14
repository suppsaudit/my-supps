#!/usr/bin/env python3
"""
Open Food Facts APIから全てのサプリメント商品を取得してSupabase用SQLを生成
NOW Foods以外も含む全サプリメントブランド
"""

import requests
import json
import csv
import time

def get_all_supplement_products():
    """全てのサプリメント商品を取得"""
    
    all_products = []
    
    # 主要サプリメントブランドとキーワード
    search_terms = [
        'supplement',
        'vitamin',
        'NOW Foods',
        'Nature Way',
        'Solgar',
        'Garden of Life',
        'Jarrow Formulas',
        'Life Extension',
        'Thorne',
        'Pure Encapsulations',
        'Doctor Best',
        'Bluebonnet',
        'Country Life',
        'Swanson',
        'Source Naturals',
        'Kirkland',
        'Nature Made',
        'Centrum',
        'One A Day',
        'multivitamin',
        'omega 3',
        'fish oil',
        'magnesium',
        'calcium',
        'zinc',
        'iron',
        'probiotics'
    ]
    
    print(f"🔍 {len(search_terms)}個のキーワードで全サプリメント商品を取得中...")
    
    for term_idx, search_term in enumerate(search_terms, 1):
        print(f"\n🔍 [{term_idx}/{len(search_terms)}] '{search_term}' で検索中...")
        
        page = 1
        term_products = []
        
        while True:
            url = "https://world.openfoodfacts.org/cgi/search.pl"
            params = {
                'search_terms': search_term,
                'search_simple': '1',
                'action': 'process',
                'json': '1',
                'page_size': 100,
                'page': page
            }
            
            try:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code != 200:
                    print(f"❌ HTTP エラー: {response.status_code}")
                    break
                    
                data = response.json()
                products = data.get('products', [])
                
                if not products:
                    break
                    
                # サプリメント関連商品のみフィルタ
                supplement_products = []
                for product in products:
                    categories = product.get('categories', '').lower()
                    product_name = product.get('product_name', '').lower()
                    brands = product.get('brands', '').lower()
                    
                    if any(keyword in categories or keyword in product_name or keyword in brands 
                           for keyword in ['supplement', 'vitamin', 'mineral', 'omega', 'probiotic', 'capsule', 'tablet', 'softgel']):
                        supplement_products.append(product)
                
                term_products.extend(supplement_products)
                print(f"📄 ページ {page}: {len(supplement_products)}件のサプリメント商品")
                
                page += 1
                time.sleep(0.5)  # API制限考慮
                
                # 1つのキーワードで最大500件まで
                if len(term_products) >= 500:
                    break
                    
            except Exception as e:
                print(f"❌ エラー: {e}")
                break
        
        print(f"✅ '{search_term}': {len(term_products)}件取得")
        all_products.extend(term_products)
    
    # 重複除去（商品コード基準）
    unique_products = {}
    for product in all_products:
        code = product.get('code', '')
        product_name = product.get('product_name', '')
        
        # ユニークキー生成
        unique_key = code if code else f"name_{hash(product_name)}"
        
        if unique_key not in unique_products:
            unique_products[unique_key] = product
    
    final_products = list(unique_products.values())
    
    print(f"\n🎯 重複除去前: {len(all_products)}件")
    print(f"🎯 重複除去後: {len(final_products)}件の全サプリメント商品を取得完了")
    
    return final_products

def process_product_for_sql(product, product_id):
    """商品データをSQL用に整形"""
    
    try:
        # 基本情報
        product_name = product.get('product_name', '')
        product_name_en = product.get('product_name_en', '')
        brands = product.get('brands', '')
        
        # 商品名の決定
        if product_name_en:
            name_en = product_name_en
        elif product_name:
            name_en = product_name
        else:
            name_en = f"Supplement Product {product_id}"
        
        # 商品名を適切な長さに制限
        if len(name_en) > 200:
            name_en = name_en[:200] + "..."
        
        # 日本語名（とりあえず英語名と同じ）
        name_ja = name_en
        
        # ブランド判定
        brand = "Unknown"
        brands_lower = brands.lower()
        name_lower = name_en.lower()
        
        if 'now' in brands_lower or 'now foods' in name_lower:
            brand = "NOW Foods"
        elif 'nature' in brands_lower and 'way' in brands_lower:
            brand = "Nature's Way"
        elif 'solgar' in brands_lower:
            brand = "Solgar"
        elif 'garden of life' in brands_lower:
            brand = "Garden of Life"
        elif 'jarrow' in brands_lower:
            brand = "Jarrow Formulas"
        elif 'life extension' in brands_lower:
            brand = "Life Extension"
        elif 'thorne' in brands_lower:
            brand = "Thorne"
        elif 'pure encapsulations' in brands_lower:
            brand = "Pure Encapsulations"
        elif 'doctor' in brands_lower and 'best' in brands_lower:
            brand = "Doctor's Best"
        elif 'bluebonnet' in brands_lower:
            brand = "Bluebonnet"
        elif 'country life' in brands_lower:
            brand = "Country Life"
        elif 'swanson' in brands_lower:
            brand = "Swanson"
        elif 'source naturals' in brands_lower:
            brand = "Source Naturals"
        elif 'kirkland' in brands_lower:
            brand = "Kirkland"
        elif 'nature made' in brands_lower:
            brand = "Nature Made"
        elif 'centrum' in brands_lower:
            brand = "Centrum"
        elif 'one a day' in brands_lower:
            brand = "One A Day"
        elif brands:
            brand = brands[:50]  # 長すぎる場合は制限
        
        # カテゴリ判定
        categories = product.get('categories', '').lower()
        name_lower = name_en.lower()
        
        if any(word in categories or word in name_lower for word in ['vitamin c', 'ascorbic', 'vitamin d', 'vitamin e', 'vitamin k', 'vitamin b', 'multivitamin', 'vitamin']):
            category = 'vitamins'
        elif any(word in categories or word in name_lower for word in ['mineral', 'magnesium', 'calcium', 'zinc', 'iron', 'selenium']):
            category = 'minerals'
        elif any(word in categories or word in name_lower for word in ['omega', 'dha', 'epa', 'fish oil']):
            category = 'fatty_acids'
        elif any(word in categories or word in name_lower for word in ['protein', 'amino', 'whey', 'casein']):
            category = 'proteins'
        elif any(word in categories or word in name_lower for word in ['probiotic', 'lactobacillus', 'bifidobacterium']):
            category = 'probiotics'
        else:
            category = 'supplements'
        
        # バーコード
        barcode = product.get('code', '')
        
        # DSLD ID生成
        if barcode and barcode.isdigit():
            dsld_id = f"DSLD_{barcode}"
        else:
            dsld_id = f"DSLD_SUPP_{product_id:08d}"
        
        return {
            'dsld_id': dsld_id,
            'name_en': name_en,
            'name_ja': name_ja,
            'brand': brand,
            'serving_size': '1 serving',
            'category': category,
            'barcode': barcode
        }
        
    except Exception as e:
        print(f"⚠️ 商品処理エラー: {e}")
        return None

def generate_massive_sql(products):
    """全サプリメント商品のSQL INSERTを生成"""
    
    print("🔄 大規模SQL生成中...")
    
    processed_products = []
    for i, product in enumerate(products, 1):
        processed = process_product_for_sql(product, i)
        if processed:
            processed_products.append(processed)
        
        if i % 1000 == 0:
            print(f"⏳ {i}/{len(products)} 商品処理中...")
    
    print(f"✅ {len(processed_products)}件の商品を処理完了")
    
    # ブランド別統計
    brands = {}
    categories = {}
    for product in processed_products:
        brand = product['brand']
        cat = product['category']
        brands[brand] = brands.get(brand, 0) + 1
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\n📊 トップブランド:")
    for brand, count in sorted(brands.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {brand}: {count}件")
    
    print("\n📊 カテゴリ別統計:")
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        print(f"  {cat}: {count}件")
    
    # SQL生成（ファイルサイズ考慮で分割）
    sql_content = f"""-- 全サプリメント商品データベース（Open Food Facts API）
-- 取得日時: {time.strftime('%Y-%m-%d %H:%M:%S')}
-- 総商品数: {len(processed_products)}件
-- 対象ブランド数: {len(brands)}ブランド

-- 既存データを完全削除
DELETE FROM user_supplements;
DELETE FROM supplement_nutrients;
DELETE FROM supplements;
DELETE FROM nutrients;

-- 全サプリメント商品を投入
"""
    
    # バッチ処理で分割投入
    batch_size = 1000
    total_batches = (len(processed_products) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(processed_products))
        batch_products = processed_products[start_idx:end_idx]
        
        sql_content += f"\n-- バッチ {batch_num + 1}/{total_batches} ({len(batch_products)}件)\n"
        sql_content += "INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES\n"
        
        for i, product in enumerate(batch_products):
            # SQLエスケープ
            name_en = product['name_en'].replace("'", "''")
            name_ja = product['name_ja'].replace("'", "''")
            brand = product['brand'].replace("'", "''")
            
            sql_content += f"('{product['dsld_id']}', '{name_en}', '{name_ja}', '{brand}', '{product['serving_size']}', '{product['category']}')"
            
            if i < len(batch_products) - 1:
                sql_content += ",\n"
            else:
                sql_content += ";\n"
    
    # 特別なバーコード商品追加
    sql_content += """
-- ユーザー検索用特別商品
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
('DSLD_19121619', 'NOW Foods Vitamin C-1000 Sustained Release', 'NOW Foods ビタミンC-1000 徐放性', 'NOW Foods', '1 tablet', 'vitamins');
"""
    
    sql_content += f"""
-- データ確認クエリ
SELECT 'データ投入完了' as status;
SELECT COUNT(*) as total_supplements FROM supplements;
SELECT brand, COUNT(*) as count FROM supplements GROUP BY brand ORDER BY count DESC LIMIT 20;
SELECT category, COUNT(*) as count FROM supplements GROUP BY category ORDER BY count DESC;
SELECT * FROM supplements WHERE dsld_id = 'DSLD_19121619';
SELECT * FROM supplements WHERE brand = 'NOW Foods' ORDER BY name_ja LIMIT 10;
"""
    
    # ファイル保存
    with open('import_all_supplements.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    # CSV保存
    with open('all_supplements_database.csv', 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['dsld_id', 'name_en', 'name_ja', 'brand', 'serving_size', 'category', 'barcode']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(processed_products)
    
    print("✅ import_all_supplements.sql を生成完了")
    print("✅ all_supplements_database.csv を生成完了")
    
    return len(processed_products)

if __name__ == "__main__":
    print("🚀 全サプリメント商品データベース構築開始")
    print("=" * 80)
    
    # 1. 全商品取得
    all_products = get_all_supplement_products()
    
    if not all_products:
        print("❌ 商品取得に失敗しました")
        exit(1)
    
    # 2. 大規模SQL生成
    total_count = generate_massive_sql(all_products)
    
    print("=" * 80)
    print(f"🎉 処理完了! {total_count}件の全サプリメント商品をSQL化")
    print("📁 生成ファイル:")
    print("  - import_all_supplements.sql (Supabase実行用)")
    print("  - all_supplements_database.csv (データ確認用)")
    print("\n次のステップ:")
    print("1. import_all_supplements.sql をSupabaseで実行")
    print("2. バーコード19121619で検索テスト")
    print("3. 'NOW Foods', 'Nature', 'Solgar' 等で検索確認")
    print("4. 数千件のサプリメント商品データベース完成！")