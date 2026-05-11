/**
 * Logo · brand mark for Consciousness Class.
 *
 * Renders a Leaf glyph (Pluma) in a terracotta-tinted rounded square +
 * the "Consciousness Class" wordmark. Mirrors the brand block in the
 * site footer so the visual identity stays coherent across every
 * surface (public site header, dashboard sidebar, mobile sheets,
 * loading splash).
 *
 * Why no image asset:
 *   - The previous design fetched a PNG from Firebase Storage on every
 *     paint. With billing not yet active on the project (see Owner
 *     handover) those requests 402'd in production, leaving every
 *     header logo broken on cold loads.
 *   - The Leaf icon is a vector (lucide-react) — no network, no CLS,
 *     responds to currentColor for dark mode.
 *
 * Back-compat: the old `imageUrl`, `altText`, `useIconOnly`, `width`
 * and `height` props are accepted but ignored — keeps existing call
 * sites compiling while we migrate them one PR at a time.
 */

import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  /** Render only the leaf glyph, no wordmark. Useful in compact headers. */
  iconOnly?: boolean;
  /** Visual scale. Defaults to `md` (matches the footer). */
  size?: LogoSize;
  /** Extra classes applied to the outer wrapper. */
  className?: string;
  /** When provided, renders a `<button>` instead of a `<Link>`. */
  onClick?: () => void;

  // ── Back-compat props (deprecated, ignored) ──────────────────────
  /** @deprecated The logo is now an inline SVG icon — no image is fetched. */
  imageUrl?: string;
  /** @deprecated No longer used; kept so existing call sites compile. */
  altText?: string;
  /** @deprecated Use `iconOnly` instead. */
  useIconOnly?: boolean;
  /** @deprecated The logo no longer renders an `<Image>`; ignored. */
  width?: number;
  /** @deprecated The logo no longer renders an `<Image>`; ignored. */
  height?: number;
}

const SIZE_TOKENS: Record<LogoSize, { box: string; icon: string; text: string }> = {
  sm: { box: 'h-7 w-7 rounded-lg', icon: 'h-4 w-4', text: 'text-sm' },
  md: { box: 'h-9 w-9 rounded-xl', icon: 'h-5 w-5', text: 'text-base' },
  lg: { box: 'h-11 w-11 rounded-2xl', icon: 'h-6 w-6', text: 'text-lg' },
};

export function Logo({
  iconOnly = false,
  size = 'md',
  className,
  onClick,
  // Back-compat: respect useIconOnly when iconOnly isn't explicitly set.
  useIconOnly,
}: LogoProps): React.ReactElement {
  const tokens = SIZE_TOKENS[size];
  const renderIconOnly = iconOnly || useIconOnly === true;

  const content = (
    <>
      <span
        className={cn(
          'flex items-center justify-center bg-brand-terracotta/15 text-brand-terracotta flex-shrink-0',
          tokens.box
        )}
        aria-hidden="true"
      >
        <Leaf className={tokens.icon} />
      </span>
      {!renderIconOnly && (
        <span className={cn('font-semibold text-foreground tracking-tight', tokens.text)}>
          Consciousness Class
        </span>
      )}
    </>
  );

  const wrapperClasses = cn(
    'inline-flex items-center gap-2 font-headline',
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={wrapperClasses}
        aria-label="Consciousness Class"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href="/" className={wrapperClasses} aria-label="Consciousness Class">
      {content}
    </Link>
  );
}
