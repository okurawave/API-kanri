# API管理アプリ 開発ガイド

## 1. 開発環境セットアップ

### 1.1 前提条件
- Node.js 18.0.0 以上
- PostgreSQL 14.0 以上
- Redis 7.0 以上
- Git
- Docker & Docker Compose（推奨）

### 1.2 クローンとセットアップ
```bash
# リポジトリのクローン
git clone https://github.com/your-org/API-kanri.git
cd API-kanri

# 依存関係のインストール
npm run install:all

# 環境変数の設定
cp .env.example .env
# .envファイルを適切に編集

# データベースのセットアップ
npm run db:setup

# 開発サーバーの起動
npm run dev
```

### 1.3 Docker を使用した開発環境
```bash
# Docker コンテナの起動
docker-compose up -d

# データベースの初期化
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed

# 開発サーバーの起動
docker-compose exec frontend npm run dev
docker-compose exec backend npm run dev
```

## 2. プロジェクト構造

### 2.1 モノレポ構成
```
API-kanri/
├── frontend/           # Reactアプリケーション
├── backend/           # Node.js APIサーバー
├── docs/              # プロジェクトドキュメント
├── database/          # データベース関連
├── scripts/           # ビルド・デプロイスクリプト
└── docker-compose.yml # 開発環境設定
```

### 2.2 npm scripts
```json
{
  "scripts": {
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "test": "npm run test:frontend && npm run test:backend",
    "db:setup": "cd backend && npm run db:migrate && npm run db:seed",
    "lint": "npm run lint:frontend && npm run lint:backend"
  }
}
```

## 3. コーディング規約

### 3.1 TypeScript 設定

#### tsconfig.json (共通)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

### 3.2 ESLint 設定

#### .eslintrc.js
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'prefer-const': 'error'
  }
}
```

### 3.3 Prettier 設定

#### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 4. フロントエンド開発

### 4.1 コンポーネント作成規約

#### ディレクトリ構造
```
components/
├── common/
│   └── Button/
│       ├── index.ts
│       ├── Button.tsx
│       ├── Button.types.ts
│       ├── Button.styles.ts
│       └── Button.test.tsx
```

#### コンポーネントテンプレート
```typescript
// Button.types.ts
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Button.tsx
import React from 'react';
import { ButtonProps } from './Button.types';
import { StyledButton } from './Button.styles';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  children,
  onClick,
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Loading...' : children}
    </StyledButton>
  );
};

// index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

### 4.2 状態管理（Zustand）

#### Store の作成例
```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => 
        set({ user, token, isAuthenticated: true }),
      logout: () => 
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 4.3 API サービス

#### API クライアントの設定
```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
  timeout: 10000,
});

// リクエストインターセプター
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export { api };
```

## 5. バックエンド開発

### 5.1 Express アプリケーション構造

#### app.ts
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { projectRouter } from './routes/projects';

const app = express();

// ミドルウェア
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// レート制限
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // リクエスト数制限
});
app.use('/api/', limiter);

// ルート
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', projectRouter);

// エラーハンドリング
app.use(errorHandler);

export { app };
```

### 5.2 コントローラー パターン

#### 例: projectController.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/projectService';
import { CreateProjectDto } from '../types/project';
import { asyncHandler } from '../utils/asyncHandler';

export const projectController = {
  // プロジェクト一覧取得
  getProjects: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { page = 1, limit = 20, search } = req.query;
    
    const result = await projectService.getProjects({
      userId,
      page: Number(page),
      limit: Number(limit),
      search: search as string,
    });
    
    res.json({
      success: true,
      data: result,
    });
  }),

  // プロジェクト作成
  createProject: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const projectData: CreateProjectDto = req.body;
    
    const project = await projectService.createProject({
      ...projectData,
      owner_id: userId,
    });
    
    res.status(201).json({
      success: true,
      data: project,
    });
  }),
};
```

### 5.3 サービス層パターン

#### 例: projectService.ts
```typescript
import { prisma } from '../utils/database';
import { CreateProjectDto, Project } from '../types/project';

