import express from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { igrejas, subscriptions } from "@shared/schema";
import { 
  stripe, 
  createCustomer, 
  createSubscription, 
  listActiveProducts, 
  createPortalSession, 
  hasActiveSubscription 
} from "../stripe";
import { logSubscriptionOp } from "../utils";
import { storage } from "server/repositories/storage";

/**
 * Router instance for handling subscription-related routes.
 */
const router = express.Router();

// Rotas de planos de assinatura
router.get("/plans", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });

  try {
    console.log(`[Subscription Plans] Fetching plans for user: ${req.user?.username}`);
    console.log("[Stripe] Using API key:", process.env.STRIPE_SECRET_KEY?.substring(0, 8) + "...");

    // Get products from Stripe
    const products = await listActiveProducts();

    console.log("[Stripe] Raw products response:", JSON.stringify(products, null, 2));

    // Retorna os produtos da resposta do Stripe diretamente
    res.json(products.data);
  } catch (error) {
    console.error("[Subscription Plans] Error fetching plans from Stripe:", error);
    res.status(500).json({ 
      message: "Erro ao buscar planos",
      details: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
});

// Criação de assinaturas
router.post("/", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
  if (!req.user?.igreja_id) return res.status(403).json({ message: "Igreja não identificada" });

  try {
    logSubscriptionOp(req, "Create Subscription Request", req.body);

    // Get igreja details
    const igreja = await db.query.igrejas.findFirst({
      where: eq(igrejas.id, req.user.igreja_id),
    });

    if (!igreja) {
      return res.status(404).json({ message: "Igreja não encontrada" });
    }

    // Create or get Stripe customer
    console.log("[Stripe] Creating customer for igreja:", igreja.id);
    const customer = await createCustomer(igreja);
    console.log("[Stripe] Customer created:", customer.id);

    // Create the subscription
    console.log("[Stripe] Creating subscription for customer:", customer.id);
    const subscription = await createSubscription(
      customer.id,
      req.body.price_id
    );
    console.log("[Stripe] Subscription created:", subscription.id);

    // Store subscription in our database
    const dbSubscription = await storage.createSubscription({
      igreja_id: req.user.igreja_id,
      plan_id: parseInt(subscription.id, 10),
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      status: subscription.status as any,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    });

    logSubscriptionOp(req, "Subscription Created", dbSubscription);
    res.status(201).json({
      subscription: dbSubscription,
      client_secret: (subscription.latest_invoice as any).payment_intent?.client_secret,
    });
  } catch (error) {
    console.error("[Subscriptions] Error creating subscription:", error);
    res.status(400).json({ 
      message: "Erro ao criar assinatura",
      details: (error as Error).message 
    });
  }
});

// Webhook do Stripe
router.post("/webhooks/stripe", express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe webhook secret not configured");
    }

    console.log("[Stripe Webhook] Received event");
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("[Stripe Webhook] Event type:", event.type);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log("[Stripe Webhook] Processing subscription update:", subscription.id);

        // Find and update the subscription in our database
        const [dbSubscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripe_subscription_id, subscription.id));

        if (dbSubscription) {
          await storage.updateSubscription(dbSubscription.id, {
            status: subscription.status as any,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          });
          console.log("[Stripe Webhook] Subscription updated in database");
        } else {
          console.warn("[Stripe Webhook] Subscription not found in database:", subscription.id);
        }
        break;
      }
    }

    res.json({received: true});
  } catch (err) {
    console.error('[Stripe Webhook] Error:', err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
});

