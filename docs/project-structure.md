# API管理アプリ プロジェクト構造

## 1. ディレクトリ構造

```
API-kanri/
├── README.md
├── package.json
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Dockerfile
├──docs/
│   ├── requirements.md
│   ├── system-design.md
│   ├── project-structure.md
│   ├── api-documentation.md
│   └── development-guide.md
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header/
│   │   │   │   ├── Sidebar/
│   │   │   │   ├── Footer/
│   │   │   │   └── Layout/
│   │   │   ├── api/
│   │   │   │   ├── ApiList/
│   │   │   │   ├── ApiForm/
│   │   │   │   ├── ApiDetail/
│   │   │   │   └── ApiTester/
│   │   │   ├── project/
│   │   │   │   ├── ProjectList/
│   │   │   │   ├── ProjectForm/
│   │   │   │   └── ProjectDetail/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm/
│   │   │   │   ├── RegisterForm/
│   │   │   │   └── ProtectedRoute/
│   │   │   └── history/
│   │   │       ├── TestHistory/
│   │   │       └── ResultDetail/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── ApiManagement.tsx
│   │   │   ├── Testing.tsx
│   │   │   ├── History.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   ├── useProjects.ts
│   │   │   └── useLocalStorage.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   └── testing.ts
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   ├── authStore.ts
│   │   │   ├── projectStore.ts
│   │   │   └── apiStore.ts
│   │   ├── types/
│   │   │   ├── api.ts
│   │   │   ├── project.ts
│   │   │   ├── user.ts
│   │   │   └── common.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   ├── validation.ts
│   │   │   └── formatters.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── components.css
│   │   │   └── themes.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── App.test.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .eslintrc.js
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── apiController.ts
│   │   │   ├── testController.ts
│   │   │   └── userController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── cors.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Project.ts
│   │   │   ├── Api.ts
│   │   │   ├── Test.ts
│   │   │   └── Environment.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── apis.ts
│   │   │   ├── tests.ts
│   │   │   └── users.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── projectService.ts
│   │   │   ├── apiService.ts
│   │   │   ├── testService.ts
│   │   │   └── emailService.ts
│   │   ├── utils/
│   │   │   ├── database.ts
│   │   │   ├── logger.ts
│   │   │   ├── cache.ts
│   │   │   ├── encryption.ts
│   │   │   └── validation.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── jwt.ts
│   │   │   └── app.ts
│   │   ├── types/
│   │   │   ├── express.d.ts
│   │   │   ├── api.ts
│   │   │   └── common.ts
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── integration/
│   │   │   └── api/
│   │   └── fixtures/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .eslintrc.js
├── database/
│   ├── init.sql
│   ├── migrations/
│   └── seeds/
├── scripts/
│   ├── build.sh
│   ├── deploy.sh
│   ├── test.sh
│   └── setup.sh
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy.yml
        └── test.yml
```

## 2. 主要コンポーネント説明

### 2.1 フロントエンド構造

#### Components
- **common/**: 再利用可能な共通コンポーネント
- **api/**: API関連の専用コンポーネント
- **project/**: プロジェクト管理コンポーネント
- **auth/**: 認証関連コンポーネント
- **history/**: テスト履歴コンポーネント

#### Pages
各ページコンポーネントはルーティングに対応し、複数のコンポーネントを組み合わせて画面を構成

#### Hooks
- **useAuth**: 認証状態の管理
- **useApi**: API呼び出しの共通ロジック
- **useProjects**: プロジェクト関連の状態管理
- **useLocalStorage**: ローカルストレージの操作

#### Services
外部API呼び出しとデータ変換を担当

#### Store
アプリケーション全体の状態管理（Zustand使用）

### 2.2 バックエンド構造

#### Controllers
HTTPリクエストの処理とレスポンスの返却を担当

#### Middleware
- **auth**: JWT認証の検証
- **validation**: リクエストデータの検証
- **errorHandler**: エラーハンドリング
- **rateLimiter**: レート制限
- **cors**: CORS設定

#### Models
データベースのテーブル定義とビジネスロジック

#### Routes
エンドポイントの定義とコントローラーのマッピング

#### Services
ビジネスロジックの実装とデータ操作

#### Utils
共通的なユーティリティ関数

## 3. 設定ファイル詳細

### 3.1 package.json (Frontend)
```json
{
  "name": "api-kanri-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "@mui/material": "^5.11.10",
    "@emotion/react": "^11.10.5",
    "@emotion/styled": "^11.10.5",
    "axios": "^1.3.4",
    "zustand": "^4.3.6",
    "react-hook-form": "^7.43.5",
    "zod": "^3.20.6"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@typescript-eslint/eslint-plugin": "^5.54.0",
    "@typescript-eslint/parser": "^5.54.0",
    "@vitejs/plugin-react": "^3.1.0",
    "eslint": "^8.35.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.3.4",
    "typescript": "^4.9.3",
    "vite": "^4.1.0"
  }
}
```

### 3.2 package.json (Backend)
```json
{
  "name": "api-kanri-backend",
  "version": "1.0.0",
  "description": "API management application backend",
  "main": "dist/app.js",
  "scripts": {
    "start": "node dist/app.js",
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "migrate": "prisma migrate dev",
    "generate": "prisma generate",
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^6.0.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "@prisma/client": "^4.11.0",
    "redis": "^4.6.4",
    "joi": "^17.8.3",
    "winston": "^3.8.2",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^18.14.6",
    "@types/bcryptjs": "^2.4.2",
    "@types/jsonwebtoken": "^9.0.1",
    "@types/jest": "^29.4.0",
    "typescript": "^4.9.5",
    "nodemon": "^2.0.20",
    "ts-node": "^10.9.1",
    "jest": "^29.4.3",
    "prisma": "^4.11.0"
  }
}
```

## 4. 開発環境構築

### 4.1 必要なソフトウェア
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose

### 4.2 セットアップ手順
1. リポジトリのクローン
2. 依存関係のインストール
3. 環境変数の設定
4. データベースのセットアップ
5. 開発サーバーの起動

## 5. 命名規則

### 5.1 ファイル・ディレクトリ
- **コンポーネント**: PascalCase (`ApiList/`)
- **ページ**: PascalCase (`Dashboard.tsx`)
- **ユーティリティ**: camelCase (`helpers.ts`)
- **定数**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

### 5.2 変数・関数
- **変数**: camelCase (`apiData`)
- **関数**: camelCase (`fetchApiData`)
- **コンポーネント**: PascalCase (`ApiList`)
- **型定義**: PascalCase (`ApiResponse`)

### 5.3 データベース
- **テーブル**: snake_case (`api_tests`)
- **カラム**: snake_case (`created_at`)

## 6. Git ブランチ戦略

### 6.1 ブランチ構成
- **main**: 本番環境のコード
- **develop**: 開発環境のコード
- **feature/**: 機能開発ブランチ
- **hotfix/**: 緊急修正ブランチ
- **release/**: リリース準備ブランチ

### 6.2 コミットメッセージ規則
```
type(scope): description

feat: 新機能の追加
fix: バグの修正
docs: ドキュメントの更新
style: コードスタイルの修正
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスやツールの修正
```
