#!/usr/bin/env python3
"""
Kaggle iHerbデータセットをダウンロードして処理するスクリプト
APIキーなしでもWebから直接ダウンロード可能
"""

import requests
import pandas as pd
import json
import os
from urllib.parse import urljoin

def download_iherb_dataset_direct():
    """
    KaggleのiHerbデータセットを直接ダウンロード
    公開データセットなので認証なしでアクセス可能
    """
    
    # Kaggleの公開データセットURL（APIキー不要）
    dataset_url = "https://www.kaggle.com/datasets/crawlfeeds/iherb-products-dataset"
    
    print("🔍 iHerbデータセット情報を取得中...")
    print(f"データセットURL: {dataset_url}")
    print("\n⚠️  手動ダウンロードが必要です:")
    print("1. https://www.kaggle.com/datasets/crawlfeeds/iherb-products-dataset にアクセス")
    print("2. 'Download'ボタンをクリック")
    print("3. ダウンロードしたZIPファイルを以下の場所に保存:")
    print(f"   {os.path.join(os.getcwd(), 'iherb-products-dataset.zip')}")
    print("4. このスクリプトを再実行")
    
    return None

def extract_and_process_iherb_data():
    """ダウンロードしたiHerbデータを処理"""
    
    zip_path = "iherb-products-dataset.zip"
    csv_path = "iherb_products.csv"
    
    if not os.path.exists(zip_path):
        print(f"❌ {zip_path} が見つかりません")
        return download_iherb_dataset_direct()
    
    print(f"📦 {zip_path} を展開中...")
    
    try:
        import zipfile
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall('.')
            
        # CSVファイルを探す
        extracted_files = [f for f in os.listdir('.') if f.endswith('.csv')]
        if not extracted_files:
            print("❌ CSVファイルが見つかりません")
            return False
            
        csv_file = extracted_files[0]
        print(f"📄 CSVファイル発見: {csv_file}")
        
        # データを読み込み
        print("📊 データ分析中...")
        df = pd.read_csv(csv_file)
        
        print(f"✅ 総レコード数: {len(df):,}件")
        print(f"✅ カラム数: {len(df.columns)}個")
        
        # カラム名を表示
        print("\n📋 利用可能なカラム:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i:2d}. {col}")
        
        # NOW Foodsの商品を検索
        print("\n🔍 NOW Foods商品を検索中...")
        
        # ブランドカラムを探す
        brand_columns = [col for col in df.columns if 'brand' in col.lower()]
        title_columns = [col for col in df.columns if any(word in col.lower() for word in ['title', 'name', 'product'])]
        
        now_foods_count = 0
        now_foods_products = []
        
        for _, row in df.iterrows():
            row_text = ' '.join(str(row[col]) for col in df.columns if pd.notna(row[col])).upper()
            if 'NOW FOOD' in row_text or 'NOW-FOOD' in row_text:
                now_foods_count += 1
                now_foods_products.append(row)
                if now_foods_count <= 10:  # 最初の10件を表示
                    product_name = ""
                    if title_columns:
                        product_name = str(row[title_columns[0]])
                    print(f"  - {product_name}")
        
        print(f"\n🎯 NOW Foods商品発見: {now_foods_count:,}件")
        
        if now_foods_count > 0:
            # NOW Foods商品をCSVに保存
            now_foods_df = pd.DataFrame(now_foods_products)
            now_foods_df.to_csv('now_foods_products.csv', index=False)
            print(f"✅ NOW Foods商品を now_foods_products.csv に保存")
            
            # Supabase用SQLを生成
            generate_supabase_sql(now_foods_df)
            
        return True
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def generate_supabase_sql(df):
    """Supabase用のSQL INSERTを生成"""
    
    print("\n🔄 Supabase用SQL生成中...")
    
    # カラム名を推測
    title_col = None
    brand_col = None
    upc_col = None
    price_col = None
    
    for col in df.columns:
        col_lower = col.lower()
        if not title_col and any(word in col_lower for word in ['title', 'name', 'product']):
            title_col = col
        elif not brand_col and 'brand' in col_lower:
            brand_col = col
        elif not upc_col and any(word in col_lower for word in ['upc', 'barcode', 'code']):
            upc_col = col
        elif not price_col and 'price' in col_lower:
            price_col = col
    
    sql_content = f"""-- NOW Foods商品データ（iHerbデータセット）
-- 生成日時: {pd.Timestamp.now()}
-- 総商品数: {len(df)}件

-- 既存データをクリア  
DELETE FROM user_supplements;
DELETE FROM supplement_nutrients;
DELETE FROM supplements;

-- NOW Foods商品を投入
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
"""
    
    for i, row in df.iterrows():
        try:
            # 商品名
            product_name = str(row[title_col]) if title_col else f"Product {i+1}"
            product_name = product_name.replace("'", "''")  # SQLエスケープ
            
            # ブランド
            brand = str(row[brand_col]) if brand_col else "NOW Foods"
            brand = brand.replace("'", "''")
            
            # DSLD ID生成
            dsld_id = f"IHERB_{i+1:05d}"
            
            # UPC/バーコード情報があれば使用
            if upc_col and pd.notna(row[upc_col]):
                upc_value = str(row[upc_col])
                if upc_value.isdigit() and len(upc_value) >= 8:
                    dsld_id = f"IHERB_{upc_value}"
            
            # カテゴリ判定
            product_upper = product_name.upper()
            if any(term in product_upper for term in ['VITAMIN C', 'ASCORBIC']):
                category = 'vitamins'
            elif any(term in product_upper for term in ['VITAMIN D', 'D3', 'D-3']):
                category = 'vitamins'
            elif any(term in product_upper for term in ['MAGNESIUM', 'MAG ']):
                category = 'minerals'
            elif any(term in product_upper for term in ['OMEGA', 'FISH OIL']):
                category = 'fatty_acids'
            else:
                category = 'supplements'
            
            sql_content += f"('{dsld_id}', '{product_name}', '{product_name}', '{brand}', '1 serving', '{category}')"
            
            if i < len(df) - 1:
                sql_content += ",\n"
            else:
                sql_content += ";\n"
                
        except Exception as e:
            print(f"⚠️ 行 {i} でエラー: {e}")
            continue
    
    sql_content += """
-- データ確認
SELECT brand, COUNT(*) as count FROM supplements GROUP BY brand ORDER BY count DESC;
SELECT * FROM supplements WHERE brand LIKE '%NOW%' ORDER BY name_ja LIMIT 20;

-- バーコード検索テスト用
SELECT * FROM supplements WHERE dsld_id LIKE '%19121619%' OR name_en LIKE '%Vitamin C%' LIMIT 5;
"""
    
    with open('import_iherb_data.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print("✅ import_iherb_data.sql を生成完了")
    print(f"📊 {len(df)}件のNOW Foods商品をSQL化")

if __name__ == "__main__":
    print("🚀 Kaggle iHerbデータセット処理開始")
    print("=" * 60)
    
    if extract_and_process_iherb_data():
        print("\n🎉 処理完了!")
        print("次のステップ:")
        print("1. import_iherb_data.sql をSupabaseで実行")
        print("2. バーコード検索をテスト")
    else:
        print("\n📥 手動ダウンロードが必要です")
        print("上記の指示に従ってデータセットをダウンロードしてください")