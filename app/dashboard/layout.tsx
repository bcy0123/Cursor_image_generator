import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8">
              <Link
                href="/dashboard"
                className="text-blue-900 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Generate
              </Link>
              <Link
                href="/dashboard/library"
                className="text-blue-900 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                My Library
              </Link>
              <Link
                href="/dashboard/credits"
                className="text-blue-900 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Buy Credits
              </Link>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 