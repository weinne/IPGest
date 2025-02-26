import express from 'express';
import { stripeService } from '../services/stripe';
import { storage } from '../storage';
import { insertPlanoAssinaturaSchema, insertAssinaturaSchema } from '@shared/schema';
import { stripe } from '../services/stripe';

const router = express.Router();

// Middleware to ensure stripe webhook signatures
const webhookMiddleware = express.raw({ type: 'application/json' });

// Create a subscription plan
router.post('/plans', async (req, res) => {
  try {
    const planoData = insertPlanoAssinaturaSchema.parse(req.body);
    
    // Create product and price in Stripe
    const { productId, priceId } = await stripeService.createProduct(planoData);
    
    // Create plan in database
    const plano = await storage.createPlanoAssinatura({
      ...planoData,
      stripe_product_id: productId,
      stripe_price_id: priceId,
    });
    
    res.json(plano);
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(400).json({ error: 'Failed to create subscription plan' });
  }
});

// Get all subscription plans
router.get('/plans', async (req, res) => {
  try {
    const active_only = req.query.active === 'true';
    const plans = await storage.getPlanoAssinaturas(active_only);
    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Create a subscription
router.post('/subscriptions', async (req, res) => {
  try {
    const { igreja_id } = req.body;
    const subscriptionData = insertAssinaturaSchema.parse(req.body);
    
    // Get the igreja email for creating stripe customer
    const igreja = await storage.getIgrejaById(igreja_id);
    if (!igreja?.email) {
      throw new Error('Igreja email is required for subscription');
    }

    // Create or get stripe customer
    const customerId = await stripeService.createCustomer(igreja_id, igreja.email);
    
    // Get the plan details
    const plan = await storage.getPlanoAssinatura(subscriptionData.plano_id);
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    // Create subscription in Stripe
    const subscriptionId = await stripeService.createSubscription(
      customerId,
      plan.stripe_price_id
    );

    // Create subscription in database
    const subscription = await storage.createAssinatura({
      ...subscriptionData,
      igreja_id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
    });

    res.json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(400).json({ error: 'Failed to create subscription' });
  }
});

// Cancel a subscription
router.post('/subscriptions/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await storage.getAssinatura(parseInt(id));
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Cancel subscription in Stripe
    await stripeService.cancelSubscription(subscription.stripe_subscription_id);
    
    // Update subscription status in database
    const updatedSubscription = await storage.updateAssinatura(parseInt(id), {
      status: 'cancelada',
      data_cancelamento: new Date(),
      motivo_cancelamento: req.body.motivo || 'Cancelamento solicitado pelo usuário',
    });

    res.json(updatedSubscription);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Handle Stripe webhooks
router.post('/webhook', webhookMiddleware, async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    await stripeService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
