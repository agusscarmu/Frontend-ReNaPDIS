import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import { tokens } from './src/design-tokens/tokens';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.brand,
        accent: tokens.colors.accent,
        surface: {
          bg: tokens.colors.bg,
          panel: tokens.colors.panel,
          border: tokens.colors.border,
          borderSoft: tokens.colors.borderSoft,
        },
        ink: {
          strong: tokens.colors.textStrong,
          medium: tokens.colors.textMedium,
          soft: tokens.colors.textSoft,
          faint: tokens.colors.textFaint,
        },
      },
      spacing: tokens.spacing,
      borderRadius: {
        DEFAULT: tokens.radius.md,
        sm: tokens.radius.sm,
      },
      boxShadow: {
        sm: tokens.shadow.sm,
      },
      maxWidth: {
        layout: tokens.layout.maxWidth,
      },
      height: {
        header: tokens.layout.headerHeight,
      },
      fontFamily: {
        sans: tokens.fontFamily.sans,
      },
    },
  },
  plugins: [forms],
} satisfies Config;
