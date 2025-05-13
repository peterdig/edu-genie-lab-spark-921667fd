import { memo } from 'react';

function LoadingFallback() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading EdGenie...</p>
      </div>
    </div>
  );
}

export default memo(LoadingFallback); 