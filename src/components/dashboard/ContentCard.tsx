import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ContentCardProps {
  title: string;
  description?: string;
  metadata?: string;
  timestamp?: string;
  tags?: string[];
  children?: ReactNode;
  footer?: ReactNode;
  image?: string;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ContentCard({ 
  title, 
  description, 
  metadata,
  timestamp,
  tags = [], 
  children, 
  footer,
  image,
  icon,
  className,
  onClick
}: ContentCardProps) {
  return (
    <Card 
      className={cn("overflow-hidden transition-all hover:shadow-md cursor-pointer", className)}
      onClick={onClick}
    >
      {image && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      <CardHeader>
        <div className="flex gap-2 flex-wrap mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {metadata && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            {icon && <span>{icon}</span>}
            <span>{metadata}</span>
          </div>
        )}
        {timestamp && (
          <div className="text-xs text-muted-foreground mt-1">
            {timestamp}
          </div>
        )}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
