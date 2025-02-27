import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Updated to stable version
  typescript: true,
});

export async function listActiveProducts() {
  console.log('[Stripe] Listing active products');
  console.log('[Stripe] API Key:', process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...');

  try {
    // Get all active products with their prices
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 100,
    });

    console.log('[Stripe] Raw prices response:', JSON.stringify(prices, null, 2));

    // Map prices to products with pricing information
    const products = prices.data.map(price => ({
      id: price.product.id,
      name: (price.product as Stripe.Product).name,
      description: (price.product as Stripe.Product).description,
      features: ((price.product as Stripe.Product).features || []).map(f => f.name),
      price_id: price.id,
      unit_amount: price.unit_amount ? price.unit_amount / 100 : 0,
      currency: price.currency,
    }));

    console.log('[Stripe] Formatted products:', JSON.stringify(products, null, 2));
    return { data: products };
  } catch (error) {
    console.error('[Stripe] Error listing products:', error);
    throw error;
  }
}

export async function createCustomer(igreja: { id: number; nome: string; email?: string | null }) {
  console.log('[Stripe] Creating customer with data:', {
    name: igreja.nome,
    email: igreja.email,
    igreja_id: igreja.id,
  });

  return await stripe.customers.create({
    name: igreja.nome || `Igreja #${igreja.id}`,
    email: igreja.email || undefined,
    metadata: {
      igreja_id: igreja.id.toString(),
    },
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  console.log('[Stripe] Creating portal session for customer:', customerId);

  try {
    // First, verify if the customer exists
    const customer = await stripe.customers.retrieve(customerId);
    console.log('[Stripe] Customer verified:', customer.id);

    // Create the portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log('[Stripe] Portal session created:', session.url);
    return session;
  } catch (error) {
    console.error('[Stripe] Error creating portal session:', error);
    throw error;
  }
}

export async function createSubscription(customerId: string, priceId: string) {
  console.log('[Stripe] Creating subscription:', { customerId, priceId });

  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

export async function updateSubscription(subscriptionId: string, priceId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId,
    }],
  });
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function createSetupIntent(customerId: string) {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}

export async function listPaymentMethods(customerId: string) {
  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
}