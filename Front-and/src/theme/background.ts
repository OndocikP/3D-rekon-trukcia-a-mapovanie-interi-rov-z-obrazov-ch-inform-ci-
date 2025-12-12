export type BackgroundName = 'purple' | 'light' | 'black' | 'blue';

export const BACKGROUND_ORDER: BackgroundName[] = ['purple', 'light', 'black', 'blue'];
export const DEFAULT_BACKGROUND: BackgroundName = 'purple';
export const STORAGE_KEY_BG = 'app_background_v1';

export type AppColors = {
  background: string;
  gradientTop: string;
  gradientBottom: string;

  primary: string;
  secondary: string;

  textPrimary: string;
  textSecondary: string;

  inputBackground: string;
  buttonText: string;

  danger: string;

  card: string;
  cardBorder: string;

  modalOverlay: string;
  modalCard: string;

  placeholder: string;
};

export const BACKGROUNDS: Record<BackgroundName, { label: string; colors: AppColors }> = {
  purple: {
    label: 'Purple (Default)',
    colors: {
      background: '#0f0f14',
      gradientTop: '#9b2ce0',
      gradientBottom: '#3a0a63',

      primary: '#9b2ce0',
      secondary: '#5c1d95',

      textPrimary: '#ffffff',
      textSecondary: '#bdbdbd',

      inputBackground: '#ffffff',
      buttonText: '#ffffff',

      danger: '#ff4d4d',

      card: 'rgba(0,0,0,0.35)',
      cardBorder: 'rgba(255,255,255,0.25)',

      modalOverlay: 'rgba(0,0,0,0.6)',
      modalCard: 'rgba(0,0,0,0.85)',

      placeholder: '#888888',
    },
  },

  light: {
    label: 'Light',
    colors: {
      background: '#ffffff',
      gradientTop: '#ffffff',
      gradientBottom: '#f2f2f7',

      primary: '#757575ff',
      secondary: '#252525ff',

      textPrimary: '#111827',
      textSecondary: '#4b5563',

      inputBackground: '#ffffff',
      buttonText: '#111827',

      danger: '#ef4444',

      card: '#ffffff',
      cardBorder: 'rgba(0,0,0,0.12)',

      modalOverlay: 'rgba(223, 223, 223, 0.35)',
      modalCard: '#fffbfbff',

      placeholder: '#6b7280',
    },
  },

  black: {
    label: 'Black',
    colors: {
      background: '#0b0b10',
      gradientTop: '#0b0b10',
      gradientBottom: '#000000',

      primary: '#7c3aed',
      secondary: '#312e81',

      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',

      inputBackground: '#111827',
      buttonText: '#ffffff',

      danger: '#fb7185',

      card: 'rgba(255,255,255,0.06)',
      cardBorder: 'rgba(255,255,255,0.14)',

      modalOverlay: 'rgba(0,0,0,0.7)',
      modalCard: 'rgba(20,20,36,0.95)',

      placeholder: '#71717a',
    },
  },

  blue: {
    label: 'Blue',
    colors: {
      background: '#0b1220',
      gradientTop: '#2563eb',
      gradientBottom: '#0b1220',

      primary: '#2563eb',
      secondary: '#1e40af',

      textPrimary: '#ffffff',
      textSecondary: '#c7d2fe',

      inputBackground: '#ffffff',
      buttonText: '#ffffff',

      danger: '#ef4444',

      card: 'rgba(0,0,0,0.35)',
      cardBorder: 'rgba(255,255,255,0.25)',

      modalOverlay: 'rgba(0,0,0,0.6)',
      modalCard: 'rgba(0,0,0,0.85)',

      placeholder: '#93c5fd',
    },
  },
};
