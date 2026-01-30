import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Gamepad2, Monitor, Apple, ExternalLink } from 'lucide-react';
import { steamApiClient } from '@/api/steam';
import { GameFullDetails } from '@/types';
import { Card, CardContent, SkeletonProfile } from '@/components';
import { useToast } from '@/store';

/**
 * Game Detail Page
 * Displays detailed information about a specific game
 */

export function GameDetailPage() {
  const { appId } = useParams<{ appId: string }>();
  const [game, setGame] = useState<GameFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState(0);
  const toast = useToast();

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!appId) return;

      setIsLoading(true);
      try {
        const response: any = await steamApiClient.getGameDetails(parseInt(appId));
        const data = response[appId];

        if (data && data.success && data.data) {
          const gameData = data.data;
          
          const details: GameFullDetails = {
            appId: parseInt(appId),
            name: gameData.name,
            type: gameData.type,
            shortDescription: gameData.short_description || '',
            detailedDescription: gameData.detailed_description || '',
            headerImage: gameData.header_image || '',
            screenshots: gameData.screenshots || [],
            movies: gameData.movies || [],
            developers: gameData.developers || [],
            publishers: gameData.publishers || [],
            releaseDate: gameData.release_date || { coming_soon: false, date: '' },
            platforms: gameData.platforms || { windows: false, mac: false, linux: false },
            metacritic: gameData.metacritic,
            categories: gameData.categories || [],
            genres: gameData.genres || [],
            price: gameData.price_overview,
            isFree: gameData.is_free || false,
            website: gameData.website,
          };

          setGame(details);
        } else {
          toast.error('Game details not available');
        }
      } catch (error) {
        toast.error('Failed to load game details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameDetails();
  }, [appId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonProfile />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Gamepad2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Game Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Unable to load game details.
              </p>
              <Link
                to="/games"
                className="inline-block px-6 py-3 bg-steam-accent text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Back to Games
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-steam-dark">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Link
          to="/games"
          className="inline-flex items-center text-steam-accent hover:underline"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Games
        </Link>
      </div>

      {/* Header Image */}
      <div className="relative w-full h-96 overflow-hidden">
        <img
          src={game.headerImage}
          alt={game.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <h1 className="text-5xl font-bold text-white mb-2">{game.name}</h1>
            <div className="flex items-center gap-2 text-white">
              {game.developers.map((dev, i) => (
                <span key={i}>{dev}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  About
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {game.shortDescription}
                </p>
                <div
                  className="text-gray-600 dark:text-gray-400 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: game.detailedDescription }}
                />
              </CardContent>
            </Card>

            {/* Screenshots */}
            {game.screenshots.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Screenshots
                  </h2>
                  
                  {/* Main Screenshot */}
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={game.screenshots[selectedScreenshot].path_full}
                      alt={`Screenshot ${selectedScreenshot + 1}`}
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Thumbnail Grid */}
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {game.screenshots.map((screenshot, index) => (
                      <button
                        key={screenshot.id}
                        onClick={() => setSelectedScreenshot(index)}
                        className={`rounded overflow-hidden border-2 transition-all ${
                          selectedScreenshot === index
                            ? 'border-steam-accent'
                            : 'border-transparent hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={screenshot.path_thumbnail}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price */}
            <Card>
              <CardContent className="p-6">
                {game.isFree ? (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500 mb-2">FREE</div>
                    <a
                      href={`https://store.steampowered.com/app/${game.appId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                    >
                      Play Now
                    </a>
                  </div>
                ) : game.price ? (
                  <div className="text-center">
                    {game.price.discount_percent > 0 && (
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="bg-green-500 text-white px-2 py-1 rounded font-bold">
                          -{game.price.discount_percent}%
                        </span>
                        <span className="text-gray-500 line-through">
                          {formatPrice(game.price.initial, game.price.currency)}
                        </span>
                      </div>
                    )}
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {formatPrice(game.price.final, game.price.currency)}
                    </div>
                    <a
                      href={`https://store.steampowered.com/app/${game.appId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-steam-accent text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                    >
                      Buy on Steam
                    </a>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Platforms */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Platforms</h3>
                <div className="flex gap-4">
                  {game.platforms.windows && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Monitor className="w-5 h-5" />
                      <span>Windows</span>
                    </div>
                  )}
                  {game.platforms.mac && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Apple className="w-5 h-5" />
                      <span>Mac</span>
                    </div>
                  )}
                  {game.platforms.linux && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Monitor className="w-5 h-5" />
                      <span>Linux</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Details</h3>
                
                {game.releaseDate.date && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Release Date</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{game.releaseDate.date}</p>
                  </div>
                )}

                {game.developers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Developer
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {game.developers.join(', ')}
                    </p>
                  </div>
                )}

                {game.publishers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Publisher
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {game.publishers.join(', ')}
                    </p>
                  </div>
                )}

                {game.website && (
                  <a
                    href={game.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-steam-accent hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Genres */}
            {game.genres && game.genres.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-steam-accent bg-opacity-10 text-steam-accent rounded-full text-sm"
                      >
                        {genre.description}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metacritic */}
            {game.metacritic && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Metacritic</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-green-500">
                      {game.metacritic.score}
                    </div>
                    <a
                      href={game.metacritic.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-steam-accent hover:underline flex items-center gap-1"
                    >
                      Read Reviews
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
