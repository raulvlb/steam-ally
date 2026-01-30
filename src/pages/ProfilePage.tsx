import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, MapPin, Award, Clock, Gamepad2, Loader2 } from 'lucide-react';
import { useSteamProfile, useSteamGames } from '@/hooks';
import { steamService } from '@/services/steam.service';
import { GameDetails } from '@/types';
import { formatPlaytime, formatDate, getPersonaStateLabel, getPersonaStateColor } from '@/utils';
import { Card, CardHeader, CardContent, GameCard, SkeletonProfile, SkeletonList } from '@/components';

/**
 * Profile Page
 * Displays Steam user profile and games
 */

export function ProfilePage() {
  const { steamId } = useParams<{ steamId: string }>();
  const { profile, isLoading: profileLoading } = useSteamProfile(steamId || null);
  const { games, isLoading: gamesLoading } = useSteamGames(steamId || null);
  const [recentGames, setRecentGames] = useState<GameDetails[]>([]);

  useEffect(() => {
    if (steamId) {
      steamService.getRecentlyPlayedGames(steamId).then(setRecentGames).catch(() => {});
    }
  }, [steamId]);

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonProfile />
        <div className="mt-8">
          <SkeletonList count={3} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The requested profile could not be found or is private.
              </p>
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-steam-accent text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalHours = profile.totalPlaytime ? Math.floor(profile.totalPlaytime / 60) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <img
              src={profile.avatarFull}
              alt={profile.personaName}
              className="w-32 h-32 rounded-lg shadow-lg"
            />

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {profile.personaName}
              </h1>
              {profile.realName && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                  {profile.realName}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                <span className={`flex items-center ${getPersonaStateColor(profile.personaState)}`}>
                  <div className="w-2 h-2 rounded-full bg-current mr-2" />
                  {getPersonaStateLabel(profile.personaState)}
                </span>
                {profile.countryCode && (
                  <span className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.countryCode}
                  </span>
                )}
                {profile.timeCreated && (
                  <span className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    Member since {formatDate(profile.timeCreated)}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col space-y-4">
              {profile.level !== undefined && (
                <div className="text-center bg-steam-accent bg-opacity-10 rounded-lg p-4">
                  <Award className="w-8 h-8 text-steam-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold text-steam-accent">{profile.level}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-steam-dark rounded-lg p-4 text-center">
              <Gamepad2 className="w-8 h-8 text-steam-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.gamesCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Games Owned</div>
            </div>

            <div className="bg-gray-50 dark:bg-steam-dark rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 text-steam-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalHours.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Hours Played</div>
            </div>

            <div className="bg-gray-50 dark:bg-steam-dark rounded-lg p-4 text-center">
              <Award className="w-8 h-8 text-steam-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {games.filter(g => g.hasStats).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Games with Stats</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recently Played */}
      {recentGames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recently Played
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentGames.slice(0, 4).map(game => (
              <GameCard key={game.appId} game={game} steamId={steamId} />
            ))}
          </div>
        </div>
      )}

      {/* All Games */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Game Library ({games.length})
          </h2>
          <Link
            to={`/games/${steamId}`}
            className="text-steam-accent hover:underline font-medium"
          >
            View All →
          </Link>
        </div>

        {gamesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-steam-accent" />
          </div>
        ) : games.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <Gamepad2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No games found or the game library is private.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {games.slice(0, 8).map(game => (
              <GameCard key={game.appId} game={game} steamId={steamId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
