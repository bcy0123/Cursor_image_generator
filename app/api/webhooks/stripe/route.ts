import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prismaClient";
import { logUserAction } from "@/lib/supabase-logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia"
  });

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || "0");

    if (userId && credits) {
      // Log the purchase
      await logUserAction(userId, 'credits_purchased', {
        credits,
        amount: session.amount_total,
        currency: session.currency
      });

      const user = await prisma.user.findFirst({
        where: { clerkUserId: userId },
      });

      if (user) {
        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: user.id,
            credits: credits,
            amount: session.amount_total || 0,
          }
        });

        // Update user credits
        await prisma.user.update({
          where: { id: user.id },
          data: { creditBalance: { increment: credits } },
        });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
} 