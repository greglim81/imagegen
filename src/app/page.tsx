"use client";

import { useState } from 'react';
import SignUp from '@/components/auth/SignUp';
import Login from '@/components/auth/Login';

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [showSignUp, setShowSignUp] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100 flex flex-col items-center justify-center relative">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto py-20 flex flex-col md:flex-row items-center gap-10">
        {/* IMAGE */}
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
          <img
            src="/landingpage.jpg"
            alt="Ghibli style example"
            className="rounded-xl shadow-lg object-cover"
            style={{ width: 400, height: 400 }}
          />
        </div>
        {/* TEXT */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 drop-shadow-lg">
            Transform Your Photos into Studio Ghibli Style Art
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Upload your photos and watch them transform into beautiful Studio Ghibli inspired artwork. Enjoy a 7-day free trial!
          </p>
          <div className="space-x-4">
            <button
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 shadow-lg text-lg font-semibold"
              onClick={() => { setModalOpen(true); setShowSignUp(true); }}
            >
              Sign Up
            </button>
            <button
              className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-md border border-indigo-600 hover:bg-gray-50 shadow-lg text-lg font-semibold"
              onClick={() => { setModalOpen(true); setShowSignUp(false); }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur transition-colors">
          <div className="relative w-full max-w-md mx-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-fade-in">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <div className="mb-6 flex justify-center space-x-4">
                <button
                  className={`px-4 py-2 rounded-md font-semibold transition-colors ${showSignUp ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setShowSignUp(true)}
                >
                  Sign Up
                </button>
                <button
                  className={`px-4 py-2 rounded-md font-semibold transition-colors ${!showSignUp ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setShowSignUp(false)}
                >
                  Sign In
                </button>
              </div>
              <div>
                {showSignUp ? <SignUp /> : <Login />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple fade-in animation */}
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
