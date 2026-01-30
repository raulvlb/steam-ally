import { useState, useEffect } from 'react';
import { steamService } from '@/services/steam.service';
import { UserProfile } from '@/types';
import { useToast } from '@/store';

/**
 * useSteamProfile Hook
 * Fetches and manages Steam user profile data
 */

interface UseSteamProfileResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSteamProfile(steamId: string | null): UseSteamProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchProfile = async () => {
    if (!steamId) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resolvedId = await steamService.resolveSteamId(steamId);
      const data = await steamService.getUserProfile(resolvedId);
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [steamId]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
