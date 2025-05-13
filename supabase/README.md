# Supabase Database Setup

This directory contains SQL scripts to set up the database tables required for the EdGenie application.

## Authentication Tables Setup

To set up authentication-related tables in Supabase:

1. Login to your Supabase dashboard
2. Navigate to the "SQL Editor" section
3. Create a new query
4. Copy and paste the contents of `auth-tables.sql` into the SQL editor
5. Run the query

This will create:

- An `auth_events` table to track user authentication events (login, logout, signup, etc.)
- Additional columns in the `profiles` table to track authentication data
- A trigger to update profile data when authentication events are logged
- A view for user login statistics

## Database Schema

### auth_events Table

Tracks all authentication-related events:

- `id`: Unique identifier for the event
- `user_id`: User associated with the event
- `event_type`: Type of event (signin, signout, signup, etc.)
- `timestamp`: When the event occurred
- `metadata`: Additional information about the event (JSON)
- `ip_address`: IP address of the request (if available)
- `user_agent`: Browser/client information
- `created_at`: When the record was created

### profiles Table Extensions

Additional columns added to the profiles table:

- `last_login`: Timestamp of the user's last login
- `login_count`: Number of times the user has logged in
- `failed_login_attempts`: Number of failed login attempts
- `last_failed_login`: Timestamp of the last failed login attempt
- `terms_accepted`: Whether the user has accepted the terms of service
- `terms_accepted_at`: When the user accepted the terms
- `email_verified`: Whether the user's email has been verified
- `email_verified_at`: When the user's email was verified

## Usage in Application

The application tracks authentication events through the `auth-events.ts` module, which provides functions to:

- Log authentication events to the database
- Update last login time
- Track signin/signout/signup events

These events are automatically triggered when users authenticate with the application.

## Security

Row Level Security (RLS) policies are in place to ensure:

- Users can only view their own authentication events
- Only administrators can view all authentication events

## Maintenance

To view authentication statistics, query the `user_login_stats` view:

```sql
SELECT * FROM user_login_stats;
```

To clear authentication events (if needed):

```sql
DELETE FROM auth_events WHERE timestamp < NOW() - INTERVAL '30 days';
``` 