
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
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img 
          src={lab.thumbnail} 
          alt={lab.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex gap-2 mb-2 flex-wrap">
          {lab.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-lg">{lab.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-0 flex-grow">
        <p className="text-muted-foreground text-sm">
          {lab.description}
        </p>
      </CardContent>
      <CardFooter className="pt-4">
        <Button 
          className="flex items-center gap-2 w-full"
          onClick={handleClick}
        >
          <Play className="h-4 w-4" />
          <span>Launch Lab</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
