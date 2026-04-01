import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchAppSettings } from "@/services/settingsService";

interface AppSettings {
  site_name?: string;
  site_description?: string;
  contact_email?: string;
  site_url?: string;
  logo?: string;
  favicon?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  frame_bg_color?: string;
  button_secondary_color?: string;
  font_family?: string;
  font_size?: string;
  button_style?: string;
  enable_registration?: boolean;
  require_email_verification?: boolean;
  max_storage_per_user?: number;
}

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  refetchSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

// Helper per calcolare il contrasto del testo
const getContrastColor = (hexColor: string): string => {
  try {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  } catch {
    return '#ffffff';
  }
};

// Helper per applicare le variabili CSS globalmente
const applyGlobalCssVars = (data: AppSettings) => {
  if (!data) return;
  const root = document.documentElement;
  
  if (data.primary_color) {
    root.style.setProperty('--color-primary', data.primary_color);
    root.style.setProperty('--color-primary-text', getContrastColor(data.primary_color));
  }
  if (data.secondary_color) {
    root.style.setProperty('--color-secondary', data.secondary_color);
    root.style.setProperty('--color-secondary-text', getContrastColor(data.secondary_color));
  }
  if (data.accent_color) {
    root.style.setProperty('--color-accent', data.accent_color);
    root.style.setProperty('--color-accent-text', getContrastColor(data.accent_color));
  }
  if (data.frame_bg_color) {
    root.style.setProperty('--color-frame-bg', data.frame_bg_color);
    root.style.setProperty('--color-frame-bg-text', getContrastColor(data.frame_bg_color));
  }
  if (data.button_secondary_color) {
    root.style.setProperty('--color-button-secondary', data.button_secondary_color);
    root.style.setProperty('--color-button-secondary-text', getContrastColor(data.button_secondary_color));
  }
  if (data.font_family) {
    root.style.setProperty('--font-family', data.font_family);
    document.body.style.fontFamily = data.font_family + ', sans-serif';
  }
  if (data.font_size) {
    const sizeMap: Record<string, string> = { small: '14px', medium: '16px', large: '18px' };
    root.style.setProperty('--font-size-base', sizeMap[data.font_size] || '16px');
    document.body.style.fontSize = sizeMap[data.font_size] || '16px';
  }
  if (data.button_style) {
    const radiusMap: Record<string, string> = { rounded: '0.5rem', pill: '9999px', square: '0px' };
    root.style.setProperty('--button-radius', radiusMap[data.button_style] || '0.5rem');
  }
};

// 🌟 FIX: Load settings from cache immediately before React even renders
const getCachedSettings = (): AppSettings | null => {
  try {
    const cached = localStorage.getItem('app_settings_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      applyGlobalCssVars(parsed); // Apply colors instantly
      return parsed;
    }
  } catch (e) {
    console.error("Cache read error", e);
  }
  return null;
};

// Run once outside the component to apply CSS instantly on page refresh
getCachedSettings();

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize state with cached data to avoid empty/default state flashes
  const [settings, setSettings] = useState<AppSettings | null>(getCachedSettings());
  const [loading, setLoading] = useState(!settings); // Only show loading if we don't have cache

  const refetchSettings = async () => {
    try {
      if (!settings) setLoading(true);
      
      const data = await fetchAppSettings();
      
      if (data) {
        setSettings(data);
        applyGlobalCssVars(data);
        // Save to cache for the next time the user refreshes
        localStorage.setItem('app_settings_cache', JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchSettings();
  }, []);

  const value = {
    settings,
    loading,
    refetchSettings,
  };

  // 🌟 FIX: Block the app from rendering defaults if we have NO data at all
  if (loading && !settings) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};