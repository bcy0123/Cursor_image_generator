import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prismaClient";
import BuyCredits from "@/app/components/BuyCredits";

interface Transaction {
  id: string;
  credits: number;
  amount: number;
  createdAt: Date;
}

async function getCredits() {
  try {
    const { userId } = await auth();
    if (!userId) return { credits: 0, transactions: [] };

    // First ensure user exists with upsert
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      update: {},
      create: {
        clerkUserId: userId,
        creditBalance: 100
      }
    });

    // Then get transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    return { 
      credits: user.creditBalance,
      transactions: transactions
    };
  } catch (error) {
    console.error('Error getting credits:', error);
    return { credits: 0, transactions: [] };
  }
}

export default async function CreditsPage() {
  const { credits, transactions } = await getCredits();
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-900">Buy Credits</h1>
        <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
          Current Balance: {credits} credits
        </span>
      </div>
      <BuyCredits />
      
      {/* Purchase History Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Purchase History</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No purchase history yet</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction: Transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.credits} credits
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(transaction.amount / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 