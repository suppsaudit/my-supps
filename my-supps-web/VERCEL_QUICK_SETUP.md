# Vercel クイックセットアップ（5分で完了）

## 手順

### 1. Vercelにログイン
- https://vercel.com
- お持ちのアカウントでログイン

### 2. 新規プロジェクト作成
1. ダッシュボードで「Add New...」→「Project」
2. 「Import Third-Party Git Repository」の下にある入力欄に以下を貼り付け：
   ```
   https://github.com/suppsaudit/my-supps
   ```
3. 「Continue with GitHub」をクリック

### 3. 設定（重要！）
プロジェクト設定画面で：
- **Project Name**: my-supps-web（好きな名前でOK）
- **Framework Preset**: `Other`（重要！）
- **Root Directory**: `./`
- **Build & Output Settings**を開く：
  - **Build Command**: （空欄のまま）
  - **Output Directory**: `./`
  - **Install Command**: （空欄のまま）

### 4. デプロイ
「Deploy」をクリック

### 5. 完了！
- 2-3分でデプロイ完了
- URLが発行されます（例：https://my-supps-web-xxx.vercel.app）

## トラブルシューティング

### もしビルドエラーが出たら
1. プロジェクトの「Settings」→「General」
2. 「Build & Development Settings」で：
   - Framework Preset: `Other`
   - Build Command: 空欄
   - Output Directory: `./`

### 404エラーが出たら
- index.htmlがルートディレクトリにあることを確認
- Output Directoryが `./` になっているか確認