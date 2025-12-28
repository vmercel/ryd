// Atlas Concierge Design System
// Aviation-inspired palette with sophisticated dark theme

export const Colors = {
  // Base colors
  primary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    contrast: '#FFFFFF',
  },
  secondary: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    contrast: '#FFFFFF',
  },
  accent: {
    emerald: '#10B981',
    green: '#10B981', // alias for emerald
    amber: '#F59E0B',
    rose: '#F43F5E',
    red: '#EF4444',
    cyan: '#06B6D4',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    ruby: '#DC2626',
  },
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background system
  background: {
    primary: '#0A0E17',
    secondary: '#141821',
    tertiary: '#1E2530',
    elevated: '#252D3A',
    modal: 'rgba(10, 14, 23, 0.95)',
  },
  
  // Surface colors
  surface: {
    base: '#1E2530',
    raised: '#252D3A',
    elevated: '#252D3A', // alias for raised
    overlay: '#2D3648',
  },
  
  // Text colors
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    disabled: '#6B7280',
    inverse: '#0A0E17',
  },
  
  // Border colors
  border: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.16)',
    primary: 'rgba(255, 255, 255, 0.12)',   // alias for medium
    secondary: 'rgba(255, 255, 255, 0.08)', // alias for light
  },
  
  // Status colors for execution phases
  execution: {
    understand: '#8B5CF6',
    search: '#3B82F6',
    compare: '#06B6D4',
    hold: '#F59E0B',
    book: '#10B981',
    pay: '#8B5CF6',
    confirm: '#10B981',
    monitor: '#3B82F6',
  },
  
  // Booking status colors
  bookingStatus: {
    planning: '#9CA3AF',
    searching: '#3B82F6',
    watching: '#3B82F6',
    holding: '#F59E0B',
    booked: '#10B981',
    confirmed: '#10B981',
    'in-progress': '#8B5CF6',
    completed: '#6B7280',
    cancelled: '#6B7280',
    'needs-attention': '#EF4444',
  },

  // Legacy alias
  tripStatus: {
    planning: '#9CA3AF',
    watching: '#3B82F6',
    holding: '#F59E0B',
    booked: '#10B981',
    inTrip: '#8B5CF6',
    complete: '#6B7280',
    needsAttention: '#EF4444',
  },
};

export const Typography = {
  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

export const Animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    inOut: 'ease-in-out',
    out: 'ease-out',
    in: 'ease-in',
  },
};
