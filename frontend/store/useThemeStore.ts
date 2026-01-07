'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
    themePreference: ThemePreference;
    setThemePreference: (theme: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            themePreference: 'light',
            setThemePreference: (themePreference) => set({ themePreference }),
        }),
        {
            name: 'app-theme-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useThemeStore;