// Portal de faturamento
router.post("/billing-portal", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
  if (!req.user?.igreja_id) return res.status(403).json({ message: "Igreja não identificada" });

  try {
    console.log("[Billing Portal] Creating session for igreja:", req.user.igreja_id);

    // Get igreja details
    const igreja = await db.query.igrejas.findFirst({
      where: eq(igrejas.id, req.user.igreja_id),
    });

    if (!igreja) {
      console.log("[Billing Portal] Igreja not found:", req.user.igreja_id);
      return res.status(404).json({ message: "Igreja não encontrada" });
    }

    console.log("[Billing Portal] Igreja details:", {
      id: igreja.id,
      nome: igreja.nome,
      stripe_customer_id: igreja.stripe_customer_id
    });

    let stripeCustomerId = igreja.stripe_customer_id;

    // If no Stripe customer exists, create one
    if (!stripeCustomerId) {
      console.log("[Stripe] Creating customer for igreja:", igreja.id);
      const customer = await createCustomer(igreja);
      stripeCustomerId = customer.id;

      // Update igreja with the new customer ID
      await db
        .update(igrejas)
        .set({ stripe_customer_id: customer.id })
        .where(eq(igrejas.id, igreja.id));

      console.log("[Stripe] Customer created and saved:", customer.id);
    }

    // Create portal session
    const returnUrl = `${req.protocol}://${req.get('host')}/assinaturas`;
    const session = await createPortalSession(stripeCustomerId, returnUrl);

    res.json({ url: session.url });
  } catch (error) {
    console.error("[Billing Portal] Error:", error);
    res.status(500).json({ 
      message: "Erro ao criar sessão do portal de assinaturas",
      details: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
});

// Portal de assinaturas
router.get("/portal", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
  if (!req.user?.igreja_id) return res.status(403).json({ message: "Igreja não encontrada" });

  try {
    console.log("[Portal] Creating portal session for igreja:", req.user.igreja_id);

    const igreja = await db.query.igrejas.findFirst({
      where: eq(igrejas.id, req.user.igreja_id)
    });

    if (!igreja) {
      return res.status(404).json({ message: "Igreja não encontrada" });
    }

    console.log("[Portal] Igreja details:", igreja);

    if (!igreja.stripe_customer_id) {
      return res.status(400).json({ message: "Igreja não possui assinatura" });
    }

    // Verificar se tem assinatura ativa
    const hasSubscription = await hasActiveSubscription(igreja.stripe_customer_id);
    if (!hasSubscription) {
      return res.status(400).json({ message: "Igreja não possui assinatura ativa" });
    }

    const session = await createPortalSession(
      igreja.stripe_customer_id,
      `${req.protocol}://${req.get('host')}/assinaturas`
    );

    res.json(session);
  } catch (error) {
    console.error("[Portal] Error:", error);
    res.status(500).json({ 
      message: "Erro ao acessar portal",
      details: (error as Error).message 
    });
  }
});

// Sessão de checkout
router.post("/create-checkout-session", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
  if (!req.user?.igreja_id) return res.status(403).json({ message: "Igreja não encontrada" });

  try {
    console.log("[Checkout] Iniciando sessão para igreja:", req.user.igreja_id);

    // Get igreja details
    const igreja = await db.query.igrejas.findFirst({
      where: eq(igrejas.id, req.user.igreja_id)
    });

    if (!igreja) {
      return res.status(404).json({ message: "Igreja não encontrada" });
    }

    // Get or create Stripe customer
    let stripeCustomerId = igreja.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log("[Stripe] Creating customer for igreja:", igreja.id);
      const customer = await createCustomer({
        id: igreja.id,
        nome: igreja.nome || `Igreja #${igreja.id}`,
        email: igreja.email
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID
      await db
        .update(igrejas)
        .set({ stripe_customer_id: stripeCustomerId })
        .where(eq(igrejas.id, igreja.id));

      console.log("[Stripe] Customer created and saved:", stripeCustomerId);
    } else {
      console.log("[Stripe] Using existing customer:", stripeCustomerId);
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: req.body.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.protocol}://${req.get('host')}/assinaturas?success=true`,
      cancel_url: `${req.protocol}://${req.get('host')}/assinaturas?canceled=true`,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      locale: 'pt-BR', // Adiciona suporte ao português
    });

    console.log("[Stripe] Checkout session created:", session.url);
    res.json({ url: session.url });
  } catch (error) {
    console.error("[Checkout] Error:", error);
    res.status(500).json({ 
      message: "Erro ao criar sessão de checkout",
      details: (error as Error).message 
    });
  }
});

export default router;
