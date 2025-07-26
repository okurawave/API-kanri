# Task 05: プロジェクト管理機能

## 概要
APIを整理・管理するためのプロジェクト機能を実装する。

## 目標
- プロジェクトのCRUD操作
- プロジェクト一覧・検索機能
- プロジェクト権限管理
- ダッシュボード画面

## 詳細タスク

### 5.1 プロジェクト管理API 🔥
**期間**: 2日  
**担当**: バックエンド開発者

**作業内容**:
- [ ] プロジェクトCRUD API実装
- [ ] プロジェクト検索・フィルタ機能
- [ ] プロジェクト統計情報取得
- [ ] プロジェクト権限チェック

**controllers/projectController.ts例**:
```typescript
import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { asyncHandler } from '../utils/asyncHandler';
import { validateProject } from '../utils/validation';

export const projectController = {
  // プロジェクト一覧取得
  getProjects: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { page = 1, limit = 20, search, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {
      OR: [
        { ownerId: userId },
        { 
          projectMembers: { 
            some: { userId: userId } 
          } 
        },
        { isPublic: true },
      ],
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { description: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }),
    };

    const orderBy = {
      [sortBy as string]: sortOrder,
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              apis: true,
              projectMembers: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: Number(limit),
      }),
      prisma.project.count({ where }),
    ]);

    // ユーザーの各プロジェクトでの役割を取得
    const projectsWithRole = await Promise.all(
      projects.map(async (project) => {
        let userRole = 'viewer';
        
        if (project.ownerId === userId) {
          userRole = 'owner';
        } else {
          const member = await prisma.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: project.id,
                userId: userId,
              },
            },
          });
          if (member) {
            userRole = member.role;
          }
        }

        return {
          ...project,
          userRole,
        };
      })
    );

    res.json({
      success: true,
      data: {
        projects: projectsWithRole,
        pagination: {
          current_page: Number(page),
          total_pages: Math.ceil(total / Number(limit)),
          total_count: total,
          per_page: Number(limit),
        },
      },
    });
  }),

  // プロジェクト作成
  createProject: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { error, value } = validateProject(req.body);

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

    const { name, description, isPublic = false } = value;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: userId,
        isPublic,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            apis: true,
            projectMembers: true,
          },
        },
      },
    });

    // デフォルト環境の作成
    await prisma.environment.create({
      data: {
        projectId: project.id,
        name: 'development',
        baseUrl: 'https://api.example.com',
        isDefault: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...project,
        userRole: 'owner',
      },
    });
  }),

  // プロジェクト詳細取得
  getProject: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        environments: {
          orderBy: { isDefault: 'desc' },
        },
        projectMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            apis: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    // アクセス権限チェック
    const hasAccess = 
      project.ownerId === userId ||
      project.isPublic ||
      project.projectMembers.some(member => member.userId === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Access denied',
        },
      });
    }

    // ユーザーの役割を取得
    let userRole = 'viewer';
    if (project.ownerId === userId) {
      userRole = 'owner';
    } else {
      const member = project.projectMembers.find(m => m.userId === userId);
      if (member) {
        userRole = member.role;
      }
    }

    // 最近のAPIテスト統計を取得
    const recentTests = await prisma.apiTest.findMany({
      where: {
        api: {
          projectId: project.id,
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 過去7日
        },
      },
      include: {
        results: {
          orderBy: { executedAt: 'desc' },
          take: 1,
        },
      },
    });

    const testStats = {
      total: recentTests.length,
      success: recentTests.filter(test => 
        test.results[0]?.statusCode && test.results[0].statusCode < 400
      ).length,
      failed: recentTests.filter(test => 
        test.results[0]?.statusCode && test.results[0].statusCode >= 400
      ).length,
    };

    res.json({
      success: true,
      data: {
        ...project,
        userRole,
        testStats,
      },
    });
  }),

  // プロジェクト更新
  updateProject: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { error, value } = validateProject(req.body);

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

    // 権限チェック（オーナーまたは管理者のみ）
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        projectMembers: {
          where: { userId: userId },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    const isOwner = project.ownerId === userId;
    const isAdmin = project.projectMembers.some(
      member => member.userId === userId && member.role === 'admin'
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Only project owner or admin can update project',
        },
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: value,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            apis: true,
            projectMembers: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully',
    });
  }),

  // プロジェクト削除
  deleteProject: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // 権限チェック（オーナーのみ）
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    if (project.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Only project owner can delete project',
        },
      });
    }

    // 関連データの削除（Cascadeで自動削除されるがトランザクションで確実に）
    await prisma.$transaction(async (tx) => {
      // テスト結果削除
      await tx.testResult.deleteMany({
        where: {
          test: {
            api: {
              projectId: Number(id),
            },
          },
        },
      });

      // APIテスト削除
      await tx.apiTest.deleteMany({
        where: {
          api: {
            projectId: Number(id),
          },
        },
      });

      // APIパラメータ削除
      await tx.apiParameter.deleteMany({
        where: {
          api: {
            projectId: Number(id),
          },
        },
      });

      // API削除
      await tx.api.deleteMany({
        where: { projectId: Number(id) },
      });

      // 環境削除
      await tx.environment.deleteMany({
        where: { projectId: Number(id) },
      });

      // プロジェクトメンバー削除
      await tx.projectMember.deleteMany({
        where: { projectId: Number(id) },
      });

      // プロジェクト削除
      await tx.project.delete({
        where: { id: Number(id) },
      });
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  }),

  // プロジェクト統計情報取得
  getProjectStats: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    // アクセス権限チェック
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        projectMembers: {
          where: { userId: userId },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    const hasAccess = 
      project.ownerId === userId ||
      project.isPublic ||
      project.projectMembers.length > 0;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: 'Access denied',
        },
      });
    }

    // 統計情報を取得
    const [
      apiCount,
      testCount,
      recentTests,
      apisByMethod,
    ] = await Promise.all([
      // API数
      prisma.api.count({
        where: { projectId: Number(id) },
      }),
      
      // テスト総数
      prisma.apiTest.count({
        where: {
          api: {
            projectId: Number(id),
          },
        },
      }),

      // 過去30日のテスト
      prisma.apiTest.findMany({
        where: {
          api: {
            projectId: Number(id),
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          results: {
            orderBy: { executedAt: 'desc' },
            take: 1,
          },
        },
      }),

      // メソッド別API数
      prisma.api.groupBy({
        by: ['method'],
        where: { projectId: Number(id) },
        _count: true,
      }),
    ]);

    // 成功率計算
    const testsWithResults = recentTests.filter(test => test.results.length > 0);
    const successfulTests = testsWithResults.filter(test => 
      test.results[0].statusCode && test.results[0].statusCode < 400
    );

    const successRate = testsWithResults.length > 0 
      ? (successfulTests.length / testsWithResults.length) * 100 
      : 0;

    // 日別テスト数（過去7日）
    const dailyTests = await prisma.apiTest.groupBy({
      by: ['createdAt'],
      where: {
        api: {
          projectId: Number(id),
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        overview: {
          apiCount,
          testCount,
          successRate: Math.round(successRate * 100) / 100,
          recentTestCount: recentTests.length,
        },
        apisByMethod: apisByMethod.reduce((acc, item) => {
          acc[item.method] = item._count;
          return acc;
        }, {} as Record<string, number>),
        dailyTestCounts: dailyTests.map(item => ({
          date: item.createdAt.toISOString().split('T')[0],
          count: item._count,
        })),
      },
    });
  }),
};
```

