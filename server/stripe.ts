import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function listActiveProducts() {
  console.log('[Stripe] Listing active products');
  console.log('[Stripe] API Key:', process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...');

  try {
    // Primeiro, vamos buscar o produto específico
    const product = await stripe.products.retrieve('prod_Rqd8mXTzFJQCVh');
    console.log('[Stripe] Product:', product);

    // Agora, vamos buscar os preços associados a este produto
    const prices = await stripe.prices.list({
      product: 'prod_Rqd8mXTzFJQCVh',
      active: true,
      type: 'recurring',
    });

    console.log('[Stripe] Raw prices response:', JSON.stringify(prices, null, 2));

    // Formatar a resposta
    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      features: product.features || [],
      price_id: prices.data[0]?.id, // Pega o primeiro preço ativo
      unit_amount: prices.data[0]?.unit_amount ? prices.data[0].unit_amount / 100 : 0,
      currency: prices.data[0]?.currency || 'brl',
    };

    console.log('[Stripe] Formatted product:', formattedProduct);
    return { data: [formattedProduct] };
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

    // List existing configurations
    const configurations = await stripe.billingPortal.configurations.list();
    console.log('[Stripe] Existing configurations:', configurations.data.length);

    let configurationId;

    if (configurations.data.length > 0) {
      // Use existing configuration
      configurationId = configurations.data[0].id;
      console.log('[Stripe] Using existing configuration:', configurationId);
    } else {
      // Create new configuration
      console.log('[Stripe] Creating new configuration with product prod_Rqd8mXTzFJQCVh');
      const configuration = await stripe.billingPortal.configurations.create({
        business_profile: {
          headline: 'Gerenciar sua assinatura',
          privacy_policy_url: 'https://example.com/privacy',
          terms_of_service_url: 'https://example.com/terms',
        },
        features: {
          subscription_update: {
            enabled: true,
            default_allowed_updates: ['price'],
            products: [
              {
                product: 'prod_Rqd8mXTzFJQCVh',
                prices: ['price_1OtkPbCQwUCwQTDHBupEOAQH']
              }
            ]
          },
          customer_update: {
            allowed_updates: ['email', 'address'],
            enabled: true
          },
          invoice_history: { enabled: true },
          payment_method_update: { enabled: true }
        },
      });
      configurationId = configuration.id;
      console.log('[Stripe] Created new configuration:', configurationId);
    }

    // Create portal session with configuration
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      configuration: configurationId
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