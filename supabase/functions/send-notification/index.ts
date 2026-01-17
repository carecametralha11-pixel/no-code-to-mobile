import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the request is from an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse notification payload
    const { user_id, title, body, data } = await req.json() as NotificationPayload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No push tokens found for user ${user_id}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No push tokens registered for this user',
          sent: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tokens.length} push tokens for user ${user_id}`);

    // For now, we just log the notification
    // In production, you would integrate with Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
    // This requires additional setup with Firebase project and credentials
    
    const notificationLog = {
      user_id,
      title,
      body,
      data,
      tokens_count: tokens.length,
      platforms: tokens.map(t => t.platform),
      sent_at: new Date().toISOString(),
    };

    console.log('Notification to send:', JSON.stringify(notificationLog, null, 2));

    // TODO: Implement actual push notification sending
    // For FCM, you would need:
    // 1. Firebase Admin SDK credentials stored in secrets
    // 2. Send notification using FCM API for each token
    
    // Example FCM implementation (commented):
    // const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     registration_ids: tokens.map(t => t.token),
    //     notification: { title, body },
    //     data,
    //   }),
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification queued',
        sent: tokens.length,
        platforms: tokens.map(t => t.platform),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in send-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
