import { useState, useEffect } from 'react';
import { steamService } from '@/services/steam.service';
import { GameDetails } from '@/types';
import { useToast } from '@/store';

/**
 * useSteamGames Hook
 * Fetches and manages user's owned games
 */

interface UseSteamGamesResult {
  games: GameDetails[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSteamGames(steamId: string | null): UseSteamGamesResult {
  const [games, setGames] = useState<GameDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchGames = async () => {
    if (!steamId) {
      setGames([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resolvedId = await steamService.resolveSteamId(steamId);
      const data = await steamService.getOwnedGames(resolvedId);
      setGames(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch games';
      setError(message);
      toast.error(message);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [steamId]);

  return {
    games,
    isLoading,
    error,
    refetch: fetchGames,
  };
}
