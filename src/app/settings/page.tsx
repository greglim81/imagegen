'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState({ isSubscribed: false, daysRemaining: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const checkSubscription = async () => {
      try {
        const response = await fetch(`/api/create-checkout-session?userId=${user.uid}`);
        const data = await response.json();
        setSubscriptionStatus({ isSubscribed: data.isSubscribed, daysRemaining: data.daysRemaining || 0 });
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSubscription();
  }, [user, router]);

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No URL returned from checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (data.success) {
        setSubscriptionStatus(prev => ({ ...prev, isSubscribed: false }));
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <button
        onClick={() => router.push('/dashboard')}
        className="text-indigo-600 hover:text-indigo-800 mb-4"
      >
        Back to Dashboard
      </button>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
        {subscriptionStatus.isSubscribed ? (
          <div>
            <p className="text-green-600 mb-4">You are currently subscribed.</p>
            <button
              onClick={handleCancelSubscription}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Cancel Subscription
            </button>
          </div>
        ) : (
          <div>
            <p className="text-yellow-600 mb-4">
              {subscriptionStatus.daysRemaining > 0
                ? `You have ${subscriptionStatus.daysRemaining} days remaining in your free trial.`
                : 'Your free trial has expired.'}
            </p>
            <button
              onClick={handleSubscribe}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Subscribe Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 