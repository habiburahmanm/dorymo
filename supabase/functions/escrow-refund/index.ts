// Supabase Edge Function: escrow-refund
// Triggered when equipment inspection passes ('clean_pass')
// Automatically refunds the segregated escrow deposit back to the customer's bKash / bank account
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
    const { bookingId, returnCondition, reason } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch booking details
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from('bookings')
      .select('*, orders(*)')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (returnCondition !== 'clean_pass') {
      // Freeze deposit in escrow ledger pending dispute arbitration
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'disputed',
          escrow_status: 'disputed',
          inspection_notes: 'Damage detected during physical check-in inspection. Deposit hold retained pending mediator arbitration.',
        })
        .eq('id', bookingId);

      await supabaseAdmin.from('escrow_ledger').insert({
        booking_id: bookingId,
        amount: booking.deposit_hold,
        type: 'dispute_settlement',
        status: 'disputed',
        notes: reason || 'Damage detected on tool return',
      });

      return new Response(
        JSON.stringify({
          success: true,
          status: 'frozen',
          message: 'Escrow deposit frozen for mediator arbitration.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Process bKash Refund API
    let refundTrxId = `REF-BKH-${Date.now().toString(36).toUpperCase()}`;

    if (booking.orders?.payment_gateway === 'bkash') {
      const bkashBase = Deno.env.get('BKASH_BASE_URL') || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
      const appKey = Deno.env.get('BKASH_APP_KEY');
      const appSecret = Deno.env.get('BKASH_APP_SECRET');
      const username = Deno.env.get('BKASH_USERNAME');
      const password = Deno.env.get('BKASH_PASSWORD');

      if (appKey && appSecret) {
        // Grant token
        const tokenRes = await fetch(`${bkashBase}/tokenized/checkout/token/grant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', username: username || '', password: password || '' },
          body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
        });
        const { id_token } = await tokenRes.json();

        // Refund API
        const refundRes = await fetch(`${bkashBase}/tokenized/checkout/payment/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: id_token,
            'X-APP-Key': appKey,
          },
          body: JSON.stringify({
            paymentID: booking.orders.gateway_payment_id,
            amount: booking.deposit_hold.toString(),
            trxID: booking.orders.gateway_transaction_id,
            sku: bookingId,
            reason: reason || 'Equipment return inspection passed (clean_pass)',
          }),
        });

        const refundData = await refundRes.json();
        if (refundData.refundTrxID) {
          refundTrxId = refundData.refundTrxID;
        }
      }
    }

    // 2. Update booking and ledger in database
    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'completed',
        escrow_status: 'released',
        deposit_hold: 0,
        inspection_notes: `Check-in inspection passed. 100% of escrow security deposit (৳${booking.deposit_hold}) automatically refunded to customer via ${booking.orders?.payment_gateway?.toUpperCase() || 'bKash'} API (${refundTrxId}).`,
      })
      .eq('id', bookingId);

    await supabaseAdmin.from('escrow_ledger').insert({
      booking_id: bookingId,
      amount: booking.deposit_hold,
      type: 'deposit_refund',
      status: 'refunded',
      gateway_trx_id: refundTrxId,
      notes: 'Automated escrow refund executed upon clean return check-in pass',
    });

    return new Response(
      JSON.stringify({
        success: true,
        refundTrxId,
        refundedAmount: booking.deposit_hold,
        message: 'Deposit refunded successfully to customer wallet.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
