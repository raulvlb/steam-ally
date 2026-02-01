import { useState } from 'react';
import { Heart, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { guidesApi, Guide } from '@/api/guides';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';

interface GuideActionsProps {
  guide: Guide;
  onUpdate?: (guide: Guide) => void;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function GuideActions({ guide, onUpdate, showLabels = false, size = 'md' }: GuideActionsProps) {
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localGuide, setLocalGuide] = useState(guide);

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.warning('Entre com Steam para curtir guias');
      return;
    }

    setIsLiking(true);
    try {
      let result;
      if (localGuide.likedByUser) {
        result = await guidesApi.unlikeGuide(guide.id);
      } else {
        result = await guidesApi.likeGuide(guide.id);
      }

      const updatedGuide = {
        ...localGuide,
        likedByUser: !localGuide.likedByUser,
        totalLikes: result.totalLikes,
      };

      setLocalGuide(updatedGuide);
      onUpdate?.(updatedGuide);
    } catch (error) {
      toast.error('Erro ao curtir guia');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.warning('Entre com Steam para salvar guias');
      return;
    }

    setIsSaving(true);
    try {
      if (localGuide.savedByUser) {
        await guidesApi.unsaveGuide(guide.id);
        toast.success('Guia removido dos salvos');
      } else {
        await guidesApi.saveGuide(guide.id);
        toast.success('Guia salvo com sucesso');
      }

      const updatedGuide = {
        ...localGuide,
        savedByUser: !localGuide.savedByUser,
      };

      setLocalGuide(updatedGuide);
      onUpdate?.(updatedGuide);
    } catch (error) {
      toast.error('Erro ao salvar guia');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Like button */}
      <button
        onClick={handleLike}
        disabled={isLiking}
        className={`flex items-center gap-1.5 transition-colors ${
          localGuide.likedByUser
            ? 'text-red-500 hover:text-red-600'
            : 'text-gray-500 hover:text-red-500 dark:text-gray-400'
        }`}
        title={localGuide.likedByUser ? 'Remover curtida' : 'Curtir'}
      >
        {isLiking ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : (
          <Heart
            className={iconSizes[size]}
            fill={localGuide.likedByUser ? 'currentColor' : 'none'}
          />
        )}
        <span className="text-sm font-medium">{localGuide.totalLikes}</span>
        {showLabels && <span className="hidden sm:inline">curtidas</span>}
      </button>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`flex items-center gap-1.5 transition-colors ${
          localGuide.savedByUser
            ? 'text-steam-accent'
            : 'text-gray-500 hover:text-steam-accent dark:text-gray-400'
        }`}
        title={localGuide.savedByUser ? 'Remover dos salvos' : 'Salvar guia'}
      >
        {isSaving ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : localGuide.savedByUser ? (
          <BookmarkCheck className={iconSizes[size]} />
        ) : (
          <Bookmark className={iconSizes[size]} />
        )}
        {showLabels && (
          <span className="hidden sm:inline">
            {localGuide.savedByUser ? 'Salvo' : 'Salvar'}
          </span>
        )}
      </button>
    </div>
  );
}
