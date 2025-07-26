# API管理アプリ API仕様書

## 1. 基本情報

### 1.1 API概要
- **ベースURL**: `https://api.api-kanri.com/api/v1`
- **認証方式**: JWT Bearer Token
- **データ形式**: JSON
- **文字エンコーディング**: UTF-8

### 1.2 共通レスポンス形式

#### 成功時
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2025-07-26T10:00:00Z"
}
```

#### エラー時
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  },
  "timestamp": "2025-07-26T10:00:00Z"
}
```

### 1.3 HTTPステータスコード
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## 2. 認証API

### 2.1 ユーザー登録
```http
POST /auth/register
```

**リクエスト**
```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "password": "password123"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "山田太郎",
      "email": "yamada@example.com",
      "avatar_url": null,
      "created_at": "2025-07-26T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.2 ログイン
```http
POST /auth/login
```

**リクエスト**
```json
{
  "email": "yamada@example.com",
  "password": "password123"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "山田太郎",
      "email": "yamada@example.com",
      "avatar_url": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-07-27T10:00:00Z"
  }
}
```

### 2.3 ログアウト
```http
POST /auth/logout
```

**ヘッダー**
```
Authorization: Bearer {token}
```

**レスポンス**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### 2.4 現在のユーザー情報取得
```http
GET /auth/me
```

**ヘッダー**
```
Authorization: Bearer {token}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "山田太郎",
    "email": "yamada@example.com",
    "avatar_url": null,
    "role": "user",
    "created_at": "2025-07-26T10:00:00Z"
  }
}
```

## 3. プロジェクトAPI

### 3.1 プロジェクト一覧取得
```http
GET /projects
```

**クエリパラメータ**
- `page` (integer): ページ番号（デフォルト: 1）
- `limit` (integer): 1ページあたりの件数（デフォルト: 20）
- `search` (string): 検索キーワード

**レスポンス**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "ECサイトAPI",
        "description": "ECサイトのバックエンドAPI",
        "owner_id": 1,
        "is_public": false,
        "api_count": 25,
        "created_at": "2025-07-26T10:00:00Z",
        "updated_at": "2025-07-26T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_count": 50,
      "per_page": 20
    }
  }
}
```

### 3.2 プロジェクト作成
```http
POST /projects
```

**リクエスト**
```json
{
  "name": "新しいプロジェクト",
  "description": "プロジェクトの説明",
  "is_public": false
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "新しいプロジェクト",
    "description": "プロジェクトの説明",
    "owner_id": 1,
    "is_public": false,
    "created_at": "2025-07-26T10:00:00Z",
    "updated_at": "2025-07-26T10:00:00Z"
  }
}
```

### 3.3 プロジェクト詳細取得
```http
GET /projects/{id}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "ECサイトAPI",
    "description": "ECサイトのバックエンドAPI",
    "owner": {
      "id": 1,
      "name": "山田太郎",
      "email": "yamada@example.com"
    },
    "is_public": false,
    "api_count": 25,
    "member_count": 3,
    "environments": [
      {
        "id": 1,
        "name": "development",
        "base_url": "https://dev-api.example.com",
        "is_default": true
      }
    ],
    "created_at": "2025-07-26T10:00:00Z",
    "updated_at": "2025-07-26T10:00:00Z"
  }
}
```

### 3.4 プロジェクト更新
```http
PUT /projects/{id}
```

**リクエスト**
```json
{
  "name": "更新されたプロジェクト名",
  "description": "更新された説明",
  "is_public": true
}
```

### 3.5 プロジェクト削除
```http
DELETE /projects/{id}
```

## 4. API管理

### 4.1 API一覧取得
```http
GET /projects/{projectId}/apis
```

**クエリパラメータ**
- `page` (integer): ページ番号
- `limit` (integer): 1ページあたりの件数
- `method` (string): HTTPメソッドでフィルタ
- `tag` (string): タグでフィルタ
- `search` (string): 検索キーワード

**レスポンス**
```json
{
  "success": true,
  "data": {
    "apis": [
      {
        "id": 1,
        "name": "ユーザー一覧取得",
        "description": "ユーザー一覧を取得するAPI",
        "method": "GET",
        "endpoint": "/users",
        "base_url": "https://api.example.com",
        "tags": ["user", "list"],
        "status": "active",
        "last_tested": "2025-07-26T09:00:00Z",
        "test_count": 15,
        "created_at": "2025-07-26T08:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_count": 25,
      "per_page": 20
    }
  }
}
```

### 4.2 API作成
```http
POST /projects/{projectId}/apis
```

**リクエスト**
```json
{
  "name": "新しいAPI",
  "description": "APIの説明",
  "method": "POST",
  "endpoint": "/users",
  "base_url": "https://api.example.com",
  "tags": ["user", "create"],
  "parameters": [
    {
      "name": "name",
      "type": "body",
      "data_type": "string",
      "required": true,
      "description": "ユーザー名",
      "example": "山田太郎"
    }
  ]
}
```

