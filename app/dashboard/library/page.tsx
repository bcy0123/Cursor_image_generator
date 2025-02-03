import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import Image from "next/image";

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: Date;
}

async function getGenerations() {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error('No userId found');
      return [];
    }

    // First ensure user exists
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {},
      create: {
        clerkUserId: userId,
        creditBalance: 100
      },
      include: {
        generations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return user.generations || [];
  } catch (error) {
    console.error('Error fetching generations:', error);
    return [];
  }
}

export default async function LibraryPage() {
  const generations = await getGenerations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">My Library</h1>
      
      {generations.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          You haven't generated any images yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generations.map((generation: Generation) => (
            <div 
              key={generation.id} 
              className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-square relative">
                <Image
                  src={generation.imageUrl}
                  alt={generation.prompt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm text-gray-600">{generation.prompt}</p>
                <p className="text-xs text-gray-400">
                  {new Date(generation.createdAt).toLocaleDateString()}
                </p>
                <a 
                  href={generation.imageUrl}
                  download={`image-${generation.id}.png`}
                  className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Image
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 