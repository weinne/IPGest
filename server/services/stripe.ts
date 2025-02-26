import Stripe from 'stripe';
import { PlanoAssinatura, InsertPlanoAssinatura, Assinatura } from '@shared/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use latest stable version
});

export class StripeService {
  // Subscription Plan Methods
  async createProduct(plano: InsertPlanoAssinatura): Promise<{
    productId: string;
    priceId: string;
  }> {
    // Create a product in Stripe
    const product = await stripe.products.create({
      name: plano.nome,
      description: plano.descricao,
      metadata: {
        intervalo: plano.intervalo,
      },
    });

    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(Number(plano.preco) * 100), // Convert to cents
      currency: 'brl',
      recurring: {
        interval: this.convertIntervalToStripe(plano.intervalo),
      },
    });

    return {
      productId: product.id,
      priceId: price.id,
    };
  }

  async updateProduct(stripeProductId: string, plano: Partial<InsertPlanoAssinatura>): Promise<void> {
    if (plano.nome || plano.descricao) {
      await stripe.products.update(stripeProductId, {
        name: plano.nome,
        description: plano.descricao,
      });
    }
  }

  // Customer Methods
  async createCustomer(igreja_id: number, email: string): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        igreja_id: igreja_id.toString(),
      },
    });

    return customer.id;
  }

  // Subscription Methods
  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<string> {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription.id;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId);
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  // Payment Methods
  async createPaymentIntent(amount: number, customerId: string): Promise<string> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'brl',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent.id;
  }

  // Helper Methods
  private convertIntervalToStripe(
    interval: "mensal" | "trimestral" | "semestral" | "anual"
  ): "month" | "year" {
    switch (interval) {
      case "mensal":
        return "month";
      case "trimestral":
        return "month"; // 3 months
      case "semestral":
        return "month"; // 6 months
      case "anual":
        return "year";
      default:
        throw new Error(`Invalid interval: ${interval}`);
    }
  }

  // Webhook handler
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Handle successful payment
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        // Handle failed payment
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription cancellation
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        // Handle successful invoice payment
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        // Handle failed invoice payment
        break;
    }
  }
}

export const stripeService = new StripeService();
