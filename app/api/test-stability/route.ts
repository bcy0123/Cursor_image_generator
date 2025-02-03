import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch('https://api.stability.ai/v1/user/balance', {
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Stability API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, balance: data });
  } catch (error) {
    console.error('Stability API test error:', error);
    return NextResponse.json({ error: "Failed to connect to Stability API" }, { status: 500 });
  }
} 