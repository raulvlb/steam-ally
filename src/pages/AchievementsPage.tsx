import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Trophy, Lock, Unlock, Search, ChevronLeft } from 'lucide-react';
import { useSteamAchievements, useDebounce } from '@/hooks';
import { AchievementWithDetails } from '@/types';
import { formatDate } from '@/utils';
import { Card, CardHeader, CardContent, ProgressBar, SkeletonList } from '@/components';

/**
 * Achievements Page
 * Displays game achievements for a user
 */

type FilterOption = 'all' | 'unlocked' | 'locked';

export function AchievementsPage() {
  const { steamId, appId } = useParams<{ steamId: string; appId: string }>();
  const navigate = useNavigate();
  const { achievements, stats, isLoading, error } = useSteamAchievements(
    steamId || null,
    appId ? parseInt(appId) : null
  );
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let result = achievements;

    // Filter by unlock status
    if (filter === 'unlocked') {
      result = result.filter(a => a.achieved === 1);
    } else if (filter === 'locked') {
      result = result.filter(a => a.achieved === 0);
    }

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        a =>
          a.displayName.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [achievements, filter, debouncedSearch]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonList count={6} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Achievements Not Available
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'Could not load achievements for this game.'}
              </p>
              <Link
                to={`/profile/${steamId}`}
                className="inline-block px-6 py-3 bg-steam-accent text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Back to Profile
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to={`/profile/${steamId}`}
        className="inline-flex items-center text-steam-accent hover:underline mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Profile
      </Link>

      {/* Header with Progress */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Game Achievements
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {stats.unlocked} of {stats.total} unlocked
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-steam-accent">{stats.percentage}%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressBar percentage={stats.percentage} showLabel={false} animated />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="py-6">
            <Trophy className="w-10 h-10 text-steam-accent mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Achievements</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="py-6">
            <Unlock className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.unlocked}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Unlocked</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="py-6">
            <Lock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total - stats.unlocked}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Locked</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search achievements..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-steam-dark bg-white dark:bg-steam-darker text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-steam-accent"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-steam-accent text-white'
                : 'bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-steam-light'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              filter === 'unlocked'
                ? 'bg-steam-accent text-white'
                : 'bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-steam-light'
            }`}
          >
            Unlocked
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              filter === 'locked'
                ? 'bg-steam-accent text-white'
                : 'bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-steam-light'
            }`}
          >
            Locked
          </button>
        </div>
      </div>

      {/* Achievements List */}
      {filteredAchievements.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No achievements found matching your filters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAchievements.map(achievement => (
            <AchievementCard key={achievement.apiname} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Achievement Card Component
 */

interface AchievementCardProps {
  achievement: AchievementWithDetails;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const isUnlocked = achievement.achieved === 1;

  return (
    <Card className={isUnlocked ? 'border-green-500 border-l-4' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <img
            src={isUnlocked ? achievement.icon : achievement.iconGray}
            alt={achievement.displayName}
            className="w-16 h-16 rounded-lg flex-shrink-0"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {achievement.displayName}
              </h3>
              {isUnlocked ? (
                <Unlock className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
              ) : (
                <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {achievement.hidden && !isUnlocked
                ? 'Hidden achievement'
                : achievement.description}
            </p>

            {isUnlocked && achievement.unlocktime > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Unlocked on {formatDate(achievement.unlocktime)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
