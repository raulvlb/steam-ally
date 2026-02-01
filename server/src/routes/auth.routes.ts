import { Router, Response } from 'express';
import { config } from '../config/index';
import { steamService } from '../services/steam.service';
import { userRepository } from '../repositories/user.repository';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /auth/steam
 * Initiates Steam OpenID authentication
 */
router.get('/steam', (req, res) => {
  const returnUrl = config.steamReturnUrl;
  const realm = config.steamRealm;
  const authUrl = steamService.buildOpenIdUrl(returnUrl, realm);
  
  res.redirect(authUrl);
});

/**
 * GET /auth/steam/callback
 * Handles Steam OpenID callback
 */
router.get('/steam/callback', async (req, res) => {
  try {
    // Convert query params - Express may parse dots as nested objects
    const params: Record<string, string> = {};
    
    // Handle both flat and nested query params
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        params[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects (openid.claimed_id might become { openid: { claimed_id: ... } })
        const flattenObject = (obj: any, prefix = ''): void => {
          for (const [k, v] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${k}` : k;
            if (typeof v === 'string') {
              params[newKey] = v;
            } else if (typeof v === 'object' && v !== null) {
              flattenObject(v, newKey);
            }
          }
        };
        flattenObject(value, key);
      }
    }
    
    console.log('Steam callback params:', Object.keys(params));
    console.log('Full params:', JSON.stringify(params, null, 2));
    
    // Check if Steam returned an error
    if (params['openid.error']) {
      console.error('Steam OpenID error:', params['openid.error']);
      return res.redirect(`${config.frontendUrl}?error=steam_error&message=${encodeURIComponent(params['openid.error'])}`);
    }
    
    // Verify OpenID response
    const steamId = await steamService.verifyOpenId(params);
    
    console.log('Verified Steam ID:', steamId);
    
    if (!steamId) {
      console.error('Steam verification failed');
      return res.redirect(`${config.frontendUrl}?error=auth_failed`);
    }

    // Get Steam profile
    const profile = await steamService.getPlayerSummary(steamId);
    
    if (!profile) {
      return res.redirect(`${config.frontendUrl}?error=profile_fetch_failed`);
    }

    // Create or update user
    const user = await userRepository.createOrUpdate(
      steamId,
      profile.personaname,
      profile.avatarfull || profile.avatar
    );

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      steamId: user.steam_id,
      username: user.username,
    });

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: config.cookieSameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: config.isProduction ? config.cookieDomain : undefined,
    });

    // Redirect to frontend with success
    res.redirect(`${config.frontendUrl}?auth=success`);
  } catch (error) {
    console.error('Steam callback error:', error);
    res.redirect(`${config.frontendUrl}?error=auth_error`);
  }
});

/**
 * GET /auth/me
 * Returns current authenticated user
 */
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userRepository.findById(req.user!.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        steamId: user.steam_id,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

/**
 * POST /auth/logout
 * Clears authentication cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    domain: config.isProduction ? config.cookieDomain : undefined,
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /auth/check
 * Check if user is authenticated (no auth required)
 */
router.get('/check', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = req.cookies?.auth_token;
    
    if (!token) {
      return res.json({
        success: true,
        authenticated: false,
      });
    }

    // Try to verify token
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, config.jwtSecret) as any;
    
    const user = await userRepository.findById(decoded.userId);
    
    if (!user) {
      return res.json({
        success: true,
        authenticated: false,
      });
    }

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        steamId: user.steam_id,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.json({
      success: true,
      authenticated: false,
    });
  }
});

export default router;
