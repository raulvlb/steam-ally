import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { 
  ChevronLeft, 
  ChevronRight,
  Save, 
  Trophy, 
  Plus,
  Trash2,
  Image as ImageIcon,
  Bold,
  List,
  ListOrdered,
  Sparkles,
  FileText,
  Award,
  Edit2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  Loader2,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardContent, SkeletonList } from '@/components';
import { AchievementWithDetails, Guide, GuideEntry, EntryType } from '@/types';
import { useToast } from '@/store/toast.store';
import { useUserStore } from '@/store';
import { useAuthStore } from '@/store/auth.store';
import { guidesApi, CreateGuideData, UpdateGuideData } from '@/api/guides';

/**
 * Guide Editor Page
 * Create and edit platinum guides for games
 */

export function GuideEditorPage() {
  const { steamId, appId, id: guideId } = useParams<{ steamId: string; appId: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { steamId: currentUserSteamId } = useUserStore();
  const { isAuthenticated } = useAuthStore();
  
  // Check if we're editing an existing community guide
  const isEditingCommunityGuide = !!guideId;
  
  // Determine if this is a new guide (no steamId in URL)
  const actualSteamId = steamId || currentUserSteamId;
  
  // Get isPublic from query params (default to false for private)
  const queryIsPublic = searchParams.get('isPublic') === 'true';

  const [achievements, setAchievements] = useState<AchievementWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(queryIsPublic);
  const [guideTitle, setGuideTitle] = useState('');
  const [gameName, setGameName] = useState('');
  const [currentAppId, setCurrentAppId] = useState(appId || '');

  const [entryType, setEntryType] = useState<EntryType>('achievement');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithDetails | null>(null);
  const [generalTitle, setGeneralTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [guide, setGuide] = useState<Guide>({ entries: [] });
  
  // Computed appId - prioritize currentAppId (from loaded guide) over URL param
  const appIdToUse = currentAppId || appId || '';
  const [showAchievementPicker, setShowAchievementPicker] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Wizard step state: 1 = Type, 2 = Selection, 3 = Content
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  
  // Check if can proceed to next step
  const canProceedToStep2 = entryType !== null;
  const canProceedToStep3 = entryType === 'achievement' ? selectedAchievement !== null : generalTitle.trim() !== '';
  const canAddEntry = editorContent.trim() !== '' && canProceedToStep3;

  // Parse guide content from API into entries
  const parseGuideContent = (content: string): GuideEntry[] => {
    const sections = content.split(/\n---\n\n(?=## )/);
    const entries: GuideEntry[] = [];
    
    sections.forEach((section) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;
      
      const lines = trimmedSection.split('\n');
      const firstLine = lines[0] || '';
      
      const titleMatch = firstLine.match(/^##\s*(?:🏆\s*)?(.+)$/);
      
      if (!titleMatch) return;
      
      const title = titleMatch[1].trim();
      const isAchievement = firstLine.includes('🏆');
      const entryContent = lines.slice(1).join('\n').trim();
      
      if (entryContent || title) {
        entries.push({
          id: `entry-${entries.length}-${Date.now()}`,
          type: isAchievement ? 'achievement' : 'general',
          // Keep title for achievements too (temporarily) so we can match later
          title: title,
          achievementId: undefined, // Will be matched later when achievements load
          content: entryContent,
        });
      }
    });
    
    return entries;
  };

  // Load existing community guide if editing
  useEffect(() => {
    const fetchCommunityGuide = async () => {
      if (!guideId) return;
      
      try {
        const guideData = await guidesApi.getGuide(guideId);
        setGuideTitle(guideData.title);
        setIsPublic(guideData.isPublic);
        setCurrentAppId(guideData.steamAppId.toString());
        
        // Parse the content into entries
        if (guideData.content) {
          const parsedEntries = parseGuideContent(guideData.content);
          setGuide({ entries: parsedEntries });
        }
      } catch (error) {
        console.error('Error fetching guide:', error);
        toast.error('Erro ao carregar guia');
        navigate('/community-guides');
      }
    };
    
    fetchCommunityGuide();
  }, [guideId]);

  // Helper function to match entries with achievements
  const matchEntriesWithAchievements = (entries: GuideEntry[], schemaAchievements: AchievementWithDetails[]): GuideEntry[] => {
    return entries.map(entry => {
      if (entry.type === 'achievement' && !entry.achievementId && entry.title) {
        // Normalize titles for comparison (lowercase, trim, remove extra spaces)
        const normalizedEntryTitle = entry.title.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Try to find matching achievement by title
        const match = schemaAchievements.find((a: AchievementWithDetails) => {
          const normalizedAchTitle = a.displayName.toLowerCase().trim().replace(/\s+/g, ' ');
          // Exact match or close match
          return normalizedEntryTitle === normalizedAchTitle ||
                 normalizedEntryTitle.includes(normalizedAchTitle) ||
                 normalizedAchTitle.includes(normalizedEntryTitle);
        });
        
        if (match) {
          return { ...entry, achievementId: match.apiname, title: undefined };
        }
      }
      return entry;
    });
  };

  // Load achievements from schema (for all users, even without the game)
  useEffect(() => {
    const fetchAchievementSchema = async () => {
      const appIdToUse = currentAppId || appId;
      if (!appIdToUse) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/steam?endpoint=GetSchemaForGame&appid=${appIdToUse}`);
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
        
        // Also set game name from schema
        if (data.game?.gameName) {
          setGameName(data.game.gameName);
        }
      } catch (error) {
        console.error('Error fetching achievement schema:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAchievementSchema();
  }, [appId, currentAppId]);

  // Match entries with achievements when both are loaded
  useEffect(() => {
    if (achievements.length > 0 && guide.entries.length > 0) {
      // Check if any entries need matching
      const hasUnmatchedAchievements = guide.entries.some(
        entry => entry.type === 'achievement' && !entry.achievementId && entry.title
      );
      
      if (hasUnmatchedAchievements) {
        const matchedEntries = matchEntriesWithAchievements(guide.entries, achievements);
        setGuide({ entries: matchedEntries });
      }
    }
  }, [achievements, guide.entries.length]);

  // Fetch game name if not from schema
  useEffect(() => {
    const fetchGameName = async () => {
      const appIdToUse = currentAppId || appId;
      if (!appIdToUse || gameName) return;
      
      try {
        const response = await fetch(`/api/steam?endpoint=GetAppDetails&appids=${appIdToUse}`);
        const data = await response.json();
        if (data[appIdToUse]?.success && data[appIdToUse]?.data?.name) {
          setGameName(data[appIdToUse].data.name);
        }
      } catch (error) {
        console.log('Could not fetch game name');
      }
    };

    fetchGameName();
  }, [appId, currentAppId, gameName]);

  // Load guide from localStorage (only if not editing community guide)
  useEffect(() => {
    if (!isEditingCommunityGuide && actualSteamId && appIdToUse) {
      const savedGuide = localStorage.getItem(`guide_${actualSteamId}_${appIdToUse}`);
      if (savedGuide) {
        setGuide(JSON.parse(savedGuide));
      }
    }
  }, [actualSteamId, appIdToUse, isEditingCommunityGuide]);

  // Save guide to localStorage
  const saveGuideLocal = () => {
    if (actualSteamId && appIdToUse) {
      localStorage.setItem(`guide_${actualSteamId}_${appIdToUse}`, JSON.stringify(guide));
      toast.success('Guia salvo localmente!', 3000);
    }
  };

  // Publish guide to community (API)
  const publishGuide = async () => {
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para publicar um guia');
      return;
    }

    if (!guideTitle.trim()) {
      toast.error('Adicione um título para o guia');
      return;
    }

    if (guide.entries.length === 0) {
      toast.error('Adicione pelo menos uma anotação ao guia');
      return;
    }

    const appIdToUse = currentAppId || appId;
    if (!appIdToUse) {
      toast.error('Selecione um jogo para o guia');
      return;
    }

    // Convert guide entries to markdown content
    const content = guide.entries.map(entry => {
      const achievement = entry.achievementId ? getAchievementByApiName(entry.achievementId) : null;
      const title = entry.type === 'achievement' && achievement 
        ? `## 🏆 ${achievement.displayName}` 
        : `## ${entry.title || 'Nota'}`;
      return `${title}\n\n${entry.content}`;
    }).join('\n\n---\n\n');

    setIsSaving(true);
    try {
      if (isEditingCommunityGuide && guideId) {
        // Update existing guide
        const updateData: UpdateGuideData = {
          title: guideTitle,
          content,
          isPublic,
        };
        await guidesApi.updateGuide(guideId, updateData);
        toast.success('Guia atualizado com sucesso!');
      } else {
        // Create new guide
        const guideData: CreateGuideData = {
          title: guideTitle,
          content,
          steamAppId: parseInt(appIdToUse),
          isPublic,
        };
        await guidesApi.createGuide(guideData);
        
        // Also save locally
        saveGuideLocal();
        
        toast.success(isPublic ? 'Guia publicado com sucesso!' : 'Guia salvo como privado!');
      }
      
      navigate('/community-guides');
    } catch (error: any) {
      console.error('Error publishing guide:', error);
      toast.error(error.message || 'Erro ao publicar guia');
    } finally {
      setIsSaving(false);
    }
  };

  // Export guide to JSON file
  const exportGuide = () => {
    // Save before exporting
    saveGuideLocal();

    const exportData = {
      version: '1.0',
      appId: appIdToUse,
      exportDate: new Date().toISOString(),
      guide: guide
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guide-${appIdToUse}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Navigate to view page
  const navigateToView = () => {
    // Save before viewing
    saveGuideLocal();
    navigate(`/guide/view/${actualSteamId}/${appIdToUse}`);
  };

  // Import guide from JSON file
  const importGuide = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const importedData = JSON.parse(content);

          // Validate the imported data
          if (!importedData.guide || !importedData.guide.entries) {
            toast.error('Arquivo inválido! O formato do guia está incorreto.', 3000);
            return;
          }

          // Load the imported guide
          setGuide(importedData.guide);
          toast.success('Guia importado com sucesso!', 3000);
        } catch (error) {
          console.error('Error importing guide:', error);
          toast.error('Erro ao importar guia! Verifique se o arquivo é válido.', 3000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Add entry to guide
  const addEntry = () => {
    if (!editorContent.trim()) {
      alert('Adicione conteúdo antes de salvar.');
      return;
    }

    if (entryType === 'achievement' && !selectedAchievement) {
      alert('Selecione uma conquista antes de salvar.');
      return;
    }

    if (entryType === 'general' && !generalTitle.trim()) {
      alert('Adicione um título para a nota geral.');
      return;
    }

    if (editingEntryId) {
      // Update existing entry
      setGuide(prev => ({
        ...prev,
        entries: prev.entries.map(entry =>
          entry.id === editingEntryId
            ? {
                ...entry,
                type: entryType,
                achievementId: entryType === 'achievement' ? selectedAchievement?.apiname : undefined,
                title: entryType === 'general' ? generalTitle : undefined,
                content: editorContent,
              }
            : entry
        ),
      }));
      setEditingEntryId(null);
    } else {
      // Add new entry
      const newEntry: GuideEntry = {
        id: Date.now().toString(),
        type: entryType,
        achievementId: entryType === 'achievement' ? selectedAchievement?.apiname : undefined,
        title: entryType === 'general' ? generalTitle : undefined,
        content: editorContent,
      };

      setGuide(prev => ({
        ...prev,
        entries: [...prev.entries, newEntry],
      }));
    }

    // Clear editor
    setEditorContent('');
    setSelectedAchievement(null);
    setGeneralTitle('');
    setShowAchievementPicker(false);
  };

  // Edit entry
  const editEntry = (entry: GuideEntry) => {
    setEditingEntryId(entry.id);
    setEntryType(entry.type);
    setEditorContent(entry.content);
    
    if (entry.type === 'achievement' && entry.achievementId) {
      const achievement = getAchievementByApiName(entry.achievementId);
      if (achievement) {
        setSelectedAchievement(achievement);
      }
    } else if (entry.type === 'general' && entry.title) {
      setGeneralTitle(entry.title);
    }

    // Scroll to editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingEntryId(null);
    setEditorContent('');
    setSelectedAchievement(null);
    setGeneralTitle('');
  };

  // Remove entry from guide
  const removeEntry = (entryId: string) => {
    if (editingEntryId === entryId) {
      cancelEdit();
    }
    setGuide(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== entryId),
    }));
    setDeleteConfirmId(null);
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

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newEntries = [...guide.entries];
    const draggedEntry = newEntries[draggedIndex];
    
    // Remove from old position
    newEntries.splice(draggedIndex, 1);
    // Insert at new position
    newEntries.splice(index, 0, draggedEntry);
    
    setGuide(prev => ({
      ...prev,
      entries: newEntries,
    }));
    
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get achievement by apiname
  const getAchievementByApiName = (apiname: string) => {
    return achievements.find(a => a.apiname === apiname);
  };

  // Text formatting functions
  const insertBold = () => {
    setEditorContent(prev => prev + '**texto em negrito**');
  };

  const insertList = () => {
    setEditorContent(prev => prev + '\n- Item da lista\n- Outro item\n');
  };

  const insertOrderedList = () => {
    setEditorContent(prev => prev + '\n1. Primeiro passo\n2. Segundo passo\n');
  };

  const insertImage = () => {
    const url = prompt('URL da imagem:');
    if (url) {
      setEditorContent(prev => prev + `\n![Descrição da imagem](${url})\n`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to={`/community-guides`}
          className="inline-flex items-center text-steam-accent hover:underline"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar para Guias
        </Link>

        <div className="flex gap-3">
          <button
            onClick={publishGuide}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Publicar Guia
          </button>
        </div>
      </div>

      {/* Game Header */}
      {gameName && appIdToUse && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-steam-light dark:bg-steam-darker rounded-xl">
          <img
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${appIdToUse}/header.jpg`}
            alt={gameName}
            className="w-32 h-auto rounded-lg"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{gameName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">App ID: {appIdToUse}</p>
          </div>
        </div>
      )}

      {/* Title & Visibility */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Editor de Guia Platina
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Crie seu guia personalizado para platinar este jogo. Adicione notas gerais ou vincule informações a conquistas específicas.
        </p>

        {/* Guide Title Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título do Guia *
            </label>
            <input
              type="text"
              value={guideTitle}
              onChange={(e) => setGuideTitle(e.target.value)}
              placeholder="Ex: Guia Completo de Conquistas"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-steam-darker border-2 border-gray-300 dark:border-steam-dark rounded-lg focus:border-steam-accent focus:outline-none text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <div className='flex-1 flex items-center gap-2'>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibilidade
              </label>
              <p className="block text-xs font-light text-gray-700 dark:text-gray-300 mb-2">
                {isPublic ? '(Todos podem ver este guia)' : '(Apenas você pode ver este guia)'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  isPublic
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-300 dark:border-steam-dark text-gray-600 dark:text-gray-400 hover:border-green-300'
                }`}
              >
                <Globe className="w-5 h-5" />
                Público
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  !isPublic
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-steam-dark text-gray-600 dark:text-gray-400 hover:border-red-300'
                }`}
              >
                <Lock className="w-5 h-5" />
                Privado
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Editor with Wizard */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Nova Anotação
              </h2>
            </CardHeader>
            <CardContent>
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-steam-darker">
                {/* Step 1 */}
                <button
                  onClick={() => setWizardStep(1)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    wizardStep === 1
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : wizardStep > 1
                        ? 'text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-steam-darker'
                        : 'text-gray-400'
                  }`}
                >
                  {wizardStep > 1 ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">1</span>
                  )}
                  <span className="text-sm font-medium">Tipo</span>
                </button>

                <ChevronRight className="w-4 h-4 text-gray-400" />

                {/* Step 2 */}
                <button
                  onClick={() => canProceedToStep2 && setWizardStep(2)}
                  disabled={!canProceedToStep2}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    wizardStep === 2
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : wizardStep > 2
                        ? 'text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-steam-darker'
                        : canProceedToStep2
                          ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-steam-darker'
                          : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {wizardStep > 2 ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                      wizardStep >= 2 ? 'bg-purple-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>2</span>
                  )}
                  <span className="text-sm font-medium">
                    {entryType === 'achievement' ? 'Conquista' : entryType === 'general' ? 'Título' : 'Seleção'}
                  </span>
                </button>

                <ChevronRight className="w-4 h-4 text-gray-400" />

                {/* Step 3 */}
                <button
                  onClick={() => canProceedToStep3 && setWizardStep(3)}
                  disabled={!canProceedToStep3}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    wizardStep === 3
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : canProceedToStep3
                        ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-steam-darker'
                        : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                    wizardStep === 3 ? 'bg-purple-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>3</span>
                  <span className="text-sm font-medium">Conteúdo</span>
                </button>
              </div>

              {/* Step 1: Entry Type Selector */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Selecione o tipo de anotação
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setEntryType('achievement');
                        setGeneralTitle('');
                        setWizardStep(2);
                      }}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        entryType === 'achievement'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-300 dark:border-steam-dark hover:border-purple-300'
                      }`}
                    >
                      <Trophy className={`w-10 h-10 mx-auto mb-3 ${
                        entryType === 'achievement' ? 'text-purple-500' : 'text-gray-400'
                      }`} />
                      <p className={`font-semibold text-lg ${
                        entryType === 'achievement' 
                          ? 'text-purple-700 dark:text-purple-300' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        Conquista
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Vinculada a uma conquista específica
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setEntryType('general');
                        setSelectedAchievement(null);
                        setWizardStep(2);
                      }}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        entryType === 'general'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-steam-dark hover:border-blue-300'
                      }`}
                    >
                      <FileText className={`w-10 h-10 mx-auto mb-3 ${
                        entryType === 'general' ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <p className={`font-semibold text-lg ${
                        entryType === 'general' 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        Nota Geral
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Considerações gerais do guia
                      </p>
                    </button>
                  </div>

                  {/* Editing buttons */}
                  {editingEntryId && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-steam-darker">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Editando nota existente
                      </p>
                      <button
                        onClick={() => {
                          cancelEdit();
                          setWizardStep(1);
                        }}
                        className="w-full py-3 bg-gray-200 dark:bg-steam-darker text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-steam-dark transition-colors"
                      >
                        Cancelar Edição
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Achievement Picker or General Title */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  {entryType === 'achievement' ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-500" />
                        Selecione a conquista
                      </h3>
                      {selectedAchievement ? (
                        <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500 rounded-lg">
                          <img
                            src={selectedAchievement.icon}
                            alt={selectedAchievement.displayName}
                            className="w-16 h-16 rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {selectedAchievement.displayName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedAchievement.description}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowAchievementPicker(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAchievementPicker(true)}
                          className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-steam-dark rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                        >
                          <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600 dark:text-gray-400">
                            Clique para selecionar uma conquista
                          </p>
                        </button>
                      )}

                      {/* Achievement List Modal */}
                      {showAchievementPicker && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                          <div className="bg-white dark:bg-steam-dark rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-steam-darker">
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Escolha uma Conquista
                              </h3>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                              <div className="grid grid-cols-1 gap-3">
                                {achievements.map(achievement => (
                                  <button
                                    key={achievement.apiname}
                                    onClick={() => {
                                      setSelectedAchievement(achievement);
                                      setShowAchievementPicker(false);
                                    }}
                                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-steam-darker rounded-lg hover:bg-gray-100 dark:hover:bg-steam-dark transition-colors text-left"
                                  >
                                    <img
                                      src={achievement.icon}
                                      alt={achievement.displayName}
                                      className="w-12 h-12 rounded"
                                    />
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {achievement.displayName}
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {achievement.description}
                                      </p>
                                    </div>
                                    {achievement.achieved === 1 && (
                                      <Award className="w-5 h-5 text-green-500" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 dark:border-steam-darker">
                              <button
                                onClick={() => setShowAchievementPicker(false)}
                                className="w-full py-3 bg-gray-200 dark:bg-steam-darker text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-steam-dark transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Next button */}
                      <button
                        onClick={() => setWizardStep(3)}
                        disabled={!selectedAchievement}
                        className="w-full mt-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        Continuar
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Editing buttons */}
                      {editingEntryId && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-steam-darker">
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
                            <Edit2 className="w-4 h-4" />
                            Editando nota existente
                          </p>
                          <button
                            onClick={() => {
                              cancelEdit();
                              setWizardStep(1);
                            }}
                            className="w-full py-3 bg-gray-200 dark:bg-steam-darker text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-steam-dark transition-colors"
                          >
                            Cancelar Edição
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Título da Nota Geral
                      </h3>
                      <input
                        type="text"
                        value={generalTitle}
                        onChange={e => setGeneralTitle(e.target.value)}
                        placeholder="Ex: Dicas Gerais, Referências, Ordem Recomendada..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-steam-darker border-2 border-gray-300 dark:border-steam-dark rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                      />

                      {/* Next button */}
                      <button
                        onClick={() => setWizardStep(3)}
                        disabled={!generalTitle.trim()}
                        className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        Continuar
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Editing buttons */}
                      {editingEntryId && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-steam-darker">
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
                            <Edit2 className="w-4 h-4" />
                            Editando nota existente
                          </p>
                          <button
                            onClick={() => {
                              cancelEdit();
                              setWizardStep(1);
                            }}
                            className="w-full py-3 bg-gray-200 dark:bg-steam-darker text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-steam-dark transition-colors"
                          >
                            Cancelar Edição
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Content Editor */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  {/* Selected item summary */}
                  <div className={`p-3 rounded-lg ${
                    entryType === 'achievement' 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      {entryType === 'achievement' && selectedAchievement ? (
                        <>
                          <img
                            src={selectedAchievement.icon}
                            alt={selectedAchievement.displayName}
                            className="w-10 h-10 rounded"
                          />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Conquista selecionada:</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{selectedAchievement.displayName}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <FileText className="w-10 h-10 text-blue-500" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Nota geral:</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{generalTitle}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Escreva o conteúdo
                  </h3>

                  {/* Toolbar */}
                  <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-steam-darker rounded-lg flex-wrap">
                    <button
                      onClick={insertBold}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-steam-dark rounded transition-colors"
                      title="Negrito"
                    >
                      <Bold className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={insertList}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-steam-dark rounded transition-colors"
                      title="Lista"
                    >
                      <List className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={insertOrderedList}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-steam-dark rounded transition-colors"
                      title="Lista Numerada"
                    >
                      <ListOrdered className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={insertImage}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-steam-dark rounded transition-colors"
                      title="Inserir Imagem"
                    >
                      <ImageIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                      Suporta Markdown
                    </div>
                  </div>

                  {/* Text Area */}
                  <textarea
                    value={editorContent}
                    onChange={e => setEditorContent(e.target.value)}
                    placeholder="Escreva suas anotações aqui... Use Markdown para formatação!"
                    className="w-full h-48 px-4 py-3 bg-gray-50 dark:bg-steam-darker border-2 border-gray-300 dark:border-steam-dark rounded-lg focus:border-steam-accent focus:outline-none text-gray-900 dark:text-white resize-none font-mono text-sm"
                  />

                  <button
                    onClick={() => {
                      addEntry();
                      setWizardStep(1);
                    }}
                    disabled={!canAddEntry}
                    className={`w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      entryType === 'achievement'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {editingEntryId ? (
                      <>
                        <Save className="w-5 h-5" />
                        Atualizar Nota
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Adicionar ao Guia
                      </>
                    )}
                  </button>

                  {editingEntryId && (
                    <button
                      onClick={() => {
                        cancelEdit();
                        setWizardStep(1);
                      }}
                      className="w-full py-3 bg-gray-200 dark:bg-steam-darker text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-steam-dark transition-colors"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Guide Preview */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Prévia do Guia ({guide.entries.length} {guide.entries.length === 1 ? 'anotação' : 'anotações'})
              </h2>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {guide.entries.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhuma anotação ainda. Comece criando uma nota!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {guide.entries.map((entry, index) => {
                    const achievement = entry.achievementId 
                      ? getAchievementByApiName(entry.achievementId)
                      : null;
                    
                    return (
                      <div
                        key={entry.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`p-4 bg-gray-50 dark:bg-steam-darker rounded-lg border-l-4 cursor-move transition-all ${
                          entry.type === 'achievement' 
                            ? 'border-purple-500' 
                            : 'border-blue-500'
                        } ${draggedIndex === index ? 'opacity-50' : 'opacity-100'} ${editingEntryId === entry.id ? 'ring-2 ring-yellow-500' : ''}`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                            {entry.type === 'achievement' && achievement ? (
                              <img
                                src={achievement.icon}
                                alt={achievement.displayName}
                                className="w-10 h-10 rounded"
                              />
                            ) : (
                              <FileText className="w-10 h-10 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {entry.type === 'achievement' && achievement ? (
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {achievement.displayName}
                              </h4>
                            ) : (
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {entry.title}
                              </h4>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleCollapse(entry.id)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-steam-dark rounded transition-colors"
                              title={collapsedEntries.has(entry.id) ? "Expandir" : "Encolher"}
                            >
                              {collapsedEntries.has(entry.id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => editEntry(entry)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(entry.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            collapsedEntries.has(entry.id) ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
                          }`}
                        >
                          <div className="
                            text-gray-700 dark:text-gray-300
                            [&>p]:my-3 [&>p]:leading-relaxed
                            [&>strong]:font-bold [&>strong]:text-gray-900 dark:[&>strong]:text-white
                            [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-4 [&>ul]:space-y-2
                            [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-4 [&>ol]:space-y-2
                            [&>li]:leading-relaxed
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
                                // Força a renderização de quebras de linha
                                p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                              }}
                            >
                              {entry.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-steam-dark rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-3 bg-gray-200 dark:bg-steam-darker text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-steam-dark transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => removeEntry(deleteConfirmId)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
