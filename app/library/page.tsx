import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: Date;
}

async function getGenerations() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      generations: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return user?.generations || [];
}

export default async function LibraryPage() {
  const generations = await getGenerations();

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Generated Images</h1>
        <UserButton afterSignOutUrl="/"/>
      </div>

      {generations.length === 0 ? (
        <p className="text-center text-gray-500">
          You haven't generated any images yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generations.map((generation: Generation) => (
            <div 
              key={generation.id} 
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-square relative">
                <Image
                  src={generation.imageUrl}
                  alt={generation.prompt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.png'; // Add a placeholder image
                  }}
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600">{generation.prompt}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(generation.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 