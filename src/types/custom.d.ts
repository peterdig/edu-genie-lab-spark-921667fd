import 'react';

// Button component type declarations
declare module '@/components/ui/button' {
  import { ButtonHTMLAttributes } from 'react';
  
  export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
  }

  export const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;

  export const buttonVariants: (options: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
  }) => string;
}

// Badge component type declarations
declare module '@/components/ui/badge' {
  import { HTMLAttributes } from 'react';
  
  export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

  export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: BadgeVariant;
  }

  export const Badge: React.FC<BadgeProps>;

  export const badgeVariants: (options: {
    variant?: BadgeVariant;
    className?: string;
  }) => string;
} 