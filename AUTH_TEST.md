# 🧪 認証テスト手順

## 現在の設定状況
✅ **Allow new users to sign up**: ON  
⚠️ **Allow manual linking**: OFF → ONに変更推奨  
✅ **URL Configuration**: 設定済み  

## 即座にテスト可能
現在の設定でメール認証は既に動作するはずです！

### テスト手順

#### 1. ブラウザで認証ページにアクセス
```
http://localhost:3000/my-supps-web/auth.html
```

#### 2. 新規登録テスト
- メールアドレス入力: `test@example.com`
- パスワード入力: `password123`
- 「アカウント作成」ボタンをクリック

#### 3. ブラウザコンソールで確認
```javascript
// Supabase接続確認
console.log('Supabase:', window.supabase);

// 認証状態確認
window.supabase.auth.getUser().then(({data: {user}}) => {
  console.log('Current user:', user);
});
```

#### 4. 期待される結果
- ✅ アカウント作成成功メッセージ
- ✅ My Suppsページにリダイレクト
- ✅ コンソールにユーザー情報表示

## トラブルシューティング

### エラーが出る場合
1. **URL Configuration**で以下を確認:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/my-supps-web/auth.html`

2. **ブラウザコンソール**でエラー詳細を確認

3. **SQL Editor**で `quick-auth-test.sql` を実行してデータベース状態確認

## Google OAuth（オプション）
メール認証が動作確認できたら、**Third Party Auth**タブでGoogle設定を追加できます。

---

**まずはメール認証をテストしてください！現在の設定で動作するはずです。**