import { query } from '../database/connection';
import { User } from '../types/index';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findBySteamId(steamId: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE steam_id = $1',
      [steamId]
    );
    return result.rows[0] || null;
  }

  async createOrUpdate(steamId: string, username: string, avatar: string | null): Promise<User> {
    const result = await query<User>(
      `INSERT INTO users (steam_id, username, avatar)
       VALUES ($1, $2, $3)
       ON CONFLICT (steam_id)
       DO UPDATE SET username = $2, avatar = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [steamId, username, avatar]
    );
    return result.rows[0];
  }

  async updateProfile(id: string, username: string, avatar: string | null): Promise<User | null> {
    const result = await query<User>(
      `UPDATE users SET username = $1, avatar = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [username, avatar, id]
    );
    return result.rows[0] || null;
  }
}

export const userRepository = new UserRepository();
