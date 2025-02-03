import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import GenerationForm from "./GenerationForm";

async function getCredits() {
  try {
    const { userId } = await auth();
    if (!userId) return 0;

    // Try to find the user, if not found create them with 100 credits
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {},
      create: {
        clerkUserId: userId,
        creditBalance: 100
      }
    });

    return user.creditBalance;
  } catch (error) {
    console.error('Error getting credits:', error);
    return 0;
  }
}

export default async function DashboardPage() {
  const credits = await getCredits();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-900">Generate Image</h1>
        <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
          Credits: {credits}
        </span>
      </div>
      <GenerationForm />
    </div>
  );
}
