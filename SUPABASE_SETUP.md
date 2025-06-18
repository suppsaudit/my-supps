# Supabase設定完了ガイド

## 🎯 現在の状況
- ✅ プロジェクト作成済み: `xkcaxrvnvefstzvpldzf`
- ✅ データベーススキーマ実行済み
- ✅ サンプルデータ投入済み
- ⚠️ 認証設定が必要

## 📋 実行する設定手順

### 1. Supabaseダッシュボードにアクセス
URL: https://supabase.com/dashboard/project/xkcaxrvnvefstzvpldzf

### 2. 基本認証設定

#### A. Authentication → Settings → General
```
Site URL: http://localhost:3000
```

#### B. Authentication → Settings → Auth
```
☑️ Enable email confirmations: OFF (開発用)
☑️ Enable phone confirmations: OFF
☑️ Enable manual linking: ON
```

#### C. Authentication → URL Configuration
```
Redirect URLs:
- http://localhost:3000/my-supps-web/auth.html
- http://localhost:3000/auth.html
```

### 3. プロバイダー設定

#### A. Authentication → Providers → Email
```
☑️ Enable email provider: ON
☑️ Confirm email: OFF (開発用)
☑️ Secure email change: OFF (開発用)
```

#### B. Authentication → Providers → Google
```
☑️ Enable Google provider: ON
☑️ Use default configuration: ON (開発用)

Client ID: (自動設定)
Client Secret: (自動設定)
Redirect URL: https://xkcaxrvnvefstzvpldzf.supabase.co/auth/v1/callback
```

### 4. 認証設定の確認

SQL Editorで `auth-setup.sql` を実行:
```sql
-- 認証テーブルとRLSの確認
-- テスト用データの作成
-- 設定状況の確認
```

### 5. テーブル権限の確認

#### Table Editor → user_supplements
- RLS: ✅ Enabled
- Policies: ✅ User-specific access only

#### Table Editor → supplements (public read)
- RLS: ❌ Disabled (public access)
- Select: ✅ anon, authenticated

### 6. 動作テスト

1. **メール認証テスト**:
   - auth.htmlでアカウント作成
   - ログイン/ログアウト確認

2. **Google OAuth テスト**:
   - Googleボタンクリック
   - 認証フロー確認

3. **データアクセステスト**:
   - My Suppsページでデータ表示確認
   - ユーザー固有データの分離確認

## 🔧 設定完了の確認方法

### ブラウザコンソールでチェック:
```javascript
// 1. 設定確認
console.log('Config:', window.APP_CONFIG.SUPABASE);

// 2. 認証状態確認
supabase.auth.getUser().then(({data: {user}}) => {
  console.log('Current user:', user);
});

// 3. データベース接続確認
supabase.from('supplements').select('count').then(({data, error}) => {
  console.log('DB connection:', error ? 'Failed' : 'Success');
});
```

### 期待される結果:
```
✅ Config validation: isValid = true
✅ Current user: null (ログイン前) or user object (ログイン後)
✅ DB connection: Success
🚀 Production Mode - Supabase Connected
```

## 🚨 トラブルシューティング

### 認証エラーの場合:
1. Site URLが正しく設定されているか確認
2. Redirect URLsにauth.htmlが含まれているか確認
3. ブラウザのコンソールでエラー詳細を確認

### データベース接続エラーの場合:
1. プロジェクトURLとAPIキーが正しいか確認
2. テーブルが作成されているか Table Editor で確認
3. RLS設定が適切か確認

## 📞 完了報告

すべての設定が完了したら、以下をお知らせください:
- [ ] Authentication設定完了
- [ ] プロバイダー設定完了  
- [ ] auth-setup.sql実行完了
- [ ] 動作テスト完了

設定完了後、アプリケーションは完全に動作するはずです！