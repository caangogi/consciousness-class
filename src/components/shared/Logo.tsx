
import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  imageUrl?: string;
  altText?: string;
  useIconOnly?: boolean;
  className?: string;
  onClick?: () => void;
  width?: number;
  height?: number;
}

export function Logo({
  imageUrl,
  altText = "Consciousness Class Logo",
  useIconOnly = false,
  className,
  onClick,
  width = 150, // Default width for desktop
  height = 40, // Default height for desktop
}: LogoProps) {
  let content;

  if (imageUrl) {
    content = (
      <Image
        src={imageUrl}
        alt={altText}
        width={width}
        height={height}
        priority // Important for LCP
        className="object-contain"
        // Removed key={imageUrl} as it's not a standard prop and might cause hydration issues
      />
    );
  } else {
    content = (
      <>
        <GraduationCap className="h-7 w-7 md:h-8 md:w-8" />
        {!useIconOnly && <span className="ml-2 text-xl md:text-2xl font-bold font-headline">Consciousness Class</span>}
      </>
    );
  }

  const commonClasses = `flex items-center text-primary font-headline ${className || ''}`;
  const ariaLabel = imageUrl ? altText : "Consciousness Class Home";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={commonClasses}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href="/" className={commonClasses} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}
