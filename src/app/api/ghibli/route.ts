export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { db, adminStorage } from '@/lib/firebaseAdmin'; // adjust path as needed
import fetch from 'node-fetch';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Set your Replicate API token in .env.local
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrls, prompt, userId } = body; // Make sure to send userId from frontend

    console.log('[ghibli] imageUrls:', imageUrls);
    console.log('[ghibli] userId:', userId);

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.log('[ghibli] Missing imageUrls');
      return NextResponse.json({ error: 'Missing imageUrls' }, { status: 400 });
    }

    // Check user's subscription status
    console.log('[ghibli] Fetching user doc from Firestore');
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    console.log('[ghibli] userData:', userData);

    if (!userData) {
      console.log('[ghibli] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const signUpDate = userData.createdAt.toDate();
    const daysSinceSignUp = Math.floor((now.getTime() - signUpDate.getTime()) / (1000 * 60 * 60 * 24));
    const isSubscribed = userData.isSubscribed;
    console.log('[ghibli] daysSinceSignUp:', daysSinceSignUp, 'isSubscribed:', isSubscribed);

    if (daysSinceSignUp > 7 && !isSubscribed) {
      console.log('[ghibli] Free trial expired');
      return NextResponse.json({ 
        error: 'Free trial expired',
        message: 'Your 7-day free trial has expired. Please subscribe to continue using the service.',
        daysRemaining: 0
      }, { status: 403 });
    }

    // Generate image with Replicate
    const input = {
      image: imageUrls[0],
      prompt: prompt || "GHBLI anime style photo",
      go_fast: true,
      guidance_scale: 10,
      prompt_strength: 0.77,
      num_inference_steps: 38
    };

    console.log('[ghibli] Replicate input:', input);
    let output;
    try {
      output = await replicate.run(
        "aaronaftab/mirage-ghibli:166efd159b4138da932522bc5af40d39194033f587d9bdbab1e594119eae3e7f",
        { input }
      );
      console.log('[ghibli] Replicate output:', output);
    } catch (replicateError) {
      console.error('[ghibli] Replicate API error:', replicateError);
      return NextResponse.json({ error: 'Replicate API error', details: String(replicateError) }, { status: 500 });
    }

    if (!Array.isArray(output) || !output[0]) {
      console.error('[ghibli] Replicate API error or unexpected output:', output);
      return NextResponse.json({ error: 'Replicate API error or unexpected output', details: output }, { status: 400 });
    }

    // Download the generated image
    const generatedImageUrl = output[0];
    console.log('[ghibli] Downloading generated image:', generatedImageUrl);
    const imageRes = await fetch(generatedImageUrl);
    const buffer = await imageRes.buffer();
    console.log('[ghibli] Image downloaded, uploading to Firebase Storage');

    // Upload to Firebase Storage
    const filename = `generations/${userId}/${Date.now()}.webp`;
    const file = adminStorage.bucket().file(filename);
    await file.save(buffer, { contentType: 'image/webp' });
    console.log('[ghibli] Image uploaded to Firebase Storage:', filename);
    const [firebaseGeneratedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    console.log('[ghibli] Firebase signed URL:', firebaseGeneratedUrl);

    // Save metadata to Firestore
    await db.collection('generations').add({
      userId,
      originalUrl: imageUrls[0],
      generatedUrl: firebaseGeneratedUrl,
      createdAt: new Date(),
    });
    console.log('[ghibli] Metadata saved to Firestore');

    return NextResponse.json({ 
      url: firebaseGeneratedUrl,
      daysRemaining: Math.max(0, 7 - daysSinceSignUp)
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[ghibli] API error:', error);
      return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    } else {
      console.error('[ghibli] Unknown server error:', error);
      return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
    }
  }
} 