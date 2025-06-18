# Vercel 新規プロジェクト作成手順

## 現在のアカウントで新しくデプロイする方法

### 1. Vercelにログイン
https://vercel.com にアクセスして、使用したいアカウントでログイン

### 2. 新規プロジェクト作成
1. ダッシュボードで「Add New...」→「Project」
2. 「Import Git Repository」をクリック
3. GitHubアカウントを連携（まだの場合）

### 3. リポジトリをインポート
1. `suppsaudit/my-supps` を検索
2. 「Import」をクリック

### 4. 設定（重要）
- **Project Name**: `my-supps-web`（好きな名前でOK）
- **Framework Preset**: `Other`
- **Root Directory**: `./`
- **Build Command**: （空欄）
- **Output Directory**: `./`
- **Install Command**: （空欄）

### 5. デプロイ
「Deploy」をクリック

### 6. 完了
- 新しいURLが発行されます
- 例: `https://my-supps-web.vercel.app`

## カスタムドメインの設定（オプション）

1. プロジェクトの「Settings」→「Domains」
2. 「Add」をクリック
3. 取得済みのドメインを入力
4. DNSの設定手順に従う

## トラブルシューティング

### ビルドエラーが出る場合
- Environment Variablesは不要（静的サイトのため）
- Framework Presetが「Other」になっているか確認

### 404エラーが出る場合
- Output Directoryが `./` になっているか確認
- index.htmlがルートディレクトリにあるか確認