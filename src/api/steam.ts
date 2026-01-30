import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import i18n from '@/i18n';

/**
 * Steam API Client
 * Handles all HTTP requests to Steam Web API with retry logic and error handling
 * Uses Vercel serverless functions as proxy to avoid CORS issues
 * Updated: 2026-01-30
 */

// Always use our API proxy (both dev and production)
const API_BASE_URL = '/api/steam';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Map i18n language codes to Steam language codes
const STEAM_LANGUAGE_MAP: Record<string, string> = {
  'en': 'english',
  'pt-BR': 'brazilian',
  'es': 'spanish',
  'fr': 'french',
  'de': 'german',
  'it': 'italian'
};

class SteamApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data || error.message;

      if (status === 401) {
        return new Error('Invalid API key. Please check your Steam API key.');
      } else if (status === 403) {
        return new Error('Access forbidden. The profile may be private.');
      } else if (status === 404) {
        return new Error('Resource not found.');
      } else if (status === 429) {
        return new Error('Too many requests. Please try again later.');
      } else if (status >= 500) {
        return new Error('Steam API is currently unavailable. Please try again later.');
      }

      return new Error(`API Error: ${message}`);
    } else if (error.request) {
      return new Error('Network error. Please check your internet connection.');
    }

    return new Error(error.message || 'An unexpected error occurred.');
  }

  /**
   * Retry logic for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries = MAX_RETRIES
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0) {
        await this.delay(RETRY_DELAY);
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generic GET request with retry
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.client.get<T>(url, config);
      return response.data;
    });
  }

  /**
   * Get player summaries
   */
  async getPlayerSummaries(steamIds: string[]) {
    return this.get(`${API_BASE_URL}?endpoint=GetPlayerSummaries&steamids=${steamIds.join(',')}`);
  }

  /**
   * Resolve vanity URL to Steam ID
   */
  async resolveVanityURL(vanityUrl: string) {
    return this.get(`${API_BASE_URL}?endpoint=ResolveVanityURL&vanityurl=${vanityUrl}`);
  }

  /**
   * Get owned games for a user
   */
  async getOwnedGames(steamId: string, includeAppInfo = true, includeFreeGames = true) {
    return this.get(`${API_BASE_URL}?endpoint=GetOwnedGames&steamid=${steamId}&include_appinfo=${includeAppInfo ? 1 : 0}&include_played_free_games=${includeFreeGames ? 1 : 0}`);
  }

  /**
   * Get recently played games
   */
  async getRecentlyPlayedGames(steamId: string) {
    return this.get(`${API_BASE_URL}?endpoint=GetRecentlyPlayedGames&steamid=${steamId}`);
  }

  /**
   * Get user stats for game
   */
  async getUserStatsForGame(steamId: string, appId: number) {
    return this.get(`${API_BASE_URL}?endpoint=GetUserStatsForGame&steamid=${steamId}&appid=${appId}`);
  }

  /**
   * Get player achievements
   */
  async getPlayerAchievements(steamId: string, appId: number) {
    return this.get(`${API_BASE_URL}?endpoint=GetPlayerAchievements&steamid=${steamId}&appid=${appId}`);
  }

  /**
   * Get game schema (achievement definitions)
   */
  async getSchemaForGame(appId: number) {
    return this.get(`${API_BASE_URL}?endpoint=GetSchemaForGame&appid=${appId}`);
  }

  /**
   * Get Steam level
   */
  async getSteamLevel(steamId: string) {
    return this.get(`${API_BASE_URL}?endpoint=GetSteamLevel&steamid=${steamId}`);
  }

  /**
   * Get game details from Steam Store API
   */
  async getGameDetails(appId: number) {
    const currentLang = i18n.language || 'en';
    const steamLang = STEAM_LANGUAGE_MAP[currentLang] || 'english';
    return this.get(`${API_BASE_URL}?endpoint=GetAppDetails&appids=${appId}&l=${steamLang}`);
  }

  /**
   * Search games on Steam
   */
  async searchGames(query: string) {
    return this.get(`${API_BASE_URL}?endpoint=StoreSearch&term=${encodeURIComponent(query)}`);
  }

  /**
   * Get featured games from Steam
   */
  async getFeaturedGames() {
    return this.get(`${API_BASE_URL}?endpoint=GetFeaturedGames&cc=us`);
  }

  /**
   * Get featured categories with promotions and featured games
   */
  async getFeaturedCategories() {
    return this.get(`${API_BASE_URL}?endpoint=GetFeaturedCategories&cc=BR`);
  }

  /**
   * Get user's wishlist
   * Note: Wishlist API may have CORS issues
   */
  async getWishlist(steamId: string) {
    // Steam wishlist doesn't support CORS - will likely fail
    return this.get(`https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/`);
  }

  /**
   * Try to resolve and validate a Steam identifier (ID, vanity URL, or profile URL)
   * Returns player info if valid
   */
  async resolveAndValidateUser(identifier: string) {
    if (!identifier || identifier.trim().length < 2) {
      return { success: false, player: null };
    }

    try {
      const cleaned = identifier.trim();
      
      // Check if it's a direct Steam ID64 (17 digits)
      if (/^\d{17}$/.test(cleaned)) {
        const response: any = await this.get(`${API_BASE_URL}?endpoint=GetPlayerSummaries&steamids=${cleaned}`);
        
        if (response?.response?.players?.length > 0) {
          const player = response.response.players[0];
          return {
            success: true,
            player: {
              steamId: player.steamid,
              personaName: player.personaname,
              avatar: player.avatar,
              profileUrl: player.profileurl,
            },
          };
        }
      }

      // Try to resolve as vanity URL
      const vanityResponse: any = await this.get(`${API_BASE_URL}?endpoint=ResolveVanityURL&vanityurl=${cleaned}`);

      if (vanityResponse?.response?.success === 1) {
        const steamId = vanityResponse.response.steamid;
        
        // Get player info
        const response: any = await this.get(`${API_BASE_URL}?endpoint=GetPlayerSummaries&steamids=${steamId}`);
        
        if (response?.response?.players?.length > 0) {
          const player = response.response.players[0];
          return {
            success: true,
            player: {
              steamId: player.steamid,
              personaName: player.personaname,
              avatar: player.avatar,
              profileUrl: player.profileurl,
            },
          };
        }
      }

      return { success: false, player: null };
    } catch (error) {
      console.error('Error resolving user:', error);
      return { success: false, player: null };
    }
  }
}

// Export singleton instance
export const steamApiClient = new SteamApiClient();
