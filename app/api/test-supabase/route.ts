import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test Supabase connection
    const { data, error } = await supabase
      .from('user_logs')
      .insert({
        clerk_user_id: userId,
        action: 'test_connection',
        metadata: {
          timestamp: new Date().toISOString(),
          test: true
        }
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to test Supabase connection" }, { status: 500 });
  }
} 