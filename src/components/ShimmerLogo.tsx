import React from 'react';
import { TextShimmer } from './TextShimmer';

interface ShimmerLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'header' | 'hero' | 'footer';
}

export function ShimmerLogo({ 
  size = 'md', 
  className = '',
  variant = 'hero'
}: ShimmerLogoProps) {
  
  // Size classes
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-5xl'
  };
  
  // Variant classes with different shimmer colors/base colors for different contexts
  const variantStyles = {
    header: {
      className: 'font-bold tracking-tight align-baseline inline-flex',
      shimmerColor: 'rgba(220, 220, 255, 1)',
      baseColor: '#ffffff',
      duration: 3
    },
    hero: {
      className: 'font-bold tracking-tight align-baseline inline-flex',
      shimmerColor: 'rgba(220, 220, 255, 1)',
      baseColor: '#ffffff',
      duration: 2.5
    },
    footer: {
      className: 'font-bold align-baseline inline-flex',
      shimmerColor: 'rgba(220, 220, 255, 1)',
      baseColor: '#ffffff',
      duration: 3.5
    }
  };
  
  const selectedVariant = variantStyles[variant];
  
  return (
    <TextShimmer
      as="span"
      className={`${sizeClasses[size]} ${selectedVariant.className} ${className} relative align-baseline`}
      duration={selectedVariant.duration}
      spread={1.5}
      shimmerColor={selectedVariant.shimmerColor}
      baseColor={selectedVariant.baseColor}
    >
      EduGenie
    </TextShimmer>
  );
} 