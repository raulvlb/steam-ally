import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  BookOpen, 
  Plus, 
  User, 
  Calendar, 
  Loader2,
  Filter,
  X,
  Globe,
  Lock,
  ArrowUpDown,
  Clock,
  Heart
} from 'lucide-react';
import { Card, CardContent, GuideActions, SteamLoginButton } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';
import { guidesApi, Guide, PaginatedGuides } from '@/api/guides';
import { steamApiClient } from '@/api/steam';

/**
 * Community Guides Page
 * Browse, search, and interact with community-created guides
 */

export function CommunityGuidesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [appIdFilter, setAppIdFilter] = useState(searchParams.get('appId') || '');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'saved'>('all');
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostLiked'>('newest');
  
  // Game names cache
  const [gameNames, setGameNames] = useState<Record<number, string>>({});

  // Game Selector Modal State
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [searchGames, setSearchGames] = useState<any[]>([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Game Filter State
  const [showGameFilter, setShowGameFilter] = useState(false);
  const [filterGameSearchQuery, setFilterGameSearchQuery] = useState('');
  const [filterSearchGames, setFilterSearchGames] = useState<any[]>([]);
  const [isSearchingFilterGames, setIsSearchingFilterGames] = useState(false);
  const [selectedGameFilter, setSelectedGameFilter] = useState<{ appId: number; name: string } | null>(null);
  const [filterSearchTimeout, setFilterSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [newGuideIsPublic, setNewGuideIsPublic] = useState(true);

  // Fetch guides
  const fetchGuides = async (page: number = 1) => {
    setIsLoading(true);
    try {
      let result: PaginatedGuides;

      if (activeTab === 'my' && isAuthenticated) {
        result = await guidesApi.getMyGuides(page, pagination.pageSize);
      } else if (activeTab === 'saved' && isAuthenticated) {
        result = await guidesApi.getSavedGuides(page, pagination.pageSize);
      } else {
        const appId = appIdFilter ? parseInt(appIdFilter) : undefined;
        result = await guidesApi.getPublicGuides(page, pagination.pageSize, appId);
      }

      setGuides(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Erro ao carregar guias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [activeTab, appIdFilter]);

  // Fetch game names for all guides
  useEffect(() => {
    const fetchGameNames = async () => {
      const uniqueAppIds = [...new Set(guides.map(g => g.steamAppId))];
      const missingAppIds = uniqueAppIds.filter(id => !gameNames[id]);
      
      if (missingAppIds.length === 0) return;
      
      const newGameNames: Record<number, string> = {};
      
      await Promise.all(
        missingAppIds.map(async (appId) => {
          try {
            const response = await fetch(`/api/steam?endpoint=GetAppDetails&appids=${appId}`);
            const data = await response.json();
            if (data[appId]?.success && data[appId]?.data?.name) {
              newGameNames[appId] = data[appId].data.name;
            }
          } catch (error) {
            console.error(`Failed to fetch game name for ${appId}`);
          }
        })
      );
      
      if (Object.keys(newGameNames).length > 0) {
        setGameNames(prev => ({ ...prev, ...newGameNames }));
      }
    };
    
    if (guides.length > 0) {
      fetchGameNames();
    }
  }, [guides]);

  // Filter guides by search query (client-side for now)
  const filteredGuides = guides
    .filter((guide) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        guide.title.toLowerCase().includes(query) ||
        guide.author.username.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'mostLiked':
          return b.totalLikes - a.totalLikes;
        default:
          return 0;
      }
    });

  const handleGuideUpdate = (updatedGuide: Guide) => {
    setGuides((prev) =>
      prev.map((g) => (g.id === updatedGuide.id ? updatedGuide : g))
    );
  };

  // Open game selector modal
  const openGameSelector = () => {
    setShowGameSelector(true);
    setSearchGames([]);
    setGameSearchQuery('');
    setNewGuideIsPublic(true);
  };

  // Search games on Steam when user types
  const handleGameSearch = (query: string) => {
    setGameSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    if (query.trim().length >= 2) {
      const timeout = setTimeout(async () => {
        setIsSearchingGames(true);
        try {
          const response: any = await steamApiClient.searchGames(query);
          if (response?.items) {
            setSearchGames(response.items.slice(0, 20));
          }
        } catch (error) {
          console.error('Failed to search games:', error);
          toast.error('Erro ao buscar jogos');
        } finally {
          setIsSearchingGames(false);
        }
      }, 500);
      
      setSearchTimeout(timeout);
    } else {
      setSearchGames([]);
    }
  };

  // Create guide for selected game
  const createGuideForGame = (appId: number) => {
    setShowGameSelector(false);
    // Navigate to guide editor with appId in URL and isPublic as query param
    navigate(`/guide/new/${appId}?isPublic=${newGuideIsPublic}`);
  };

  // Search games for filter
  const handleFilterGameSearch = (query: string) => {
    setFilterGameSearchQuery(query);
    
    if (filterSearchTimeout) {
      clearTimeout(filterSearchTimeout);
    }

    if (query.trim().length >= 2) {
      const timeout = setTimeout(async () => {
        setIsSearchingFilterGames(true);
        try {
          const response: any = await steamApiClient.searchGames(query);
          if (response?.items) {
            setFilterSearchGames(response.items.slice(0, 20));
          }
        } catch (error) {
          console.error('Failed to search games:', error);
        } finally {
          setIsSearchingFilterGames(false);
        }
      }, 500);
      
      setFilterSearchTimeout(timeout);
    } else {
      setFilterSearchGames([]);
    }
  };

  // Select game for filter
  const selectGameFilter = (appId: number, name: string) => {
    setSelectedGameFilter({ appId, name });
    setAppIdFilter(appId.toString());
    setShowGameFilter(false);
    setFilterGameSearchQuery('');
    setFilterSearchGames([]);
  };

  // Clear game filter
  const clearGameFilter = () => {
    setSelectedGameFilter(null);
    setAppIdFilter('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-steam-accent" />
            {t('guides.library')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Explore guias criados pela comunidade
          </p>
        </div>

        {isAuthenticated ? (
          <button
            onClick={openGameSelector}
            className="flex items-center gap-2 px-4 py-2 bg-steam-accent text-white rounded-lg hover:bg-steam-accent-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('guides.createNew')}
          </button>
        ) : (
          <SteamLoginButton />
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-steam-dark mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-steam-accent text-steam-accent'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-steam-accent'
          }`}
        >
          Todos os Guias
        </button>
        {isAuthenticated && (
          <>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'my'
                  ? 'border-steam-accent text-steam-accent'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-steam-accent'
              }`}
            >
              {t('guides.myGuides')}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'saved'
                  ? 'border-steam-accent text-steam-accent'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-steam-accent'
              }`}
            >
              Guias Salvos
            </button>
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar guias..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-steam-accent"
          />
        </div>
        
        {/* Game Filter Button */}
        <div className="relative">
          {selectedGameFilter ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-steam-accent/20 border border-steam-accent rounded-lg">
              <span className="text-sm text-steam-accent font-medium truncate max-w-[150px]">
                {selectedGameFilter.name}
              </span>
              <button
                onClick={clearGameFilter}
                className="text-steam-accent hover:text-steam-accent-dark"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowGameFilter(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg hover:border-steam-accent transition-colors text-gray-700 dark:text-gray-300"
            >
              <Filter className="w-5 h-5" />
              <span>Filtrar por Jogo</span>
            </button>
          )}
          
          {/* Game Filter Dropdown */}
          {showGameFilter && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-gray-200 dark:border-steam-dark">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Selecionar Jogo</span>
                  <button
                    onClick={() => setShowGameFilter(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filterGameSearchQuery}
                    onChange={(e) => handleFilterGameSearch(e.target.value)}
                    placeholder="Buscar jogo..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-steam-dark border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-steam-accent text-sm"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {isSearchingFilterGames ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-steam-accent" />
                  </div>
                ) : filterSearchGames.length > 0 ? (
                  filterSearchGames.map((game: any) => (
                    <button
                      key={game.id}
                      onClick={() => selectGameFilter(game.id, game.name)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-steam-dark transition-colors text-left"
                    >
                      <img
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/capsule_sm_120.jpg`}
                        alt={game.name}
                        className="w-12 h-14 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {game.name}
                      </span>
                    </button>
                  ))
                ) : filterGameSearchQuery.length >= 2 ? (
                  <p className="text-center py-8 text-gray-500 text-sm">
                    Nenhum jogo encontrado
                  </p>
                ) : (
                  <p className="text-center py-8 text-gray-500 text-sm">
                    Digite para buscar um jogo
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'mostLiked')}
            className="w-full sm:w-48 pl-10 pr-4 py-2 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-steam-accent appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
          >
            <option value="newest">Mais Recentes</option>
            <option value="oldest">Mais Antigos</option>
            <option value="mostLiked">Mais Curtidos</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-steam-accent" />
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {activeTab === 'my' ? t('guides.emptyOwn') : t('guides.empty')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'saved'
              ? 'Salve guias para acessá-los facilmente depois'
              : 'Seja o primeiro a criar um guia!'}
          </p>
        </div>
      ) : (
        <>
          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <Link key={guide.id} to={`/community-guide/${guide.id}`}>
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group !p-0 h-full"
                >
                  <CardContent className="!p-0">
                    {/* Game Header with Image */}
                    <div className="relative h-24 overflow-hidden">
                      <img
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${guide.steamAppId}/header.jpg`}
                        alt={gameNames[guide.steamAppId] || `Game ${guide.steamAppId}`}
                        className="w-full h-full object-cover saturate-[0.3] group-hover:saturate-100 transition-all duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/460x215?text=Game';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="text-white text-sm font-medium truncate">
                          {gameNames[guide.steamAppId] || `App ID: ${guide.steamAppId}`}
                        </p>
                      </div>
                    </div>

                    {/* Guide Title */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-steam-accent transition-colors line-clamp-2">
                        {guide.title}
                      </h3>
                    </div>

                  {/* Guide Footer */}
                  <div className="p-4 border-t border-gray-200 dark:border-steam-dark bg-gray-50 dark:bg-steam-darker/50">
                    <div className="flex items-center justify-between">
                      {/* Author */}
                      <div className="flex items-center gap-2">
                        {guide.author.avatar ? (
                          <img
                            src={guide.author.avatar}
                            alt={guide.author.username}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {guide.author.username}
                        </span>
                      </div>

                      {/* Actions */}
                      <GuideActions
                        guide={guide}
                        onUpdate={handleGuideUpdate}
                        size="sm"
                      />
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(guide.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => fetchGuides(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchGuides(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Game Selector Modal */}
      {showGameSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-steam-darker rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-steam-dark flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Selecione um Jogo
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Escolha o jogo para o qual deseja criar um guia
                </p>
              </div>
              <button
                onClick={() => setShowGameSelector(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-steam-dark rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Visibility Toggle */}
            <div className="p-4 border-b border-gray-200 dark:border-steam-dark">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-steam-dark p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  {newGuideIsPublic ? (
                    <Globe className="w-5 h-5 text-green-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {newGuideIsPublic ? 'Guia Público' : 'Guia Privado'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {newGuideIsPublic 
                        ? 'Todos poderão ver este guia' 
                        : 'Apenas você poderá ver este guia'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNewGuideIsPublic(!newGuideIsPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    newGuideIsPublic ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      newGuideIsPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-steam-dark">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar qualquer jogo na Steam..."
                  value={gameSearchQuery}
                  onChange={(e) => handleGameSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-steam-dark border-2 border-gray-300 dark:border-steam-light rounded-lg focus:border-steam-accent focus:outline-none text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Digite pelo menos 2 caracteres para buscar
              </p>
            </div>

            {/* Games List */}
            <div className="overflow-y-auto max-h-[45vh] p-4">
              {isSearchingGames ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-steam-accent" />
                </div>
              ) : gameSearchQuery.trim().length < 2 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Digite o nome do jogo para começar a busca
                  </p>
                </div>
              ) : searchGames.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhum jogo encontrado
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {searchGames.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => createGuideForGame(game.id)}
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-steam-dark hover:bg-gray-100 dark:hover:bg-steam-light rounded-lg transition-colors text-left group"
                    >
                      <img
                        src={game.tiny_image}
                        alt={game.name}
                        className="w-20 h-auto rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="92" height="43"><rect fill="%23171a21" width="92" height="43"/></svg>';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-steam-accent transition-colors">
                          {game.name}
                        </h3>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-steam-accent transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
