-- Create the app_downloads table
CREATE TABLE IF NOT EXISTS app_downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    platform TEXT NOT NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    app_version TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE app_downloads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for authenticated users" ON app_downloads
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable viewing own downloads" ON app_downloads
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "Enable select for authenticated users" ON profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable update for own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON app_downloads TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- Create or replace the store_download_info function
CREATE OR REPLACE FUNCTION store_download_info(
    p_email TEXT,
    p_platform TEXT DEFAULT 'android',
    p_version TEXT DEFAULT '1.0.0'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the current user's ID if they're authenticated
    v_user_id := auth.uid();
    
    -- Insert the download record
    INSERT INTO app_downloads (email, platform, app_version, user_id)
    VALUES (p_email, p_platform, p_version, v_user_id);
    
    RETURN json_build_object(
        'success', true,
        'message', 'Download info stored successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', SQLERRM
        );
END;
$$; 