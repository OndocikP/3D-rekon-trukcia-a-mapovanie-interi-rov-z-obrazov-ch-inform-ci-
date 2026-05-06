export type ThemeName = 'purple' | 'light' | 'black' | 'blue';

export type AppColors = {
  background: string;
  gradientTop: string;
  gradientBottom: string;

  primary: string;
  primaryLight: string;
  secondary: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  inputBackground: string;
  inputBorder: string;
  inputFocused: string;
  buttonText: string;

  danger: string;
  warning: string;
  success: string;

  card: string;
  cardBorder: string;

  modalOverlay: string;
  modalCard: string;

  placeholder: string;
  shadow: string;
};

export const THEMES: Record<ThemeName, AppColors> = {
  purple: {
    background: '#0f0f1a',
    gradientTop: '#a855f7',
    gradientBottom: '#6d28d9',

    primary: '#a855f7',
    primaryLight: '#d8b4fe',
    secondary: '#7c3aed',

    textPrimary: '#ffffff',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',

    inputBackground: '#1f2937',
    inputBorder: '#374151',
    inputFocused: '#a855f7',
    buttonText: '#ffffff',

    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',

    card: 'rgba(168, 85, 247, 0.08)',
    cardBorder: 'rgba(168, 85, 247, 0.2)',

    modalOverlay: 'rgba(0,0,0,0.7)',
    modalCard: 'rgba(31, 41, 55, 0.95)',

    placeholder: '#6b7280',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },

  light: {
    background: '#f9fafb',
    gradientTop: '#f3f4f6',
    gradientBottom: '#f9fafb',

    primary: '#3b82f6',
    primaryLight: '#93c5fd',
    secondary: '#0ea5e9',

    textPrimary: '#111827',
    textSecondary: '#374151',
    textTertiary: '#6b7280',

    inputBackground: '#ffffff',
    inputBorder: '#e5e7eb',
    inputFocused: '#3b82f6',
    buttonText: '#ffffff',

    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',

    card: '#f3f4f6',
    cardBorder: '#e5e7eb',

    modalOverlay: 'rgba(0,0,0,0.4)',
    modalCard: '#ffffff',

    placeholder: '#9ca3af',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  black: {
    background: '#000000',
    gradientTop: '#1a1a2e',
    gradientBottom: '#000000',

    primary: '#60a5fa',
    primaryLight: '#93c5fd',
    secondary: '#3b82f6',

    textPrimary: '#ffffff',
    textSecondary: '#e5e7eb',
    textTertiary: '#9ca3af',

    inputBackground: '#111827',
    inputBorder: '#374151',
    inputFocused: '#60a5fa',
    buttonText: '#ffffff',

    danger: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',

    card: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',

    modalOverlay: 'rgba(0,0,0,0.8)',
    modalCard: '#111827',

    placeholder: '#6b7280',
    shadow: 'rgba(0, 0, 0, 0.8)',
  },

  blue: {
    background: '#0f172a',
    gradientTop: '#3b82f6',
    gradientBottom: '#1e3a8a',

    primary: '#3b82f6',
    primaryLight: '#93c5fd',
    secondary: '#1d4ed8',

    textPrimary: '#ffffff',
    textSecondary: '#e0e7ff',
    textTertiary: '#a5b4fc',

    inputBackground: '#1e293b',
    inputBorder: '#334155',
    inputFocused: '#3b82f6',
    buttonText: '#ffffff',

    danger: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',

    card: 'rgba(59, 130, 246, 0.1)',
    cardBorder: 'rgba(59, 130, 246, 0.2)',

    modalOverlay: 'rgba(0,0,0,0.7)',
    modalCard: 'rgba(30, 58, 138, 0.95)',

    placeholder: '#64748b',
    shadow: 'rgba(0, 0, 0, 0.6)',
  },
};
