import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Navigation() {
  return (
    <nav className="flex justify-between items-center p-4 border-b">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="font-bold text-xl">
          Image Generator
        </Link>
        <Link 
          href="/library" 
          className="text-gray-600 hover:text-gray-900"
        >
          My Library
        </Link>
      </div>
      <UserButton afterSignOutUrl="/"/>
    </nav>
  );
} 