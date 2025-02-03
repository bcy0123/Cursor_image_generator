import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('No userId found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Updating credits for user:', userId);

    // Force update credits to 100
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        creditBalance: 100
      },
      update: {
        creditBalance: 100  // Force update to 100
      }
    });

    console.log('Credits updated:', user);

    return NextResponse.json({ 
      success: true,
      message: "Credits updated successfully", 
      credits: user.creditBalance 
    });
  } catch (err) {
    console.error('Update credits error:', err);
    return NextResponse.json({ 
      error: "Failed to update credits",
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
} 