# MY SUPPS デプロイメントガイド

## 🚀 Vercelへのデプロイ

### 1. Supabaseプロジェクトのセットアップ

1. [Supabase](https://supabase.com)にアクセスしてプロジェクトを作成
2. SQLエディタで以下のファイルを順番に実行：
   - `supabase/schema.sql` - テーブル作成
   - `supabase/auth-trigger.sql` - 認証トリガー
   - `supabase/seed.sql` - サンプルデータ

3. Settings > API から以下の情報を取得：
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon/public key` (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 2. Vercelプロジェクトのセットアップ

1. GitHubリポジトリを作成してコードをプッシュ
2. [Vercel](https://vercel.com)でアカウント作成
3. 「New Project」からGitHubリポジトリをインポート
4. Framework Preset: **Next.js** を選択

### 3. 環境変数の設定

Vercelの Project Settings > Environment Variables で以下を設定：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URL (デプロイ後のURL)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### 4. デプロイ実行

1. 「Deploy」ボタンをクリック
2. 初回ビルド完了まで待機（3-5分）
3. デプロイ完了後、URLにアクセスして動作確認

## 🔧 ローカル開発環境のセットアップ

### 1. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local`を編集：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. 開発サーバー起動

```bash
npm install
npm run dev
```

## 📱 PWA機能の確認

デプロイ後、以下を確認してください：

1. **Service Worker**: DevToolsのApplication → Service Workersで登録確認
2. **マニフェスト**: Application → Manifest で設定確認
3. **インストール**: ブラウザの「ホーム画面に追加」オプション確認

## 🔐 認証フロー

1. ユーザーが`/auth`でサインアップ/ログイン
2. Supabaseが認証処理
3. `/auth/callback`で認証完了
4. `/profile`にリダイレクト
5. ユーザーレコードが自動作成（トリガー使用）

## 🧪 テスト方法

### ローカルテスト

```bash
# ビルドテスト
npm run build

# Lint/Type check
npm run lint
npm run type-check
```

### 本番テスト

1. **認証機能**:
   - サインアップ/ログイン
   - プロファイル保存
   - ログアウト

2. **シミュレーション機能**:
   - iHerbのURL入力
   - 栄養素分析結果表示
   - チャートの表示

3. **MY SUPPS機能**:
   - サプリメント選択/解除
   - ライブラリの保存

## 🔄 データベース更新

### 新しいマイグレーション

```sql
-- supabase/migrations/新しいファイル.sql
-- 新しいテーブルやカラムの追加
```

### サンプルデータの更新

`supabase/seed.sql`を更新してから再実行。

## 🚨 トラブルシューティング

### よくある問題

1. **認証エラー**: 
   - Supabase URLとキーの確認
   - `/auth/callback`のリダイレクト設定

2. **ビルドエラー**:
   - TypeScriptエラーの修正
   - 環境変数の設定確認

3. **PWAインストールできない**:
   - HTTPS接続の確認
   - マニフェストファイルの検証

### ログの確認

- Vercel: Function Logs でサーバーエラー確認
- Supabase: Logs & Reports でデータベースエラー確認
- Browser: DevTools Console でクライアントエラー確認

## 📊 パフォーマンス最適化

### 画像最適化

```bash
# 商品画像の最適化
npm install sharp
```

### バンドルサイズ最適化

```bash
# Bundle analyzer
npm install @next/bundle-analyzer
```

## 🔐 セキュリティ設定

### Supabase RLS

Row Level Security がすべてのテーブルで有効になっていることを確認：

```sql
-- テーブルごとのRLS確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### CSP設定

next.config.tsでContent Security Policyを設定：

```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];
```