import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Steam API key at startup
const STEAM_API_KEY = process.env.STEAM_API_KEY || '';
console.log('[Vite Config] STEAM_API_KEY loaded:', STEAM_API_KEY ? `${STEAM_API_KEY.substring(0, 4)}...` : 'MISSING');

// Steam API proxy plugin for local development
function steamApiPlugin(): Plugin {
  return {
    name: 'steam-api-proxy',
    configureServer(server) {
      console.log('[Steam API Proxy] Plugin registered!');
      
      // Use path-based middleware
      server.middlewares.use('/api/steam', async (req, res) => {
        try {
          const fullUrl = `http://localhost:3000${req.url}`;
          const url = new URL(fullUrl);
          const endpoint = url.searchParams.get('endpoint');

          console.log('[Steam API Proxy] Request:', endpoint);

          if (!endpoint) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing endpoint parameter' }));
            return;
          }

          const STEAM_API_BASE = 'https://api.steampowered.com';
          const STEAM_STORE_BASE = 'https://store.steampowered.com';

          let targetUrl = '';

          switch (endpoint) {
            case 'StoreSearch': {
              const term = url.searchParams.get('term') || '';
              targetUrl = `${STEAM_STORE_BASE}/api/storesearch?term=${encodeURIComponent(term)}&l=english&cc=US`;
              break;
            }
            case 'GetAppDetails': {
              const appids = url.searchParams.get('appids') || '';
              const cc = url.searchParams.get('cc') || 'us';
              const l = url.searchParams.get('l') || 'english';
              targetUrl = `${STEAM_STORE_BASE}/api/appdetails?appids=${appids}&cc=${cc}&l=${l}`;
              break;
            }
            case 'GetFeaturedGames': {
              const cc = url.searchParams.get('cc') || 'us';
              targetUrl = `${STEAM_STORE_BASE}/api/featured?cc=${cc}`;
              break;
            }
            case 'GetFeaturedCategories': {
              const cc = url.searchParams.get('cc') || 'us';
              targetUrl = `${STEAM_STORE_BASE}/api/featuredcategories?cc=${cc}`;
              break;
            }
            case 'GetPlayerSummaries': {
              const steamids = url.searchParams.get('steamids') || '';
              targetUrl = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamids}`;
              break;
            }
            case 'ResolveVanityURL': {
              const vanityurl = url.searchParams.get('vanityurl') || '';
              targetUrl = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanityurl}`;
              break;
            }
            case 'GetOwnedGames': {
              const steamid = url.searchParams.get('steamid') || '';
              const includeAppInfo = url.searchParams.get('include_appinfo') || '1';
              const includeFreeGames = url.searchParams.get('include_played_free_games') || '1';
              targetUrl = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamid}&include_appinfo=${includeAppInfo}&include_played_free_games=${includeFreeGames}&format=json`;
              break;
            }
            case 'GetPlayerAchievements': {
              const steamid = url.searchParams.get('steamid') || '';
              const appid = url.searchParams.get('appid') || '';
              targetUrl = `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appid}&key=${STEAM_API_KEY}&steamid=${steamid}`;
              break;
            }
            case 'GetSchemaForGame': {
              const appid = url.searchParams.get('appid') || '';
              targetUrl = `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appid}`;
              break;
            }
            case 'GetUserStatsForGame': {
              const steamid = url.searchParams.get('steamid') || '';
              const appid = url.searchParams.get('appid') || '';
              targetUrl = `${STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${appid}&key=${STEAM_API_KEY}&steamid=${steamid}`;
              break;
            }
            case 'GetRecentlyPlayedGames': {
              const steamid = url.searchParams.get('steamid') || '';
              targetUrl = `${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamid}&format=json`;
              break;
            }
            case 'GetSteamLevel': {
              const steamid = url.searchParams.get('steamid') || '';
              targetUrl = `${STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/?key=${STEAM_API_KEY}&steamid=${steamid}`;
              break;
            }
            default: {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }));
              return;
            }
          }

          console.log('[Steam API Proxy] Fetching from Steam API...');
          const response = await fetch(targetUrl);
          
          if (!response.ok) {
            console.error('[Steam API Proxy] Steam API error:', response.status);
            const errorText = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Steam API returned ${response.status}`, details: errorText }));
            return;
          }
          
          const data = await response.json();
          console.log('[Steam API Proxy] Success!');
          
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(data));
        } catch (error: any) {
          console.error('[Steam API Proxy] Error:', error.message);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to fetch from Steam API', message: error.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), steamApiPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
