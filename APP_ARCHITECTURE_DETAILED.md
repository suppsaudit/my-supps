# MY SUPPS - 詳細アプリケーション分割設計書

## 🎯 アプリケーション分割戦略

### アプリA: 購入シミュレーション Web アプリ
**技術スタック**: Next.js 15 + React 18 + TypeScript + Supabase
**URL**: https://simulate.my-supps.app
**主要機能**: iHerb連携、価格計算、栄養分析

#### 具体的機能詳細
1. **iHerb URL解析エンジン**
   - URL入力 → 商品情報自動取得
   - 商品名、価格、栄養成分を抽出
   - 画像、レビュー情報も取得

2. **購入シミュレーション機能**
   - 複数商品の組み合わせ最適化
   - 送料計算（40ドル以上無料など）
   - 割引コード適用シミュレーション
   - 為替レート連動価格計算

3. **栄養分析機能**
   - 栄養成分重複チェック
   - 過剰摂取警告システム
   - 不足栄養素の提案機能
   - RDA（推奨摂取量）比較

4. **革新的栄養チャート**
   - サプリメントがチャート外枠形成
   - リアルタイム栄養バランス表示
   - インタラクティブな視覚化
   - データエクスポート機能

#### データベーステーブル設計
```sql
-- 商品情報テーブル
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iherb_product_id VARCHAR(50) UNIQUE NOT NULL,
    name_en VARCHAR(500) NOT NULL,
    name_ja VARCHAR(500),
    brand VARCHAR(200),
    price_usd DECIMAL(10,2),
    image_url TEXT,
    product_url TEXT,
    serving_size VARCHAR(100),
    servings_per_container INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 栄養成分テーブル
CREATE TABLE nutrients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    nutrient_name VARCHAR(200) NOT NULL,
    amount_per_serving DECIMAL(10,3),
    unit VARCHAR(20),
    daily_value_percent DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- シミュレーション履歴
CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    simulation_name VARCHAR(200),
    total_price_usd DECIMAL(10,2),
    total_price_jpy DECIMAL(10,2),
    exchange_rate DECIMAL(8,4),
    shipping_cost DECIMAL(8,2),
    discount_applied DECIMAL(8,2),
    simulation_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- シミュレーション商品
CREATE TABLE simulation_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID REFERENCES simulations(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### API設計
```typescript
// iHerb商品情報取得API
POST /api/iherb/extract
{
  "url": "https://jp.iherb.com/pr/now-foods-omega-3-180-softgels/54"
}
Response: {
  "success": true,
  "product": {
    "iherb_id": "NOW-54",
    "name": "Now Foods, Omega-3, 180 Softgels",
    "price": 24.99,
    "nutrients": [...]
  }
}

// シミュレーション実行API
POST /api/simulation/calculate
{
  "products": [
    {"iherb_id": "NOW-54", "quantity": 1},
    {"iherb_id": "LIFE-789", "quantity": 2}
  ],
  "discount_code": "NEW20"
}
Response: {
  "total_price": 89.97,
  "shipping": 0,
  "nutrition_analysis": {...},
  "warnings": [...]
}
```

### アプリB: MY SUPPS 管理ネイティブアプリ
**技術スタック**: Flutter 3.x + Dart + Supabase SDK
**プラットフォーム**: iOS/Android
**主要機能**: 個人サプリ管理、摂取記録、通知

#### 具体的機能詳細
1. **MY SUPPS登録・管理**
   - QRコード/バーコードスキャン
   - 手動商品追加
   - 摂取量・頻度設定
   - 在庫管理機能

2. **摂取記録システム**
   - ワンタップ摂取記録
   - 摂取時間の自動記録
   - 写真付きメモ機能
   - 体調・気分記録

3. **通知・リマインダー**
   - 摂取時間通知
   - 在庫切れアラート
   - 購入推奨タイミング
   - 定期健康チェック促進

4. **データ分析・レポート**
   - 摂取履歴のグラフ化
   - 栄養素トレンド分析
   - 健康指標との相関
   - 月次/年次レポート生成

#### データベーステーブル設計
```sql
-- ユーザーサプリ登録
CREATE TABLE user_supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES products(id),
    custom_name VARCHAR(200),
    dosage_per_serving INTEGER,
    frequency_per_day INTEGER,
    total_quantity INTEGER,
    remaining_quantity INTEGER,
    purchase_date DATE,
    expiration_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 摂取記録
