'use client';

import { useState } from 'react';

export default function BuyCredits() {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (quantity: number) => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <button
        onClick={() => handlePurchase(1)}
        disabled={loading}
        className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all bg-white"
      >
        <div className="text-2xl font-bold text-blue-900 mb-2">10 Credits</div>
        <div className="text-lg text-blue-700 font-medium">$5.00</div>
      </button>
      <button
        onClick={() => handlePurchase(2)}
        disabled={loading}
        className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all bg-white"
      >
        <div className="text-2xl font-bold text-blue-900 mb-2">20 Credits</div>
        <div className="text-lg text-blue-700 font-medium">$10.00</div>
      </button>
      <button
        onClick={() => handlePurchase(5)}
        disabled={loading}
        className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all bg-white"
      >
        <div className="text-2xl font-bold text-blue-900 mb-2">50 Credits</div>
        <div className="text-lg text-blue-700 font-medium">$25.00</div>
      </button>
    </div>
  );
} 