import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

type ConnectionStatus = 'checking' | 'connected' | 'error' | 'unconfigured';

const SupabaseDebug = () => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [configDetails, setConfigDetails] = useState<{
    url?: string;
    keyConfigured?: boolean;
    serviceRoleConfigured?: boolean;
  }>({});

  useEffect(() => {
    checkConnection();
  }, []);

  // Check Supabase connection
  const checkConnection = async () => {
    setStatus('checking');
    setErrorDetails(null);

    // Check if Supabase is configured at all
    if (!isSupabaseConfigured()) {
      setStatus('unconfigured');
      setConfigDetails({
        url: import.meta.env.VITE_SUPABASE_URL || 'Not configured',
        keyConfigured: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        serviceRoleConfigured: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      });
      return;
    }

    try {
      // Try a basic query to test connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      // Store configuration details regardless of connection result
      setConfigDetails({
        url: import.meta.env.VITE_SUPABASE_URL,
        keyConfigured: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        serviceRoleConfigured: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      });

      if (error) {
        console.error('Supabase connection error:', error);
        setStatus('error');
        setErrorDetails(error.message);
      } else {
        setStatus('connected');
      }
    } catch (err) {
      console.error('Error checking Supabase connection:', err);
      setStatus('error');
      setErrorDetails(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Network connectivity test
  const testNetwork = async () => {
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      return false;
    }
  };

  return (
    <div className="bg-muted/50 p-4 rounded-lg border border-border shadow-sm w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-foreground">Supabase Connection</h3>
        
        <Badge
          variant={
            status === 'connected' 
              ? 'success' 
              : status === 'error' 
                ? 'destructive' 
                : status === 'unconfigured'
                  ? 'secondary'
                  : 'outline'
          }
          className="ml-2"
        >
          {status === 'checking' && (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          )}
          {status === 'connected' && (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-3 w-3 mr-1" />
          )}
          {status === 'unconfigured' && (
            <Info className="h-3 w-3 mr-1" />
          )}
          
          {status === 'checking' && 'Checking...'}
          {status === 'connected' && 'Connected'}
          {status === 'error' && 'Connection Error'}
          {status === 'unconfigured' && 'Not Configured'}
        </Badge>
      </div>
      
      {status === 'error' && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>
            {errorDetails || 'Could not connect to Supabase'}
          </AlertDescription>
        </Alert>
      )}
      
      {status === 'unconfigured' && (
        <Alert variant="warning" className="mb-3">
          <AlertDescription>
            Supabase credentials not found in environment variables. Using localStorage fallback.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium">URL:</span> 
          {configDetails.url ? 
            (configDetails.url.startsWith('https://') ? '✓ Valid URL' : '❌ Invalid URL format') :
            '❌ Missing'
          }
        </p>
        <p>
          <span className="font-medium">Anon Key:</span> 
          {configDetails.keyConfigured ? '✓ Configured' : '❌ Missing'}
        </p>
        <p>
          <span className="font-medium">Service Role Key:</span> 
          {configDetails.serviceRoleConfigured ? '✓ Configured' : '⚠️ Not found (optional)'}
        </p>
      </div>
      
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button 
          size="sm" 
          onClick={checkConnection}
          variant="outline"
          className="flex-1"
        >
          Test Connection
        </Button>
        <Button 
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
      
      {showDetails && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs font-mono overflow-auto max-h-32">
          <p>URL: {configDetails.url && configDetails.url.replace(/^(https:\/\/\w{4}).*(\w{4}\.supabase\.\w+)$/, '$1...$2')}</p>
          <p>Anon Key: {configDetails.keyConfigured ? '[configured]' : '[missing]'}</p>
          <p>Service Role: {configDetails.serviceRoleConfigured ? '[configured]' : '[missing]'}</p>
          <p>Using Fallback: {!isSupabaseConfigured() ? 'Yes' : 'No'}</p>
          <p>Browser: {navigator.userAgent}</p>
        </div>
      )}
    </div>
  );
};

export default SupabaseDebug; 