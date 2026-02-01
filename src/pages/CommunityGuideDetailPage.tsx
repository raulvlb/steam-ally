import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import {
  ChevronLeft,
  User,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  ExternalLink,
  Eye,
  Trophy,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { Card, CardContent, GuideActions } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';
import { guidesApi, Guide } from '@/api/guides';
import { AchievementWithDetails } from '@/types';

// Interface for parsed guide entries
interface ParsedEntry {
  id: string;
  type: 'achievement' | 'general';
  title: string;
  content: string;
  achievementName?: string;
}

/**
 * Community Guide Detail Page
 * View a single community guide with full content
 */

export function CommunityGuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isAuthenticated } = useAuthStore();

  const [guide, setGuide] = useState<Guide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [achievements, setAchievements] = useState<AchievementWithDetails[]>([]);
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(new Set());
  const [gameName, setGameName] = useState<string>('');

  const isAuthor = user && guide && user.id === guide.author.id;

  // Parse guide content into entries
  const parseGuideContent = (content: string): ParsedEntry[] => {
    // Split by "---" separator followed by "## " headers
    // This regex looks for --- followed by ## header pattern
    const sections = content.split(/\n---\n\n(?=## )/);
    
    const entries: ParsedEntry[] = [];
    
    sections.forEach((section) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;
      
      const lines = trimmedSection.split('\n');
      const firstLine = lines[0] || '';
      
      // Only process if it starts with ## (a proper header)
      const titleMatch = firstLine.match(/^##\s*(?:🏆\s*)?(.+)$/);
      
      if (!titleMatch) {
        // If no header, skip this section or it's just content without header
        return;
      }
      
      const title = titleMatch[1].trim();
      const isAchievement = firstLine.includes('🏆');
      
      // Content is everything after the first line
      const entryContent = lines.slice(1).join('\n').trim();
      
      // Only add if there's actual content
      if (entryContent) {
        entries.push({
          id: `entry-${entries.length}`,
          type: isAchievement ? 'achievement' : 'general',
          title,
          content: entryContent,
          achievementName: isAchievement ? title : undefined,
        });
      }
    });
    
    return entries;
  };

  // Get achievement by display name
  const getAchievementByName = (name: string): AchievementWithDetails | undefined => {
    return achievements.find(a => 
      a.displayName.toLowerCase() === name.toLowerCase() ||
      a.displayName.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(a.displayName.toLowerCase())
    );
  };

  // Toggle entry collapsed state
  const toggleCollapse = (entryId: string) => {
    setCollapsedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchGuide = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await guidesApi.getGuide(id);
        setGuide(data);
        
        // Parse the content into entries
        if (data.content) {
          const entries = parseGuideContent(data.content);
          setParsedEntries(entries);
        }
        
        // Fetch achievements and game name for this game
        if (data.steamAppId) {
          try {
            // Fetch achievements
            const response = await fetch(`/api/steam?endpoint=GetSchemaForGame&appid=${data.steamAppId}`);
            const schemaData = await response.json();
            
            if (schemaData.game?.availableGameStats?.achievements) {
              const schemaAchievements = schemaData.game.availableGameStats.achievements.map((ach: any) => ({
                apiname: ach.name,
                achieved: 0,
                unlocktime: 0,
                displayName: ach.displayName,
                description: ach.description,
                icon: ach.icon,
                icongray: ach.icongray,
              }));
              setAchievements(schemaAchievements);
            }
            
            // Fetch game name
            const appDetailsResponse = await fetch(`/api/steam?endpoint=GetAppDetails&appids=${data.steamAppId}`);
            const appDetailsData = await appDetailsResponse.json();
            if (appDetailsData[data.steamAppId]?.success) {
              setGameName(appDetailsData[data.steamAppId].data.name);
            }
          } catch (err) {
            console.error('Error fetching achievements:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching guide:', error);
        toast.error('Erro ao carregar guia');
        navigate('/community-guides');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuide();
  }, [id]);

  const handleDelete = async () => {
    if (!guide) return;

    setIsDeleting(true);
    try {
      await guidesApi.deleteGuide(guide.id);
      toast.success('Guia excluído com sucesso');
      navigate('/community-guides');
    } catch (error) {
      console.error('Error deleting guide:', error);
      toast.error('Erro ao excluir guia');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Copy guide to local library for editing
  const copyGuideToLocal = () => {
    if (!guide) return;
    
    // Get steamId from auth store (the logged in user)
    const currentUserSteamId = user?.steamId;
    
    if (!currentUserSteamId) {
      toast.error('Você precisa estar logado para copiar o guia');
      return;
    }
    
    // Convert parsed entries to local guide format
    const localGuide = {
      entries: parsedEntries.map((entry, index) => {
        // Try to find matching achievement
        const achievement = entry.type === 'achievement' && entry.achievementName
          ? getAchievementByName(entry.achievementName)
          : null;
        
        return {
          id: `${Date.now()}-${index}`,
          type: entry.type,
          achievementId: achievement?.apiname,
          title: entry.type === 'general' ? entry.title : undefined,
          content: entry.content,
        };
      }),
    };
    
    // Save to localStorage
    const storageKey = `guide_${currentUserSteamId}_${guide.steamAppId}`;
    localStorage.setItem(storageKey, JSON.stringify(localGuide));
    
    toast.success('Guia copiado para sua biblioteca!');
    
    // Navigate to edit the copied guide
    navigate(`/guide/${currentUserSteamId}/${guide.steamAppId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-steam-accent" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Guia não encontrado
        </h1>
        <Link
          to="/community-guides"
          className="text-steam-accent hover:underline mt-4 inline-block"
        >
          Voltar para Guias
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link
        to="/community-guides"
        className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-steam-accent mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Voltar para Guias
      </Link>

      {/* Game Header Banner */}
      <div className="relative rounded-xl overflow-hidden mb-8">
        <img
          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${guide.steamAppId}/header.jpg`}
          alt={gameName || `Game ${guide.steamAppId}`}
          className="w-full h-48 md:h-56 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/460x215?text=Game';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Content over image */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="bg-black/60 backdrop-blur-sm px-4 py-3 rounded-lg">
              <p className="text-steam-accent text-sm font-medium mb-1">
                {gameName || `App ID: ${guide.steamAppId}`}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {guide.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`https://store.steampowered.com/app/${guide.steamAppId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm bg-black/50 px-3 py-1.5 rounded-full text-white hover:bg-black/70 hover:text-steam-accent transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver na Steam
              </a>
              {!guide.isPublic && (
                <span className="flex items-center gap-1 text-sm bg-black/50 px-3 py-1.5 rounded-full text-yellow-400">
                  <Eye className="w-4 h-4" />
                  Privado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Author Actions */}
        {isAuthor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/guide/edit/${guide.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-steam-accent text-white rounded-lg hover:bg-steam-accent-dark transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        )}
        
        {/* Copy to Local Library Button - Available for all logged in users */}
        {isAuthenticated && !isAuthor && (
          <button
            onClick={copyGuideToLocal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copiar para Meus Guias
          </button>
        )}

        {/* Spacer when no actions */}
        {!isAuthor && !isAuthenticated && <div />}

        {/* Guide Actions (likes, saves) */}
        <GuideActions guide={guide} onUpdate={setGuide} showLabels />
      </div>

      {/* Author Info */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 dark:bg-steam-darker rounded-lg">
        <div className="flex items-center gap-3">
          {guide.author.avatar ? (
            <img
              src={guide.author.avatar}
              alt={guide.author.username}
              className="w-12 h-12 rounded-full border-2 border-steam-accent"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-steam-dark flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {guide.author.username}
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Criado em {new Date(guide.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* Guide Content - Card style like GuideViewPage */}
      <div className="space-y-4">
        {parsedEntries.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <article className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 space-y-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-2">
                        {children}
                      </ol>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-');
                      return isBlock ? (
                        <pre className="bg-gray-100 dark:bg-steam-darker p-4 rounded-lg overflow-x-auto mb-4">
                          <code className={className}>{children}</code>
                        </pre>
                      ) : (
                        <code className="bg-gray-100 dark:bg-steam-darker px-1.5 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-steam-accent pl-4 italic text-gray-600 dark:text-gray-400 mb-4">
                        {children}
                      </blockquote>
                    ),
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt}
                        className="rounded-lg max-w-full h-auto my-4"
                      />
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-steam-accent hover:underline"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {guide.content}
                </ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        ) : (
          parsedEntries.map((entry, index) => {
            const achievement = entry.type === 'achievement' && entry.achievementName
              ? getAchievementByName(entry.achievementName)
              : null;
            
            return (
              <Card key={entry.id}>
                <div className={`border-l-4 ${
                  entry.type === 'achievement' 
                    ? 'border-purple-500' 
                    : 'border-blue-500'
                }`}>
                  <CardContent>
                    {/* Entry Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-steam-darker rounded-full">
                          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                            {index + 1}
                          </span>
                        </div>
                        {entry.type === 'achievement' && achievement ? (
                          <img
                            src={achievement.icon}
                            alt={achievement.displayName}
                            className="w-12 h-12 rounded"
                          />
                        ) : entry.type === 'achievement' ? (
                          <Trophy className="w-12 h-12 text-yellow-500" />
                        ) : (
                          <FileText className="w-12 h-12 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {entry.title}
                        </h3>
                        {entry.type === 'achievement' && achievement && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {achievement.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleCollapse(entry.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-steam-dark rounded transition-colors flex-shrink-0"
                        title={collapsedEntries.has(entry.id) ? "Expandir" : "Encolher"}
                      >
                        {collapsedEntries.has(entry.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Entry Content */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        collapsedEntries.has(entry.id) ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
                      }`}
                    >
                      <div className="
                        mt-4 pt-4 border-t border-gray-200 dark:border-steam-dark
                        text-gray-700 dark:text-gray-300
                        [&>p]:my-3 [&>p]:leading-relaxed [&>p]:text-base
                        [&>strong]:font-bold [&>strong]:text-gray-900 dark:[&>strong]:text-white
                        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-4 [&>ul]:space-y-2
                        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-4 [&>ol]:space-y-2
                        [&>li]:leading-relaxed [&>li]:text-base
                        [&>img]:rounded-lg [&>img]:shadow-lg [&>img]:my-4 [&>img]:w-full
                        [&>code]:text-purple-600 dark:[&>code]:text-purple-400 [&>code]:bg-gray-100 dark:[&>code]:bg-steam-darker [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm
                        [&>pre]:bg-gray-100 dark:[&>pre]:bg-steam-darker [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-4
                        [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 dark:[&>blockquote]:border-steam-dark [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4
                        [&>hr]:border-gray-300 dark:[&>hr]:border-steam-dark [&>hr]:my-6
                        [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-gray-900 dark:[&>h1]:text-white [&>h1]:mb-4 [&>h1]:mt-6
                        [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900 dark:[&>h2]:text-white [&>h2]:mb-3 [&>h2]:mt-5
                        [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-gray-900 dark:[&>h3]:text-white [&>h3]:mb-2 [&>h3]:mt-4
                      ">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                            img: ({ src, alt }) => (
                              <img
                                src={src}
                                alt={alt}
                                className="rounded-lg max-w-full h-auto my-4"
                              />
                            ),
                          }}
                        >
                          {entry.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-steam-darker rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Excluir Guia
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir este guia? Esta ação não pode ser
              desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-steam-dark rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
