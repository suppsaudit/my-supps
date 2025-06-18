# 🔍 認証問題デバッグチェックリスト

## 1. ブラウザコンソール確認

auth.htmlで新規登録時に表示されるメッセージを確認：

### 期待されるログ:
```
🔄 Auth page loading...
✅ Supabase auth client initialized  
🔗 Connected to: https://xkcaxrvnvefstzvpldzf.supabase.co
✅ Auth page initialized
🔄 Creating account...
✅ Account created: [ユーザー情報]
```

### エラーの場合:
```
❌ Failed to initialize Supabase client: [エラー詳細]
❌ Signup error: [エラー詳細]
```

## 2. Supabaseダッシュボード再確認

### URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/my-supps-web/auth.html`

### Email Settings:
- Enable Email provider: ✅ ON
- Confirm email: ❌ OFF
- Secure email change: ✅ ON

## 3. 手動テストコード

ブラウザコンソールで実行：
```javascript
// 設定確認
console.log('Config:', window.APP_CONFIG.SUPABASE);

// 接続確認
console.log('Supabase:', window.supabase);

// DB接続テスト
window.supabase.from('supplements').select('count').then(({data, error}) => {
  console.log('DB connection:', error ? 'Failed: ' + error.message : 'Success');
});

// 認証テスト
window.supabase.auth.signUp({
  email: 'debugtest@example.com',
  password: 'debugpass123'
}).then(({data, error}) => {
  console.log('Auth test:', error ? 'Failed: ' + error.message : 'Success');
});
```

## 4. 報告内容

以下を確認してお知らせください：
- [ ] コンソールに表示されるエラーメッセージ
- [ ] Supabase URL Configuration設定
- [ ] Email確認設定の状態
- [ ] 手動テストコードの結果

## 5. 次のステップ

問題が特定できたら、具体的な修正を行います。