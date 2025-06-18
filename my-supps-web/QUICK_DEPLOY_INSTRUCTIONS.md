# 🚀 MY SUPPS 即座デプロイ手順

## ステップ1: GitHubリポジトリ作成
1. [github.com](https://github.com) にアクセス
2. 右上の「+」→「New repository」
3. Repository name: `my-supps-web`
4. **Public** に設定（重要）
5. 「Create repository」

## ステップ2: コードをプッシュ
リポジトリ作成後に表示されるコマンドを実行：

```bash
git remote add origin https://github.com/YOUR_USERNAME/my-supps-web.git
git push -u origin main
```

## ステップ3: Vercel デプロイ
1. Vercel画面で「Cancel」をクリック
2. 「Add New...」→「Project」
3. 「Import Git Repository」
4. 作成した `my-supps-web` リポジトリを選択
5. 「Import」

### 設定（重要）:
- **Framework Preset**: Other
- **Root Directory**: ./
- **Build Command**: 空欄のまま
- **Output Directory**: ./
- **Install Command**: 空欄のまま

6. 「Deploy」をクリック

## ステップ4: 完了！
- 約2-3分でデプロイ完了
- `https://my-supps-web-xyz.vercel.app` のようなURLが発行される
- 世界中からアクセス可能

---

## トラブルシューティング

### ビルドエラーが出る場合
Environment Variables に追加：
```
NODE_ENV = production
```

### 404エラーが出る場合
プロジェクト設定で：
- **Output Directory**: `./` (ドットスラッシュ)
- **Publish directory**: 空欄

---

手順でわからないことがあれば、スクリーンショットを送ってください！