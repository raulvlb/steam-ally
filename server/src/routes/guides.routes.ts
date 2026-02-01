import { Router, Response } from 'express';
import { z } from 'zod';
import { guideRepository } from '../repositories/guide.repository';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createGuideSchema = z.object({
  steamAppId: z.number().int().positive(),
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  isPublic: z.boolean().optional().default(true),
});

const updateGuideSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
});

/**
 * GET /guides
 * List public guides with optional filtering
 */
router.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const appId = req.query.appId ? parseInt(req.query.appId as string) : undefined;

    const { guides, total } = await guideRepository.findPublicGuides(
      page,
      pageSize,
      req.user?.userId,
      appId
    );

    res.json({
      success: true,
      data: guides.map(formatGuideResponse),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('List guides error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guides',
    });
  }
});

/**
 * GET /guides/my
 * List current user's guides
 */
router.get('/my', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const { guides, total } = await guideRepository.findByAuthor(
      req.user!.userId,
      page,
      pageSize
    );

    res.json({
      success: true,
      data: guides.map(formatGuideResponse),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('List my guides error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guides',
    });
  }
});

/**
 * GET /guides/:id
 * Get a single guide by ID
 */
router.get('/:id', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guide = await guideRepository.findByIdWithDetails(req.params.id, req.user?.userId);

    if (!guide) {
      return res.status(404).json({
        success: false,
        error: 'Guide not found',
      });
    }

    // Check if guide is public or user is the author
    if (!guide.is_public && guide.author_id !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: formatGuideResponse(guide),
    });
  } catch (error) {
    console.error('Get guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guide',
    });
  }
});

/**
 * POST /guides
 * Create a new guide
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createGuideSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const { steamAppId, title, content, isPublic } = validation.data;

    const guide = await guideRepository.create(
      req.user!.userId,
      steamAppId,
      title,
      content,
      isPublic
    );

    const fullGuide = await guideRepository.findByIdWithDetails(guide.id, req.user!.userId);

    res.status(201).json({
      success: true,
      data: formatGuideResponse(fullGuide!),
    });
  } catch (error) {
    console.error('Create guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create guide',
    });
  }
});

/**
 * PUT /guides/:id
 * Update an existing guide (author only)
 */
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guide = await guideRepository.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({
        success: false,
        error: 'Guide not found',
      });
    }

    if (guide.author_id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own guides',
      });
    }

    const validation = updateGuideSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const { title, content, isPublic } = validation.data;

    const updatedGuide = await guideRepository.update(
      req.params.id,
      title ?? guide.title,
      content ?? guide.content,
      isPublic ?? guide.is_public
    );

    const fullGuide = await guideRepository.findByIdWithDetails(updatedGuide!.id, req.user!.userId);

    res.json({
      success: true,
      data: formatGuideResponse(fullGuide!),
    });
  } catch (error) {
    console.error('Update guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update guide',
    });
  }
});

/**
 * DELETE /guides/:id
 * Delete a guide (author only)
 */
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guide = await guideRepository.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({
        success: false,
        error: 'Guide not found',
      });
    }

    if (guide.author_id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own guides',
      });
    }

    await guideRepository.delete(req.params.id);

    res.json({
      success: true,
      message: 'Guide deleted successfully',
    });
  } catch (error) {
    console.error('Delete guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete guide',
    });
  }
});

/**
 * POST /guides/:id/save
 * Save a guide to user's collection
 */
router.post('/:id/save', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guide = await guideRepository.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({
        success: false,
        error: 'Guide not found',
      });
    }

    await guideRepository.saveGuide(req.user!.userId, req.params.id);

    res.json({
      success: true,
      message: 'Guide saved successfully',
    });
  } catch (error) {
    console.error('Save guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save guide',
    });
  }
});

/**
 * DELETE /guides/:id/save
 * Remove a guide from user's saved collection
 */
router.delete('/:id/save', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await guideRepository.unsaveGuide(req.user!.userId, req.params.id);

    res.json({
      success: true,
      message: 'Guide removed from saved',
    });
  } catch (error) {
    console.error('Unsave guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove guide from saved',
    });
  }
});

/**
 * POST /guides/:id/like
 * Like a guide
 */
router.post('/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const guide = await guideRepository.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({
        success: false,
        error: 'Guide not found',
      });
    }

    if (!guide.is_public) {
      return res.status(403).json({
        success: false,
        error: 'Cannot like a private guide',
      });
    }

    await guideRepository.likeGuide(req.user!.userId, req.params.id);
    const likeCount = await guideRepository.getLikeCount(req.params.id);

    res.json({
      success: true,
      message: 'Guide liked successfully',
      totalLikes: likeCount,
    });
  } catch (error) {
    console.error('Like guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like guide',
    });
  }
});

/**
 * DELETE /guides/:id/like
 * Unlike a guide
 */
router.delete('/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await guideRepository.unlikeGuide(req.user!.userId, req.params.id);
    const likeCount = await guideRepository.getLikeCount(req.params.id);

    res.json({
      success: true,
      message: 'Guide unliked successfully',
      totalLikes: likeCount,
    });
  } catch (error) {
    console.error('Unlike guide error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlike guide',
    });
  }
});

// Helper to format guide response
function formatGuideResponse(guide: any) {
  return {
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
  };
}

export default router;
