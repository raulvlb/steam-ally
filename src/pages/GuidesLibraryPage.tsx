import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, BookOpen, Calendar, User, Eye, Plus, X, Loader2 } from 'lucide-react';
import { Card, CardContent, SkeletonList } from '@/components';
import { useToast } from '@/store/toast.store';
import { useUserStore } from '@/store';
import { steamApiClient } from '@/api/steam';

/**
 * Guide Library Page
 * Browse and download curated platinum guides
 */

interface GuideMetadata {
  id: string;
  appId: string;
  gameName: string;
  gameImage: string;
  author: string;
  description: string;
  fileName: string;
  createdAt: string;
  entriesCount: number;
}

interface GuideData {
  version: string;
  appId: string;
  exportDate: string;
  guide: {
    entries: Array<{
      id: string;
      type: string;
      achievementId?: string;
      title?: string;
      content: string;
    }>;
  };
}

export function GuidesLibraryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile } = useUserStore();
  const [guides, setGuides] = useState<GuideMetadata[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<GuideMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [searchGames, setSearchGames] = useState<any[]>([]);
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Load guides index
  useEffect(() => {
    const loadGuides = async () => {
      try {
        const response = await fetch('/guides/index.json');
        const data = await response.json();
        setGuides(data);
        setFilteredGuides(data);
      } catch (error) {
        console.error('Error loading guides:', error);
        toast.error('Erro ao carregar biblioteca de guias');
      } finally {
        setIsLoading(false);
      }
    };

    loadGuides();
  }, [toast]);

  // Filter guides by search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGuides(guides);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = guides.filter(guide =>
        guide.gameName.toLowerCase().includes(query) ||
        guide.description.toLowerCase().includes(query)
      );
      setFilteredGuides(filtered);
    }
  }, [searchQuery, guides]);

  // Load user's games when modal opens
  const openGameSelector = () => {
    setShowGameSelector(true);
    setSearchGames([]);
    setGameSearchQuery('');
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
    navigate(`/guide/new/${appId}`);
  };

  // Download and import guide
  const downloadGuide = async (guide: GuideMetadata) => {
    try {
      const response = await fetch(`/guides/${guide.fileName}`);
      const guideData: GuideData = await response.json();

      // Save to localStorage for the current user
      if (profile?.steamid) {
        localStorage.setItem(
          `guide_${profile.steamid}_${guide.appId}`,
          JSON.stringify(guideData.guide)
        );
        toast.success(`Guia de ${guide.gameName} importado com sucesso!`);
        
        // Navigate to the guide editor
        navigate(`/guide/${profile.steamid}/${guide.appId}`);
      } else {
        toast.error('Você precisa estar logado para importar guias');
      }
    } catch (error) {
      console.error('Error downloading guide:', error);
      toast.error('Erro ao baixar guia');
    }
  };

  // Preview guide before importing
  const previewGuide = async (guide: GuideMetadata) => {
    try {
      console.log('Fetching guide:', guide.fileName);
      const response = await fetch(`/guides/${guide.fileName}`);
      const guideData: GuideData = await response.json();
      
      console.log('Guide data fetched:', guideData);

      // Save temporarily with a preview prefix
      const storageKey = `guide_preview_${guide.appId}`;
      localStorage.setItem(storageKey, JSON.stringify(guideData.guide));
      console.log('Guide saved to localStorage with key:', storageKey);
      
      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to preview view page (read-only)
      console.log('Navigating to preview page');
      navigate(`/guide/view/preview/${guide.appId}`);
    } catch (error) {
      console.error('Error previewing guide:', error);
      toast.error('Erro ao carregar prévia do guia');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonList count={6} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-purple-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Biblioteca de Guias
            </h1>
          </div>
          {/* Create New Guide Button */}
          <button
            onClick={openGameSelector}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Criar Novo Guia
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Explore e importe guias curados para platinar seus jogos favoritos
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome do jogo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-steam-darker border-2 border-gray-300 dark:border-steam-dark rounded-lg focus:border-steam-accent focus:outline-none text-gray-900 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guides Grid */}
      {filteredGuides.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Nenhum guia encontrado
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'Tente outro termo de pesquisa' : 'Não há guias disponíveis no momento'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <Card key={guide.id} className="hover:shadow-xl transition-shadow">
              <div className="relative h-48 overflow-hidden rounded-t-xl">
                <img
                  src={guide.gameImage}
                  alt={guide.gameName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {guide.gameName}
                  </h3>
                </div>
              </div>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {guide.description}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{guide.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(guide.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="w-4 h-4" />
                    <span>{guide.entriesCount} {guide.entriesCount === 1 ? 'anotação' : 'anotações'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => previewGuide(guide)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => downloadGuide(guide)}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Importar
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Game Selector Modal */}
      {showGameSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-steam-darker rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
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

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-steam-dark">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar qualquer jogo na Steam..."
                  value={gameSearchQuery}
                  onChange={(e) => handleGameSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-steam-darker border-2 border-gray-300 dark:border-steam-dark rounded-lg focus:border-steam-accent focus:outline-none text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Digite pelo menos 2 caracteres para buscar
              </p>
            </div>

            {/* Games List */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
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
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-steam-dark hover:bg-gray-100 dark:hover:bg-steam-light rounded-lg transition-colors text-left"
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
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {game.name}
                        </h3>
                      </div>
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
