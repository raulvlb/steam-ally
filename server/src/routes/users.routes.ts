import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { guideRepository } from '../repositories/guide.repository';

const router = Router();

/**
 * GET /users/me/saved-guides
 * Get current user's saved guides
 */
router.get('/me/saved-guides', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const { guides, total } = await guideRepository.getSavedGuides(
      req.user!.userId,
      page,
      pageSize
    );

    res.json({
      success: true,
      data: guides.map(guide => ({
        id: guide.id,
        steamAppId: guide.steam_app_id,
        title: guide.title,
        content: guide.content,
        isPublic: guide.is_public,
        createdAt: guide.created_at,
        updatedAt: guide.updated_at,
        author: {
          id: guide.author_id,
          username: guide.author_username,
          avatar: guide.author_avatar,
          steamId: guide.author_steam_id,
        },
        totalLikes: guide.total_likes || 0,
        likedByUser: guide.liked_by_user || false,
        savedByUser: guide.saved_by_user || false,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get saved guides error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved guides',
    });
  }
});

export default router;
