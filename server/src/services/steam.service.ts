import { config } from '../config/index';
import { SteamProfile } from '../types/index';

const STEAM_API_BASE = 'https://api.steampowered.com';

export class SteamService {
  async getPlayerSummary(steamId: string): Promise<SteamProfile | null> {
    try {
      const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steamApiKey}&steamids=${steamId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Steam API error:', response.status);
        return null;
      }

      const data = await response.json() as { response?: { players?: SteamProfile[] } };
      const players = data?.response?.players;

      if (!players || players.length === 0) {
        return null;
      }

      return players[0] as SteamProfile;
    } catch (error) {
      console.error('Error fetching Steam profile:', error);
      return null;
    }
  }

  extractSteamIdFromOpenId(claimedIdentifier: string): string | null {
    // Format: https://steamcommunity.com/openid/id/76561198012345678
    const match = claimedIdentifier.match(/\/openid\/id\/(\d+)$/);
    return match ? match[1] : null;
  }

  buildOpenIdUrl(returnUrl: string, realm: string): string {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnUrl,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }

  async verifyOpenId(params: Record<string, string>): Promise<string | null> {
    try {
      // Prepare verification request
      const verifyParams = new URLSearchParams();
      
      for (const [key, value] of Object.entries(params)) {
        verifyParams.append(key, value);
      }
      
      verifyParams.set('openid.mode', 'check_authentication');

      console.log('Verifying OpenID with params:', Array.from(verifyParams.keys()));
      
      const response = await fetch('https://steamcommunity.com/openid/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: verifyParams.toString(),
      });

      const text = await response.text();
      
      console.log('Steam OpenID response:', text);
      
      if (text.includes('is_valid:true')) {
        const claimedId = params['openid.claimed_id'];
        console.log('Claimed ID:', claimedId);
        return this.extractSteamIdFromOpenId(claimedId);
      }

      console.log('OpenID validation failed - is_valid:true not found');
      return null;
    } catch (error) {
      console.error('OpenID verification error:', error);
      return null;
    }
  }
}

export const steamService = new SteamService();
