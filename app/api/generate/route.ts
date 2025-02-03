import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import { NextResponse } from "next/server";

export const maxDuration = 300; // Set max duration to 300 seconds
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    console.log('Processing prompt:', prompt);
    
    // Get user and ensure they exist with upsert
    const dbUser = await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        creditBalance: 100
      },
      update: {}
    });

    if (dbUser.creditBalance < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Call Stability API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt, weight: 1 }],
          cfg_scale: 7,
          height: 512, // Reduced size for faster generation
          width: 512,  // Reduced size for faster generation
          steps: 25,   // Reduced steps for faster generation
          samples: 1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || 'API Error');
        } catch {
          throw new Error(errorText || response.statusText);
        }
      }

      const data = await response.json();
      
      if (!data.artifacts?.[0]?.base64) {
        throw new Error('No image data received');
      }

      const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;

      // Save the generation and update credits atomically
      const [generation] = await prisma.$transaction([
        prisma.generation.create({
          data: {
            userId: dbUser.id,
            prompt,
            imageUrl
          }
        }),
        prisma.user.update({
          where: { id: dbUser.id },
          data: { creditBalance: dbUser.creditBalance - 1 }
        })
      ]);

      return NextResponse.json({ 
        success: true,
        imageUrl: generation.imageUrl
      });

    } catch (apiError) {
      console.error('API call error:', apiError);
      if (apiError.name === 'AbortError') {
        return NextResponse.json({ 
          error: 'Image generation timed out. Please try again.'
        }, { status: 504 });
      }
      return NextResponse.json({ 
        error: apiError instanceof Error ? apiError.message : 'Failed to generate image'
      }, { status: 500 });
    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 