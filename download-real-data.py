#!/usr/bin/env python3
"""
実際のサプリメントデータを取得して、Supabaseに投入するスクリプト
USDA FoodData Centralから無料でダウンロード可能
"""

import requests
import json
import csv
import os
from datetime import datetime

# USDA FoodData Central API設定
API_KEY = "DEMO_KEY"  # 無料のDEMO_KEYまたは実際のAPIキーを使用
BASE_URL = "https://api.nal.usda.gov/fdc/v1"

def search_supplements(query="supplement", limit=200):
    """サプリメント商品を検索"""
    url = f"{BASE_URL}/foods/search"
    params = {
        "api_key": API_KEY,
        "query": query,
        "dataType": ["Branded"],  # ブランド商品のみ
        "pageSize": limit,
        "pageNumber": 1
    }
    
    print(f"🔍 検索中: {query}")
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        return data.get("foods", [])
    else:
        print(f"❌ API エラー: {response.status_code}")
        return []

def extract_supplement_data():
    """複数のキーワードでサプリメントデータを取得"""
    all_supplements = []
    
    # 主要なサプリメント検索キーワード
    search_terms = [
        "NOW Foods",
        "Nature's Way", 
        "Solgar",
        "Garden of Life",
        "Jarrow Formulas",
        "vitamin C",
        "vitamin D",
        "magnesium",
        "omega 3",
        "multivitamin"
    ]
    
    for term in search_terms:
        supplements = search_supplements(term, 100)
        print(f"✅ {term}: {len(supplements)}件取得")
        all_supplements.extend(supplements)
    
    # 重複除去（fdcId基準）
    unique_supplements = {}
    for supp in all_supplements:
        fdc_id = supp.get("fdcId")
        if fdc_id and fdc_id not in unique_supplements:
            unique_supplements[fdc_id] = supp
    
    print(f"📊 総件数: {len(all_supplements)}件")
    print(f"📊 重複除去後: {len(unique_supplements)}件")
    
    return list(unique_supplements.values())

def process_supplement_for_supabase(supplement):
    """Supabase用にデータを整形"""
    try:
        brand_owner = supplement.get("brandOwner", "")
        brand_name = supplement.get("brandName", "")
        description = supplement.get("description", "")
        
        # ブランド名の決定
        if "NOW" in brand_owner.upper() or "NOW" in brand_name.upper():
            brand = "NOW Foods"
        elif "NATURE" in brand_owner.upper():
            brand = "Nature's Way"
        elif "SOLGAR" in brand_owner.upper():
            brand = "Solgar"
        elif "GARDEN OF LIFE" in brand_owner.upper():
            brand = "Garden of Life"
        elif "JARROW" in brand_owner.upper():
            brand = "Jarrow Formulas"
        else:
            brand = brand_owner or brand_name or "Unknown"
        
        # カテゴリの判定
        desc_upper = description.upper()
        if any(term in desc_upper for term in ["VITAMIN C", "ASCORBIC"]):
            category = "vitamins"
        elif any(term in desc_upper for term in ["VITAMIN D", "D3", "D-3"]):
            category = "vitamins"
        elif any(term in desc_upper for term in ["MAGNESIUM", "MG"]):
            category = "minerals"
        elif any(term in desc_upper for term in ["OMEGA", "FISH OIL", "EPA", "DHA"]):
            category = "fatty_acids"
        elif "MULTIVITAMIN" in desc_upper:
            category = "vitamins"
        else:
            category = "supplements"
        
        # UPCコードの取得
        upc = supplement.get("gtinUpc", "")
        
        return {
            "dsld_id": f"USDA_{supplement.get('fdcId')}",
            "name_en": description,
            "name_ja": description,  # 後で翻訳可能
            "brand": brand,
            "serving_size": "1 serving",  # デフォルト値
            "category": category,
            "upc": upc,
            "fdc_id": supplement.get("fdcId"),
            "brand_owner": brand_owner,
            "data_type": supplement.get("dataType")
        }
    except Exception as e:
        print(f"⚠️ データ処理エラー: {e}")
        return None

def save_to_csv(supplements, filename="real_supplements.csv"):
    """CSVファイルに保存"""
    processed_data = []
    
    for supp in supplements:
        processed = process_supplement_for_supabase(supp)
        if processed:
            processed_data.append(processed)
    
    # NOW Foodsの商品数を確認
    now_foods_count = len([s for s in processed_data if "NOW" in s["brand"]])
    print(f"🎯 NOW Foods商品: {now_foods_count}件")
    
    # CSVに保存
    if processed_data:
        fieldnames = processed_data[0].keys()
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(processed_data)
        
        print(f"✅ {filename}に{len(processed_data)}件保存完了")
        return True
    return False

def generate_supabase_sql(csv_filename="real_supplements.csv"):
    """SupabaseのSQL INSERT文を生成"""
    sql_content = """-- 実際のサプリメントデータ（USDA FoodData Central）
-- 生成日時: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """

-- 既存データをクリア
DELETE FROM user_supplements;
DELETE FROM supplement_nutrients;
DELETE FROM supplements;

-- 実際のサプリメントデータを投入
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
"""
    
    try:
        with open(csv_filename, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            
            for i, row in enumerate(rows):
                # SQL用にエスケープ
                name_en = row['name_en'].replace("'", "''")
                name_ja = row['name_ja'].replace("'", "''")
                brand = row['brand'].replace("'", "''")
                
                sql_content += f"('{row['dsld_id']}', '{name_en}', '{name_ja}', '{brand}', '{row['serving_size']}', '{row['category']}')"
                
                if i < len(rows) - 1:
                    sql_content += ",\n"
                else:
                    sql_content += ";\n"
        
        sql_content += """
-- データ確認
SELECT brand, COUNT(*) as count FROM supplements GROUP BY brand ORDER BY count DESC;
SELECT * FROM supplements WHERE brand LIKE '%NOW%' LIMIT 10;
"""
        
        with open("import_real_supplements.sql", "w", encoding="utf-8") as f:
            f.write(sql_content)
        
        print("✅ import_real_supplements.sql を生成完了")
        return True
        
    except Exception as e:
        print(f"❌ SQL生成エラー: {e}")
        return False

if __name__ == "__main__":
    print("🚀 実際のサプリメントデータ取得開始")
    print("=" * 50)
    
    # 1. データ取得
    supplements = extract_supplement_data()
    
    if not supplements:
        print("❌ データの取得に失敗しました")
        exit(1)
    
    # 2. CSV保存
    if save_to_csv(supplements):
        print("✅ CSVファイル保存完了")
    else:
        print("❌ CSV保存に失敗しました")
        exit(1)
    
    # 3. SQL生成
    if generate_supabase_sql():
        print("✅ SQL文生成完了")
    else:
        print("❌ SQL生成に失敗しました")
        exit(1)
    
    print("=" * 50)
    print("🎉 実際のサプリメントデータ準備完了!")
    print("次のステップ:")
    print("1. import_real_supplements.sql をSupabaseで実行")
    print("2. バーコード検索をテスト")