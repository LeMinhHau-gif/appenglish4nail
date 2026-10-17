import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ThemePaletteId,
  ThemeMode,
  ThemeOption,
  THEME_PALETTES,
  ThemeService,
} from '../services/themeService';

interface ThemeContextType {
  palette: ThemePaletteId;
  mode: ThemeMode;
  theme: ThemeOption;
  palettes: ThemeOption[];
  setPalette: (palette: ThemePaletteId) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [palette, setPaletteState] = useState<ThemePaletteId>(ThemeService.getPalette());
  const [mode, setModeState] = useState<ThemeMode>(ThemeService.getMode());

  useEffect(() => {
    // Apply initial attributes
    ThemeService.applyToDOM(palette, mode);

    const unsubscribe = ThemeService.subscribe((newPalette, newMode) => {
      setPaletteState(newPalette);
      setModeState(newMode);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setPalette = (newPalette: ThemePaletteId) => {
    ThemeService.setPalette(newPalette);
    setPaletteState(newPalette);
  };

  const setMode = (newMode: ThemeMode) => {
    ThemeService.setMode(newMode);
    setModeState(newMode);
  };

  const toggleMode = () => {
    const next = ThemeService.toggleMode();
    setModeState(next);
  };

  const theme = THEME_PALETTES.find((p) => p.id === palette) || THEME_PALETTES[0];

  return (
    <ThemeContext.Provider
      value={{
        palette,
        mode,
        theme,
        palettes: THEME_PALETTES,
        setPalette,
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
