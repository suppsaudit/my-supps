# 🚀 ローカルサーバー起動方法

## 問題
`file:///` でHTMLファイルを直接開くと、Supabase認証が動作しません。

## 解決方法

### 方法1: Python（Mac標準搭載）
ターミナルで以下を実行：
```bash
cd /Users/air/Desktop/my-supps/my-supps-web
python3 -m http.server 3000
```

アクセス: http://localhost:3000

### 方法2: Node.js（インストール済みの場合）
```bash
cd /Users/air/Desktop/my-supps/my-supps-web
npx http-server -p 3000
```

### 方法3: VS Code拡張機能
VS Codeを使用している場合：
1. 「Live Server」拡張機能をインストール
2. index.htmlを右クリック → 「Open with Live Server」

## 🎯 アクセス方法

サーバー起動後：
1. http://localhost:3000/index.html
2. http://localhost:3000/auth.html でログイン
3. http://localhost:3000/products.html で商品一覧

## ⚠️ 重要
- `file:///` ではなく `http://localhost:3000` でアクセス
- これで認証が正常に動作します！