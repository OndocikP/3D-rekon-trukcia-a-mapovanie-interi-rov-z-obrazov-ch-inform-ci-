/**
 * Centralizovaná konfigurácia pre API a Supabase
 */

// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8086';
export const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

// Supabase Configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Debug info
export const isDevelopment = __DEV__;

console.log('🔧 Config Loaded:', {
  API_BASE_URL,
  API_URL,
  isDevelopment,
});
