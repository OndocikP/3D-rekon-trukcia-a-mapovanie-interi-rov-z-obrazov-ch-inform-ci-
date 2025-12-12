import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeName, AppColors } from './themes';

const STORAGE_KEY = 'app_theme_colors';

type CtxType = {
  themeName: ThemeName;
  colors: AppColors;
  setTheme: (name: ThemeName) => void;
};

const ColorsContext = createContext<CtxType | null>(null);

export function ColorsProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('purple');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in THEMES) {
        setThemeName(saved as ThemeName);
      }
    });
  }, []);

  const setTheme = async (name: ThemeName) => {
    setThemeName(name);
    await AsyncStorage.setItem(STORAGE_KEY, name);
  };

  return (
    <ColorsContext.Provider
      value={{
        themeName,
        colors: THEMES[themeName],
        setTheme,
      }}
    >
      {children}
    </ColorsContext.Provider>
  );
}

export function useColors() {
  const ctx = useContext(ColorsContext);
  if (!ctx) {
    throw new Error('useColors must be used inside ColorsProvider');
  }
  return ctx;
}
