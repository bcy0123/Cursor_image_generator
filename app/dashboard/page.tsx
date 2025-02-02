import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import GenerationForm from "./GenerationForm";

async function getCredits() {
  const { userId } = await auth();
  if (!userId) return 0;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  });
  return user?.creditBalance || 0;
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
