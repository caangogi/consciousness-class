import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  imageUrl?: string;
  altText?: string;
  useIconOnly?: boolean; // Kept for potential future use, but image will take precedence
  className?: string;
  onClick?: () => void;
  width?: number;
  height?: number;
}

export function Logo({
  imageUrl,
  altText = "MentorBloom Logo",
  useIconOnly = false,
  className,
  onClick,
  width = 150, // Default width for the image logo
  height = 40, // Default height for the image logo
}: LogoProps) {
  let content;

  if (imageUrl) {
    content = (
      <Image
        src={imageUrl}
        alt={altText}
        width={width}
        height={height}
        priority // Prioritize loading the logo
        className="object-contain" // Ensure the logo scales correctly
      />
    );
  } else {
    content = (
      <>
        <GraduationCap className="h-7 w-7 md:h-8 md:w-8" />
        {!useIconOnly && <span className="ml-2 text-xl md:text-2xl font-bold font-headline">MentorBloom</span>}
      </>
    );
  }

  const commonClasses = `flex items-center text-primary font-headline ${className || ''}`;
  const ariaLabel = imageUrl ? altText : "MentorBloom Home";

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
