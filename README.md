# MY SUPPS - サプリメント管理PWA

iHerbパワーユーザー向けの革新的なサプリメント管理アプリケーション。Spotifyライクなモダンなデザインで、サプリメントを楽しくコレクション管理。

## 🌟 主な機能

### 🔍 購入シミュレーション（MVPコア）
- iHerb/AmazonのURLを入力するだけで栄養素分析
- 複数サプリメントのスタックシミュレーション
- 栄養素カバレッジの可視化
- 過剰摂取の警告機能

### 📊 革新的な栄養素チャート
- サプリメントが外枠を形成する独自のビジュアライゼーション
- RDAゾーン表示（適正範囲・上限値）
- 体重ベースの個別最適化
- リアルタイムアニメーション

### 📦 MY SUPPS（サプリメント管理）
- ドラッグ&ドロップでコレクション管理
- 選択/非選択の視覚的フィードバック
- ピンクのオーバーレイ効果（選択時）
- グレースケール効果（非選択時）

### 👤 ユーザープロファイル
- 体重ベースRDA計算
- 健康目標の設定
- 4つのテーマモード（ライト/ダーク/ミディアムダーク/自動）

## 🛠 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, React 19
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **PWA**: next-pwa

## 🚀 セットアップ

### 必要な環境
- Node.js 18以上
- npm または yarn
- Supabaseアカウント

### クイックスタート

```bash
# 1. プロジェクトのクローン
git clone https://github.com/yourusername/my-supps.git
cd my-supps

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp .env.local.example .env.local
# .env.localを編集（後述のSupabaseセットアップ後）

# 4. 開発サーバーの起動
npm run dev
```

### 📖 詳細なセットアップ手順
詳細な手順は [`DEPLOYMENT.md`](DEPLOYMENT.md) をご確認ください。

### Supabaseセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `supabase/schema.sql`を実行してテーブルを作成
3. `supabase/seed.sql`を実行してサンプルデータを追加
4. プロジェクトのURLとAnonキーを`.env.local`に設定

## 📱 PWA機能

- オフライン対応
- ホーム画面への追加
- プッシュ通知（開発中）
- バックグラウンド同期

## 🎨 デザインシステム

Spotifyライクなモダンデザイン：
- **Primary Color**: #1DB954 (Spotify Green)
- **Accent Color**: #FF1493 (Pink)
- **Background**: グラデーション効果
- **Typography**: Noto Sans JP

## 📄 ライセンス

MIT

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを作成して変更内容を議論してください。

## 📋 プロジェクト状況

### ✅ 実装完了
- 🔐 **認証システム**: Supabase Auth完全統合
- 📊 **栄養素チャート**: 革新的なレーダーチャートUI
- 🛒 **購入シミュレーション**: URL入力→即座に栄養素分析
- 📦 **MY SUPPS**: 視覚的サプリメント管理
- 👤 **ユーザープロファイル**: 体重ベースRDA計算
- 📱 **PWA対応**: オフライン機能・ホーム画面追加
- 🎨 **4テーマモード**: ライト/ダーク/ミディアムダーク/自動

### 🧪 テスト状況
- ✅ TypeScript型チェック完了
- ✅ ESLint検証完了
- ✅ ビルドテスト完了
- ⏳ 手動テスト項目：[`TESTING.md`](TESTING.md)参照

### 📝 ドキュメント
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - デプロイメント手順
- [`TESTING.md`](TESTING.md) - テスト結果と手順
- [`CLAUDE.md`](CLAUDE.md) - 技術仕様書

## 👥 開発者

- Created with Claude Code 🤖
- Architecture: Next.js 14 + Supabase + TypeScript
- Design: Spotify-inspired Modern UI

---

**注意**: このアプリケーションは医療アドバイスを提供するものではありません。サプリメントの摂取については医師や薬剤師にご相談ください。
