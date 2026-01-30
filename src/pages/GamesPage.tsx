import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Loader2, Gamepad2, SortAsc, SortDesc } from 'lucide-react';
import { useSteamGames, useDebounce, usePagination } from '@/hooks';
import { GameCard, Card, CardContent, Pagination, SkeletonList } from '@/components';

/**
 * Games Page
 * Displays paginated and searchable game library
 */

type SortOption = 'name-asc' | 'name-desc' | 'playtime-desc' | 'playtime-asc';

export function GamesPage() {
  const { steamId } = useParams<{ steamId?: string }>();
  const { games, isLoading } = useSteamGames(steamId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('playtime-desc');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    let result = [...games];

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(game => game.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'playtime-asc':
          return a.playtime - b.playtime;
        case 'playtime-desc':
        default:
          return b.playtime - a.playtime;
      }
    });

    return result;
  }, [games, debouncedSearch, sortBy]);

  // Pagination
  const pagination = usePagination(filteredAndSortedGames, {
    pageSize: 20,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonList count={8} />
      </div>
    );
  }

  if (!steamId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Gamepad2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Steam ID Provided
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please search for a Steam profile first.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Game Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {games.length} games found
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-steam-dark bg-white dark:bg-steam-darker text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-steam-accent"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="px-4 py-3 rounded-lg border border-gray-300 dark:border-steam-dark bg-white dark:bg-steam-darker text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-steam-accent"
        >
          <option value="playtime-desc">Most Played</option>
          <option value="playtime-asc">Least Played</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>

      {/* Results Info */}
      {debouncedSearch && (
        <div className="mb-4 text-gray-600 dark:text-gray-400">
          Found {filteredAndSortedGames.length} games matching "{debouncedSearch}"
        </div>
      )}

      {/* Games Grid */}
      {filteredAndSortedGames.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Gamepad2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Games Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? 'Try adjusting your search query.'
                  : 'This user has no games or the library is private.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pagination.paginatedData.map(game => (
              <GameCard key={game.appId} game={game} steamId={steamId} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            canGoPrev={pagination.canGoPrev}
            canGoNext={pagination.canGoNext}
          />
        </>
      )}
    </div>
  );
}
