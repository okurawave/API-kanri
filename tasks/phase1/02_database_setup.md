# Task 02: データベース設計・構築

## 概要
API管理アプリに必要なデータベーススキーマの設計と構築を行う。

## 目標
- 正規化されたデータベース設計
- Prismaを使用したスキーマ定義
- マイグレーション機能の実装

## 詳細タスク

### 2.1 データベース設計 🔥
**期間**: 2日  
**担当**: バックエンド開発者・データベース設計者

**作業内容**:
- [ ] エンティティ関係図（ER図）の作成
- [ ] テーブル設計とリレーションシップの定義
- [ ] インデックス戦略の策定

**成果物**:
- ER図（Mermaid形式）
- テーブル定義書
- インデックス設計書

### 2.2 Prismaスキーマ定義 🔥
**期間**: 1.5日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] schema.prisma ファイルの作成
- [ ] 全テーブルのモデル定義
- [ ] リレーションシップの設定

**prisma/schema.prisma例**:
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

model Api {
  id          Int      @id @default(autoincrement())
  projectId   Int      @map("project_id")
  name        String
  description String?
  method      String   // GET, POST, PUT, DELETE, etc.
  endpoint    String
  baseUrl     String?  @map("base_url")
  tags        String[]
  status      String   @default("active") // active, inactive, deprecated
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  project    Project        @relation(fields: [projectId], references: [id])
  parameters ApiParameter[]
  tests      ApiTest[]

  @@map("apis")
}

model ApiParameter {
  id           Int     @id @default(autoincrement())
  apiId        Int     @map("api_id")
  name         String
  type         String  // query, path, body, header
  dataType     String  @map("data_type") // string, number, boolean, object
  required     Boolean @default(false)
  defaultValue String? @map("default_value")
  description  String?
  example      String?

  // Relations
  api Api @relation(fields: [apiId], references: [id])

  @@map("api_parameters")
}

model Environment {
  id         Int    @id @default(autoincrement())
  projectId  Int    @map("project_id")
  name       String
  baseUrl    String @map("base_url")
  headers    Json?
  authConfig Json?  @map("auth_config")
  isDefault  Boolean @default(false) @map("is_default")

  // Relations
  project Project   @relation(fields: [projectId], references: [id])
  tests   ApiTest[]

  @@map("environments")
}

model ApiTest {
  id            Int      @id @default(autoincrement())
  apiId         Int      @map("api_id")
  environmentId Int      @map("environment_id")
  userId        Int      @map("user_id")
  requestData   Json     @map("request_data")
  createdAt     DateTime @default(now()) @map("created_at")

  // Relations
  api         Api           @relation(fields: [apiId], references: [id])
  environment Environment   @relation(fields: [environmentId], references: [id])
  user        User          @relation(fields: [userId], references: [id])
  results     TestResult[]

  @@map("api_tests")
}

model TestResult {
  id           Int      @id @default(autoincrement())
  testId       Int      @map("test_id")
  statusCode   Int?     @map("status_code")
  responseData Json?    @map("response_data")
  responseTime Int?     @map("response_time") // milliseconds
  errorMessage String?  @map("error_message")
  executedAt   DateTime @default(now()) @map("executed_at")

  // Relations
  test ApiTest @relation(fields: [testId], references: [id])

  @@map("test_results")
}

