# MY SUPPS セットアップガイド

## 1. Supabase プロジェクトの設定

### 1.1 Supabase アカウント作成
1. [Supabase](https://supabase.com) にアクセス
2. GitHubアカウントでサインアップ
3. 新しいプロジェクトを作成

### 1.2 認証設定
1. Supabase Dashboard → Authentication → Providers
2. Email/Password を有効化
3. Google を有効化
   - Client ID と Client Secret が必要（次のセクション参照）

### 1.3 プロジェクト情報の取得
1. Settings → API に移動
2. 以下の情報をコピー：
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

## 2. Google OAuth の設定

### 2.1 Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. APIs & Services → Credentials に移動

### 2.2 OAuth 2.0 クライアントの作成
1. "Create Credentials" → "OAuth client ID"
2. Application type: "Web application"
3. Name: "MY SUPPS"
4. Authorized redirect URIs に追加:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
   （xxxxxxxxxxxxx は実際のSupabaseプロジェクトIDに置き換え）

### 2.3 OAuth同意画面の設定
1. OAuth consent screen に移動
2. User Type: External を選択
3. 必要な情報を入力:
   - App name: MY SUPPS
   - User support email
   - Developer contact information
4. Scopes: email, profile を追加

## 3. コードの設定

### 3.1 Supabase接続情報の更新
`js/supabase-client.js` を編集:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co'; // 実際のProject URLに置き換え
const SUPABASE_ANON_KEY = 'your-actual-anon-key'; // 実際のanon keyに置き換え
```

### 3.2 Google OAuth設定の追加
1. Supabase Dashboard → Authentication → Providers → Google
2. Enable Google
3. Google Cloud ConsoleからコピーしたClient IDとClient Secretを入力
4. Save

## 4. データベースのセットアップ

Supabase SQL Editor で以下のSQLを実行:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Supplements table
CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ja TEXT NOT NULL,
  name_en TEXT,
  brand TEXT NOT NULL,
  barcode TEXT,
  iherb_id TEXT UNIQUE,
  serving_size INTEGER DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nutrients master table
CREATE TABLE nutrients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ja TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  rda_amount DECIMAL,
  unit TEXT DEFAULT 'mg',
  description_ja TEXT
);

-- Supplement-Nutrient relationships
CREATE TABLE supplement_nutrients (
  supplement_id UUID REFERENCES supplements(id),
  nutrient_id UUID REFERENCES nutrients(id),
  amount_per_serving DECIMAL NOT NULL,
  amount_per_unit DECIMAL NOT NULL,
  PRIMARY KEY (supplement_id, nutrient_id)
);

-- User supplement selections
CREATE TABLE user_supplements (
  user_id UUID REFERENCES auth.users(id),
  supplement_id UUID REFERENCES supplements(id),
  is_selected BOOLEAN DEFAULT false,
  is_my_supps BOOLEAN DEFAULT false,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, supplement_id)
);

-- Intake logs
CREATE TABLE intake_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  supplement_id UUID REFERENCES supplements(id),
  taken_at TIMESTAMP NOT NULL,
  quantity INTEGER DEFAULT 1
);

-- Row Level Security
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_supplements
CREATE POLICY "Users can view own supplements" ON user_supplements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplements" ON user_supplements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplements" ON user_supplements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplements" ON user_supplements
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for intake_logs
CREATE POLICY "Users can view own logs" ON intake_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON intake_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 5. テストデータの投入（オプション）

```sql
-- Sample nutrients
INSERT INTO nutrients (name_ja, name_en, category, unit) VALUES
  ('ビタミンC', 'Vitamin C', 'vitamin', 'mg'),
  ('ビタミンD', 'Vitamin D', 'vitamin', 'IU'),
  ('マグネシウム', 'Magnesium', 'mineral', 'mg'),
  ('亜鉛', 'Zinc', 'mineral', 'mg'),
  ('オメガ3', 'Omega-3', 'fatty_acid', 'mg');

-- Sample supplements
INSERT INTO supplements (name_ja, brand, iherb_id) VALUES
  ('ビタミンC 1000mg', 'California Gold Nutrition', 'CGN-01014'),
  ('ビタミンD3 5000IU', 'NOW Foods', 'NOW-00372'),
  ('マグネシウム グリシネート', 'Doctor\'s Best', 'DRB-00200');
```

## 6. 動作確認

1. ローカルでHTTPサーバーを起動:
   ```bash
   python -m http.server 8000
   ```
   または
   ```bash
   npx http-server
   ```

2. ブラウザで `http://localhost:8000` を開く

3. 認証機能をテスト:
   - メールアドレスで新規登録
   - Googleでログイン
   - My Suppsページへのアクセス

## トラブルシューティング

### Google認証が動作しない
- Authorized redirect URIが正しく設定されているか確認
- Google Cloud ConsoleでOAuth同意画面がテストモードの場合、テストユーザーを追加

### Supabaseに接続できない
- SUPABASE_URLとSUPABASE_ANON_KEYが正しく設定されているか確認
- Supabaseプロジェクトが一時停止していないか確認

### CORS エラーが発生する
- ローカル開発時は必ずHTTPサーバー経由でアクセス（file://では動作しません）