import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';
import { styles } from './components';

export { theme, styles };

export function DesignSystem({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
} 