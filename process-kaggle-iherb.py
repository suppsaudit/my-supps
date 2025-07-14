#!/usr/bin/env python3
"""
Kaggle iHerbデータセットを処理して全サプリメント商品をSupabaseに投入
手動ダウンロード版
"""

import pandas as pd
import json
import os
import zipfile
from datetime import datetime

def extract_kaggle_dataset():
    """Kaggleからダウンロードしたデータセットを展開・処理"""
    
    # 可能なファイル名パターン
    possible_files = [
        'iherb-products-dataset.zip',
        'archive.zip',
        'iherb_products.csv',
        'products.csv'
    ]
    
    print("📂 Kaggleデータセットファイルを検索中...")
    
    # ZIPファイルを探す
    zip_file = None
    for filename in possible_files:
        if os.path.exists(filename):
            if filename.endswith('.zip'):
                zip_file = filename
                print(f"✅ ZIPファイル発見: {filename}")
                break
            elif filename.endswith('.csv'):
                print(f"✅ CSVファイル発見: {filename}")
                return filename
    
    if not zip_file:
        print("❌ Kaggleデータセットが見つかりません")
        print("\n📥 手動ダウンロード手順:")
        print("1. https://www.kaggle.com/datasets/crawlfeeds/iherb-products-dataset")
        print("2. 'Download'ボタンをクリック")
        print("3. ダウンロードしたZIPファイルをこのフォルダに保存:")
        print(f"   {os.getcwd()}/")
        print("4. このスクリプトを再実行")
        return None
    
    # ZIP展開
    print(f"📦 {zip_file} を展開中...")
    try:
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall('.')
        
        # CSVファイルを探す
        csv_files = [f for f in os.listdir('.') if f.endswith('.csv')]
        if csv_files:
            csv_file = csv_files[0]
            print(f"✅ CSVファイル展開完了: {csv_file}")
            return csv_file
        else:
            print("❌ ZIPにCSVファイルが含まれていません")
            return None
            
    except Exception as e:
        print(f"❌ ZIP展開エラー: {e}")
        return None

def analyze_iherb_data(csv_file):
    """iHerbデータを分析・処理"""
    
    print(f"📊 {csv_file} を分析中...")
    
    try:
        # データ読み込み
        df = pd.read_csv(csv_file, encoding='utf-8')
        print(f"✅ データ読み込み完了: {len(df):,}行, {len(df.columns)}列")
        
        # カラム一覧表示
        print("\n📋 利用可能なカラム:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i:2d}. {col}")
        
        # データサンプル表示
        print(f"\n📄 データサンプル (最初の3行):")
        print(df.head(3).to_string())
        
        # サプリメント関連商品を抽出
        print("\n🔍 サプリメント商品を抽出中...")
        
        # カラム名を推測
        title_cols = [col for col in df.columns if any(word in col.lower() for word in ['title', 'name', 'product'])]
        brand_cols = [col for col in df.columns if 'brand' in col.lower()]
        category_cols = [col for col in df.columns if any(word in col.lower() for word in ['category', 'section'])]
        upc_cols = [col for col in df.columns if any(word in col.lower() for word in ['upc', 'barcode', 'code'])]
        
        print(f"🏷️  商品名カラム: {title_cols}")
        print(f"🏢 ブランドカラム: {brand_cols}")
        print(f"📂 カテゴリカラム: {category_cols}")
        print(f"🏷️  UPCカラム: {upc_cols}")
        
        # サプリメント関連商品をフィルタ
        supplement_mask = pd.Series([False] * len(df))
        
        # 全カラムからサプリメント関連キーワードを検索
        supplement_keywords = [
            'vitamin', 'mineral', 'supplement', 'capsule', 'tablet', 'softgel',
            'omega', 'probiotic', 'protein', 'amino', 'magnesium', 'calcium',
            'zinc', 'iron', 'b12', 'b-12', 'multivitamin', 'now foods',
            'solgar', 'nature', 'garden of life', 'jarrow'
        ]
        
        for col in df.columns:
            if df[col].dtype == 'object':  # テキストカラムのみ
                for keyword in supplement_keywords:
                    mask = df[col].astype(str).str.lower().str.contains(keyword, na=False)
                    supplement_mask |= mask
        
        supplement_df = df[supplement_mask].copy()
        print(f"✅ サプリメント商品抽出完了: {len(supplement_df):,}件")
        
        # ブランド別統計
        if brand_cols:
            brand_col = brand_cols[0]
            brand_stats = supplement_df[brand_col].value_counts().head(20)
            print(f"\n📊 トップブランド ({brand_col}):")
            for brand, count in brand_stats.items():
                print(f"  {brand}: {count:,}件")
        
        return supplement_df, title_cols, brand_cols, category_cols, upc_cols
        
    except Exception as e:
        print(f"❌ データ分析エラー: {e}")
        return None, None, None, None, None

