import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { steamApiClient } from '@/api/steam';
import { SteamStoreGame } from '@/types';
import { useDebounce } from '@/hooks';
import { Card, CardContent } from '@/components';
import { useToast } from '@/store';
import { formatCurrency } from '@/utils/formatters';

/**
 * Games Explore Page
 * Browse featured categories, promotions and search for Steam games
 */

interface FeaturedCategory {
  id: string;
  name: string;
  items: SteamStoreGame[];
}

export function GamesExplorePage() {
  const [categories, setCategories] = useState<FeaturedCategory[]>([]);
  const [searchResults, setSearchResults] = useState<SteamStoreGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchQuery, 500);
  const toast = useToast();

  // Load featured categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response: any = await steamApiClient.getFeaturedCategories();
        
        const categoriesList: FeaturedCategory[] = [];

        // Specials (Promoções)
        if (response.specials?.items) {
          categoriesList.push({
            id: 'specials',
            name: '🔥 Promoções Especiais',
            items: response.specials.items.slice(0, 12).map((item: any) => ({
              id: item.id,
              name: item.name,
              header_image: item.header_image || item.large_capsule_image,
              capsule_image: item.small_capsule_image || item.large_capsule_image,
              short_description: item.headline || '',
              price: item.discount_percent > 0 ? {
                final: item.final_price,
                discount_percent: item.discount_percent,
                initial: item.original_price,
                currency: item.currency || 'USD',
              } : undefined,
            })),
          });
        }

        // Top Sellers
        if (response.top_sellers?.items) {
          categoriesList.push({
            id: 'top_sellers',
            name: '🏆 Mais Vendidos',
            items: response.top_sellers.items.slice(0, 12).map((item: any) => ({
              id: item.id,
              name: item.name,
              header_image: item.header_image || item.large_capsule_image,
              capsule_image: item.small_capsule_image || item.large_capsule_image,
              short_description: item.headline || '',
              price: item.discount_percent > 0 ? {
                final: item.final_price,
                discount_percent: item.discount_percent,
                initial: item.original_price,
                currency: item.currency || 'USD',
              } : undefined,
            })),
          });
        }

        // New Releases
        if (response.new_releases?.items) {
          categoriesList.push({
            id: 'new_releases',
            name: '🆕 Lançamentos Recentes',
            items: response.new_releases.items.slice(0, 12).map((item: any) => ({
              id: item.id,
              name: item.name,
              header_image: item.header_image || item.large_capsule_image,
              capsule_image: item.small_capsule_image || item.large_capsule_image,
              short_description: item.headline || '',
              price: item.discount_percent > 0 ? {
                final: item.final_price,
                discount_percent: item.discount_percent,
                initial: item.original_price,
                currency: item.currency || 'USD',
              } : undefined,
            })),
          });
        }

        // Coming Soon
        if (response.coming_soon?.items) {
          categoriesList.push({
            id: 'coming_soon',
            name: '⏰ Em Breve',
            items: response.coming_soon.items.slice(0, 12).map((item: any) => ({
              id: item.id,
              name: item.name,
              header_image: item.header_image || item.large_capsule_image,
              capsule_image: item.small_capsule_image || item.large_capsule_image,
              short_description: item.headline || '',
              price: item.discount_percent > 0 ? {
                final: item.final_price,
                discount_percent: item.discount_percent,
                initial: item.original_price,
                currency: item.currency || 'USD',
              } : undefined,
            })),
          });
        }

        setCategories(categoriesList);
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast.error('Não foi possível carregar os jogos em destaque');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Search games when query changes
  useEffect(() => {
    const searchGames = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response: any = await steamApiClient.searchGames(debouncedSearch);
        
        if (response && response.items) {
          const games: SteamStoreGame[] = response.items.slice(0, 20).map((item: any) => ({
            id: item.id,
            name: item.name,
            tiny_image: item.tiny_image,
            header_image: item.tiny_image,
            capsule_image: item.tiny_image,
          }));
          setSearchResults(games);
        }
      } catch (error) {
        toast.error('Falha na busca');
      } finally {
        setIsSearching(false);
      }
    };

    searchGames();
  }, [debouncedSearch]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-steam-accent" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Explorar Jogos Steam
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Descubra promoções, lançamentos e os jogos mais vendidos
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por jogos na Steam..."
            className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-gray-300 dark:border-steam-dark bg-white dark:bg-steam-darker text-gray-900 dark:text-white focus:outline-none focus:border-steam-accent text-lg"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-steam-accent" />
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-6 h-6 text-steam-accent" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Resultados da Busca ({searchResults.length})
            </h2>
          </div>

          {isSearching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-steam-accent" />
            </div>
          ) : searchResults.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Nenhum Jogo Encontrado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tente um termo de busca diferente
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((game) => (
                <GameStoreCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Categories */}
      {!searchQuery && (
        <>
          {isLoadingCategories ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-steam-accent" />
            </div>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Nenhuma Categoria Disponível
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Não foi possível carregar os jogos em destaque
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {categories.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                const visibleItems = isExpanded ? category.items : category.items.slice(0, 8);
                const hasMore = category.items.length > 8;

                return (
                  <div key={category.id}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {category.name}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {visibleItems.map((game) => (
                        <GameStoreCard key={game.id} game={game} />
                      ))}
                    </div>

                    {hasMore && !isExpanded && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="px-6 py-2 bg-steam-accent hover:bg-opacity-90 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Ver Mais ({category.items.length - 8} jogos)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Game Store Card Component
 */

interface GameStoreCardProps {
  game: SteamStoreGame;
}

function GameStoreCard({ game }: GameStoreCardProps) {
  const [imageError, setImageError] = useState(false);
  const { i18n } = useTranslation();

  return (
    <Link to={`/game/${game.id}`}>
      <Card hoverable className="overflow-hidden h-full">
        {/* Game Image */}
        <div className="relative h-48 bg-gradient-to-br from-steam-light to-steam-dark overflow-hidden">
          {game.header_image && !imageError ? (
            <img
              src={game.header_image}
              alt={game.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-gray-500 opacity-50" />
            </div>
          )}
          
          {/* Discount Badge */}
          {game.price && game.price.discount_percent > 0 && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded font-bold">
              -{game.price.discount_percent}%
            </div>
          )}
        </div>

        {/* Game Info */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem]">
            {game.name}
          </h3>

          {game.short_description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {game.short_description}
            </p>
          )}

          {/* Price */}
          {game.price && (
            <div className="flex items-center gap-2">
              {game.price.discount_percent > 0 && (
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(game.price.initial, i18n.language)}
                </span>
              )}
              <span className="text-lg font-bold text-steam-accent">
                {formatCurrency(game.price.final, i18n.language)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
