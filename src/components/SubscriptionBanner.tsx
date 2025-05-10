'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionBannerProps {
  daysRemaining: number;
  isSubscribed: boolean;
  subscriptionStatus: string; // 'trial', 'active', 'none'
}

export default function SubscriptionBanner({ daysRemaining, isSubscribed, subscriptionStatus }: SubscriptionBannerProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubscribe = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No URL returned from checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-green-800">Active Subscription</h3>
            <p className="text-green-600">You have full access to all features.</p>
          </div>
        </div>
      </div>
    );
  }

  if (subscriptionStatus === 'trial' && daysRemaining > 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-800">Subscribe to Use the App (7 day free trial)</h3>
            <p className="text-blue-600">
              Free trial: {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </p>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Loading...' : 'Subscribe Now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-yellow-800">Free Trial Expired</h3>
          <p className="text-yellow-600">Subscribe to continue using the service.</p>
        </div>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:bg-yellow-400"
        >
          {loading ? 'Loading...' : 'Subscribe Now'}
        </button>
      </div>
    </div>
  );
} 