### 5.2 プロジェクト管理UI 🔥
**期間**: 3日  
**担当**: フロントエンド開発者

**作業内容**:
- [ ] プロジェクト一覧画面
- [ ] プロジェクト作成・編集フォーム
- [ ] プロジェクト詳細画面
- [ ] プロジェクト削除確認ダイアログ

**pages/Projects.tsx例**:
```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Public,
  Lock,
  Edit,
  Delete,
  Api,
  Group,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { ProjectForm } from '../components/project/ProjectForm';

interface Project {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  userRole: string;
  owner: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  _count: {
    apis: number;
    projectMembers: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // モーダル状態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  
  // メニュー状態
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, [page, searchTerm]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects({
        page,
        limit: 12,
        search: searchTerm,
      });
      setProjects(response.projects);
      setTotalPages(response.pagination.total_pages);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleEdit = () => {
    if (selectedProject) {
      setEditingProject(selectedProject);
      handleMenuClose();
    }
  };

  const handleDelete = () => {
    if (selectedProject) {
      setDeleteConfirmProject(selectedProject);
      handleMenuClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmProject) {
      try {
        await projectService.deleteProject(deleteConfirmProject.id);
        setProjects(projects.filter(p => p.id !== deleteConfirmProject.id));
        setDeleteConfirmProject(null);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleProjectSave = async (projectData: any) => {
    try {
      if (editingProject) {
        // 更新
        const updated = await projectService.updateProject(editingProject.id, projectData);
        setProjects(projects.map(p => 
          p.id === editingProject.id ? { ...p, ...updated } : p
        ));
        setEditingProject(null);
      } else {
        // 新規作成
        const newProject = await projectService.createProject(projectData);
        setProjects([newProject, ...projects]);
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'primary';
      case 'admin': return 'secondary';
      case 'member': return 'default';
      case 'viewer': return 'default';
      default: return 'default';
    }
  };

  const canEdit = (project: Project) => {
    return ['owner', 'admin'].includes(project.userRole);
  };

  const canDelete = (project: Project) => {
    return project.userRole === 'owner';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">プロジェクト</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          新規プロジェクト
        </Button>
      </Box>

      {/* 検索バー */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="プロジェクトを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* プロジェクト一覧 */}
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} lg={4} key={project.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {project.isPublic ? <Public fontSize="small" /> : <Lock fontSize="small" />}
                    <Typography variant="h6" noWrap>
                      {project.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, project);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2, height: 40, overflow: 'hidden' }}
                >
                  {project.description || '説明なし'}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Avatar 
                    src={project.owner.avatarUrl} 
                    sx={{ width: 24, height: 24 }}
                  >
                    {project.owner.name.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {project.owner.name}
                  </Typography>
                  <Chip 
                    label={project.userRole} 
                    size="small" 
                    color={getRoleColor(project.userRole) as any}
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Api fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {project._count.apis}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Group fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {project._count.projectMembers + 1}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* メニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedProject && canEdit(selectedProject) && (
          <MenuItem onClick={handleEdit}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            編集
          </MenuItem>
        )}
        {selectedProject && canDelete(selectedProject) && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            削除
          </MenuItem>
        )}
      </Menu>

      {/* プロジェクト作成モーダル */}
      <Dialog 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>新規プロジェクト作成</DialogTitle>
        <DialogContent>
          <ProjectForm
            onSave={handleProjectSave}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* プロジェクト編集モーダル */}
      <Dialog 
        open={Boolean(editingProject)} 
        onClose={() => setEditingProject(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>プロジェクト編集</DialogTitle>
        <DialogContent>
          {editingProject && (
            <ProjectForm
              initialData={editingProject}
              onSave={handleProjectSave}
              onCancel={() => setEditingProject(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={Boolean(deleteConfirmProject)}
        onClose={() => setDeleteConfirmProject(null)}
      >
        <DialogTitle>プロジェクトの削除</DialogTitle>
        <DialogContent>
          <Typography>
            プロジェクト「{deleteConfirmProject?.name}」を削除しますか？
            この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmProject(null)}>
            キャンセル
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
```

