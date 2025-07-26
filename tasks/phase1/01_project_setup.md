# Task 01: プロジェクト初期設定

## 概要
API管理アプリのプロジェクト基盤を構築し、開発環境をセットアップする。

## 目標
- モノレポ構造の構築
- 開発環境の統一
- ビルド・テストパイプラインの設定

## 詳細タスク

### 1.1 プロジェクト構造作成 🔥
**期間**: 1日  
**担当**: フルスタック開発者

**作業内容**:
- [ ] ルートディレクトリの設定
- [ ] frontend/、backend/、docs/ ディレクトリ作成
- [ ] 基本的な設定ファイル配置

**成果物**:
```
API-kanri/
├── frontend/
├── backend/
├── docs/
├── tasks/
├── scripts/
├── .gitignore
├── README.md
├── package.json
└── docker-compose.yml
```

### 1.2 パッケージ管理設定 🔥
**期間**: 0.5日  
**担当**: フルスタック開発者

**作業内容**:
- [ ] ルートpackage.jsonの作成
- [ ] ワークスペースの設定
- [ ] 共通スクリプトの定義

**成果物**:
- ルートpackage.json（ワークスペース設定）
- npm scriptsの定義

### 1.3 フロントエンド初期設定 🔥
**期間**: 1日  
**担当**: フロントエンド開発者

**作業内容**:
- [ ] Vite + React + TypeScript プロジェクト作成
- [ ] ESLint + Prettier 設定
- [ ] 基本的なディレクトリ構造作成

**依存パッケージ**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "@mui/material": "^5.11.10",
    "axios": "^1.3.4",
    "zustand": "^4.3.6"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "typescript": "^4.9.3",
    "vite": "^4.1.0"
  }
}
```

### 1.4 バックエンド初期設定 🔥
**期間**: 1日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] Node.js + Express + TypeScript プロジェクト作成
- [ ] ESLint + Prettier 設定
- [ ] 基本的なディレクトリ構造作成

**依存パッケージ**:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^6.0.1",
    "prisma": "^4.11.0",
    "@prisma/client": "^4.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^18.14.6",
    "typescript": "^4.9.5",
    "nodemon": "^2.0.20",
    "ts-node": "^10.9.1"
  }
}
```

### 1.5 Docker環境設定 🔥
**期間**: 1日  
**担当**: DevOps/フルスタック開発者

**作業内容**:
- [ ] docker-compose.yml 作成
- [ ] PostgreSQL、Redis コンテナ設定
- [ ] 開発用Dockerfile作成

**docker-compose.yml例**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: api_kanri_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/api_kanri_dev
      REDIS_URL: redis://redis:6379

volumes:
  postgres_data:
```

### 1.6 CI/CD パイプライン設定 🟡
**期間**: 1日  
**担当**: DevOps/フルスタック開発者

**作業内容**:
- [ ] GitHub Actions ワークフロー作成
- [ ] テスト自動実行設定
- [ ] リンター・フォーマッター自動実行

**.github/workflows/ci.yml例**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

### 1.7 環境変数設定 🔥
**期間**: 0.5日  
**担当**: フルスタック開発者

**作業内容**:
- [ ] .env.example ファイル作成
- [ ] 環境変数の定義と説明
- [ ] セキュリティ考慮事項の文書化

**.env.example**:
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/api_kanri_dev
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Frontend
REACT_APP_API_URL=http://localhost:3001/api/v1

# Node Environment
NODE_ENV=development
PORT=3001
```

## 完了条件

### 技術的完了条件
- [ ] 全てのプロジェクトが正常にビルドできる
- [ ] Docker Compose で全サービスが起動する
- [ ] フロントエンド（localhost:5173）にアクセス可能
- [ ] バックエンドAPI（localhost:3001）が応答する
- [ ] データベース接続が確立される

### ドキュメント完了条件
- [ ] README.md の更新
- [ ] セットアップ手順の文書化
- [ ] 各環境での動作確認手順

## 次のタスクへの依存関係
- Task 02 (データベース設計) への入力として使用
- Task 03 (認証システム) のベースとなる

## 見積もり
- **総工数**: 5日
- **クリティカルパス**: プロジェクト構造 → Docker設定 → 動作確認

## リスク要因
1. **技術的リスク**: Docker環境でのネットワーク問題
2. **スケジュール的リスク**: 設定ファイルの調整に時間がかかる可能性
3. **品質リスク**: 設定漏れによる後続タスクへの影響

## 対応策
1. 事前にDocker環境での類似プロジェクトを参考にする
2. 設定ファイルのテンプレートを準備する
3. チェックリストを作成して設定漏れを防ぐ
