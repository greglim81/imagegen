export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { db, adminStorage } from '@/lib/firebaseAdmin'; // adjust path as needed
import fetch from 'node-fetch';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Set your Replicate API token in .env.local
});

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'POST works!' });
} 