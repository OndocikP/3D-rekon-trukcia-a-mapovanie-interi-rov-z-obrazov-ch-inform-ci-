export type ThemeName = 'purple' | 'light' | 'black' | 'blue';

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

export const THEMES: Record<ThemeName, AppColors> = {
  purple: {
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
    modalCard: 'rgba(0, 0, 0, 0.14)',

    placeholder: '#000000ff',
  },

  light: {
    background: '#ffffff',
    gradientTop: '#ffffff',
    gradientBottom: '#f2f2f7',

    primary: '#3ad67bff',
    secondary: '#3ad67bff',

    textPrimary: '#000000ff',
    textSecondary: '#4b5563',

    inputBackground: '#ffffff',
    buttonText: '#ffffff',

    danger: '#ef4444',

    card: '#d8d8d8ff',
    cardBorder: 'rgba(0,0,0,0.12)',

    modalOverlay: 'rgba(0,0,0,0.4)',
    modalCard: '#494949ff',

    placeholder: '#000000ff',
  },

  black: {
    background: '#0b0b10',
    gradientTop: '#0b0b10',
    gradientBottom: '#000000',

    primary: '#312e81',
    secondary: '#312e81',

    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',

    inputBackground: '#111827',
    buttonText: '#ffffff',

    danger: '#fb7185',

    card: 'rgba(56, 56, 56, 0.06)',
    cardBorder: 'rgba(255,255,255,0.14)',

    modalOverlay: 'rgba(0,0,0,0.7)',
    modalCard: 'rgba(20,20,36,0.95)',

    placeholder: '#ffffffff',
  },

  blue: {
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
    modalCard: 'rgba(0,0,0,0.2)',

    placeholder: '#000000ff',
  },
};