CREATE TABLE intake_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_supplement_id UUID REFERENCES user_supplements(id),
    user_id UUID REFERENCES auth.users(id),
    taken_at TIMESTAMP NOT NULL,
    quantity_taken INTEGER NOT NULL,
    notes TEXT,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 5),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 通知設定
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_supplement_id UUID REFERENCES user_supplements(id),
    notification_type VARCHAR(50) NOT NULL, -- 'intake', 'restock', 'expiry'
    time_of_day TIME,
    days_of_week INTEGER[], -- [1,2,3,4,5] for Mon-Fri
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 健康指標記録
CREATE TABLE health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    metric_type VARCHAR(50) NOT NULL, -- 'weight', 'blood_pressure', 'sleep_hours'
    value DECIMAL(8,2) NOT NULL,
    unit VARCHAR(20),
    recorded_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Flutter実装構造
```dart
// 主要画面構成
lib/
├── main.dart
├── app/
│   ├── app.dart
│   └── routes.dart
├── features/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── signup_screen.dart
│   ├── supplements/
│   │   ├── add_supplement_screen.dart
│   │   ├── supplement_list_screen.dart
│   │   └── supplement_detail_screen.dart
│   ├── intake/
│   │   ├── intake_log_screen.dart
│   │   ├── quick_intake_widget.dart
│   │   └── intake_history_screen.dart
│   ├── analytics/
│   │   ├── dashboard_screen.dart
│   │   ├── nutrition_chart_screen.dart
│   │   └── reports_screen.dart
│   └── settings/
│       ├── notifications_screen.dart
│       └── profile_screen.dart
├── shared/
│   ├── widgets/
│   ├── services/
│   │   ├── supabase_service.dart
│   │   ├── notification_service.dart
│   │   └── barcode_scanner_service.dart
│   └── models/
│       ├── supplement.dart
│       ├── intake_log.dart
│       └── nutrition_data.dart
└── core/
    ├── constants/
    ├── theme/
    └── utils/
```

### 共有データベース・認証システム
**技術**: Supabase (PostgreSQL + Auth + Realtime)

#### 認証フロー
1. **ユーザー登録/ログイン**
   - メール/パスワード認証
   - Google/Apple Sign-In
   - JWT トークン管理

2. **データ同期**
   - Webアプリでのシミュレーション → ネイティブアプリで摂取管理
   - リアルタイム同期
   - オフライン対応

#### Row Level Security (RLS) 設定
```sql
-- ユーザーサプリの行レベルセキュリティ
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supplements" ON user_supplements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplements" ON user_supplements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplements" ON user_supplements
    FOR UPDATE USING (auth.uid() = user_id);

-- 摂取記録の行レベルセキュリティ
ALTER TABLE intake_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own intake logs" ON intake_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intake logs" ON intake_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 🚀 開発・デプロイ戦略

### Phase 1: 基盤構築 (2週間)
1. **Supabaseプロジェクト作成**
   - データベーススキーマ実装
   - 認証設定
   - RLS設定

2. **WebアプリMVP**
   - Next.js基本構造
   - 認証フロー
   - 基本的なiHerb URL解析

### Phase 2: Webアプリ完成 (3週間)
1. **購入シミュレーション機能**
   - 複数商品組み合わせ
   - 価格計算エンジン
   - 栄養分析

2. **革新的栄養チャート**
   - Chart.js/D3.js実装
   - インタラクティブ機能

### Phase 3: ネイティブアプリ開発 (4週間)
1. **Flutter基本構造**
   - 認証画面
   - サプリ登録機能
   - Supabase連携

2. **摂取記録・通知機能**
   - ローカル通知
   - データ同期
   - 分析画面

### Phase 4: 統合・テスト (1週間)
1. **データ連携テスト**
2. **UI/UX最適化**
3. **パフォーマンス最適化**

## 💰 コスト見積もり

### 開発コスト
- **Supabase**: $0-25/月 (無料枠から開始)
- **Vercel**: $0-20/月 (Hobby Plan)
- **ドメイン**: $10-15/年
- **アプリストア**: $99/年 (Apple) + $25 (Google Play)

### 技術的リスク対策
1. **ビルドエラー対策**
   - Docker環境での統一
   - CI/CDパイプライン構築
   - 段階的デプロイ

2. **データ整合性**
   - トランザクション処理
   - バックアップ戦略
   - エラーハンドリング

この設計書に基づいて実装を開始しますか？具体的なコード実装から始めることができます。