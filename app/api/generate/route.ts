import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    console.log('Processing prompt:', prompt);
    
    // Get user and ensure they exist
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!dbUser || dbUser.creditBalance < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Call Stability API
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
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1
        }),
      });

      let errorMessage;
      if (!response.ok) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'API Error';
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || response.statusText;
        }
        console.error('Stability API error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: response.status });
      }

      const data = await response.json();
      
      if (!data.artifacts?.[0]?.base64) {
        return NextResponse.json({ error: 'No image generated' }, { status: 500 });
      }

      const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;

      // Save the generation
      const generation = await prisma.generation.create({
        data: {
          userId: dbUser.id,
          prompt,
          imageUrl
        }
      });

      // Deduct credit
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { creditBalance: dbUser.creditBalance - 1 }
      });

      return NextResponse.json({ 
        imageUrl: generation.imageUrl
      });

    } catch (apiError) {
      console.error('API call error:', apiError);
      return NextResponse.json({ 
        error: apiError instanceof Error ? apiError.message : 'Failed to connect to image generation service'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate image'
    }, { status: 500 });
  }
} 