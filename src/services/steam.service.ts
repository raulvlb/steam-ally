import { steamApiClient } from '@/api/steam';
import { cacheService } from './cache.service';
import {
  UserProfile,
  GameDetails,
  AchievementWithDetails,
  AchievementStats,
  PlayerSummaryResponse,
  OwnedGamesResponse,
  RecentGamesResponse,
  PlayerAchievementsResponse,
  GameSchemaResponse,
  SteamLevelResponse,
  VanityURLResponse,
  PersonaState,
} from '@/types';

/**
 * Steam Service
 * High-level service layer for Steam API operations with caching
 */

class SteamService {
  /**
   * Resolve vanity URL or return Steam ID if already valid
   */
  async resolveSteamId(input: string): Promise<string> {
    // Check if input is already a Steam ID (17 digits)
    if (/^\d{17}$/.test(input)) {
      return input;
    }

    // Try to resolve as vanity URL
    const cacheKey = `vanity:${input}`;
    const cached = cacheService.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const response = (await steamApiClient.resolveVanityURL(input)) as VanityURLResponse;

      if (response.response.success === 1 && response.response.steamid) {
        const steamId = response.response.steamid;
        cacheService.set(cacheKey, steamId, 24 * 60 * 60 * 1000); // Cache for 24 hours
        return steamId;
      }

      throw new Error('Steam ID not found. Please check the ID or vanity URL.');
    } catch (error) {
      throw new Error('Failed to resolve Steam ID. Please verify the input.');
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(steamId: string): Promise<UserProfile> {
    const cacheKey = cacheService.playerKey(steamId);
    const cached = cacheService.get<UserProfile>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch player summary
      const summaryResponse = (await steamApiClient.getPlayerSummaries([
        steamId,
      ])) as PlayerSummaryResponse;

      if (!summaryResponse.response.players.length) {
        throw new Error('Player not found');
      }

      const player = summaryResponse.response.players[0];

      // Fetch Steam level
      let level: number | undefined;
      try {
        const levelResponse = (await steamApiClient.getSteamLevel(steamId)) as SteamLevelResponse;
        level = levelResponse.response.player_level;
      } catch {
        // Level is optional, continue without it
      }

      // Fetch owned games for count and total playtime
      let gamesCount: number | undefined;
      let totalPlaytime: number | undefined;
      try {
        const gamesResponse = (await steamApiClient.getOwnedGames(
          steamId,
          false,
          true
        )) as OwnedGamesResponse;
        gamesCount = gamesResponse.response.game_count;
        totalPlaytime = gamesResponse.response.games.reduce(
          (sum, game) => sum + game.playtime_forever,
          0
        );
      } catch {
        // Games data is optional
      }

      const profile: UserProfile = {
        steamId: player.steamid,
        personaName: player.personaname,
        avatar: player.avatar,
        avatarFull: player.avatarfull,
        profileUrl: player.profileurl,
        realName: player.realname,
        personaState: player.personastate as PersonaState,
        timeCreated: player.timecreated,
        countryCode: player.loccountrycode,
        level,
        gamesCount,
        totalPlaytime,
      };

      cacheService.set(cacheKey, profile);
      return profile;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Get owned games
   */
  async getOwnedGames(steamId: string): Promise<GameDetails[]> {
    const cacheKey = cacheService.gamesKey(steamId);
    const cached = cacheService.get<GameDetails[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = (await steamApiClient.getOwnedGames(
        steamId,
        true,
        true
      )) as OwnedGamesResponse;

      const games: GameDetails[] = response.response.games.map(game => ({
        appId: game.appid,
        name: game.name,
        playtime: game.playtime_forever,
        playtimeRecent: game.playtime_2weeks,
        iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`,
        logoUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
        hasStats: game.has_community_visible_stats,
      }));

      cacheService.set(cacheKey, games);
      return games;
    } catch (error) {
      throw new Error('Failed to fetch owned games');
    }
  }

  /**
   * Get recently played games
   */
  async getRecentlyPlayedGames(steamId: string): Promise<GameDetails[]> {
    try {
      const response = (await steamApiClient.getRecentlyPlayedGames(
        steamId
      )) as RecentGamesResponse;

      if (!response.response.games) {
        return [];
      }

      return response.response.games.map(game => ({
        appId: game.appid,
        name: game.name,
        playtime: game.playtime_forever,
        playtimeRecent: game.playtime_2weeks,
        iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`,
        logoUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get game achievements for a user
   */
  async getGameAchievements(
    steamId: string,
    appId: number
  ): Promise<{ achievements: AchievementWithDetails[]; stats: AchievementStats }> {
    const cacheKey = cacheService.achievementsKey(steamId, appId);
    const cached = cacheService.get<{
      achievements: AchievementWithDetails[];
      stats: AchievementStats;
    }>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch player achievements
      const playerAchievements = (await steamApiClient.getPlayerAchievements(
        steamId,
        appId
      )) as PlayerAchievementsResponse;

      if (!playerAchievements.playerstats.success) {
        throw new Error('Failed to fetch achievements');
      }

      // Fetch game schema for achievement details
      const schemaResponse = (await steamApiClient.getSchemaForGame(
        appId
      )) as GameSchemaResponse;

      const schemaAchievements = schemaResponse.game.availableGameStats?.achievements || [];

      // Merge player achievements with schema details
      const achievements: AchievementWithDetails[] = schemaAchievements.map(schema => {
        const playerAch = playerAchievements.playerstats.achievements?.find(
          a => a.apiname === schema.name
        );

        return {
          apiname: schema.name,
          achieved: playerAch?.achieved || 0,
          unlocktime: playerAch?.unlocktime || 0,
          displayName: schema.displayName,
          description: schema.description || 'Hidden achievement',
          icon: schema.icon,
          iconGray: schema.icongray,
          hidden: schema.hidden === 1,
        };
      });

      const unlocked = achievements.filter(a => a.achieved === 1).length;
      const total = achievements.length;

      const stats: AchievementStats = {
        total,
        unlocked,
        percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      };

      const result = { achievements, stats };
      cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch game achievements');
    }
  }

  /**
   * Search games by name (using owned games)
   */
  async searchGames(steamId: string, query: string): Promise<GameDetails[]> {
    const games = await this.getOwnedGames(steamId);
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return games;
    }

    return games.filter(game => game.name.toLowerCase().includes(normalizedQuery));
  }
}

// Export singleton instance
export const steamService = new SteamService();
