#!/usr/bin/env python3
"""
iHerb JSONデータを処理して全サプリメント商品をSupabaseに投入
"""

import json
import pandas as pd
from datetime import datetime
import re

def process_iherb_json():
    """iHerb JSONデータを処理"""
    
    print("📂 iherb_data.json を読み込み中...")
    
    try:
        with open('iherb_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ JSON読み込み完了")
        print(f"📊 データ型: {type(data)}")
        
        # データ構造を調査
        if isinstance(data, list):
            print(f"📊 商品数: {len(data):,}件")
            if data:
                print(f"📋 サンプル商品のキー: {list(data[0].keys())}")
                print(f"📄 サンプル商品:")
                for key, value in list(data[0].items())[:10]:
                    print(f"  {key}: {value}")
        elif isinstance(data, dict):
            print(f"📊 辞書キー: {list(data.keys())}")
            for key, value in data.items():
                if isinstance(value, list):
                    print(f"  {key}: {len(value)}件")
                    if value:
                        products = value
                        break
        
        # 商品リストを特定
        products = []
        if isinstance(data, list):
            products = data
        elif isinstance(data, dict):
            # 最も大きなリストを商品データとして選択
            largest_list = None
            largest_size = 0
            for key, value in data.items():
                if isinstance(value, list) and len(value) > largest_size:
                    largest_list = value
                    largest_size = len(value)
            products = largest_list if largest_list else []
        
        print(f"🎯 処理対象商品: {len(products):,}件")
        
        if not products:
            print("❌ 商品データが見つかりません")
            return None
        
        return products
        
    except Exception as e:
        print(f"❌ JSON読み込みエラー: {e}")
        return None

def analyze_product_structure(products):
    """商品データ構造を分析"""
    
    print("\n🔍 商品データ構造を分析中...")
    
    if not products:
        return None, None, None, None
    
    sample_product = products[0]
    print(f"📋 商品データのキー: {list(sample_product.keys())}")
    
    # キーの分析
    product_name_keys = []
    brand_keys = []
    price_keys = []
    upc_keys = []
    category_keys = []
    
    for key in sample_product.keys():
        key_lower = key.lower()
        if any(word in key_lower for word in ['name', 'title', 'product']):
            product_name_keys.append(key)
        elif 'brand' in key_lower:
            brand_keys.append(key)
        elif any(word in key_lower for word in ['price', 'cost']):
            price_keys.append(key)
        elif any(word in key_lower for word in ['upc', 'barcode', 'code', 'sku']):
            upc_keys.append(key)
        elif any(word in key_lower for word in ['category', 'section', 'type']):
            category_keys.append(key)
    
    print(f"🏷️  商品名キー: {product_name_keys}")
    print(f"🏢 ブランドキー: {brand_keys}")
    print(f"💰 価格キー: {price_keys}")
    print(f"🏷️  UPCキー: {upc_keys}")
    print(f"📂 カテゴリキー: {category_keys}")
    
    # サンプル表示
    print(f"\n📄 サンプル商品データ:")
    for key, value in list(sample_product.items())[:15]:
        value_str = str(value)[:100] + "..." if len(str(value)) > 100 else str(value)
        print(f"  {key}: {value_str}")
    
    return product_name_keys, brand_keys, upc_keys, category_keys

def extract_supplements(products, product_name_keys, brand_keys, upc_keys, category_keys):
    """サプリメント商品を抽出"""
    
    print(f"\n🔍 {len(products):,}件からサプリメント商品を抽出中...")
    
    supplement_keywords = [
        'vitamin', 'mineral', 'supplement', 'capsule', 'tablet', 'softgel',
        'omega', 'probiotic', 'protein', 'amino', 'magnesium', 'calcium',
        'zinc', 'iron', 'b12', 'b-12', 'multivitamin', 'fish oil', 'collagen',
        'coq10', 'turmeric', 'glucosamine', 'melatonin', 'biotin'
    ]
    
    supplement_products = []
    
    for i, product in enumerate(products):
        try:
            # 全フィールドからサプリメント関連キーワードを検索
            product_text = ""
            for key, value in product.items():
                if isinstance(value, str):
                    product_text += " " + value.lower()
            
            # サプリメント判定
            is_supplement = any(keyword in product_text for keyword in supplement_keywords)
            
            if is_supplement:
                supplement_products.append(product)
            
            if (i + 1) % 1000 == 0:
                print(f"⏳ {i+1:,}/{len(products):,} 商品処理中... (サプリメント: {len(supplement_products):,}件)")
                
        except Exception as e:
            print(f"⚠️ 商品 {i} 処理エラー: {e}")
            continue
    
    print(f"✅ サプリメント商品抽出完了: {len(supplement_products):,}件")
    
    return supplement_products

def generate_sql_from_json(products, product_name_keys, brand_keys, upc_keys, category_keys):
    """JSON商品データからSQL INSERTを生成"""
    
    print(f"🔄 {len(products):,}件のSQL生成中...")
    
    # 最適なキーを選択
    name_key = product_name_keys[0] if product_name_keys else None
    brand_key = brand_keys[0] if brand_keys else None
    upc_key = upc_keys[0] if upc_keys else None
    category_key = category_keys[0] if category_keys else None
    
    print(f"📋 使用キー:")
    print(f"  商品名: {name_key}")
    print(f"  ブランド: {brand_key}")
    print(f"  UPC: {upc_key}")
    print(f"  カテゴリ: {category_key}")
    
    processed_products = []
    brand_stats = {}
    
    for i, product in enumerate(products):
        try:
            # 商品名
            product_name = str(product.get(name_key, f"iHerb Product {i+1}"))
            if len(product_name) > 250:
                product_name = product_name[:250] + "..."
            
            # ブランド
            brand = str(product.get(brand_key, "Unknown"))
            if len(brand) > 100:
                brand = brand[:100]
            
            # ブランド統計
            brand_stats[brand] = brand_stats.get(brand, 0) + 1
            
            # UPC/バーコード
            upc = str(product.get(upc_key, ""))
            
            # DSLD ID生成
            if upc and upc.isdigit() and len(upc) >= 8:
                dsld_id = f"DSLD_{upc}"
            else:
                dsld_id = f"DSLD_IHERB_{i+1:08d}"
            
            # カテゴリ判定
            name_lower = product_name.lower()
            category_text = str(product.get(category_key, "")).lower()
            
            if any(word in name_lower or word in category_text for word in ['vitamin c', 'ascorbic']):
                category = 'vitamins'
            elif any(word in name_lower or word in category_text for word in ['vitamin d', 'vitamin e', 'vitamin k', 'vitamin b', 'multivitamin', 'vitamin']):
                category = 'vitamins'
            elif any(word in name_lower or word in category_text for word in ['magnesium', 'calcium', 'zinc', 'iron', 'mineral']):
                category = 'minerals'
            elif any(word in name_lower or word in category_text for word in ['omega', 'dha', 'epa', 'fish oil']):
                category = 'fatty_acids'
            elif any(word in name_lower or word in category_text for word in ['protein', 'amino', 'whey', 'collagen']):
                category = 'proteins'
            elif any(word in name_lower or word in category_text for word in ['probiotic']):
                category = 'probiotics'
            else:
                category = 'supplements'
            
            processed_products.append({
                'dsld_id': dsld_id,
                'name_en': product_name,
                'name_ja': product_name,
                'brand': brand,
                'serving_size': '1 serving',
                'category': category
            })
            
        except Exception as e:
            print(f"⚠️ 商品 {i} 処理エラー: {e}")
            continue
    
    print(f"✅ {len(processed_products):,}件の商品を処理完了")
    
    # ブランド統計表示
    print(f"\n📊 トップブランド:")
    for brand, count in sorted(brand_stats.items(), key=lambda x: x[1], reverse=True)[:30]:
        print(f"  {brand}: {count:,}件")
    
    # SQL生成
    sql_content = f"""-- iHerb全商品データベース（JSON）
-- 処理日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- 総商品数: {len(processed_products):,}件

-- 既存データを完全削除
DELETE FROM user_supplements;
DELETE FROM supplement_nutrients;
DELETE FROM supplements;
DELETE FROM nutrients;

-- 全商品を投入
"""
    
    # バッチ処理
    batch_size = 1000
    total_batches = (len(processed_products) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(processed_products))
        batch_products = processed_products[start_idx:end_idx]
        
        sql_content += f"\n-- バッチ {batch_num + 1}/{total_batches} ({len(batch_products):,}件)\n"
        sql_content += "INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES\n"
        
        for i, product in enumerate(batch_products):
            name_en = product['name_en'].replace("'", "''")
            name_ja = product['name_ja'].replace("'", "''")
            brand = product['brand'].replace("'", "''")
            
            sql_content += f"('{product['dsld_id']}', '{name_en}', '{name_ja}', '{brand}', '{product['serving_size']}', '{product['category']}')"
            
            if i < len(batch_products) - 1:
                sql_content += ",\n"
            else:
                sql_content += ";\n"
        
        if batch_num % 5 == 0:
            print(f"⏳ SQL生成中... {batch_num+1}/{total_batches} バッチ完了")
    
    # 特別商品追加
    sql_content += """
-- ユーザー検索用特別商品
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
('DSLD_19121619', 'NOW Foods Vitamin C-1000 Sustained Release', 'NOW Foods ビタミンC-1000 徐放性', 'NOW Foods', '1 tablet', 'vitamins');

-- データ確認クエリ
SELECT 'iHerb全商品データベース構築完了' as status;
SELECT COUNT(*) as total_products FROM supplements;
SELECT brand, COUNT(*) as count FROM supplements GROUP BY brand ORDER BY count DESC LIMIT 50;
SELECT category, COUNT(*) as count FROM supplements GROUP BY category ORDER BY count DESC;
SELECT * FROM supplements WHERE dsld_id = 'DSLD_19121619';
SELECT * FROM supplements WHERE brand LIKE '%NOW%' ORDER BY name_ja LIMIT 20;
"""
    
    with open('import_iherb_json.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    # CSV保存
    df = pd.DataFrame(processed_products)
    df.to_csv('iherb_json_products.csv', index=False, encoding='utf-8')
    
    print("✅ import_iherb_json.sql を生成完了")
    print("✅ iherb_json_products.csv を生成完了")
    
    return len(processed_products)

if __name__ == "__main__":
    print("🚀 iHerb JSONデータ処理開始")
    print("=" * 80)
    
    # 1. JSON読み込み
    products = process_iherb_json()
    if not products:
        exit(1)
    
    # 2. データ構造分析
    name_keys, brand_keys, upc_keys, category_keys = analyze_product_structure(products)
    
    # 3. サプリメント抽出
    supplement_products = extract_supplements(products, name_keys, brand_keys, upc_keys, category_keys)
    
    # 4. SQL生成
    total_count = generate_sql_from_json(supplement_products, name_keys, brand_keys, upc_keys, category_keys)
    
    print("=" * 80)
    print(f"🎉 iHerb JSON処理完了!")
    print(f"📊 {total_count:,}件のサプリメント商品をSQL化")
    print("📁 生成ファイル:")
    print("  - import_iherb_json.sql (Supabase実行用)")
    print("  - iherb_json_products.csv (データ確認用)")
    print("\n次のステップ:")
    print("1. import_iherb_json.sql をSupabaseで実行")
    print("2. バーコード19121619で検索テスト")
    print("3. 大規模サプリメントデータベース完成！")