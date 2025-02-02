import { supabase } from '@/lib/supabaseClient';

type LogAction = 'login' | 'generate_image' | 'image_generated' | 'credits_purchased';

export async function logUserAction(
  clerkUserId: string,
  action: LogAction,
  metadata: any
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
  } catch (error) {
    console.error('Logging error:', error);
  }
} 