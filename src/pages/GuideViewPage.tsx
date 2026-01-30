import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { 
  ChevronLeft, 
  Trophy, 
  FileText,
  ChevronDown,
  ChevronUp,
  Edit2,
  Download
} from 'lucide-react';
import { Card, CardContent, SkeletonList } from '@/components';
import { useToast, useUserStore } from '@/store';
import { AchievementWithDetails, Guide, GuideEntry } from '@/types';

/**
 * Guide View Page - Read-only view of a platinum guide
 */
export function GuideViewPage() {
  const { t } = useTranslation();
  const { steamId, appId } = useParams<{ steamId: string; appId: string }>();
  const isPreview = steamId === 'preview';
  const toast = useToast();
  const currentUserSteamId = useUserStore(state => state.steamId);
  const isOwnGuide = steamId === currentUserSteamId;
  
  console.log('GuideViewPage - isPreview:', isPreview, 'steamId:', steamId, 'appId:', appId);
  
  const [guide, setGuide] = useState<Guide>({ entries: [] });
  const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(new Set());
  const [achievements, setAchievements] = useState<AchievementWithDetails[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false);

  // Fetch achievement schema (public API, no user auth needed)
  useEffect(() => {
    if (appId) {
      const fetchAchievementSchema = async () => {
        setIsLoadingAchievements(true);
        try {
          const response = await fetch(`/api/steam?endpoint=GetSchemaForGame&appid=${appId}`);
          const data = await response.json();
          
          if (data.game?.availableGameStats?.achievements) {
            const schemaAchievements = data.game.availableGameStats.achievements.map((ach: any) => ({
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
        } catch (error) {
          console.error('Error fetching achievement schema:', error);
        } finally {
          setIsLoadingAchievements(false);
        }
      };
      
      fetchAchievementSchema();
    }
  }, [appId]);

  // Load guide from localStorage
  useEffect(() => {
    if (appId) {
      const storageKey = isPreview 
        ? `guide_preview_${appId}`
        : `guide_${steamId}_${appId}`;
      
      console.log('Loading guide with key:', storageKey, 'isPreview:', isPreview);
      const savedGuide = localStorage.getItem(storageKey);
      
      if (savedGuide) {
        try {
          const parsedGuide = JSON.parse(savedGuide);
          console.log('Guide loaded successfully:', parsedGuide);
          setGuide(parsedGuide);
        } catch (error) {
          console.error('Error loading guide:', error);
        }
      } else {
        console.log('No guide found in localStorage with key:', storageKey);
      }
    }
  }, [steamId, appId, isPreview]);

  // Get achievement by apiname
  const getAchievementByApiName = (apiname: string): AchievementWithDetails | undefined => {
    return achievements.find(a => a.apiname === apiname);
  };

  // Export guide as JSON
  const exportGuide = () => {
    if (!guide || !appId) return;

    const exportData = {
      version: '1.0',
      appId: appId,
      exportDate: new Date().toISOString(),
      guide: guide,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guide-${appId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(t('guides.exportSuccess'));
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

  if (isLoadingAchievements) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to={isPreview ? "/guides" : (isOwnGuide ? `/guide/${steamId}/${appId}` : "/guides")}
          className="inline-flex items-center text-steam-accent hover:underline"
        >
          <ChevronLeft className="w-5 h-5" />
          {isPreview ? t('guides.backToLibrary') : (isOwnGuide ? t('guides.backToEdit') : t('guides.backToLibrary'))}
        </Link>

        {isPreview ? (
          <button
            onClick={exportGuide}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('guides.export')}
          </button>
        ) : (
          <Link
            to={`/guide/${steamId}/${appId}`}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Edit2 className="w-5 h-5" />
            {t('guide.view.edit')}
          </Link>
        )}
      </div>

      {/* Title */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            {t('guide.title')}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {guide.entries.length === 1 ? t('guides.entry', { count: guide.entries.length }) : t('guides.entries', { count: guide.entries.length })}
        </p>
      </div>

      {/* Guide Content - This section will be exported to PDF */}
      <div id="guide-content">
      <div className="space-y-6">
        {guide.entries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('guides.empty')}
              </p>
            </CardContent>
          </Card>
        ) : (
          guide.entries.map((entry: GuideEntry, index: number) => {
            const achievement = entry.achievementId 
              ? getAchievementByApiName(entry.achievementId)
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
                        ) : (
                          <FileText className="w-12 h-12 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {entry.type === 'achievement' && achievement ? (
                          <>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {achievement.displayName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {achievement.description}
                            </p>
                          </>
                        ) : (
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {entry.title}
                          </h3>
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
        )}        </div>      </div>
    </div>
  );
}
