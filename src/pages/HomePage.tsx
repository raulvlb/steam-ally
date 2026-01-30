import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { extractSteamId } from '@/utils';
import { steamService } from '@/services/steam.service';
import { steamApiClient } from '@/api/steam';
import { useUserStore, useToast } from '@/store';
import { useDebounce } from '@/hooks';

/**
 * Home Page
 * Landing page with Steam ID authentication with real-time validation
 */

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    player?: {
      steamId: string;
      personaName: string;
      avatar: string;
      profileUrl: string;
    };
  } | null>(null);
  const { setSteamId, setProfile } = useUserStore();
  const toast = useToast();
  const debouncedSearch = useDebounce(searchInput, 800);

  // Validate Steam identifier as user types
  useState(() => {
    const validateInput = async () => {
      if (!debouncedSearch.trim() || debouncedSearch.length < 2) {
        setValidationResult(null);
        return;
      }

      setIsValidating(true);
      try {
        // Extract Steam ID from URL if it's a URL
        const extracted = extractSteamId(debouncedSearch);
        const identifier = extracted || debouncedSearch.trim();
        
        // Try to resolve and validate
        const result = await steamApiClient.resolveAndValidateUser(identifier);
        
        if (result.success && result.player) {
          setValidationResult({
            valid: true,
            player: result.player,
          });
        } else {
          setValidationResult({
            valid: false,
          });
        }
      } catch (error) {
        setValidationResult({
          valid: false,
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateInput();
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    // If we already validated and found a user, use that
    if (validationResult?.valid && validationResult.player) {
      setIsLoading(true);
      try {
        // Fetch full profile
        const profile = await steamService.getUserProfile(validationResult.player.steamId);
        
        if (!profile) {
          toast.error('Could not load profile. Please try again.');
          return;
        }

        // Save to store - Convert UserProfile to SteamPlayer format
        setSteamId(profile.steamId);
        const steamPlayer: import('@/types').SteamPlayer = {
          steamid: profile.steamId,
          communityvisibilitystate: 3,
          profilestate: 1,
          personaname: profile.personaName,
          profileurl: profile.profileUrl,
          avatar: profile.avatar,
          avatarmedium: profile.avatar,
          avatarfull: profile.avatarFull,
          avatarhash: '',
          personastate: profile.personaState,
          realname: profile.realName,
          timecreated: profile.timeCreated,
          loccountrycode: profile.countryCode,
          personastateflags: 0,
        };
        setProfile(steamPlayer);
        
        toast.success(`Welcome, ${profile.personaName}!`);
        
        // Redirect to profile page
        navigate(`/profile/${profile.steamId}`);
      } catch (error) {
        toast.error('Failed to load Steam profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Otherwise try to validate and load
    setIsLoading(true);
    try {
      // Extract Steam ID from URL or use input directly
      const extracted = extractSteamId(searchInput);
      const steamId = extracted || searchInput.trim();
      
      // Fetch user profile to validate Steam ID
      const profile = await steamService.getUserProfile(steamId);
      
      if (!profile) {
        toast.error('Steam profile not found. Please check your input.');
        return;
      }

      // Save to store - Convert UserProfile to SteamPlayer format
      setSteamId(profile.steamId);
      const steamPlayer: import('@/types').SteamPlayer = {
        steamid: profile.steamId,
        communityvisibilitystate: 3,
        profilestate: 1,
        personaname: profile.personaName,
        profileurl: profile.profileUrl,
        avatar: profile.avatar,
        avatarmedium: profile.avatar,
        avatarfull: profile.avatarFull,
        avatarhash: '',
        personastate: profile.personaState,
        realname: profile.realName,
        timecreated: profile.timeCreated,
        loccountrycode: profile.countryCode,
        personastateflags: 0,
      };
      setProfile(steamPlayer);
      
      toast.success(`Welcome, ${profile.personaName}!`);
      
      // Redirect to profile page
      navigate(`/profile/${profile.steamId}`);
    } catch (error) {
      toast.error('Failed to load Steam profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get validation icon
  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
    if (validationResult?.valid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (validationResult?.valid === false && searchInput.length >= 2) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Search className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-steam-darker via-steam-blue to-steam-dark">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4">
              {t('home.title')}
            </h1>
            <p className="text-xl text-gray-300">
              {t('home.subtitle')}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-steam-dark rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-steam-darker">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('home.form.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.form.description')}
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="steamId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('home.form.label')}
                </label>
                <div className="relative">
                  <input
                    id="steamId"
                    type="text"
                    value={searchInput}
                    onChange={e => {
                      setSearchInput(e.target.value);
                      setValidationResult(null);
                    }}
                    placeholder={t('home.form.placeholder')}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 pr-12 rounded-lg text-gray-900 dark:text-white bg-gray-50 dark:bg-steam-darker border-2 ${
                      validationResult?.valid
                        ? 'border-green-500 focus:border-green-500'
                        : validationResult?.valid === false && searchInput.length >= 2
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-steam-darker focus:border-steam-accent'
                    } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    autoComplete="off"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getValidationIcon()}
                  </div>
                </div>

                {/* Validation feedback */}
                {validationResult?.valid && validationResult.player && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <img
                      src={validationResult.player.avatar}
                      alt={validationResult.player.personaName}
                      className="w-10 h-10 rounded-full border-2 border-green-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {validationResult.player.personaName}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {t('home.form.profileFound')}
                      </p>
                    </div>
                  </div>
                )}

                {validationResult?.valid === false && searchInput.length >= 2 && !isValidating && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {t('home.form.profileNotFound')}
                  </p>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('home.form.exampleNote')}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !searchInput.trim() || (validationResult?.valid === false)}
                className="w-full py-3 px-6 bg-steam-accent hover:bg-opacity-90 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('home.form.loadingProfile')}
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    {t('home.form.accessProfile')}
                  </>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-steam-darker">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-steam-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {t('home.form.help.title')}
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• {t('home.form.help.step1')}</li>
                    <li>• {t('home.form.help.step2')}</li>
                    <li>• {t('home.form.help.step3')}</li>
                    <li>• {t('home.form.help.step4')}</li>
                    <li>• {t('home.form.help.step5')}</li>
                    <li>• {t('home.form.help.step6')}</li>
                    <li>• {t('home.form.help.step7')}</li>
                    <li>• {t('home.form.help.step8')}</li>
                    <li>• {t('home.form.help.step9')}</li>
                    <li>• {t('home.form.exampleNote')}: https://steamcommunity.com/profiles/<strong>76561198012345678</strong>/</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
