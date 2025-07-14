#!/usr/bin/env python3
"""
Open Food Facts APIから全てのNOW Foods商品を取得してSupabase用SQLを生成
"""

import requests
import json
import csv
import time

def get_all_now_foods_products():
    """Open Food Facts APIから全てのNOW Foods商品を取得"""
    
    all_products = []
    page = 1
    page_size = 100
    
    print("🔍 NOW Foods商品を全て取得中...")
    
    while True:
        print(f"📄 ページ {page} を取得中...")
        
        url = "https://world.openfoodfacts.org/cgi/search.pl"
        params = {
            'search_terms': 'NOW Foods',
            'search_simple': '1',
            'action': 'process',
            'json': '1',
            'page_size': page_size,
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
                print(f"✅ ページ {page} で商品終了")
                break
                
            print(f"✅ ページ {page}: {len(products)}件取得")
            all_products.extend(products)
            
            # 次のページへ
            page += 1
            
            # API制限を考慮して少し待機
            time.sleep(1)
            
        except Exception as e:
            print(f"❌ ページ {page} でエラー: {e}")
            break
    
    print(f"🎯 合計 {len(all_products)} 件のNOW Foods商品を取得完了")
    return all_products

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
            name_en = f"NOW Foods Product {product_id}"
        
        # 日本語名（とりあえず英語名と同じ）
        name_ja = name_en
        
        # ブランド
        brand = "NOW Foods"
        if brands and "NOW" not in brands.upper():
            brand = brands
        
        # カテゴリ判定
        categories = product.get('categories', '').lower()
        name_lower = name_en.lower()
        
        if any(word in categories or word in name_lower for word in ['vitamin', 'supplement']):
            category = 'vitamins'
        elif any(word in categories or word in name_lower for word in ['mineral', 'magnesium', 'calcium', 'zinc']):
            category = 'minerals'
        elif any(word in categories or word in name_lower for word in ['omega', 'dha', 'epa', 'fish oil']):
            category = 'fatty_acids'
        elif any(word in categories or word in name_lower for word in ['protein', 'amino']):
            category = 'proteins'
        else:
            category = 'supplements'
        
        # バーコード
        barcode = product.get('code', '')
        
        # DSLD ID生成
        if barcode:
            dsld_id = f"DSLD_{barcode}"
        else:
            dsld_id = f"DSLD_NOW_{product_id:06d}"
        
        return {
            'dsld_id': dsld_id,
            'name_en': name_en,
            'name_ja': name_ja,
            'brand': brand,
            'serving_size': '1 serving',
            'category': category,
            'barcode': barcode,
            'original_data': json.dumps(product, ensure_ascii=False)[:500]  # 元データ参考用
        }
        
    except Exception as e:
        print(f"⚠️ 商品処理エラー: {e}")
        return None

def generate_complete_sql(products):
    """全商品のSQL INSERTを生成"""
    
    print("🔄 SQL生成中...")
    
    processed_products = []
    for i, product in enumerate(products, 1):
        processed = process_product_for_sql(product, i)
        if processed:
            processed_products.append(processed)
    
    print(f"✅ {len(processed_products)}件の商品を処理完了")
    
    # カテゴリ別統計
    categories = {}
    for product in processed_products:
        cat = product['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print("📊 カテゴリ別統計:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}件")
    
    # SQL生成
    sql_content = f"""-- 全NOW Foods商品データ（Open Food Facts API）
-- 取得日時: {time.strftime('%Y-%m-%d %H:%M:%S')}
-- 総商品数: {len(processed_products)}件

-- 既存データを完全削除
DELETE FROM user_supplements;
DELETE FROM supplement_nutrients;
DELETE FROM supplements;
DELETE FROM nutrients;

-- 全NOW Foods商品を投入
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
"""
    
    for i, product in enumerate(processed_products):
        # SQLエスケープ
        name_en = product['name_en'].replace("'", "''")
        name_ja = product['name_ja'].replace("'", "''")
        brand = product['brand'].replace("'", "''")
        
        sql_content += f"('{product['dsld_id']}', '{name_en}', '{name_ja}', '{brand}', '{product['serving_size']}', '{product['category']}')"
        
        if i < len(processed_products) - 1:
            sql_content += ",\n"
        else:
            sql_content += ";\n"
    
    # 追加のバーコード19121619商品
    sql_content += """
-- ユーザー検索用バーコード商品
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
('DSLD_19121619', 'NOW Foods Vitamin C-1000 Sustained Release', 'NOW Foods ビタミンC-1000 徐放性', 'NOW Foods', '1 tablet', 'vitamins');
"""
    
    sql_content += f"""
-- データ確認クエリ
SELECT 'データ投入完了' as status;
SELECT COUNT(*) as total_now_foods FROM supplements WHERE brand LIKE '%NOW%';
SELECT category, COUNT(*) as count FROM supplements WHERE brand LIKE '%NOW%' GROUP BY category ORDER BY count DESC;
SELECT * FROM supplements WHERE dsld_id = 'DSLD_19121619';
SELECT * FROM supplements WHERE brand LIKE '%NOW%' ORDER BY name_ja LIMIT 20;
"""
    
    # ファイル保存
    with open('import_all_now_foods.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    # CSV保存
    with open('all_now_foods_products.csv', 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['dsld_id', 'name_en', 'name_ja', 'brand', 'serving_size', 'category', 'barcode']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for product in processed_products:
            writer.writerow({k: v for k, v in product.items() if k != 'original_data'})
    
    print("✅ import_all_now_foods.sql を生成完了")
    print("✅ all_now_foods_products.csv を生成完了")
    
    return len(processed_products)

if __name__ == "__main__":
    print("🚀 全NOW Foods商品取得開始")
    print("=" * 60)
    
    # 1. 全商品取得
    all_products = get_all_now_foods_products()
    
    if not all_products:
        print("❌ 商品取得に失敗しました")
        exit(1)
    
    # 2. SQL生成
    total_count = generate_complete_sql(all_products)
    
    print("=" * 60)
    print(f"🎉 処理完了! {total_count}件のNOW Foods商品をSQL化")
    print("次のステップ:")
    print("1. import_all_now_foods.sql をSupabaseで実行")
    print("2. バーコード19121619で検索テスト")
    print("3. 'NOW'で検索して全商品確認")