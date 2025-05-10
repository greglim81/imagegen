import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Webhook signature verification failed: ${err.message}`);
      } else {
        console.error('Webhook signature verification failed: Unknown error');
      }
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          // Update user's subscription status in Firestore
          await db.collection('users').doc(userId).update({
            isSubscribed: true,
            stripeCustomerId: session.customer,
            subscriptionId: session.subscription,
            subscriptionStatus: 'active',
            subscriptionStartDate: new Date(),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const endTimestamp =
            subscription.cancel_at ||
            subscription.trial_end ||
            subscription.ended_at ||
            null;
          await db.collection('users').doc(userId).update({
            subscriptionStatus: subscription.status,
            subscriptionEndDate: endTimestamp ? new Date(endTimestamp * 1000) : null,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const endTimestamp =
            subscription.cancel_at ||
            subscription.trial_end ||
            subscription.ended_at ||
            null;
          await db.collection('users').doc(userId).update({
            isSubscribed: false,
            subscriptionStatus: 'canceled',
            subscriptionEndDate: endTimestamp ? new Date(endTimestamp * 1000) : null,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json(
        { error: error.message || 'Error processing webhook' },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Unknown error processing webhook' },
        { status: 500 }
      );
    }
  }
} 