### 4.3 API詳細取得
```http
GET /apis/{id}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "ユーザー一覧取得",
    "description": "ユーザー一覧を取得するAPI",
    "method": "GET",
    "endpoint": "/users",
    "base_url": "https://api.example.com",
    "tags": ["user", "list"],
    "status": "active",
    "parameters": [
      {
        "id": 1,
        "name": "page",
        "type": "query",
        "data_type": "number",
        "required": false,
        "default_value": "1",
        "description": "ページ番号",
        "example": "1"
      }
    ],
    "test_count": 15,
    "last_test_result": {
      "status_code": 200,
      "response_time": 150,
      "executed_at": "2025-07-26T09:00:00Z"
    },
    "created_at": "2025-07-26T08:00:00Z",
    "updated_at": "2025-07-26T08:30:00Z"
  }
}
```

### 4.4 API更新
```http
PUT /apis/{id}
```

### 4.5 API削除
```http
DELETE /apis/{id}
```

## 5. APIテストAPI

### 5.1 APIテスト実行
```http
POST /apis/{id}/test
```

**リクエスト**
```json
{
  "environment_id": 1,
  "parameters": {
    "query": {
      "page": "1",
      "limit": "10"
    },
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer token123"
    },
    "body": {
      "name": "テストユーザー"
    }
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "test_id": 123,
    "status_code": 200,
    "response_time": 150,
    "response_headers": {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    },
    "response_body": {
      "users": [],
      "total": 0
    },
    "request_info": {
      "url": "https://api.example.com/users?page=1&limit=10",
      "method": "GET",
      "headers": {},
      "sent_at": "2025-07-26T10:00:00Z"
    },
    "executed_at": "2025-07-26T10:00:00Z"
  }
}
```

### 5.2 テスト履歴取得
```http
GET /apis/{id}/history
```

**クエリパラメータ**
- `page` (integer): ページ番号
- `limit` (integer): 1ページあたりの件数
- `from_date` (string): 開始日（ISO 8601形式）
- `to_date` (string): 終了日（ISO 8601形式）

**レスポンス**
```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "id": 123,
        "status_code": 200,
        "response_time": 150,
        "environment": {
          "id": 1,
          "name": "development"
        },
        "user": {
          "id": 1,
          "name": "山田太郎"
        },
        "executed_at": "2025-07-26T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 100,
      "per_page": 20
    },
    "statistics": {
      "success_rate": 95.5,
      "average_response_time": 245,
      "total_tests": 100
    }
  }
}
```

### 5.3 テスト結果詳細取得
```http
GET /tests/{id}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "api": {
      "id": 1,
      "name": "ユーザー一覧取得",
      "method": "GET",
      "endpoint": "/users"
    },
    "environment": {
      "id": 1,
      "name": "development",
      "base_url": "https://dev-api.example.com"
    },
    "request": {
      "url": "https://dev-api.example.com/users?page=1",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer token123"
      },
      "body": null
    },
    "response": {
      "status_code": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "users": [],
        "total": 0
      },
      "response_time": 150
    },
    "user": {
      "id": 1,
      "name": "山田太郎"
    },
    "executed_at": "2025-07-26T10:00:00Z"
  }
}
```

## 6. 環境管理API

### 6.1 環境一覧取得
```http
GET /projects/{projectId}/environments
```

### 6.2 環境作成
```http
POST /projects/{projectId}/environments
```

**リクエスト**
```json
{
  "name": "staging",
  "base_url": "https://staging-api.example.com",
  "headers": {
    "X-API-Version": "v1"
  },
  "auth_config": {
    "type": "bearer",
    "token": "staging-token-123"
  },
  "is_default": false
}
```

### 6.3 環境更新
```http
PUT /environments/{id}
```

### 6.4 環境削除
```http
DELETE /environments/{id}
```

## 7. エラーコード一覧

| コード | 説明 |
|--------|------|
| `VALIDATION_ERROR` | バリデーションエラー |
| `AUTHENTICATION_FAILED` | 認証失敗 |
| `AUTHORIZATION_FAILED` | 認可失敗 |
| `RESOURCE_NOT_FOUND` | リソースが見つからない |
| `DUPLICATE_RESOURCE` | 重複するリソース |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 |
| `INTERNAL_SERVER_ERROR` | 内部サーバーエラー |
| `EXTERNAL_API_ERROR` | 外部API呼び出しエラー |
| `DATABASE_ERROR` | データベースエラー |

## 8. レート制限

| エンドポイント | 制限 |
|---------------|-----|
| 認証関連 | 5リクエスト/分 |
| API作成・更新 | 30リクエスト/分 |
| APIテスト実行 | 60リクエスト/分 |
| その他 | 100リクエスト/分 |

## 9. APIバージョニング

- 現在のバージョン: `v1`
- バージョンはURLパスに含める: `/api/v1/...`
- 新しいバージョンでは下位互換性を保つ
- 非推奨機能は6ヶ月前に告知
