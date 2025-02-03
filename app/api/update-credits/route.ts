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

    console.log('Attempting to update credits for user:', userId);

    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    console.log('Existing user:', existingUser);

    let user;
    if (!existingUser) {
      // Create new user
      console.log('Creating new user');
      user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          creditBalance: 100
        }
      });
    } else {
      // Update existing user
      console.log('Updating existing user');
      user = await prisma.user.update({
        where: { clerkUserId: userId },
        data: { creditBalance: 100 }
      });
    }

    console.log('Operation successful:', user);

    return NextResponse.json({ 
      message: "Credits updated", 
      credits: user.creditBalance,
      userId: user.id 
    });
  } catch (err) {
    console.error('Update credits error:', err);
    return NextResponse.json({ 
      error: "Failed to update credits",
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
} 