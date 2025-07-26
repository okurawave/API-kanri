# Task 03: 認証システム構築

## 概要
JWT認証を基盤とした安全な認証システムを構築する。

## 目標
- セキュアなユーザー認証機能
- JWT Token管理
- パスワード暗号化
- セッション管理

## 詳細タスク

### 3.1 認証ミドルウェア実装 🔥
**期間**: 2日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] JWT認証ミドルウェアの実装
- [ ] Passport.js設定
- [ ] 認証エラーハンドリング

**middleware/auth.ts例**:
```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/database';

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Access token is required',
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'User not found',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid or expired token',
      },
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};
```

### 3.2 認証コントローラー実装 🔥
**期間**: 2日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] ユーザー登録機能
- [ ] ログイン機能
- [ ] ログアウト機能
- [ ] 現在ユーザー情報取得

**controllers/authController.ts例**:
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRegister, validateLogin } from '../utils/validation';

export const authController = {
  // ユーザー登録
  register: asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(d => d.message),
        },
      });
    }

    const { name, email, password } = value;

    // メールアドレス重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: 'Email already exists',
        },
      });
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 12);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'user',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // JWT生成
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }),

  // ログイン
  login: asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(d => d.message),
        },
      });
    }

    const { email, password } = value;

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password',
        },
      });
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password',
        },
      });
    }

    // JWT生成
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }),

  // 現在のユーザー情報取得
  getCurrentUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  }),

  // ログアウト（クライアント側でトークン削除）
  logout: asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Successfully logged out',
    });
  }),
};
```

### 3.3 バリデーション実装 🔥
**期間**: 1日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] Joi を使用した入力値検証
- [ ] パスワード強度チェック
- [ ] メールアドレス形式チェック

**utils/validation.ts例**:
```typescript
import Joi from 'joi';

export const validateRegister = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': '名前は2文字以上で入力してください',
      'string.max': '名前は50文字以内で入力してください',
      'any.required': '名前は必須です',
    }),
    email: Joi.string().email().required().messages({
      'string.email': '有効なメールアドレスを入力してください',
      'any.required': 'メールアドレスは必須です',
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'パスワードは8文字以上で入力してください',
        'string.max': 'パスワードは128文字以内で入力してください',
        'string.pattern.base': 'パスワードは英大文字、英小文字、数字を含む必要があります',
        'any.required': 'パスワードは必須です',
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': '有効なメールアドレスを入力してください',
      'any.required': 'メールアドレスは必須です',
    }),
    password: Joi.string().required().messages({
      'any.required': 'パスワードは必須です',
    }),
  });

  return schema.validate(data, { abortEarly: false });
};
```

### 3.4 認証ルーティング設定 🔥
**期間**: 0.5日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] 認証関連エンドポイントの定義
- [ ] レート制限の設定
- [ ] CORS設定

**routes/auth.ts例**:
```typescript
import express from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// レート制限（認証関連は厳しく）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回の試行
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 認証不要エンドポイント
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// 認証必要エンドポイント
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

export { router as authRouter };
```

### 3.5 フロントエンド認証機能 🔥
**期間**: 2日  
**担当**: フロントエンド開発者

**作業内容**:
- [ ] 認証ストアの実装（Zustand）
- [ ] ログイン・登録フォーム
- [ ] 認証状態管理
- [ ] Protected Route実装

**store/authStore.ts例**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', {
            name,
            email,
            password,
          });
          const { user, token } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      getCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.data });
        } catch (error) {
          // トークンが無効な場合はログアウト
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 3.6 セキュリティ強化 🟡
**期間**: 1日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] パスワードポリシー強化
- [ ] ブルートフォース攻撃対策
- [ ] CSRF対策
- [ ] セキュリティヘッダー設定

**middleware/security.ts例**:
```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// セキュリティヘッダー
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// 一般的なレート制限
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
```

## 完了条件

### 技術的完了条件
- [ ] ユーザー登録が正常に動作する
- [ ] ログイン・ログアウトが正常に動作する
- [ ] JWT認証が正常に機能する
- [ ] 認証必要エンドポイントでアクセス制御される
- [ ] パスワードが安全にハッシュ化される

### セキュリティ条件
- [ ] パスワード強度チェックが機能する
- [ ] レート制限が適切に設定される
- [ ] セキュリティヘッダーが設定される
- [ ] 入力値検証が適切に行われる

### フロントエンド条件
- [ ] ログイン・登録フォームが動作する
- [ ] 認証状態が正しく管理される
- [ ] Protected Routeが機能する

## 次のタスクへの依存関係
- Task 04 (ユーザー管理): 認証システムをベースに拡張
- Task 05 (プロジェクト管理): 認証ユーザーのプロジェクト管理
- 全ての後続タスク: 認証が前提となる

## 見積もり
- **総工数**: 7日
- **クリティカルパス**: 認証ミドルウェア → コントローラー → フロントエンド実装

## リスク要因
1. **セキュリティリスク**: 認証の脆弱性
2. **UXリスク**: 認証フローの複雑さ
3. **技術リスク**: JWT管理の複雑さ

## 対応策
1. セキュリティチェックリストに基づく検証
2. シンプルで直感的なUI設計
3. JWT処理をライブラリに依存して安全性を確保
