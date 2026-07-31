export const tokens = {
  colors: {
    brand: '#242C4F',
    accent: '#37BBED',
    bg: '#F5F6F8',
    panel: '#FFFFFF',
    border: '#E5E7EB',
    borderSoft: '#F3F4F6',
    textStrong: '#111827',
    textMedium: '#374151',
    textSoft: '#6B7280',
    textFaint: '#9CA3AF',
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
  },
  radius: {
    sm: '4px',
    md: '6px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
  },
  layout: {
    maxWidth: '1100px',
    headerHeight: '56px',
  },
  fontFamily: {
    sans: ['Encode Sans', 'system-ui', '-apple-system', 'sans-serif'],
  },
} as const;
