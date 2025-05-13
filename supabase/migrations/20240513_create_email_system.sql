-- Create the email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id BIGSERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error TEXT,
  attempts INT DEFAULT 0
);

-- Create the email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the app installation template
INSERT INTO email_templates (name, subject, html_content, text_content) 
VALUES (
  'app-installation',
  'EdGenie Mobile App Installation Instructions',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .steps { margin: 20px 0; }
    .step { margin: 10px 0; }
    .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
    .button { 
      display: inline-block; 
      padding: 12px 24px; 
      background-color: #4F46E5;
      color: white; 
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EdGenie Mobile App Installation</h1>
      <p>Version {{app_version}}</p>
    </div>
    
    <p>Thank you for downloading the EdGenie mobile app! Follow these steps to install:</p>
    
    <div class="steps">
      {{#each installation_steps}}
        <div class="step">{{this}}</div>
      {{/each}}
    </div>

    <a href="{{download_url}}" class="button">Download APK</a>

    <p>If you need any assistance, please contact our support team at {{support_email}}.</p>

    <div class="footer">
      <p>This email was sent because you requested to download the EdGenie mobile app.</p>
    </div>
  </div>
</body>
</html>',
  'Thank you for downloading EdGenie Mobile App (Version {{app_version}})

Installation Steps:
{{#each installation_steps}}
- {{this}}
{{/each}}

Download APK: {{download_url}}

Need help? Contact us at {{support_email}}

This email was sent because you requested to download the EdGenie mobile app.'
);

-- Create a function to send emails
CREATE OR REPLACE FUNCTION process_email_queue() RETURNS trigger AS $$
BEGIN
  -- Get the template
  WITH template AS (
    SELECT subject, html_content, text_content
    FROM email_templates
    WHERE name = NEW.template
  )
  -- Send the email using Supabase's built-in email sending
  SELECT net.http_post(
    url := CONCAT(current_setting('app.settings.supabase_url'), '/rest/v1/rpc/send_email'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', current_setting('app.settings.service_key')
    ),
    body := jsonb_build_object(
      'to', NEW.to_email,
      'subject', (SELECT subject FROM template),
      'html', (SELECT html_content FROM template),
      'text', (SELECT text_content FROM template),
      'data', NEW.data
    )
  );

  -- Update the email queue record
  UPDATE email_queue
  SET sent_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to process emails
CREATE TRIGGER process_email_after_insert
  AFTER INSERT ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION process_email_queue(); 