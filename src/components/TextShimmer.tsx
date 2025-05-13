'use client';
import React, { useMemo, type JSX } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  shimmerColor?: string;
  baseColor?: string;
}

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
  shimmerColor,
  baseColor,
}: TextShimmerProps) {
  const MotionComponent = motion(Component as keyof JSX.IntrinsicElements);

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  // Determine if base color is white to adjust the shimmer effect
  const isWhiteBase = baseColor === '#ffffff';
  
  // For white base color, use a subtle light shimmer effect
  const gradientColors = isWhiteBase 
    ? {
        start: baseColor || '#ffffff',
        middle: shimmerColor || 'rgba(255, 255, 255, 0.5)',
        end: baseColor || '#ffffff'
      }
    : {
        start: baseColor || 'rgba(var(--primary-rgb), 0.9)',
        middle: shimmerColor || '#ffffff',
        end: baseColor || 'rgba(var(--primary-rgb), 0.9)'
      };

  return (
    <MotionComponent
      className={cn(
        'relative inline-block overflow-hidden align-baseline',
        className
      )}
      style={{
        WebkitTextFillColor: 'transparent',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        backgroundImage: `linear-gradient(
          90deg, 
          ${gradientColors.start} 0%, 
          ${gradientColors.middle} 50%, 
          ${gradientColors.end} 100%
        )`,
        backgroundSize: '200% 100%',
        color: baseColor || 'rgba(var(--primary-rgb), 0.9)',
        display: 'inline-flex',
        verticalAlign: 'baseline',
        transform: 'translateY(0)'
      }}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
    >
      {children}
    </MotionComponent>
  );
}

// GradientShimmer is an alias for TextShimmer for backward compatibility
export const GradientShimmer = TextShimmer; 