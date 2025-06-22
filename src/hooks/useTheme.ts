import { useColorScheme } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { colors } from '../constants/colors';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { theme } = useUserStore();
  
  const resolvedTheme = theme === 'system' ? systemColorScheme || 'light' : theme;
  const currentColors = colors[resolvedTheme];
  
  return {
    theme: resolvedTheme,
    colors: currentColors,
    isDark: resolvedTheme === 'dark',
  };
}