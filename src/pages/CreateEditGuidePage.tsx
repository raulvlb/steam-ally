import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronLeft,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Globe,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';
import { guidesApi, CreateGuideData, UpdateGuideData } from '@/api/guides';

/**
 * Create/Edit Community Guide Page
 * Form for creating or editing guides with markdown support
 */

export function CreateEditGuidePage() {
  const { id, appId: routeAppId } = useParams<{ id?: string; appId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuthStore();

  const isEditing = !!id;
  
  // Get initial values from query params (from game selector modal)
  const queryAppId = searchParams.get('appId') || '';
  const queryIsPublic = searchParams.get('isPublic') !== 'false';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [steamAppId, setSteamAppId] = useState(routeAppId || queryAppId || '');
  const [isPublic, setIsPublic] = useState(queryIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [gameName, setGameName] = useState('');

  // Load guide if editing
  useEffect(() => {
    const fetchGuide = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const guide = await guidesApi.getGuide(id);
        setTitle(guide.title);
        setContent(guide.content);
        setSteamAppId(guide.steamAppId.toString());
        setIsPublic(guide.isPublic);
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

  // Fetch game name based on appId
  useEffect(() => {
    const fetchGameName = async () => {
      if (!steamAppId) return;
      
      try {
        const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${steamAppId}`);
        const data = await response.json();
        if (data[steamAppId]?.success && data[steamAppId]?.data?.name) {
          setGameName(data[steamAppId].data.name);
        }
      } catch (error) {
        console.log('Could not fetch game name');
      }
    };

    fetchGameName();
  }, [steamAppId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!content.trim()) {
      toast.error('Conteúdo é obrigatório');
      return;
    }

    if (!steamAppId || isNaN(parseInt(steamAppId))) {
      toast.error('App ID é obrigatório e deve ser um número');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && id) {
        const updateData: UpdateGuideData = {
          title,
          content,
          isPublic,
        };
        await guidesApi.updateGuide(id, updateData);
        toast.success('Guia atualizado com sucesso');
        navigate(`/community-guide/${id}`);
      } else {
        const createData: CreateGuideData = {
          title,
          content,
          steamAppId: parseInt(steamAppId),
          isPublic,
        };
        const newGuide = await guidesApi.createGuide(createData);
        toast.success('Guia criado com sucesso');
        navigate(`/community-guide/${newGuide.id}`);
      }
    } catch (error: any) {
      console.error('Error saving guide:', error);
      toast.error(error.message || 'Erro ao salvar guia');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-steam-accent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-steam-accent mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Voltar
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditing ? 'Editar Guia' : 'Criar Novo Guia'}
        </h1>
        {gameName && (
          <div className="flex items-center gap-2 mt-2">
            <img 
              src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${steamAppId}/header.jpg`}
              alt={gameName}
              className="w-24 h-auto rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <p className="text-lg font-medium text-steam-accent">{gameName}</p>
              <p className="text-sm text-gray-500">App ID: {steamAppId}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Title and App ID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Título do Guia *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Guia Completo de Conquistas"
              className="w-full px-4 py-2 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-steam-accent"
              required
            />
          </div>
          <div>
            <label
              htmlFor="appId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Steam App ID *
            </label>
            <input
              id="appId"
              type="number"
              value={steamAppId}
              onChange={(e) => setSteamAppId(e.target.value)}
              placeholder="Ex: 1174180"
              disabled={isEditing}
              className="w-full px-4 py-2 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-steam-accent disabled:opacity-50"
              required
            />
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isPublic
                ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-400'
            }`}
          >
            {isPublic ? (
              <>
                <Eye className="w-5 h-5" />
                Público
              </>
            ) : (
              <>
                <EyeOff className="w-5 h-5" />
                Privado
              </>
            )}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isPublic
              ? 'Todos podem ver este guia'
              : 'Apenas você pode ver este guia'}
          </span>
        </div>

        {/* Markdown Toolbar */}
        <Card className="mb-2">
          <CardContent className="p-2 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => insertMarkdown('# ', '\n')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-steam-dark rounded"
              title="Título 1"
            >
              <Heading1 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('## ', '\n')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-steam-dark rounded"
              title="Título 2"
            >
              <Heading2 className="w-5 h-5" />
            </button>
            <div className="w-px bg-gray-300 dark:bg-steam-dark mx-1" />
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-steam-dark rounded"
              title="Negrito"
            >
              <Bold className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-steam-dark rounded"
              title="Itálico"
            >
              <Italic className="w-5 h-5" />
            </button>
            <div className="w-px bg-gray-300 dark:bg-steam-dark mx-1" />
            <button
              type="button"
              onClick={() => insertMarkdown('- ', '\n')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-steam-dark rounded"
              title="Lista"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('1. ', '\n')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-steam-dark rounded"
              title="Lista Numerada"
            >
              <ListOrdered className="w-5 h-5" />
            </button>
            <div className="w-px bg-gray-300 dark:bg-steam-dark mx-1" />
            <button
              type="button"
              onClick={() => insertMarkdown('[', '](url)')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-steam-dark rounded"
              title="Link"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('![alt](', ')')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-steam-dark rounded"
              title="Imagem"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                showPreview
                  ? 'bg-steam-accent text-white'
                  : 'bg-gray-100 dark:bg-steam-dark text-gray-700 dark:text-gray-300'
              }`}
            >
              {showPreview ? 'Editar' : 'Visualizar'}
            </button>
          </CardContent>
        </Card>

        {/* Content Editor / Preview */}
        {showPreview ? (
          <Card className="mb-6">
            <CardContent className="p-6 prose dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*Nenhum conteúdo ainda...*'}
              </ReactMarkdown>
            </CardContent>
          </Card>
        ) : (
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva seu guia usando Markdown...

# Introdução
Descrição do jogo e visão geral das conquistas.

## Dicas Gerais
- Dica 1
- Dica 2

## Conquistas
### Nome da Conquista
Como desbloquear essa conquista..."
            className="w-full h-96 px-4 py-3 bg-white dark:bg-steam-darker border border-gray-300 dark:border-steam-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-steam-accent font-mono text-sm resize-y mb-6"
            required
          />
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-steam-dark rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-steam-accent text-white rounded-lg hover:bg-steam-accent-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isEditing ? 'Salvar Alterações' : 'Publicar Guia'}
          </button>
        </div>
      </form>
    </div>
  );
}
