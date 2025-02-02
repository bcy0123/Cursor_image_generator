import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: { creditBalance: 100 },
      create: { clerkUserId: userId, creditBalance: 100 }
    });

    return NextResponse.json({ message: "Credits updated", credits: user.creditBalance });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
  }
} 