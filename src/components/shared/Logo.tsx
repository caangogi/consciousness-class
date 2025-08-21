
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

const DEFAULT_LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2FLOGO-COUNSCIUSNESS.png?alt=media&token=1aa283aa-2213-4b2f-8ff0-443a31c1d84b";

export function Logo({
  imageUrl = DEFAULT_LOGO_URL,
  altText = "Consciousness Class Logo",
  useIconOnly = false,
  className,
  onClick,
  width = 125, // Default width for desktop
  height = 76, // Default height for desktop
}: LogoProps) {
  let content;

  if (imageUrl) {
    content = (
      <Image
        src={imageUrl}
        alt={altText}
        width={width}
        height={height}
        className="object-contain"
        priority
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
