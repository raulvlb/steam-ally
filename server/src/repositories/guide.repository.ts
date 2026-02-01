import { query } from '../database/connection';
import { Guide, GuideWithDetails } from '../types/index';

export class GuideRepository {
  async findById(id: string): Promise<Guide | null> {
    const result = await query<Guide>(
      'SELECT * FROM guides WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdWithDetails(id: string, userId?: string): Promise<GuideWithDetails | null> {
    const result = await query<GuideWithDetails>(
      `SELECT 
        g.*,
        u.username as author_username,
        u.avatar as author_avatar,
        u.steam_id as author_steam_id,
        COALESCE(likes.count, 0)::int as total_likes,
        CASE WHEN user_like.user_id IS NOT NULL THEN true ELSE false END as liked_by_user,
        CASE WHEN user_save.user_id IS NOT NULL THEN true ELSE false END as saved_by_user
      FROM guides g
      JOIN users u ON g.author_id = u.id
      LEFT JOIN (
        SELECT guide_id, COUNT(*) as count FROM guide_likes GROUP BY guide_id
      ) likes ON likes.guide_id = g.id
      LEFT JOIN guide_likes user_like ON user_like.guide_id = g.id AND user_like.user_id = $2
      LEFT JOIN saved_guides user_save ON user_save.guide_id = g.id AND user_save.user_id = $2
      WHERE g.id = $1`,
      [id, userId || null]
    );
    return result.rows[0] || null;
  }

  async findPublicGuides(
    page: number = 1,
    pageSize: number = 20,
    userId?: string,
    appId?: number
  ): Promise<{ guides: GuideWithDetails[]; total: number }> {
    let whereClause = 'WHERE g.is_public = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (appId) {
      whereClause += ` AND g.steam_app_id = $${paramIndex++}`;
      params.push(appId);
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM guides g ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get guides with details
    const offset = (page - 1) * pageSize;
    params.push(userId || null, pageSize, offset);

    const result = await query<GuideWithDetails>(
      `SELECT 
        g.*,
        u.username as author_username,
        u.avatar as author_avatar,
        u.steam_id as author_steam_id,
        COALESCE(likes.count, 0)::int as total_likes,
        CASE WHEN user_like.user_id IS NOT NULL THEN true ELSE false END as liked_by_user,
        CASE WHEN user_save.user_id IS NOT NULL THEN true ELSE false END as saved_by_user
      FROM guides g
      JOIN users u ON g.author_id = u.id
      LEFT JOIN (
        SELECT guide_id, COUNT(*) as count FROM guide_likes GROUP BY guide_id
      ) likes ON likes.guide_id = g.id
      LEFT JOIN guide_likes user_like ON user_like.guide_id = g.id AND user_like.user_id = $${paramIndex++}
      LEFT JOIN saved_guides user_save ON user_save.guide_id = g.id AND user_save.user_id = $${paramIndex - 1}
      ${whereClause}
      ORDER BY g.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return { guides: result.rows, total };
  }

  async findByAuthor(
    authorId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ guides: GuideWithDetails[]; total: number }> {
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) FROM guides WHERE author_id = $1',
      [authorId]
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    const offset = (page - 1) * pageSize;
    const result = await query<GuideWithDetails>(
      `SELECT 
        g.*,
        u.username as author_username,
        u.avatar as author_avatar,
        u.steam_id as author_steam_id,
        COALESCE(likes.count, 0)::int as total_likes,
        false as liked_by_user,
        false as saved_by_user
      FROM guides g
      JOIN users u ON g.author_id = u.id
      LEFT JOIN (
        SELECT guide_id, COUNT(*) as count FROM guide_likes GROUP BY guide_id
      ) likes ON likes.guide_id = g.id
      WHERE g.author_id = $1
      ORDER BY g.created_at DESC
      LIMIT $2 OFFSET $3`,
      [authorId, pageSize, offset]
    );

    return { guides: result.rows, total };
  }

  async create(
    authorId: string,
    steamAppId: number,
    title: string,
    content: string,
    isPublic: boolean = true
  ): Promise<Guide> {
    const result = await query<Guide>(
      `INSERT INTO guides (author_id, steam_app_id, title, content, is_public)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [authorId, steamAppId, title, content, isPublic]
    );
    return result.rows[0];
  }

  async update(
    id: string,
    title: string,
    content: string,
    isPublic: boolean
  ): Promise<Guide | null> {
    const result = await query<Guide>(
      `UPDATE guides 
       SET title = $1, content = $2, is_public = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title, content, isPublic, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM guides WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Saved guides
  async saveGuide(userId: string, guideId: string): Promise<boolean> {
    try {
      await query(
        `INSERT INTO saved_guides (user_id, guide_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, guideId]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async unsaveGuide(userId: string, guideId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM saved_guides WHERE user_id = $1 AND guide_id = $2',
      [userId, guideId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getSavedGuides(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ guides: GuideWithDetails[]; total: number }> {
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) FROM saved_guides WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    const offset = (page - 1) * pageSize;
    const result = await query<GuideWithDetails>(
      `SELECT 
        g.*,
        u.username as author_username,
        u.avatar as author_avatar,
        u.steam_id as author_steam_id,
        COALESCE(likes.count, 0)::int as total_likes,
        CASE WHEN user_like.user_id IS NOT NULL THEN true ELSE false END as liked_by_user,
        true as saved_by_user
      FROM saved_guides sg
      JOIN guides g ON sg.guide_id = g.id
      JOIN users u ON g.author_id = u.id
      LEFT JOIN (
        SELECT guide_id, COUNT(*) as count FROM guide_likes GROUP BY guide_id
      ) likes ON likes.guide_id = g.id
      LEFT JOIN guide_likes user_like ON user_like.guide_id = g.id AND user_like.user_id = $1
      WHERE sg.user_id = $1
      ORDER BY sg.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    return { guides: result.rows, total };
  }

  // Likes
  async likeGuide(userId: string, guideId: string): Promise<boolean> {
    try {
      await query(
        `INSERT INTO guide_likes (user_id, guide_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, guideId]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async unlikeGuide(userId: string, guideId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM guide_likes WHERE user_id = $1 AND guide_id = $2',
      [userId, guideId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getLikeCount(guideId: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) FROM guide_likes WHERE guide_id = $1',
      [guideId]
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}

export const guideRepository = new GuideRepository();
