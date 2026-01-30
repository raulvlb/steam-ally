import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { 
  ChevronLeft, 
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
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardHeader, CardContent, SkeletonList } from '@/components';
import { AchievementWithDetails, Guide, GuideEntry, EntryType } from '@/types';
import { useToast } from '@/store/toast.store';
import { useUserStore } from '@/store';

/**
 * Guide Editor Page
 * Create and edit platinum guides for games
 */

export function GuideEditorPage() {
  const { steamId, appId } = useParams<{ steamId: string; appId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { steamId: currentUserSteamId } = useUserStore();
  
  // Determine if this is a new guide (no steamId in URL)
  const actualSteamId = steamId || currentUserSteamId;

  const [achievements, setAchievements] = useState<AchievementWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [entryType, setEntryType] = useState<EntryType>('achievement');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithDetails | null>(null);
  const [generalTitle, setGeneralTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [guide, setGuide] = useState<Guide>({ entries: [] });
  const [showAchievementPicker, setShowAchievementPicker] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load achievements from schema (for all users, even without the game)
  useEffect(() => {
    const fetchAchievementSchema = async () => {
      if (!appId) return;
      
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };
    
    fetchAchievementSchema();
  }, [appId]);

  // Load guide from localStorage
  useEffect(() => {
    if (actualSteamId && appId) {
      const savedGuide = localStorage.getItem(`guide_${actualSteamId}_${appId}`);
      if (savedGuide) {
        setGuide(JSON.parse(savedGuide));
      }
    }
  }, [actualSteamId, appId]);

  // Save guide to localStorage
  const saveGuide = () => {
    if (actualSteamId && appId) {
      localStorage.setItem(`guide_${actualSteamId}_${appId}`, JSON.stringify(guide));
      toast.success('Guia salvo com sucesso!', 3000);
    }
  };

  // Export guide to JSON file
  const exportGuide = () => {
    // Save before exporting
    saveGuide();

    const exportData = {
      version: '1.0',
      appId: appId,
      exportDate: new Date().toISOString(),
      guide: guide
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guide-${appId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Navigate to view page
  const navigateToView = () => {
    // Save before viewing
    saveGuide();
    navigate(`/guide/view/${actualSteamId}/${appId}`);
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
          to={`/guides`}
          className="inline-flex items-center text-steam-accent hover:underline"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar para Guias
        </Link>

        <div className="flex gap-3">
          <button
            onClick={navigateToView}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Visualizar
          </button>
          <button
            onClick={exportGuide}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
          <button
            onClick={importGuide}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Importar
          </button>
          <button
            onClick={saveGuide}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            <Save className="w-5 h-5" />
            Salvar
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Editor de Guia Platina
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Crie seu guia personalizado para platinar este jogo. Adicione notas gerais ou vincule informações a conquistas específicas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          {/* Entry Type Selector */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Tipo de Anotação
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setEntryType('achievement');
                    setGeneralTitle('');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    entryType === 'achievement'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-steam-dark hover:border-purple-300'
                  }`}
                >
                  <Trophy className={`w-8 h-8 mx-auto mb-2 ${
                    entryType === 'achievement' ? 'text-purple-500' : 'text-gray-400'
                  }`} />
                  <p className={`font-semibold ${
                    entryType === 'achievement' 
                      ? 'text-purple-700 dark:text-purple-300' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Conquista
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Vinculada a uma conquista
                  </p>
                </button>

                <button
                  onClick={() => {
                    setEntryType('general');
                    setSelectedAchievement(null);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    entryType === 'general'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-steam-dark hover:border-blue-300'
                  }`}
                >
                  <FileText className={`w-8 h-8 mx-auto mb-2 ${
                    entryType === 'general' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <p className={`font-semibold ${
                    entryType === 'general' 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Nota Geral
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Considerações gerais
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Picker or General Title */}
          {entryType === 'achievement' ? (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-steam-accent" />
                  Selecionar Conquista
                </h2>
              </CardHeader>
              <CardContent>
                {selectedAchievement ? (
                  <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500 rounded-lg">
                    <img
                      src={selectedAchievement.icon}
                      alt={selectedAchievement.displayName}
                      className="w-16 h-16 rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedAchievement.displayName}
                      </h3>
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-500" />
                  Título da Nota Geral
                </h2>
              </CardHeader>
              <CardContent>
                <input
                  type="text"
                  value={generalTitle}
                  onChange={e => setGeneralTitle(e.target.value)}
                  placeholder="Ex: Dicas Gerais, Referências, Ordem Recomendada..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-steam-darker border-2 border-gray-300 dark:border-steam-dark rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                />
              </CardContent>
            </Card>
          )}

          {/* Text Editor */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Escrever Conteúdo
              </h2>
            </CardHeader>
            <CardContent>
              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-4 p-2 bg-gray-100 dark:bg-steam-darker rounded-lg flex-wrap">
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
                className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-steam-darker border-2 border-gray-300 dark:border-steam-dark rounded-lg focus:border-steam-accent focus:outline-none text-gray-900 dark:text-white resize-none font-mono text-sm"
              />

              <button
                onClick={addEntry}
                disabled={
                  !editorContent.trim() ||
                  (entryType === 'achievement' && !selectedAchievement) ||
                  (entryType === 'general' && !generalTitle.trim())
                }
                className={`w-full mt-4 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
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
                  onClick={cancelEdit}
                  className="w-full mt-2 py-3 bg-gray-200 dark:bg-steam-darker text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-steam-dark transition-colors"
                >
                  Cancelar Edição
                </button>
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
            <CardContent>
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