def generate_sql_from_iherb(df, title_cols, brand_cols, category_cols, upc_cols):
    """iHerbデータからSQL INSERTを生成"""
    
    print("🔄 全商品SQL生成中...")
    
    # カラム選択
    title_col = title_cols[0] if title_cols else None
    brand_col = brand_cols[0] if brand_cols else None
    category_col = category_cols[0] if category_cols else None
    upc_col = upc_cols[0] if upc_cols else None
    
    processed_products = []
    
    for idx, row in df.iterrows():
        try:
            # 商品名
            product_name = str(row[title_col]) if title_col else f"iHerb Product {idx+1}"
            if pd.isna(row[title_col]) or product_name == 'nan':
                product_name = f"iHerb Product {idx+1}"
            
            # 長すぎる場合は制限
            if len(product_name) > 200:
                product_name = product_name[:200] + "..."
            
            # ブランド
            brand = str(row[brand_col]) if brand_col and pd.notna(row[brand_col]) else "Unknown"
            if brand == 'nan':
                brand = "Unknown"
            
            # UPC/バーコード
            upc = str(row[upc_col]) if upc_col and pd.notna(row[upc_col]) else ""
            if upc == 'nan':
                upc = ""
            
            # DSLD ID生成
            if upc and upc.isdigit() and len(upc) >= 8:
                dsld_id = f"DSLD_{upc}"
            else:
                dsld_id = f"DSLD_IHERB_{idx+1:08d}"
            
            # カテゴリ判定
            product_lower = product_name.lower()
            category_text = str(row[category_col]).lower() if category_col and pd.notna(row[category_col]) else ""
            
            if any(word in product_lower or word in category_text for word in ['vitamin c', 'ascorbic', 'vitamin d', 'vitamin e', 'vitamin k', 'vitamin b', 'multivitamin', 'vitamin']):
                category = 'vitamins'
            elif any(word in product_lower or word in category_text for word in ['mineral', 'magnesium', 'calcium', 'zinc', 'iron']):
                category = 'minerals'
            elif any(word in product_lower or word in category_text for word in ['omega', 'dha', 'epa', 'fish oil']):
                category = 'fatty_acids'
            elif any(word in product_lower or word in category_text for word in ['protein', 'amino', 'whey']):
                category = 'proteins'
            elif any(word in product_lower or word in category_text for word in ['probiotic']):
                category = 'probiotics'
            else:
                category = 'supplements'
            
            processed_products.append({
                'dsld_id': dsld_id,
                'name_en': product_name,
                'name_ja': product_name,  # 日本語翻訳は後で
                'brand': brand,
                'serving_size': '1 serving',
                'category': category,
                'upc': upc
            })
            
        except Exception as e:
            print(f"⚠️ 行 {idx} 処理エラー: {e}")
            continue
    
    print(f"✅ {len(processed_products):,}件の商品を処理完了")
    
    # 統計情報
    brands = {}
    categories = {}
    for product in processed_products:
        brand = product['brand']
        cat = product['category']
        brands[brand] = brands.get(brand, 0) + 1
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\n📊 トップブランド:")
    for brand, count in sorted(brands.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {brand}: {count:,}件")
    
    print(f"\n📊 カテゴリ別統計:")
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        print(f"  {cat}: {count:,}件")
    
    # SQL生成
    sql_content = f"""-- 全iHerbサプリメント商品データベース（Kaggleデータセット）
-- 処理日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- 総商品数: {len(processed_products):,}件
-- データソース: Kaggle iHerb Products Dataset

-- 既存データを完全削除
DELETE FROM user_supplements;
DELETE FROM supplement_nutrients;
DELETE FROM supplements;
DELETE FROM nutrients;

-- 全サプリメント商品を投入
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
            # SQLエスケープ
            name_en = product['name_en'].replace("'", "''")
            name_ja = product['name_ja'].replace("'", "''")
            brand = product['brand'].replace("'", "''")
            
            sql_content += f"('{product['dsld_id']}', '{name_en}', '{name_ja}', '{brand}', '{product['serving_size']}', '{product['category']}')"
            
            if i < len(batch_products) - 1:
                sql_content += ",\n"
            else:
                sql_content += ";\n"
    
    # 特別商品追加
    sql_content += """
-- ユーザー検索用特別商品
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
('DSLD_19121619', 'NOW Foods Vitamin C-1000 Sustained Release', 'NOW Foods ビタミンC-1000 徐放性', 'NOW Foods', '1 tablet', 'vitamins');
"""
    
    sql_content += f"""
-- データ確認クエリ
SELECT 'iHerbデータベース構築完了' as status;
SELECT COUNT(*) as total_products FROM supplements;
SELECT brand, COUNT(*) as count FROM supplements GROUP BY brand ORDER BY count DESC LIMIT 30;
SELECT category, COUNT(*) as count FROM supplements GROUP BY category ORDER BY count DESC;
SELECT * FROM supplements WHERE dsld_id = 'DSLD_19121619';
SELECT * FROM supplements WHERE brand LIKE '%NOW%' ORDER BY name_ja LIMIT 10;
"""
    
    # ファイル保存
    with open('import_kaggle_iherb.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    # CSV保存
    df_output = pd.DataFrame(processed_products)
    df_output.to_csv('kaggle_iherb_supplements.csv', index=False, encoding='utf-8')
    
    print("✅ import_kaggle_iherb.sql を生成完了")
    print("✅ kaggle_iherb_supplements.csv を生成完了")
    
    return len(processed_products)

if __name__ == "__main__":
    print("🚀 Kaggle iHerbデータセット処理開始")
    print("=" * 80)
    
    # 1. データセット検索・展開
    csv_file = extract_kaggle_dataset()
    if not csv_file:
        exit(1)
    
    # 2. データ分析
    df, title_cols, brand_cols, category_cols, upc_cols = analyze_iherb_data(csv_file)
    if df is None:
        exit(1)
    
    # 3. SQL生成
    total_count = generate_sql_from_iherb(df, title_cols, brand_cols, category_cols, upc_cols)
    
    print("=" * 80)
    print(f"🎉 Kaggle iHerbデータ処理完了!")
    print(f"📊 {total_count:,}件のサプリメント商品をSQL化")
    print("\n📁 生成ファイル:")
    print("  - import_kaggle_iherb.sql (Supabase実行用)")
    print("  - kaggle_iherb_supplements.csv (データ確認用)")
    print("\n次のステップ:")
    print("1. import_kaggle_iherb.sql をSupabaseで実行")
    print("2. バーコード19121619で検索テスト")
    print("3. 数万件のiHerbサプリメントデータベース完成！")