import { supabase } from '@/lib/supabaseClient';

type LogAction = 'login' | 'generate_image' | 'image_generated' | 'credits_purchased';

type LogMetadata = {
  timestamp?: string;
  [key: string]: unknown;
};

export async function logUserAction(
  clerkUserId: string,
  action: LogAction,
  metadata: LogMetadata
) {
  try {
    await supabase.from('user_logs').insert({
      clerk_user_id: clerkUserId,
      action,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Logging error:', err);
  }
} 