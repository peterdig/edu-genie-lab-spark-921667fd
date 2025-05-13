import { createClient } from '@supabase/supabase-js';

// Define more generic interface for request and response
interface Request {
  method: string;
  body: any;
}

interface Response {
  status: (code: number) => Response;
  json: (data: any) => Response;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, version } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Insert into a custom emails table that triggers the email send
    const { error } = await supabase
      .from('email_queue')
      .insert({
        to_email: email,
        template: 'app-installation',
        data: {
          app_version: version,
          installation_steps: [
            'Download the APK file from the download link',
            'Enable installation from unknown sources in your Android settings',
            'Open the downloaded APK file to start installation',
            'Follow the on-screen instructions to complete installation'
          ],
          support_email: 'support@edgenie.com',
          download_url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/EdGenie-mobile.apk`
        }
      });

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to queue installation instructions email:', error);
    return res.status(500).json({ error: 'Failed to send installation instructions' });
  }
} 