import { useState, useEffect } from 'react';
import { steamService } from '@/services/steam.service';
import { AchievementWithDetails, AchievementStats } from '@/types';
import { useToast } from '@/store';

/**
 * useSteamAchievements Hook
 * Fetches and manages game achievements for a user
 */

interface UseSteamAchievementsResult {
  achievements: AchievementWithDetails[];
  stats: AchievementStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSteamAchievements(
  steamId: string | null,
  appId: number | null
): UseSteamAchievementsResult {
  const [achievements, setAchievements] = useState<AchievementWithDetails[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchAchievements = async () => {
    if (!steamId || !appId) {
      setAchievements([]);
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resolvedId = await steamService.resolveSteamId(steamId);
      const data = await steamService.getGameAchievements(resolvedId, appId);
      setAchievements(data.achievements);
      setStats(data.stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch achievements';
      setError(message);
      toast.error(message);
      setAchievements([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('useSteamAchievements - steamId:', steamId, 'appId:', appId);
    // Only fetch if both steamId and appId are provided AND steamId is not 'preview'
    if (steamId && appId && steamId !== 'preview') {
      console.log('Fetching achievements...');
      fetchAchievements();
    } else {
      console.log('Skipping achievements fetch (preview mode or missing data)');
    }
  }, [steamId, appId]);

  return {
    achievements,
    stats,
    isLoading,
    error,
    refetch: fetchAchievements,
  };
}
