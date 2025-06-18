# Supabase認証設定（一度だけ実行）

## 🎯 目的
開発環境でメール確認を無効化し、即座にログイン可能にする

## 📋 設定手順

### 1. Supabaseダッシュボードにアクセス
URL: https://supabase.com/dashboard/project/xkcaxrvnvefstzvpldzf

### 2. Authentication → Settings
左サイドバーから **Settings** をクリック

### 3. Auth Settings で以下を設定
```
General Settings:
- Site URL: http://localhost:3000

User Signups:
☑️ Enable email confirmations: OFF
☑️ Enable phone confirmations: OFF

Security Settings:
☑️ Enable secure email change: OFF (開発用)
☑️ Enable manual linking: ON
```

### 4. Save Changes をクリック

## ✅ 設定完了後の動作

### 新規ユーザー登録
1. auth.htmlでアカウント作成
2. **即座にログイン状態になる**
3. **メール確認不要**
4. my-supps.htmlに自動遷移

### 既存ユーザーログイン
1. メール/パスワード入力
2. **「Email not confirmed」エラーなし**
3. 正常にログイン完了

## 🚨 重要
この設定は**一度だけ**行えば、今後の全ユーザーに適用されます。
SQLでの手動修正は不要です。

## 📞 本番環境では
本番デプロイ時にメール確認を再度有効化することを推奨します。