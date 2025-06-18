# MY SUPPS デプロイメントガイド

## 必要なもの

### 1. ドメイン
- 取得先: お名前.com、Google Domains、Namecheap
- 費用: 年間1,000〜3,000円
- 例: `my-supps.com`, `mysupps.jp`

### 2. ホスティングサービス（無料）
**Supabaseはデータベースのみ**なので、静的サイトホスティングが必要です。

## 推奨構成（完全無料）

### Option 1: Vercel（推奨）

```bash
# 1. Vercel CLIインストール
npm i -g vercel

# 2. プロジェクトディレクトリに移動
cd /Users/air/Desktop/my-supps/my-supps-web

# 3. デプロイ
vercel

# 4. 質問に答える
# - Set up and deploy? → Y
# - Which scope? → 個人アカウント選択
# - Link to existing project? → N
# - Project name? → my-supps
# - Directory? → ./
# - Override settings? → N

# 5. カスタムドメイン設定（ドメイン購入後）
vercel domains add your-domain.com
```

### Option 2: GitHub Pages

1. GitHubリポジトリ作成
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/my-supps.git
git push -u origin main
```

2. GitHub Pages有効化
- Settings → Pages
- Source: Deploy from a branch
- Branch: main / root
- Save

3. カスタムドメイン設定
- CNAMEファイル作成
```bash
echo "your-domain.com" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

### Option 3: Netlify

1. [Netlify](https://netlify.com)にアクセス
2. GitHubと連携
3. New site from Git
4. デプロイ設定
   - Build command: なし（静的サイト）
   - Publish directory: ./

## 環境変数の設定

### 1. Supabase設定
```javascript
// js/config.js を本番用に更新
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 2. セキュリティ設定
- Supabaseダッシュボード → Authentication → URL Configuration
- Site URL: `https://your-domain.com`
- Redirect URLs: 
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/*`

## DNS設定（ドメイン購入後）

### Vercelの場合
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### GitHub Pagesの場合
```
Type: A
Name: @
Value: 185.199.108.153
      185.199.109.153
      185.199.110.153
      185.199.111.153

Type: CNAME
Name: www
Value: YOUR_USERNAME.github.io
```

## デプロイ前チェックリスト

- [ ] Supabase URLとキーを本番用に更新
- [ ] Google OAuth設定を本番URLに更新
- [ ] CORS設定確認（NIH DSLD APIアクセス）
- [ ] 画像やアセットのパス確認
- [ ] エラーページ（404.html）作成
- [ ] robots.txtとsitemap.xml作成

## 月間コスト見積もり

| サービス | プラン | 費用 |
|---------|--------|------|
| ドメイン | .com | ¥1,500/年 (¥125/月) |
| Vercel | Free | ¥0 |
| Supabase | Free | ¥0 |
| NIH DSLD API | Public | ¥0 |
| **合計** | | **¥125/月** |

## スケーリング時の考慮事項

### Supabase無料プランの制限
- Database: 500MB
- Storage: 1GB
- API requests: 無制限（レート制限あり）
- Monthly Active Users: 50,000

### 有料プランへの移行タイミング
- MAU > 10,000
- データベース > 400MB
- 高可用性が必要な場合

## トラブルシューティング

### CORS エラー
```javascript
// Supabaseダッシュボードで設定
API Settings → CORS Allowed Origins
→ https://your-domain.com を追加
```

### 404エラー
```html
<!-- 404.html を作成 -->
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/" />
</head>
</html>
```

### パフォーマンス最適化
```html
<!-- index.htmlに追加 -->
<link rel="preconnect" href="https://YOUR_PROJECT.supabase.co">
<link rel="dns-prefetch" href="https://api.ods.od.nih.gov">
```

## セキュリティ推奨事項

1. **環境変数の分離**
```javascript
// config.prod.js と config.dev.js を作成
const config = window.location.hostname === 'localhost' 
  ? await import('./config.dev.js')
  : await import('./config.prod.js');
```

2. **Rate Limiting**
- Vercel: 自動で設定
- CloudflareのWAF追加（オプション）

3. **HTTPS強制**
- すべてのホスティングサービスで自動

## 継続的デプロイ設定

### GitHub Actions（自動デプロイ）
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

準備ができたらデプロイを開始してください！
サポートが必要な場合はお知らせください。