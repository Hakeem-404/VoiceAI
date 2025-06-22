export const colors = {
  light: {
    primary: '#6366F1',
    primaryDark: '#4338CA',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: '#6366F1',
    primaryDark: '#4338CA',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#64748B',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const gradients = {
  primary: ['#6366F1', '#8B5CF6'],
  secondary: ['#06B6D4', '#8B5CF6'],
  accent: ['#F59E0B', '#EF4444'],
  dark: ['#0F172A', '#1E293B'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};