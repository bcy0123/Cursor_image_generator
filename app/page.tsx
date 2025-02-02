import { SignIn } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <SignIn 
        afterSignInUrl="/dashboard" 
        routing="hash"
      />
    </main>
  );
} 