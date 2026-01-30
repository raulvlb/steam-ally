import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SteamProfile } from '@/types';

/**
 * User Store
 * Manages authenticated user state with persistence
 */

interface UserState {
  steamId: string | null;
  profile: SteamProfile | null;
  setSteamId: (steamId: string) => void;
  setProfile: (profile: SteamProfile | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      steamId: null,
      profile: null,

      setSteamId: (steamId: string) => {
        set({ steamId });
      },

      setProfile: (profile: SteamProfile | null) => {
        set({ profile });
      },

      logout: () => {
        set({ steamId: null, profile: null });
      },

      isAuthenticated: () => {
        const state = get();
        return !!state.steamId;
      },
    }),
    {
      name: 'steam-user-storage',
    }
  )
);
