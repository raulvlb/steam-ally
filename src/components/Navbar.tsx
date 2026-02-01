import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Gamepad2, User, LogOut, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore, useUserStore, useAuthStore } from '@/store';
import { SteamLoginButton } from './SteamLoginButton';

/**
 * Navbar Component
 * Main navigation bar with theme toggle and user info
 */

export function Navbar() {
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { profile, logout: legacyLogout, isAuthenticated: legacyIsAuthenticated } = useUserStore();
  const { user: authUser, isAuthenticated: apiAuthenticated, logout: apiLogout } = useAuthStore();
  const navigate = useNavigate();
  
  // Support both legacy auth (SteamID input) and new API auth (Steam OpenID)
  const authenticated = legacyIsAuthenticated() || apiAuthenticated;
  const displayProfile = profile || (authUser ? {
    personaname: authUser.username,
    avatar: authUser.avatar || '',
    steamid: authUser.steamId,
  } : null);

  const handleLogout = async () => {
    legacyLogout();
    await apiLogout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-steam-darker border-b border-gray-200 dark:border-steam-dark sticky top-0 z-50 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold text-steam-accent hover:opacity-80 transition-opacity"
          >
            <Gamepad2 className="w-8 h-8" />
            <span>Steam Ally</span>
          </Link>

          {/* Navigation Links & User Info */}
          <div className="flex items-center space-x-6">
            {/* Community Guides - Always visible */}
            <Link
              to="/community-guides"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-steam-accent dark:hover:text-steam-accent transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span className="hidden sm:inline">Guias</span>
            </Link>

            {authenticated && (
              <>
                <Link
                  to={`/profile/${displayProfile?.steamid}`}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-steam-accent dark:hover:text-steam-accent transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('nav.profile')}</span>
                </Link>

                {/* User Info */}
                {displayProfile && (
                  <div className="flex items-center space-x-3 pl-4 border-l border-gray-300 dark:border-steam-dark">
                    <img
                      src={displayProfile.avatar}
                      alt={displayProfile.personaname}
                      className="w-8 h-8 rounded-full border-2 border-steam-accent"
                    />
                    <span className="hidden md:inline text-sm font-medium text-gray-900 dark:text-white">
                      {displayProfile.personaname}
                    </span>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-red-600 dark:text-red-300"
                  aria-label="Change user"
                  title="Change Steam account"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Steam Login Button (when not authenticated) */}
            {!authenticated && (
              <SteamLoginButton size="sm" />
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-steam-dark hover:bg-gray-200 dark:hover:bg-steam-light transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
