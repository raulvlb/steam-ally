/**
 * Vercel Serverless Function - Steam API Proxy
 * This function proxies requests to Steam API to avoid CORS issues
 */

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_API_BASE = 'https://api.steampowered.com';
const STEAM_STORE_BASE = 'https://store.steampowered.com';

// Helper to make requests to Steam API
async function fetchSteamAPI(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Steam API returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Steam API Error:', error);
    throw error;
  }
}

// Main handler
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, ...params } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    let url;
    let data;

    switch (endpoint) {
      // Player Summaries
      case 'GetPlayerSummaries': {
        const { steamids } = params;
        if (!steamids) {
          return res.status(400).json({ error: 'Missing steamids' });
        }
        url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamids}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // Resolve Vanity URL
      case 'ResolveVanityURL': {
        const { vanityurl } = params;
        if (!vanityurl) {
          return res.status(400).json({ error: 'Missing vanityurl' });
        }
        url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanityurl}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // Owned Games
      case 'GetOwnedGames': {
        const { steamid, include_appinfo = 1, include_played_free_games = 1 } = params;
        if (!steamid) {
          return res.status(400).json({ error: 'Missing steamid' });
        }
        url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamid}&include_appinfo=${include_appinfo}&include_played_free_games=${include_played_free_games}&format=json`;
        data = await fetchSteamAPI(url);
        break;
      }

      // Player Achievements
      case 'GetPlayerAchievements': {
        const { steamid, appid } = params;
        if (!steamid || !appid) {
          return res.status(400).json({ error: 'Missing steamid or appid' });
        }
        url = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appid}&key=${STEAM_API_KEY}&steamid=${steamid}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // Game Schema
      case 'GetSchemaForGame': {
        const { appid } = params;
        if (!appid) {
          return res.status(400).json({ error: 'Missing appid' });
        }
        url = `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appid}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // User Stats
      case 'GetUserStatsForGame': {
        const { steamid, appid } = params;
        if (!steamid || !appid) {
          return res.status(400).json({ error: 'Missing steamid or appid' });
        }
        url = `${STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${appid}&key=${STEAM_API_KEY}&steamid=${steamid}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // Recent Games
      case 'GetRecentlyPlayedGames': {
        const { steamid, count = 0 } = params;
        if (!steamid) {
          return res.status(400).json({ error: 'Missing steamid' });
        }
        url = `${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamid}&format=json&count=${count}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // Steam Level
      case 'GetSteamLevel': {
        const { steamid } = params;
        if (!steamid) {
          return res.status(400).json({ error: 'Missing steamid' });
        }
        url = `${STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/?key=${STEAM_API_KEY}&steamid=${steamid}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // App Details (Store API)
      case 'GetAppDetails': {
        const { appids, cc = 'us', l = 'english' } = params;
        if (!appids) {
          return res.status(400).json({ error: 'Missing appids' });
        }
        url = `${STEAM_STORE_BASE}/api/appdetails?appids=${appids}&cc=${cc}&l=${l}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // Featured Games
      case 'GetFeaturedGames': {
        const { cc = 'us' } = params;
        url = `${STEAM_STORE_BASE}/api/featured?cc=${cc}`;
        data = await fetchSteamAPI(url);
        break;
      }

      // Featured Categories
      case 'GetFeaturedCategories': {
        const { cc = 'us' } = params;
        url = `${STEAM_STORE_BASE}/api/featuredcategories?cc=${cc}`;
        data = await fetchSteamAPI(url);
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
    }

    // Return success response
    return res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
