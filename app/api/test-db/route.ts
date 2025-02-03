import { prisma } from "@/lib/prismaClient";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    return NextResponse.json({ 
      success: true, 
      user: user ? {
        id: user.id,
        credits: user.creditBalance
      } : null 
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ error: "Failed to connect to database" }, { status: 500 });
  }
} 