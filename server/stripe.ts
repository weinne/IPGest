import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set');
} else {
  console.log('[Stripe] Inicializando com a chave secreta (primeiros 8 caracteres):', 
    process.env.STRIPE_SECRET_KEY.substring(0, 8) + '...');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Função para atualizar o arquivo .env
async function updateEnvFile(freeProd: Stripe.Product, proProd: Stripe.Product, freePriceId: string, proPriceId: string) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = await fs.promises.readFile(envPath, 'utf-8');

  // Separar o conteúdo em linhas
  const lines = envContent.split('\n');
  const updatedLines = lines.map(line => {
    // Ignorar comentários e linhas vazias
    if (line.trim().startsWith('#') || line.trim() === '') {
      return line;
    }

    // Atualizar os valores correspondentes
    if (line.includes('VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID=')) {
      return `VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_ID="${freeProd.id}"`;
    }
    if (line.includes('VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_PRICE_ID=')) {
      return `VITE_NEXT_PUBLIC_STRIPE_FREE_PROD_PRICE_ID="${freePriceId}"`;
    }
    if (line.includes('VITE_NEXT_PUBLIC_STRIPE_PROD_ID=')) {
      return `VITE_NEXT_PUBLIC_STRIPE_PROD_ID="${proProd.id}"`;
    }
    if (line.includes('VITE_NEXT_PUBLIC_STRIPE_PROD_PRICE_ID=')) {
      return `VITE_NEXT_PUBLIC_STRIPE_PROD_PRICE_ID="${proPriceId}"`;
    }

    return line;
  });

  // Juntar as linhas de volta e escrever no arquivo
  const newContent = updatedLines.join('\n');
  await fs.promises.writeFile(envPath, newContent);

  console.log('[Stripe] Arquivo .env atualizado com os IDs dos produtos e preços:', {
    freeProdId: freeProd.id,
    freePriceId,
    proProdId: proProd.id,
    proPriceId
  });
}

export async function listActiveProducts() {
  console.log('[Stripe] Listing active products');
  console.log('[Stripe] API Key:', process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...');

  try {
    // Listar todos os produtos ativos
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    console.log('[Stripe] Products found:', products.data.length);

    // Para cada produto, buscar seus preços
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          type: 'recurring',
          limit: 1,
        });

        console.log(`[Stripe] Prices for product ${product.id}:`, prices.data.length);

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          price_id: prices.data[0]?.id,
          unit_amount: prices.data[0]?.unit_amount ? prices.data[0].unit_amount / 100 : 0,
          currency: prices.data[0]?.currency || 'brl',
        };
      })
    );

    console.log('[Stripe] Products with prices:', productsWithPrices);
    return { data: productsWithPrices };
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
      const configuration = await stripe.billingPortal.configurations.create({
        business_profile: {
          headline: 'Gerenciar sua assinatura',
          privacy_policy_url: 'https://example.com/privacy',
          terms_of_service_url: 'https://example.com/terms',
        },
        features: {
          subscription_update: {
            enabled: true,
            default_allowed_updates: ['price']
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

export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });
    return subscriptions.data.length > 0;
  } catch (error) {
    console.error('[Stripe] Error checking subscription:', error);
    return false;
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

// Função para criar os produtos do Stripe
export async function ensureStripeProducts() {
  try {
    console.log('[Stripe] Verificando produtos...');

    // Buscar produtos existentes
    const existingProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // Procurar produto Free existente
    let freeProd = existingProducts.data.find(p => p.name === 'Plano Free');
    if (!freeProd) {
      console.log('[Stripe] Criando produto Free...');
      freeProd = await stripe.products.create({
        name: 'Plano Free',
        description: 'Plano gratuito para gestão básica',
        default_price_data: {
          currency: 'brl',
          unit_amount: 0,
          recurring: {
            interval: 'month'
          }
        }
      });
      console.log('[Stripe] Produto Free criado:', freeProd.id);
    } else {
      console.log('[Stripe] Produto Free já existe:', freeProd.id);
    }

    // Procurar produto Pro existente
    let proProd = existingProducts.data.find(p => p.name === 'Plano Pro');
    if (!proProd) {
      console.log('[Stripe] Criando produto Pro...');
      proProd = await stripe.products.create({
        name: 'Plano Pro',
        description: 'Plano completo para gestão da igreja',
        default_price_data: {
          currency: 'brl',
          unit_amount: 4990,
          recurring: {
            interval: 'month'
          }
        }
      });
      console.log('[Stripe] Produto Pro criado:', proProd.id);
    } else {
      console.log('[Stripe] Produto Pro já existe:', proProd.id);
    }

    // Buscar os preços atuais
    const freePrice = await stripe.prices.list({ product: freeProd.id, limit: 1 });
    const proPrice = await stripe.prices.list({ product: proProd.id, limit: 1 });

    // Atualizar as variáveis de ambiente com os IDs dos preços
    const freePriceId = freePrice.data[0]?.id || freeProd.default_price as string;
    const proPriceId = proPrice.data[0]?.id || proProd.default_price as string;

    // Atualizar o arquivo .env
    await updateEnvFile(freeProd, proProd, freePriceId, proPriceId);

    return {
      free: freeProd,
      pro: proProd
    };
  } catch (error) {
    console.error('[Stripe] Erro ao verificar/criar produtos:', error);
    throw error;
  }
}