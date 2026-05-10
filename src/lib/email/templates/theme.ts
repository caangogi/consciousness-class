/**
 * Natureza palette + typography for transactional emails.
 *
 * Why a separate file from the web Tailwind config: email clients (Gmail,
 * Outlook, Apple Mail) do not reliably support CSS variables, custom fonts
 * loaded via @import, or modern selectors. Everything inlined as hex +
 * web-safe stacks.
 */

export const colors = {
  bone:        '#F4EFE6',
  boneSoft:    '#FAF7EF',
  olive:       '#6B7A4F',
  oliveDark:   '#4A5638',
  charcoal:    '#2A2A2A',
  terracotta:  '#C66A3D',
  muted:       '#8A8578',
  line:        'rgba(0,0,0,0.08)',
} as const;

export const fonts = {
  /** Email-safe stack mirroring the iOS-system feel without relying on a webfont. */
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
} as const;

export const styles = {
  body: {
    backgroundColor: colors.bone,
    margin: '0',
    padding: '0',
    fontFamily: fonts.body,
    color: colors.charcoal,
    WebkitTextSizeAdjust: '100%',
  },
  container: {
    margin: '0 auto',
    padding: '32px 24px',
    maxWidth: '560px',
    backgroundColor: colors.bone,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  brandLabel: {
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: colors.terracotta,
    fontWeight: 600,
    margin: '0 0 8px',
  },
  h1: {
    fontSize: '24px',
    fontWeight: 600,
    color: colors.oliveDark,
    margin: '0 0 16px',
    lineHeight: '1.25',
    letterSpacing: '-0.01em',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.55',
    color: colors.charcoal,
    margin: '0 0 12px',
  },
  meta: {
    fontSize: '13px',
    color: colors.muted,
    margin: '0',
  },
  button: {
    display: 'inline-block',
    backgroundColor: colors.olive,
    color: '#FFFFFF',
    padding: '12px 22px',
    borderRadius: '999px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
  },
  hr: {
    border: 'none',
    borderTop: `1px solid ${colors.line}`,
    margin: '24px 0',
  },
  footer: {
    fontSize: '12px',
    color: colors.muted,
    textAlign: 'center' as const,
    margin: '24px 0 0',
    lineHeight: '1.55',
  },
  detailRow: {
    fontSize: '14px',
    color: colors.charcoal,
    margin: '0 0 6px',
  },
  detailLabel: {
    fontWeight: 600,
    color: colors.oliveDark,
    marginRight: '8px',
  },
} as const;
