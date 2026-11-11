// Supabase Edge Function: payment-initiate
// Handles secure server-side initiation of bKash Tokenized Checkout and SSLCommerz sessions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      gateway,
      amount,
      customerPhone,
      customerName,
      customerEmail,
    } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. bKash Tokenized Checkout Session Initiation
    if (gateway === 'bkash') {
      const bkashBase = Deno.env.get('BKASH_BASE_URL') || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
      const appKey = Deno.env.get('BKASH_APP_KEY');
      const appSecret = Deno.env.get('BKASH_APP_SECRET');
      const username = Deno.env.get('BKASH_USERNAME');
      const password = Deno.env.get('BKASH_PASSWORD');

      // Grant token
      const tokenRes = await fetch(`${bkashBase}/tokenized/checkout/token/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          username: username || '',
          password: password || '',
        },
        body: JSON.stringify({
          app_key: appKey,
          app_secret: appSecret,
        }),
      });
      const tokenData = await tokenRes.json();
      const idToken = tokenData.id_token;

      // Create Payment
      const createRes = await fetch(`${bkashBase}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: idToken,
          'X-APP-Key': appKey || '',
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: customerPhone,
          callbackURL: Deno.env.get('BKASH_CALLBACK_URL') || 'http://localhost:5173/api/payment/bkash/callback',
          amount: amount.toString(),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: `INV-${orderId}`,
        }),
      });

      const createData = await createRes.json();

      return new Response(
        JSON.stringify({
          success: true,
          gateway: 'bkash',
          paymentId: createData.paymentID,
          redirectUrl: createData.bkashURL,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. SSLCommerz Multi-Gateway Session Initiation
    if (gateway === 'sslcommerz') {
      const isSandbox = Deno.env.get('SSLCOMMERZ_IS_SANDBOX') === 'true';
      const sslUrl = isSandbox
        ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

      const formData = new URLSearchParams({
        store_id: Deno.env.get('SSLCOMMERZ_STORE_ID') || '',
        store_passwd: Deno.env.get('SSLCOMMERZ_STORE_PASSWORD') || '',
        total_amount: amount.toString(),
        currency: 'BDT',
        tran_id: `SSL-${orderId}-${Date.now()}`,
        success_url: `${Deno.env.get('PUBLIC_APP_URL')}/checkout/success`,
        fail_url: `${Deno.env.get('PUBLIC_APP_URL')}/checkout/failed`,
        cancel_url: `${Deno.env.get('PUBLIC_APP_URL')}/checkout/cancel`,
        cus_name: customerName,
        cus_email: customerEmail || 'customer@nexserve.bd',
        cus_phone: customerPhone,
        cus_add1: 'Dhaka, Bangladesh',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        shipping_method: 'NO',
        product_name: 'NexServe Booking & Escrow Hold',
        product_category: 'Service & Rental',
        product_profile: 'general',
      });

      const sslRes = await fetch(sslUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const sslData = await sslRes.json();

      return new Response(
        JSON.stringify({
          success: sslData.status === 'SUCCESS',
          gateway: 'sslcommerz',
          paymentId: sslData.sessionkey,
          redirectUrl: sslData.GatewayPageURL,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unsupported gateway: ${gateway}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
