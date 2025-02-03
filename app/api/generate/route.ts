import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      console.error('Auth failed:', { userId, user });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    console.log('Processing prompt:', prompt);
    
    // First ensure user exists with upsert
    const dbUser = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {},
      create: {
        clerkUserId: userId,
        creditBalance: 100
      }
    });

    console.log('User found/created:', dbUser);

    if (dbUser.creditBalance < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    try {
      // Enhanced prompt for better results
      const enhancedPrompt = `${prompt}, high quality, detailed, 4k, professional photography`;
      
      console.log('Calling Stability API with prompt:', enhancedPrompt);
      
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [
            { text: enhancedPrompt, weight: 1 },
            { text: 'blurry, bad quality, low resolution, ugly, distorted', weight: -1 }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Stability API error:', errorData);
        throw new Error(errorData?.message || `Stability API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Stability API response received');
      
      if (!data.artifacts?.[0]?.base64) {
        console.error('No image data in response:', data);
        throw new Error('No image data received from API');
      }

      const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;

      // Store generation and update credits
      const generation = await prisma.generation.create({
        data: {
          userId: dbUser.id,
          prompt,
          imageUrl,
        }
      });

      // Deduct credit
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { creditBalance: dbUser.creditBalance - 1 }
      });

      console.log('Generation completed successfully');

      return NextResponse.json({ 
        id: generation.id,
        prompt: generation.prompt,
        imageUrl: generation.imageUrl,
        createdAt: generation.createdAt
      });

    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : "Failed to generate image. Please try again." 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ 
      error: "Internal server error. Please try again." 
    }, { status: 500 });
  }
} 