# API管理アプリ（API-kanri）

APIの管理、テスト、監視を効率的に行えるWebアプリケーション

## 📋 概要

API-kanriは、開発者がAPIエンドポイントの管理、テスト実行、履歴管理を一元的に行えるWebアプリケーションです。直感的なUIと豊富な機能により、API開発とテストの効率化を支援します。

## ✨ 主な機能

### コア機能
- **APIエンドポイント管理** - REST APIの登録、編集、削除
- **APIテスト機能** - リアルタイムでのAPIテスト実行
- **履歴管理** - テスト結果の記録と分析
- **認証管理** - 複数の認証方式に対応
- **環境管理** - 開発・ステージング・本番環境の切り替え

### 補助機能
- **チーム機能** - プロジェクトの共有と権限管理
- **ドキュメント生成** - OpenAPI形式での仕様書自動生成
- **監視・アラート** - APIの死活監視とSlack/Discord通知
- **レスポンシブデザイン** - デスクトップ・モバイル対応

## 🛠 技術スタック

### フロントエンド
- **React 18** + TypeScript
- **Material-UI (MUI)** - UIコンポーネント
- **Zustand** - 状態管理
- **React Router v6** - ルーティング
- **Axios** - HTTP クライアント
- **Vite** - ビルドツール

### バックエンド
- **Node.js 18** + TypeScript
- **Express.js** - Webフレームワーク
- **Prisma** - ORM
- **JWT** - 認証
- **Redis** - キャッシュ・セッション管理

### データベース
- **PostgreSQL 14** - メインデータベース
- **Redis 7** - キャッシュストア

### インフラ
- **Docker** - コンテナ化
- **GitHub Actions** - CI/CD
- **AWS/Vercel** - デプロイ

## 🚀 クイックスタート

### 前提条件
- Node.js 18.0.0 以上
- PostgreSQL 14.0 以上
- Redis 7.0 以上
- Git

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-org/API-kanri.git
cd API-kanri

# 依存関係のインストール
npm run install:all

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してください

# データベースのセットアップ
npm run db:setup

# 開発サーバーの起動
npm run dev
```

アプリケーションは以下のURLでアクセスできます：
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3001

### Dockerを使用した起動

```bash
# Docker コンテナの起動
docker-compose up -d

# データベースの初期化
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

## 📖 ドキュメント

詳細なドキュメントは `docs/` ディレクトリにあります：

- [要件定義書](docs/requirements.md) - プロジェクトの要件と仕様
- [システム設計書](docs/system-design.md) - アーキテクチャとデータベース設計
- [プロジェクト構造](docs/project-structure.md) - ディレクトリ構成と命名規則
- [API仕様書](docs/api-documentation.md) - REST API の詳細仕様
- [開発ガイド](docs/development-guide.md) - 開発環境構築と開発フロー

## 🧪 テスト

```bash
# 全てのテストを実行
npm test

# フロントエンドのテストのみ
npm run test:frontend

# バックエンドのテストのみ
npm run test:backend

# テストカバレッジ
npm run test:coverage
```

## 🔧 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | プロダクションビルドを作成 |
| `npm run test` | テストを実行 |
| `npm run lint` | ESLintを実行 |
| `npm run db:migrate` | データベースマイグレーション |
| `npm run db:seed` | テストデータの投入 |

## 📦 プロジェクト構造

```
API-kanri/
├── frontend/           # Reactアプリケーション
│   ├── src/
│   │   ├── components/ # UIコンポーネント
│   │   ├── pages/      # ページコンポーネント
│   │   ├── hooks/      # カスタムフック
│   │   ├── services/   # API呼び出し
│   │   ├── store/      # 状態管理
│   │   └── types/      # 型定義
├── backend/            # Node.js APIサーバー
│   ├── src/
│   │   ├── controllers/ # コントローラー
│   │   ├── models/     # データモデル
│   │   ├── routes/     # ルート定義
│   │   ├── services/   # ビジネスロジック
│   │   └── middleware/ # ミドルウェア
├── docs/               # プロジェクトドキュメント
└── database/           # データベース関連
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コミットメッセージ規約

```
type(scope): description

# 例:
feat(auth): add JWT authentication
fix(api): resolve CORS issue
docs(readme): update installation guide
```

## 📋 ロードマップ

### Phase 1 (MVP) ✅
- [x] APIエンドポイント管理
- [x] 基本的なテスト機能
- [x] 履歴管理

### Phase 2 🚧
- [ ] 認証管理の強化
- [ ] 環境管理
- [ ] チーム機能

### Phase 3 📋
- [ ] 監視・アラート機能
- [ ] ドキュメント生成
- [ ] 詳細分析機能

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 🙋‍♂️ サポート

問題や質問がある場合は、以下の方法でお知らせください：

- [Issues](https://github.com/your-org/API-kanri/issues) - バグ報告や機能要求
- [Discussions](https://github.com/your-org/API-kanri/discussions) - 質問や議論

## 👥 作成者

- **あなたの名前** - [GitHub](https://github.com/yourusername)

## 🙏 謝辞

このプロジェクトの開発にあたり、以下のオープンソースプロジェクトを使用させていただきました：

- [React](https://reactjs.org/)
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Material-UI](https://mui.com/)

---

⭐ このプロジェクトが役に立ったら、スターをつけていただけると嬉しいです！