### 5.3 プロジェクトサービス実装 🔥
**期間**: 1日  
**担当**: フロントエンド開発者

**作業内容**:
- [ ] プロジェクト関連API呼び出し
- [ ] 型定義
- [ ] エラーハンドリング

### 5.4 ダッシュボード画面 🟡
**期間**: 2日  
**担当**: フロントエンド開発者

**作業内容**:
- [ ] 全体統計の表示
- [ ] 最近のアクティビティ
- [ ] クイックアクション
- [ ] グラフ・チャートの実装

### 5.5 プロジェクト権限管理 🟡
**期間**: 1.5日  
**担当**: フルスタック開発者

**作業内容**:
- [ ] 権限レベルの定義
- [ ] 権限チェックミドルウェア
- [ ] UI での権限制御

## 完了条件

### 技術的完了条件
- [ ] プロジェクトCRUD操作が正常に動作する
- [ ] 検索・フィルタ機能が動作する
- [ ] 権限制御が適切に機能する
- [ ] ダッシュボードに統計情報が表示される

### UI/UX条件
- [ ] 直感的なプロジェクト管理UI
- [ ] レスポンシブデザイン対応
- [ ] 適切なローディング状態表示

### パフォーマンス条件
- [ ] プロジェクト一覧が2秒以内に表示される
- [ ] ページネーションが正常に動作する

## 次のタスクへの依存関係
- Task 06 (API管理): プロジェクト内でAPIを管理
- Task 10 (環境管理): プロジェクト内で環境を管理

## 見積もり
- **総工数**: 8日
- **クリティカルパス**: プロジェクトAPI → UI実装 → 権限管理

## リスク要因
1. **権限管理の複雑さ**: 多段階の権限制御
2. **パフォーマンス**: 大量のプロジェクトがある場合
3. **UX**: 複雑な機能による使いづらさ

## 対応策
1. 権限マトリックスを事前定義
2. ページネーションと検索機能の最適化
3. ユーザビリティテストの実施
