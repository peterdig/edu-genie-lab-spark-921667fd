import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, AlertTriangle, CheckCircle2, Copy, Database, ExternalLink, KeyRound, RefreshCw, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const SupabaseSetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unchecked' | 'checking' | 'success' | 'error'>('unchecked');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [sqlScript, setSqlScript] = useState<string>('');

  useEffect(() => {
    // Load the initial SQL script
    loadSqlScript();
  }, []);

  const loadSqlScript = async () => {
    // Hard-coded SQL script as fallback
    const defaultSql = `-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'teacher',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create shared_resources table
CREATE TABLE IF NOT EXISTS shared_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Team members can view their teams" 
  ON teams FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = id
    )
  );

CREATE POLICY "Team members can view team membership" 
  ON team_members FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = team_id
    )
  );

CREATE POLICY "Users can view resources shared with them" 
  ON shared_resources FOR SELECT 
  USING (
    auth.uid() = shared_with OR auth.uid() = shared_by
  );`;
    
    setSqlScript(defaultSql);
  };
  
  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('checking');
    
    try {
      // Check if we already have configured Supabase
      if (!isSupabaseConfigured()) {
        setConnectionStatus('error');
        setErrorDetails('Supabase URL or anon key not configured in environment variables.');
        return;
      }
      
      // Try making a simple query
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      // If we got here, connection is successful
      setConnectionStatus('success');
      toast({
        title: "Connection successful",
        description: "Supabase is properly configured and connected.",
      });
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      setErrorDetails(error.message || 'Unknown error occurred');
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Failed to connect to Supabase.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste the content.",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Supabase Setup</h1>
          <p className="text-muted-foreground">
            Configure your Supabase integration for EdGenie
          </p>
        </div>

        <Tabs defaultValue="connection">
          <TabsList className="mb-6">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="schema">Database Schema</TabsTrigger>
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="mr-2 h-5 w-5" />
                    Connection Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your Supabase connection details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant={isSupabaseConfigured() ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Configuration Status</AlertTitle>
                    <AlertDescription>
                      {isSupabaseConfigured() 
                        ? "Supabase is configured in your environment variables." 
                        : "Supabase is not properly configured. Please add the required environment variables."}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supabase-url">Supabase URL</Label>
                    <div className="flex">
                      <Input 
                        id="supabase-url"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(supabaseUrl)}
                        className="ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your Supabase project URL from the API settings
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                    <div className="flex">
                      <Input 
                        id="supabase-key"
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        placeholder="eyJh..."
                        type="password"
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(supabaseKey)}
                        className="ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your anon/public key from the API settings
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="w-full">
                    <Button 
                      onClick={testConnection} 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing Connection
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" /> Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {connectionStatus === 'success' && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertTitle>Connection Successful</AlertTitle>
                      <AlertDescription>
                        Your Supabase connection is working properly.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {connectionStatus === 'error' && (
          <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription>
                        {errorDetails || "There was an error connecting to Supabase."}
            </AlertDescription>
          </Alert>
        )}

                  <div className="text-sm text-muted-foreground">
                    <p>
                      To configure Supabase for this application, you need to add the following 
                      variables to your <code className="bg-muted px-1 rounded">.env</code> file:
                    </p>
                    <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto">
                      VITE_SUPABASE_URL=your_url_here{"\n"}
                      VITE_SUPABASE_ANON_KEY=your_key_here
                    </pre>
                  </div>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5" />
                    Next Steps
                  </CardTitle>
                  <CardDescription>
                    After configuring your connection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">1. Set up database schema</h3>
                    <p className="text-sm text-muted-foreground">
                      Run the SQL script in the "Database Schema" tab to create the required tables.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">2. Enable authentication providers</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure authentication methods in your Supabase dashboard.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href="https://supabase.com/dashboard/project/_/auth/providers" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        Open Auth Settings <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">3. Restart your application</h3>
                    <p className="text-sm text-muted-foreground">
                      Restart the app to apply the new configuration.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => navigate('/login')}>
                        Go to Login
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/')}>
                        Go to Home
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="schema">
            <Card>
              <CardHeader>
                <CardTitle>Database Schema</CardTitle>
                <CardDescription>
                  Run this SQL script in your Supabase SQL Editor to create the required tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Textarea 
                    value={sqlScript}
                    onChange={(e) => setSqlScript(e.target.value)}
                    className="font-mono text-sm h-[500px] overflow-y-auto"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(sqlScript)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={loadSqlScript}>
                  Reset to Default
                </Button>
                <Button onClick={() => copyToClipboard(sqlScript)}>
                  Copy SQL Script
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="guide">
            <Card>
              <CardHeader>
                <CardTitle>Setup Guide</CardTitle>
                <CardDescription>
                  Follow these steps to set up your Supabase project
                </CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none dark:prose-invert">
                <h3>1. Create a Supabase Project</h3>
                <p>
                  If you haven't already, create a new project in your 
                  <a href="https://app.supabase.io/" target="_blank" rel="noopener noreferrer"> Supabase dashboard</a>.
                </p>
                
                <h3>2. Get Your API Keys</h3>
                <p>
                  From your project dashboard, go to Project Settings → API and copy your:
                </p>
                <ul>
                  <li><strong>Project URL</strong>: This is your <code>VITE_SUPABASE_URL</code></li>
                  <li><strong>anon public</strong>: This is your <code>VITE_SUPABASE_ANON_KEY</code></li>
                </ul>
                
                <h3>3. Configure Your .env File</h3>
                <p>
                  Create or update your <code>.env</code> file with the values from step 2.
                </p>
                
                <h3>4. Run the Database Schema</h3>
                <p>
                  Go to the "Database Schema" tab, copy the SQL code, and run it in your 
                  Supabase SQL Editor.
                </p>
                
                <h3>5. Set Up Authentication</h3>
                <p>
                  In the Supabase dashboard, go to Authentication → Settings and:
                </p>
                <ul>
                  <li>Configure the Site URL (for redirects)</li>
                  <li>Enable the email provider</li>
                  <li>Optionally set up additional providers (Google, GitHub, etc.)</li>
                  </ul>
                
                <h3>6. Restart Your Application</h3>
                <p>
                  Restart your application to apply the new configuration.
                </p>
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="mt-0">Need More Help?</h4>
                  <p className="mb-0">
                    Refer to the comprehensive <code>SUPABASE_SETUP.md</code> file or 
                    <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer"> Supabase documentation</a>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SupabaseSetup; 