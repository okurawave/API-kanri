# Task 04: ユーザー管理機能

## 概要
ユーザープロフィール管理、パスワード変更、アカウント設定等のユーザー関連機能を実装する。

## 目標
- ユーザープロフィール管理
- パスワード変更機能
- アカウント設定
- ユーザー一覧（管理者向け）

## 詳細タスク

### 4.1 ユーザープロフィール管理 🔥
**期間**: 1.5日  
**担当**: フルスタック開発者

**作業内容**:
- [ ] プロフィール取得API
- [ ] プロフィール更新API
- [ ] アバター画像アップロード
- [ ] プロフィール画面UI

**controllers/userController.ts例**:
```typescript
import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { asyncHandler } from '../utils/asyncHandler';
import { validateProfileUpdate } from '../utils/validation';

export const userController = {
  // プロフィール取得
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
            apiTests: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  }),

  // プロフィール更新
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { error, value } = validateProfileUpdate(req.body);

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

    const { name, avatarUrl } = value;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  }),

  // パスワード変更
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    // 現在のパスワード確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current password is incorrect',
        },
      });
    }

    // 新しいパスワードをハッシュ化
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }),
};
```

### 4.2 管理者向けユーザー管理 🟡
**期間**: 2日  
**担当**: フルスタック開発者

**作業内容**:
- [ ] ユーザー一覧取得API
- [ ] ユーザー詳細取得API
- [ ] ユーザーロール変更API
- [ ] ユーザー無効化機能

**controllers/adminController.ts例**:
```typescript
import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { asyncHandler } from '../utils/asyncHandler';

export const adminController = {
  // ユーザー一覧取得（管理者のみ）
  getUsers: asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { email: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role: role as string }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              projects: true,
              apiTests: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: Number(page),
          total_pages: Math.ceil(total / Number(limit)),
          total_count: total,
          per_page: Number(limit),
        },
      },
    });
  }),

  // ユーザーロール変更
  updateUserRole: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role specified',
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully',
    });
  }),
};
```

### 4.3 フロントエンド プロフィール画面 🔥
**期間**: 2日  
**担当**: フロントエンド開発者

**作業内容**:
- [ ] プロフィール表示画面
- [ ] プロフィール編集フォーム
- [ ] パスワード変更フォーム
- [ ] アバター画像アップロード

**pages/Profile.tsx例**:
```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/userService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // プロフィール更新フォーム
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatarUrl || '',
  });

  // パスワード変更フォーム
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setMessage('');
    setError('');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await userService.updateProfile(profileForm);
      setMessage('プロフィールが更新されました');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage('パスワードが変更されました');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Typography>ログインが必要です</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        プロフィール設定
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="基本情報" />
            <Tab label="パスワード変更" />
          </Tabs>
        </Box>

        {message && (
          <Alert severity="success" sx={{ m: 2 }}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* 基本情報タブ */}
        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleProfileUpdate}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Avatar
                    src={profileForm.avatarUrl}
                    sx={{ width: 120, height: 120, mb: 2 }}
                  >
                    {user?.name?.charAt(0)}
                  </Avatar>
                  <Button variant="outlined" size="small">
                    画像を変更
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} sm={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="名前"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="メールアドレス"
                      value={user?.email}
                      disabled
                      helperText="メールアドレスは変更できません"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="アバターURL"
                      value={profileForm.avatarUrl}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          avatarUrl: e.target.value,
                        })
                      }
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      startIcon={isLoading && <CircularProgress size={20} />}
                    >
                      更新
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* パスワード変更タブ */}
        <TabPanel value={tabValue} index={1}>
          <Box component="form" onSubmit={handlePasswordChange}>
            <Grid container spacing={2} maxWidth={400}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="現在のパスワード"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="新しいパスワード"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  helperText="8文字以上、英大文字・小文字・数字を含む"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="新しいパスワード（確認）"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={isLoading && <CircularProgress size={20} />}
                >
                  パスワードを変更
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
};
```

### 4.4 ユーザーサービス実装 🔥
**期間**: 1日  
**担当**: フロントエンド開発者

**作業内容**:
- [ ] ユーザー関連API呼び出し
- [ ] エラーハンドリング
- [ ] 型定義

**services/userService.ts例**:
```typescript
import { api } from './api';

export interface UpdateProfileData {
  name: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    projects: number;
    apiTests: number;
  };
}

export const userService = {
  // プロフィール取得
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/profile');
    return response.data.data;
  },

  // プロフィール更新
  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  // パスワード変更
  changePassword: async (data: ChangePasswordData) => {
    const response = await api.put('/users/password', data);
    return response.data;
  },

  // ユーザー一覧取得（管理者のみ）
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  },
};
```

### 4.5 ルーティング設定 🔥
**期間**: 0.5日  
**担当**: フルスタック開発者

**作業内容**:
- [ ] ユーザー関連エンドポイントの追加
- [ ] 管理者権限チェック
- [ ] バリデーションミドルウェア

**routes/users.ts例**:
```typescript
import express from 'express';
import { userController } from '../controllers/userController';
import { adminController } from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// ユーザー自身のプロフィール管理
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.put('/password', authenticateToken, userController.changePassword);

// 管理者向け機能
router.get('/admin/users', 
  authenticateToken, 
  requireRole(['admin']), 
  adminController.getUsers
);

router.put('/admin/users/:userId/role',
  authenticateToken,
  requireRole(['admin']),
  adminController.updateUserRole
);

export { router as userRouter };
```

## 完了条件

### 技術的完了条件
- [ ] プロフィール取得・更新が正常に動作する
- [ ] パスワード変更が正常に動作する
- [ ] 管理者向けユーザー管理が動作する
- [ ] 適切な認可制御が実装される

### UI/UX条件
- [ ] 直感的なプロフィール画面
- [ ] 分かりやすいエラーメッセージ
- [ ] レスポンシブデザイン対応

### セキュリティ条件
- [ ] パスワード変更時の現在パスワード確認
- [ ] 適切な入力値検証
- [ ] 管理者権限の適切なチェック

## 次のタスクへの依存関係
- Task 05 (プロジェクト管理): ユーザー情報をプロジェクトで使用
- Task 12 (チーム機能): ユーザー管理機能を拡張

## 見積もり
- **総工数**: 6日
- **クリティカルパス**: バックエンドAPI → フロントエンドUI → 管理機能

## リスク要因
1. **セキュリティリスク**: パスワード変更の脆弱性
2. **UXリスク**: 複雑なフォームによるユーザビリティ低下
3. **性能リスク**: ユーザー一覧の表示速度

## 対応策
1. セキュリティレビューの実施
2. ユーザビリティテストの実施
3. ページネーションと検索機能の最適化
