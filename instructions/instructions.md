# Project Requirements Document (PRD)

## 1. Project Overview

This project implements text-to-image generation using the [**Pollinations API**](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md), user authentication via [**Clerk**](https://clerk.com/docs), database storage with [**Prisma**](https://www.prisma.io/docs) (backed by Postgres or [**Supabase**](https://supabase.com/docs)), optional payments via [**Stripe**](https://stripe.com/docs), and is built on [**Next.js** (App Router)](https://nextjs.org/docs). The final application will be deployed on [**Vercel**](https://vercel.com).

### 1.1 Key Objectives

1. **User Authentication**: Users must sign up/login before generating images.  
2. **Credit System**: Each image generation costs one "credit." Users have an initial balance and can buy more if they run out.  
3. **Text-to-Image Generation**: Submit a text prompt to the Pollinations API to produce an image.  
4. **Library / My Images**: A user can view previously generated images and prompts.  
5. **Payments (Optional)**: Integrate Stripe Checkout to purchase additional credits.  
6. **Deployment**: Push to GitHub; automatically deploy on Vercel.

---

## 2. Detailed Scope & Features

### 2.1 User Management & Authentication

- **Sign-Up & Login**:  
  - **Clerk** manages user creation, password reset, session management, etc.  
  - Reference: [Clerk Docs – Quickstart](https://clerk.com/docs/quickstarts/get-started-with-nextjs)

- **Database Sync**:  
  - Each new Clerk user should also have a record in our Prisma `User` table, storing:  
    - `id` (primary key)  
    - `clerkUserId` (unique identifier matching Clerk)  
    - `creditBalance` (integer)  

#### Example "Check or Create User" Flow

> **Pseudo-code** (not final production code):

```typescript
// server-side route snippet
import { currentUser } from '@clerk/nextjs';
import { prisma } from '@/lib/prismaClient';

export async function checkOrCreateUser() {
  const clerk = await currentUser();
  const clerkUserId = clerk?.id;

  let user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkUserId,
        creditBalance: 1, // initial free credits
      }
    });
  }
  return user;
}
```

---

### 2.2 Image Generation & Credits

- **Text Prompt**: A user inputs text describing the desired image.  
- **Pollinations API**:  
  - [Pollinations API Reference](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md)  
  - A typical request might look like this (simplified):

```json
{
  "text_prompt": "A futuristic city on Mars, concept art"
}
```

- **Credit Deduction**:
  - Before calling Pollinations, check if `user.creditBalance >= 1`.
  - If yes, decrement `creditBalance` by 1, call the API, and store the result (image URL).
  - If no, return an error or direct user to purchase credits.

#### Example Pollinations Request/Response

> **Pseudo-code** (not final production code):
```typescript
// route.ts snippet (POST /api/generate)
export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Call Pollinations API
  const pollinationsRes = await fetch('https://api.pollinations.ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text_prompt: prompt })
  });

  const data = await pollinationsRes.json();
  // data might contain { images: [...], prompt, ... } or a direct image_url
  return new Response(JSON.stringify(data), { status: 200 });
}
```

> **Example Response** (simplified):
```json
{
  "image_url": "https://pollinations.ai/ipfs/QmSomeHash123/mars_city.png",
  "prompt": "A futuristic city on Mars, concept art"
}
```

---

### 2.3 Library / My Images

- A page (`/library`) that shows all previously generated images for the logged-in user:
  - **Fields**: `prompt`, `imageUrl`, `createdAt`.
  - Fetched from the `Generation` table in Prisma.

#### Example Query

> **Pseudo-code**:
```typescript
// server-side library page
export default async function LibraryPage() {
  const user = await checkOrCreateUser();
  const generations = await prisma.generation.findMany({
    where: { userId: user.id }
  });
  // Render a list of images
}
```

---

### 2.4 Payments (Stripe)

- **Flow**:  
  1. User chooses a credit package (e.g., 10 credits for $5).  
  2. Create a **Stripe Checkout Session** server-side.  
  3. On success, `creditBalance += purchasedAmount`.  
  4. (Recommended) Use Stripe webhook to verify completed payments.

- **Stripe Docs**: [Stripe Checkout Reference](https://stripe.com/docs/payments/checkout)

#### Example Checkout Session Creation

> **Pseudo-code**:
```typescript
// (POST) /api/checkout
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' });

export async function POST(req: Request) {
  const { quantity } = await req.json();
  // e.g., quantity = number of credits to buy

  const session = await stripe.checkout.sessions.create({
    // ...
  });

  return new Response(JSON.stringify({ url: session.url }), { status: 200 });
}
```

> **Response** (sample):
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
}
```

---

### 2.5 Deployment

- Use [Vercel](https://vercel.com/docs) for continuous deployment from GitHub.
- Environment variables (e.g., `DATABASE_URL`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`) must be configured in Vercel "Project Settings" → "Environment Variables."

---

## 3. Technical Stack & Dependencies

1. **Next.js 14 (App Router)**:
   - Folder-based routing under `app/` directory.  
   - [Docs](https://nextjs.org/docs) or [App Router Beta Docs](https://beta.nextjs.org/docs).

2. **TypeScript**:
   - Ensure `tsconfig.json` includes `"strict": true` for safety.

3. **Clerk**:
   - For authentication and session management.  
   - [Clerk Next.js Docs](https://clerk.com/docs/quickstarts/get-started-with-nextjs).

4. **Prisma**:
   - Database ORM.  
   - `schema.prisma` must define `User`, `Generation`, and optionally `Transaction`.  
   - [Prisma Docs](https://www.prisma.io/docs).

5. **Pollinations API**:
   - For text-to-image generation.  
   - [GitHub Reference](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md).

6. **Stripe** (Optional):
   - For credit purchases.  
   - [Stripe Docs](https://stripe.com/docs).

7. **Supabase** (or Other Postgres):
   - For hosting the production database.  
   - [Supabase Docs](https://supabase.com/docs).

8. **Tailwind CSS**:
   - For styling.  
   - [Tailwind Docs](https://tailwindcss.com/docs).

9. **Vercel**:
   - Deployment.  
   - [Vercel Docs](https://vercel.com/docs).

---



## 4. Database Schema

Below is a conceptual schema in **Prisma** style (for clarity). This is **not** the full production code, but an example for dev alignment:

```prisma
model User {
  id            String  @id @default(uuid())
  clerkUserId   String  @unique
  creditBalance Int     @default(1)
  generations   Generation[]
}

model Generation {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  prompt    String
  imageUrl  String
  createdAt DateTime @default(now())
}

// optional transaction table for Stripe purchases
model Transaction {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  credits   Int
  createdAt DateTime @default(now())
}
```

---

## 5. User Stories & Example Workflows

1. **Sign Up / Login**  
   - **User** visits site, signs up with Clerk → On success, we create a record in `User` table if not already existing.

2. **Generate an Image**  
   - **User** enters prompt "A cyborg cat playing guitar."  
   - **System** checks `creditBalance >= 1`; if yes:  
     1. Calls Pollinations with `text_prompt: "A cyborg cat playing guitar"`.  
     2. Receives `imageUrl` from Pollinations.  
     3. Decrements user's `creditBalance` by 1.  
     4. Stores new `Generation` record (with prompt + imageUrl).  
   - **System** displays the image to the user on success.

3. **View My Images**  
   - **User** clicks "My Library."  
   - **System** fetches from `Generation` table where `userId == currentUser.id`.  
   - **System** renders a list of images (thumbnail or full) with associated prompts.

4. **Purchase Credits**   
   - **User** clicks "Buy Credits."  
   - **System** calls `/api/checkout` to create a Stripe session.  
   - **User** pays successfully, returns to success page.  
   - **System** updates `creditBalance += purchasedAmount` (via direct success callback or Stripe webhook).

---

## 6. Documentation References

1. **Next.js (App Router)**  
   - [Docs](https://nextjs.org/docs)  
   - [App Router Beta Docs](https://beta.nextjs.org/docs)

2. **Clerk**  
   - [Clerk – Next.js Quickstart](https://clerk.com/docs/quickstarts/get-started-with-nextjs)  
   - [Middleware & Authentication](https://clerk.com/docs/nextjs/authentication)

3. **Prisma**  
   - [Prisma Docs](https://www.prisma.io/docs)  
   - [Getting Started](https://www.prisma.io/docs/getting-started)

4. **Pollinations API**  
   - [API Documentation on GitHub](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md)

5. **Stripe**  
   - [Checkout Quickstart](https://stripe.com/docs/payments/checkout)  
   - [Stripe Webhooks](https://stripe.com/docs/webhooks)

6. **Supabase** (if used for DB hosting)  
   - [Supabase Docs](https://supabase.com/docs)

7. **Tailwind CSS**  
   - [Tailwind Documentation](https://tailwindcss.com/docs)

8. **Vercel**  
   - [Deploying Next.js](https://vercel.com/docs/frameworks/nextjs)

---



## 7. Key Acceptance Criteria

1. **Users can sign up and log in via Clerk** without manual user table manipulation.  
2. **Generating an image** deducts 1 credit if the user has enough credits.  
3. **Generated images** are listed in the user's library.  
4. **Stripe** (if implemented) can successfully sell credits and update the user's balance.  
5. The application runs on **Vercel** with environment variables properly configured.  

