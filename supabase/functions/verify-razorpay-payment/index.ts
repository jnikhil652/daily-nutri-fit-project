import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    }: VerifyPaymentRequest = await req.json()

    // Validate input
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required payment data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Razorpay secret from environment
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!razorpayKeySecret) {
      console.error('Razorpay secret not configured')
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex')

    const isValid = expectedSignature === razorpay_signature

    if (isValid) {
      // Get order details from database
      const { data: orderData, error: orderError } = await supabase
        .from('razorpay_orders')
        .select('*')
        .eq('order_id', razorpay_order_id)
        .eq('user_id', user.id)
        .single()

      if (orderError || !orderData) {
        console.error('Order not found:', orderError)
        return new Response(
          JSON.stringify({ verified: false, error: 'Order not found' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('razorpay_orders')
        .update({
          status: 'completed',
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
          completed_at: new Date().toISOString()
        })
        .eq('order_id', razorpay_order_id)

      if (updateError) {
        console.error('Error updating order status:', updateError)
      }

      // Store payment record
      const { error: paymentError } = await supabase
        .from('razorpay_payments')
        .insert({
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          amount: orderData.amount,
          currency: orderData.currency,
          user_id: user.id,
          status: 'captured',
          signature: razorpay_signature,
          verified_at: new Date().toISOString()
        })

      if (paymentError) {
        console.error('Error storing payment record:', paymentError)
      }
    }

    return new Response(
      JSON.stringify({ verified: isValid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ verified: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})