'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';

interface Generation {
  id: string;
  originalUrl: string;
  generatedUrl: string;
  createdAt: Date;
}

export default function GenerationGallery() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ghibli-style-${Date.now()}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  };

  useEffect(() => {
    const fetchGenerations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const generationsRef = collection(db, 'generations');
        const q = query(
          generationsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const generationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Generation[];

        setGenerations(generationsData);
      } catch (err) {
        console.error('Error fetching generations:', err);
        setError('Failed to load your generations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGenerations();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-lg">Loading your generations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No generations yet</h3>
        <p className="text-gray-500">Transform your first image to see it here!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {generations.map((generation) => (
        <div key={generation.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4">
            <ReactBeforeSliderComponent
              firstImage={{ imageUrl: generation.originalUrl }}
              secondImage={{ imageUrl: generation.generatedUrl }}
            />
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {generation.createdAt.toLocaleDateString()} at{' '}
                {generation.createdAt.toLocaleTimeString()}
              </div>
              <button
                onClick={() => handleDownload(generation.generatedUrl)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                title="Download generated image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 