model ProjectMember {
  id        Int      @id @default(autoincrement())
  projectId Int      @map("project_id")
  userId    Int      @map("user_id")
  role      String   // owner, admin, member, viewer
  joinedAt  DateTime @default(now()) @map("joined_at")

  // Relations
  project Project @relation(fields: [projectId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@unique([projectId, userId])
  @@map("project_members")
}
```

### 2.3 マイグレーション作成 🔥
**期間**: 1日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] 初期マイグレーションファイルの生成
- [ ] マイグレーション実行スクリプトの作成
- [ ] ロールバック手順の確立

**マイグレーションコマンド**:
```bash
# マイグレーション生成
npx prisma migrate dev --name init

# マイグレーション実行
npx prisma migrate deploy

# Prisma Client 生成
npx prisma generate
```

### 2.4 シードデータ作成 🔥
**期間**: 1日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] 開発用テストデータの作成
- [ ] prisma/seed.ts ファイルの実装
- [ ] シード実行スクリプトの作成

**prisma/seed.ts例**:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 管理者ユーザー作成
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@api-kanri.com',
      passwordHash: hashedPassword,
      name: '管理者',
      role: 'admin',
    },
  });

  // 一般ユーザー作成
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@api-kanri.com',
      passwordHash: await bcrypt.hash('user123', 10),
      name: '一般ユーザー',
      role: 'user',
    },
  });

  // サンプルプロジェクト作成
  const sampleProject = await prisma.project.create({
    data: {
      name: 'サンプルECサイトAPI',
      description: 'ECサイトのバックエンドAPI管理プロジェクト',
      ownerId: adminUser.id,
      isPublic: false,
    },
  });

  // 環境設定作成
  await prisma.environment.create({
    data: {
      projectId: sampleProject.id,
      name: 'development',
      baseUrl: 'https://dev-api.example.com',
      isDefault: true,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1'
      },
    },
  });

  await prisma.environment.create({
    data: {
      projectId: sampleProject.id,
      name: 'production',
      baseUrl: 'https://api.example.com',
      isDefault: false,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1'
      },
    },
  });

  // サンプルAPI作成
  const userListApi = await prisma.api.create({
    data: {
      projectId: sampleProject.id,
      name: 'ユーザー一覧取得',
      description: 'システム内の全ユーザー一覧を取得するAPI',
      method: 'GET',
      endpoint: '/users',
      tags: ['user', 'list'],
      status: 'active',
    },
  });

  // APIパラメータ作成
  await prisma.apiParameter.createMany({
    data: [
      {
        apiId: userListApi.id,
        name: 'page',
        type: 'query',
        dataType: 'number',
        required: false,
        defaultValue: '1',
        description: 'ページ番号',
        example: '1',
      },
      {
        apiId: userListApi.id,
        name: 'limit',
        type: 'query',
        dataType: 'number',
        required: false,
        defaultValue: '20',
        description: '1ページあたりの件数',
        example: '20',
      },
    ],
  });

  console.log('シードデータの作成が完了しました');
  console.log('管理者: admin@api-kanri.com / admin123');
  console.log('一般ユーザー: user@api-kanri.com / user123');
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

### 2.5 データベース接続設定 🔥
**期間**: 0.5日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] Prisma Client のセットアップ
- [ ] 接続プールの設定
- [ ] エラーハンドリングの実装

**utils/database.ts例**:
```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### 2.6 インデックス最適化 🟡
**期間**: 1日  
**担当**: データベース設計者・バックエンド開発者

**作業内容**:
- [ ] パフォーマンス重要クエリの特定
- [ ] 適切なインデックスの追加
- [ ] クエリパフォーマンステスト

**インデックス例**:
```sql
-- ユーザー検索用
CREATE INDEX idx_users_email ON users(email);

-- プロジェクト関連
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_apis_project_id ON apis(project_id);

-- API検索用
CREATE INDEX idx_apis_method_status ON apis(method, status);
CREATE INDEX idx_apis_tags ON apis USING gin(tags);

-- テスト関連
CREATE INDEX idx_api_tests_api_id ON api_tests(api_id);
CREATE INDEX idx_test_results_executed_at ON test_results(executed_at);
```

## 完了条件

### 技術的完了条件
- [ ] Prismaスキーマが正常に検証される
- [ ] マイグレーションが成功する
- [ ] シードデータが正常に投入される
- [ ] Prisma Clientが正常に動作する
- [ ] 全てのリレーションシップが正しく設定される

### パフォーマンス条件
- [ ] 基本的なクエリが100ms以内で実行される
- [ ] インデックスが適切に設定される

### ドキュメント完了条件
- [ ] ER図の作成と承認
- [ ] データベース設計書の完成
- [ ] セットアップ手順の文書化

## 次のタスクへの依存関係
- Task 03 (認証システム): Userテーブルを使用
- Task 05 (プロジェクト管理): Project、ProjectMemberテーブルを使用
- Task 06 (API管理): Api、ApiParameterテーブルを使用

## 見積もり
- **総工数**: 6日
- **クリティカルパス**: スキーマ設計 → マイグレーション → テストデータ

## リスク要因
1. **設計リスク**: スキーマ変更による後続開発への影響
2. **パフォーマンスリスク**: 大量データでのクエリ性能
3. **運用リスク**: マイグレーション失敗時の復旧

## 対応策
1. スキーマレビューを複数回実施
2. パフォーマンステストを早期に実施
3. マイグレーションのロールバック手順を事前定義
