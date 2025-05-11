-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  fullName TEXT,
  avatarUrl TEXT,
  role TEXT CHECK (role IN ('teacher', 'admin', 'student')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_resources table
CREATE TABLE shared_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('lesson', 'assessment', 'template', 'rubric')),
  shared_by UUID REFERENCES profiles(id),
  shared_with UUID,
  permission TEXT CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accessibility_settings table
CREATE TABLE accessibility_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for each table
-- Note: You would customize these policies based on your specific access requirements

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for teams
CREATE POLICY "Team members can view teams"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can update teams"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'admin')
    )
  );

-- Create policies for templates
CREATE POLICY "Users can view public templates"
  ON templates FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own templates"
  ON templates FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can view shared templates"
  ON templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_resources
      WHERE shared_resources.resource_id = templates.id
      AND shared_resources.resource_type = 'template'
      AND shared_resources.shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (created_by = auth.uid());

-- Create policies for shared_resources
CREATE POLICY "Users can view resources shared with them"
  ON shared_resources FOR SELECT
  USING (shared_with = auth.uid() OR shared_by = auth.uid());

CREATE POLICY "Users can share their own resources"
  ON shared_resources FOR INSERT
  WITH CHECK (shared_by = auth.uid());

-- Create policies for accessibility_settings
CREATE POLICY "Users can view their own accessibility settings"
  ON accessibility_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own accessibility settings"
  ON accessibility_settings FOR UPDATE
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_shared_resources_resource_id ON shared_resources(resource_id);
CREATE INDEX idx_shared_resources_shared_with ON shared_resources(shared_with);
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_content_id ON analytics(content_id); 