# Vercel Web Dashboard での公開手順

## ステップ1: Vercelアカウント作成
1. [vercel.com](https://vercel.com) にアクセス
2. 「Start Deploying」をクリック
3. GitHubアカウントで登録（推奨）

## ステップ2: ファイルをGitHubにアップロード
```bash
# プロジェクトディレクトリで実行
cd /Users/air/Desktop/my-supps/my-supps-web

# Gitリポジトリ初期化
git init

# 全ファイル追加
git add .

# コミット
git commit -m "Initial MY SUPPS deployment"

# GitHubリポジトリ作成後（下記手順）、プッシュ
git remote add origin https://github.com/YOUR_USERNAME/my-supps.git
git branch -M main
git push -u origin main
```

### GitHub リポジトリ作成手順
1. [github.com](https://github.com) にアクセス
2. 右上の「+」→「New repository」
3. Repository name: `my-supps`
4. Public に設定
5. 「Create repository」

## ステップ3: Vercel にインポート
1. Vercel Dashboard で「Add New...」→「Project」
2. 「Import Git Repository」
3. GitHubから `my-supps` リポジトリを選択
4. 「Import」をクリック

### 設定画面で：
- **Framework Preset**: Other
- **Root Directory**: ./
- **Build Command**: 空欄（静的サイト）
- **Output Directory**: ./
- **Install Command**: 空欄

5. 「Deploy」をクリック

## ステップ4: 環境変数設定
デプロイ後、Project Settings → Environment Variables で追加：

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
```

## ステップ5: 確認
- デプロイ完了後、`https://my-supps-xxx.vercel.app` のようなURLが発行される
- このURLでサイトにアクセス可能

---

# 代替方法: ドラッグ&ドロップデプロイ

GitHubを使わない場合：

1. [vercel.com](https://vercel.com) でアカウント作成
2. ダッシュボードで「Add New...」→「Project」
3. 「Browse All Templates」の下の「Deploy a project」
4. フォルダを直接ドラッグ&ドロップ
   - `/Users/air/Desktop/my-supps/my-supps-web` フォルダ全体をドラッグ
5. 自動でデプロイ開始

---

# トラブルシューティング

## ビルドエラーが出る場合
```json
// package.json を作成（なければ）
{
  "name": "my-supps",
  "version": "1.0.0",
  "scripts": {
    "build": "echo 'Static site, no build needed'"
  }
}
```

## CORS エラーが出る場合
Supabase Dashboard → Settings → API → CORS Allowed Origins に追加：
```
https://your-vercel-url.vercel.app
```

## 404 エラーページ
```html
<!-- 404.html を作成 -->
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="3; url=/" />
    <title>ページが見つかりません - MY SUPPS</title>
</head>
<body>
    <h1>ページが見つかりません</h1>
    <p>3秒後にホームページにリダイレクトします...</p>
    <a href="/">ホームに戻る</a>
</body>
</html>
```

---

デプロイが完了したら、発行されたURLをお知らせください！