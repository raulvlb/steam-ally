import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * Steam API Client
 * Handles all HTTP requests to Steam Web API with retry logic and error handling
 */

// Use Vite proxy in development, direct API in production
const STEAM_API_BASE_URL = import.meta.env.DEV ? '/api/steam' : 'https://api.steampowered.com';
const STEAM_STORE_API = import.meta.env.DEV ? '/store.steampowered.com/api' : 'https://store.steampowered.com/api';
const API_KEY = import.meta.env.VITE_STEAM_API_KEY;

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

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
    const url = `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/`;
    return this.get(url, {
      params: {
        key: API_KEY,
        steamids: steamIds.join(','),
      },
    });
  }

  /**
   * Resolve vanity URL to Steam ID
   */
  async resolveVanityURL(vanityUrl: string) {
    const url = `${STEAM_API_BASE_URL}/ISteamUser/ResolveVanityURL/v0001/`;
    return this.get(url, {
      params: {
        key: API_KEY,
        vanityurl: vanityUrl,
      },
    });
  }

  /**
   * Get owned games for a user
   */
  async getOwnedGames(steamId: string, includeAppInfo = true, includeFreeGames = true) {
    const url = `${STEAM_API_BASE_URL}/IPlayerService/GetOwnedGames/v0001/`;
    return this.get(url, {
      params: {
        key: API_KEY,
        steamid: steamId,
        include_appinfo: includeAppInfo ? 1 : 0,
        include_played_free_games: includeFreeGames ? 1 : 0,
      },
    });
  }

  /**
   * Get recently played games
   */
  async getRecentlyPlayedGames(steamId: string) {
    const url = `${STEAM_API_BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v0001/`;
    return this.get(url, {
      params: {
        key: API_KEY,
        steamid: steamId,
      },
    });
  }

  /**
   * Get user stats for game
   */
  async getUserStatsForGame(steamId: string, appId: number) {
    const url = `${STEAM_API_BASE_URL}/ISteamUserStats/GetUserStatsForGame/v0002/`;
    return this.get(url, {
      params: {
        key: API_KEY,
        steamid: steamId,
        appid: appId,
      },
    });
  }

  /**
   * Get player achievements
   */
  async getPlayerAchievements(steamId: string, appId: number) {
    const url = `${STEAM_API_BASE_URL}/ISteamUserStats/GetPlayerAchievements/v0001/`;
    return this.get(url, {
      params: {
        key: API_KEY,
        steamid: steamId,
        appid: appId,
      },
    });
  }

  /**
   * Get game schema (achievement definitions)
   */
  async getSchemaForGame(appId: number) {
    const url = `${STEAM_API_BASE_URL}/ISteamUserStats/GetSchemaForGame/v2/`;
    return this.get(url, {
      params: {
        key: API_KEY,
        appid: appId,
      },
    });
  }

  /**
   * Get Steam level
   */
  async getSteamLevel(steamId: string) {
    const url = `${STEAM_API_BASE_URL}/IPlayerService/GetSteamLevel/v1/`;
    return this.get(url, {
      params: {
        key: API_KEY,
        steamid: steamId,
      },
    });
  }

  /**
   * Get game details from Steam Store API
   */
  async getGameDetails(appId: number) {
    const url = `${STEAM_STORE_API}/appdetails`;
    return this.get(url, {
      params: {
        appids: appId,
        l: 'english',
      },
    });
  }

  /**
   * Search games on Steam
   */
  async searchGames(query: string) {
    const url = `${STEAM_STORE_API}/storesearch`;
    return this.get(url, {
      params: {
        term: query,
        l: 'english',
        cc: 'US',
      },
    });
  }

  /**
   * Get featured games from Steam
   */
  async getFeaturedGames() {
    const url = `${STEAM_STORE_API}/featured`;
    return this.get(url);
  }

  /**
   * Get featured categories with promotions and featured games
   */
  async getFeaturedCategories() {
    const url = `${STEAM_STORE_API}/featuredcategories`;
    return this.get(url, {
      params: {
        l: 'portuguese',
        cc: 'BR',
      },
    });
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(steamId: string) {
    // Steam wishlist uses a different endpoint
    const url = import.meta.env.DEV 
      ? `/store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/`
      : `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/`;
    
    return this.get(url);
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
        const url = `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/`;
        const response: any = await this.get(url, {
          params: {
            key: API_KEY,
            steamids: cleaned,
          },
        });
        
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
      const vanityUrl = `${STEAM_API_BASE_URL}/ISteamUser/ResolveVanityURL/v0001/`;
      const vanityResponse: any = await this.get(vanityUrl, {
        params: {
          key: API_KEY,
          vanityurl: cleaned,
        },
      });

      if (vanityResponse?.response?.success === 1) {
        const steamId = vanityResponse.response.steamid;
        
        // Get player info
        const url = `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/`;
        const response: any = await this.get(url, {
          params: {
            key: API_KEY,
            steamids: steamId,
          },
        });
        
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
