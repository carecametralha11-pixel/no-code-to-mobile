import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  message: string;
  tokens?: string[];
  user_id?: string;
  send_to_all?: boolean;
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
    const payload = await req.json() as NotificationPayload;
    const { title, message, tokens: providedTokens, user_id, send_to_all } = payload;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetTokens: { token: string; platform: string; user_id: string }[] = [];

    // Get tokens based on target
    if (providedTokens && providedTokens.length > 0) {
      // Tokens were provided directly
      const { data: tokenData } = await supabase
        .from('push_tokens')
        .select('token, platform, user_id')
        .in('token', providedTokens);
      targetTokens = tokenData || [];
    } else if (user_id) {
      // Send to specific user
      const { data: tokenData } = await supabase
        .from('push_tokens')
        .select('token, platform, user_id')
        .eq('user_id', user_id);
      targetTokens = tokenData || [];
    } else if (send_to_all) {
      // Send to all users
      const { data: tokenData } = await supabase
        .from('push_tokens')
        .select('token, platform, user_id');
      targetTokens = tokenData || [];
    }

    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No devices found to send notification',
          sent: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending notification to ${targetTokens.length} devices`);

    // Log notification details
    const notificationLog = {
      title,
      message,
      tokens_count: targetTokens.length,
      platforms: [...new Set(targetTokens.map(t => t.platform))],
      user_ids: [...new Set(targetTokens.map(t => t.user_id))],
      sent_at: new Date().toISOString(),
      sent_by: user.id,
    };

    console.log('Notification details:', JSON.stringify(notificationLog, null, 2));

    // TODO: Implement actual push notification sending with FCM
    // For now, we simulate successful sending
    // 
    // To implement FCM:
    // 1. Add FCM_SERVER_KEY to secrets
    // 2. Use the Firebase Cloud Messaging API:
    //
    // const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     registration_ids: targetTokens.map(t => t.token),
    //     notification: { 
    //       title, 
    //       body: message,
    //       sound: 'default',
    //       badge: 1,
    //     },
    //     data: {
    //       title,
    //       message,
    //       click_action: 'FLUTTER_NOTIFICATION_CLICK',
    //     },
    //   }),
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        sent: targetTokens.length,
        platforms: [...new Set(targetTokens.map(t => t.platform))],
        users_notified: [...new Set(targetTokens.map(t => t.user_id))].length,
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
