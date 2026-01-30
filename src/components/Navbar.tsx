import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Home, Gamepad2, User, LogOut, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore, useUserStore } from '@/store';

/**
 * Navbar Component
 * Main navigation bar with theme toggle and user info
 */

export function Navbar() {
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { profile, logout, isAuthenticated } = useUserStore();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
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
            {authenticated && (
              <>
                <Link
                  to="/"
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-steam-accent dark:hover:text-steam-accent transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('nav.home')}</span>
                </Link>

                <Link
                  to="/games"
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-steam-accent dark:hover:text-steam-accent transition-colors"
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('nav.games')}</span>
                </Link>

                <Link
                  to="/guides"
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-steam-accent dark:hover:text-steam-accent transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('nav.guides')}</span>
                </Link>

                <Link
                  to={`/profile/${profile?.steamid}`}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-steam-accent dark:hover:text-steam-accent transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('nav.profile')}</span>
                </Link>

                {/* User Info */}
                {profile && (
                  <div className="flex items-center space-x-3 pl-4 border-l border-gray-300 dark:border-steam-dark">
                    <img
                      src={profile.avatar}
                      alt={profile.personaname}
                      className="w-8 h-8 rounded-full border-2 border-steam-accent"
                    />
                    <span className="hidden md:inline text-sm font-medium text-gray-900 dark:text-white">
                      {profile.personaname}
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
