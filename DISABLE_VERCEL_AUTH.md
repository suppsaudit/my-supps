# Vercel認証保護を無効にする方法

## 現在の問題
- URL: https://my-supps-rcwsk5teo-suppsaudits-projects.vercel.app/
- 状態: "Authentication Required" ページが表示される

## 解決手順

### 方法1: Vercelダッシュボードから無効化
1. https://vercel.com/dashboard にアクセス
2. `my-supps` プロジェクトをクリック
3. 上部メニューの「Settings」をクリック
4. 左メニューの「Deployment Protection」をクリック
5. 「Vercel Authentication」を「Disabled」に変更
6. 「Save」をクリック

### 方法2: カスタムドメインを追加（推奨）
カスタムドメインを追加すると、自動的に認証保護が解除されます：
1. Settings → Domains
2. カスタムドメインを追加
3. 認証なしでアクセス可能に

### 方法3: 本番環境URLを使用
本番環境のエイリアスURLは認証保護されない場合があります：
- https://my-supps-suppsaudits-projects.vercel.app/

## 注意事項
- 無料プランでは、プレビューデプロイメントに認証保護が適用されます
- 本番環境（Production）デプロイメントは通常、認証保護されません
- Pro以上のプランでは、より細かい認証設定が可能です