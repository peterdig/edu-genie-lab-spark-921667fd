import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play } from "lucide-react";
import { Lab } from "@/types/labs";
import { useNavigate } from "react-router-dom";

interface LabCardProps {
  lab: Lab;
  onClick?: () => void;
}

export function LabCard({ lab, onClick }: LabCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/labs/${lab.id}`);
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow border border-border/50">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img 
          src={lab.thumbnail} 
          alt={lab.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {lab.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
              {tag}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-base sm:text-lg line-clamp-1">{lab.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-0 flex-grow px-3 sm:px-6">
        <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
          {lab.description}
        </p>
      </CardContent>
      <CardFooter className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
        <Button 
          className="flex items-center gap-1.5 w-full text-sm h-9"
          onClick={handleClick}
        >
          <Play className="h-3.5 w-3.5" />
          <span>Launch Lab</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
