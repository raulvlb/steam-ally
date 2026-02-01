import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/steam_ally',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Steam
  steamApiKey: process.env.STEAM_API_KEY || '',
  steamRealm: process.env.STEAM_REALM || 'http://localhost:3000',
  steamReturnUrl: process.env.STEAM_RETURN_URL || 'http://localhost:3001/auth/steam/callback',

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',

  // Cookie settings
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieSameSite: 'lax' as 'none' | 'lax' | 'strict',
};