export const projectService = {
  async getProjects(params: {
    userId: number;
    page: number;
    limit: number;
    search?: string;
  }) {
    const { userId, page, limit, search } = params;
    const offset = (page - 1) * limit;

    const where = {
      OR: [
        { owner_id: userId },
        { project_members: { some: { user_id: userId } } },
      ],
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { apis: true } },
        },
        orderBy: { updated_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_count: total,
        per_page: limit,
      },
    };
  },

  async createProject(data: CreateProjectDto & { owner_id: number }) {
    return prisma.project.create({
      data,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  },
};
```

## 6. データベース管理

### 6.1 Prisma スキーマ

#### schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  avatarUrl    String?  @map("avatar_url")
  role         String   @default("user")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  projects       Project[]
  projectMembers ProjectMember[]
  apiTests       ApiTest[]

  @@map("users")
}

model Project {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  ownerId     Int      @map("owner_id")
  isPublic    Boolean  @default(false) @map("is_public")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  owner          User            @relation(fields: [ownerId], references: [id])
  apis           Api[]
  environments   Environment[]
  projectMembers ProjectMember[]

  @@map("projects")
}
```

### 6.2 マイグレーション

#### マイグレーション作成
```bash
# 新しいマイグレーション作成
npx prisma migrate dev --name add_user_table

# マイグレーション実行
npx prisma migrate deploy

# Prisma Client 生成
npx prisma generate
```

### 6.3 シード データ

#### prisma/seed.ts
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // テストユーザー作成
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: '管理者',
      role: 'admin',
    },
  });

  // テストプロジェクト作成
  const project = await prisma.project.create({
    data: {
      name: 'サンプルプロジェクト',
      description: 'テスト用のプロジェクトです',
      ownerId: user.id,
    },
  });

  console.log('Seed data created:', { user, project });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 7. テスト

### 7.1 フロントエンドテスト

#### Jest 設定
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
```

#### コンポーネントテスト例
```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 7.2 バックエンドテスト

#### API テスト例
```typescript
// projectController.test.ts
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../utils/database';

describe('Project API', () => {
  beforeEach(async () => {
    // テストデータのクリーンアップ
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('GET /projects', () => {
    it('should return user projects', async () => {
      // テストユーザーとプロジェクトを作成
      const user = await createTestUser();
      const token = generateTestToken(user);

      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.projects)).toBe(true);
    });
  });
});
```

## 8. デプロイ

### 8.1 Docker 本番環境

#### Dockerfile (フロントエンド)
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Dockerfile (バックエンド)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### 8.2 CI/CD パイプライン

#### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/test
      
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: echo "Deploy to production server"
```

## 9. 開発ワークフロー

### 9.1 Git ブランチ戦略
```
main
├── develop
│   ├── feature/user-authentication
│   ├── feature/api-testing
│   └── feature/project-management
├── hotfix/critical-bug-fix
└── release/v1.0.0
```

### 9.2 開発フロー
1. `develop` ブランチから `feature/` ブランチを作成
2. 機能開発とテスト
3. プルリクエスト作成
4. コードレビュー
5. `develop` ブランチにマージ
6. `release/` ブランチで最終テスト
7. `main` ブランチにマージして本番デプロイ

### 9.3 コミットメッセージ規約
```
type(scope): description

feat(auth): add JWT authentication
fix(api): resolve CORS issue
docs(readme): update installation guide
style(lint): fix ESLint warnings
refactor(store): optimize state management
test(api): add integration tests
chore(deps): update dependencies
```

## 10. トラブルシューティング

### 10.1 よくある問題

#### データベース接続エラー
```bash
# PostgreSQL サービス確認
sudo systemctl status postgresql

# データベース接続テスト
psql -h localhost -U username -d database_name
```

#### Node.js バージョン問題
```bash
# Node.js バージョン確認
node --version

# nvm で適切なバージョンに切り替え
nvm use 18
```

#### ポート競合
```bash
# ポート使用状況確認
netstat -tulpn | grep :3000

# プロセス終了
kill -9 <PID>
```

### 10.2 デバッグ方法

#### フロントエンド
- React Developer Tools を使用
- ブラウザの開発者ツールでネットワークタブを確認
- console.log によるデバッグ

#### バックエンド
- VS Code デバッガーの設定
- ログレベルを DEBUG に設定
- Postman/Insomnia でAPI テスト
