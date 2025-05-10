'use client';

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';

export default function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Convert HEIC to JPEG if needed
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        setError('HEIC files are not supported. Please convert to JPEG or PNG first.');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Create a unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const filename = `${timestamp}_${randomString}_${selectedFile.name}`;
      const path = `images/${user.uid}/${filename}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, path);
      
      // Convert file to blob if needed
      const blob = selectedFile.type.startsWith('image/') 
        ? selectedFile 
        : new Blob([selectedFile], { type: 'image/jpeg' });
      
      const metadata = {
        contentType: blob.type,
        customMetadata: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      };

      const snapshot = await uploadBytes(storageRef, blob, metadata);
      console.log('Upload successful:', snapshot);
      
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadUrl);

      // Call your API route to transform the image
      const res = await fetch('/api/ghibli', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          imageUrls: [downloadUrl],
          prompt: 'recreate this image in the style of ghibli',
          userId: user.uid
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.url) {
        setTransformedUrl(data.url);
      } else {
        throw new Error(data.error || 'Failed to transform image');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileSelect}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: JPEG, PNG, GIF
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-center p-2 bg-red-50 rounded">
            {error}
          </div>
        )}

        {previewUrl && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Original Image</h3>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Transform Image'}
        </button>

        {previewUrl && transformedUrl && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Compare Original and Ghibli Style</h3>
            <ReactBeforeSliderComponent
              firstImage={{ imageUrl: previewUrl }}
              secondImage={{ imageUrl: transformedUrl }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 