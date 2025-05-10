'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';
import GenerationGallery from '@/components/GenerationGallery';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    daysRemaining: 7,
    isSubscribed: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (userData) {
          const now = new Date();
          const signUpDate = userData.createdAt.toDate();
          const daysSinceSignUp = Math.floor((now.getTime() - signUpDate.getTime()) / (1000 * 60 * 60 * 24));
          
          setSubscriptionStatus({
            daysRemaining: Math.max(0, 7 - daysSinceSignUp),
            isSubscribed: userData.isSubscribed || false,
          });
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Ghibli Style Generator</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-4">{user.email}</span>
              <span className="text-gray-600 mr-4">
                {subscriptionStatus.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
              </span>
              <button
                onClick={handleLogout}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Logout
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="text-indigo-600 hover:text-indigo-800 ml-4"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <SubscriptionBanner
            daysRemaining={subscriptionStatus.daysRemaining}
            isSubscribed={subscriptionStatus.isSubscribed}
          />

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Transform Your Photos</h2>
            <ImageUpload />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Your Generations</h2>
            <GenerationGallery />
          </div>
        </div>
      </main>
    </div>
  );
} 