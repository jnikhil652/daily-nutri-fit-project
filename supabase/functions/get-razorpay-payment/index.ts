import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetPaymentRequest {
  payment_id: string;
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
    const { payment_id }: GetPaymentRequest = await req.json()

    // Validate input
    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: 'Payment ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Razorpay credentials from environment
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // First check if user owns this payment
    const { data: paymentRecord, error: dbError } = await supabase
      .from('razorpay_payments')
      .select('*')
      .eq('payment_id', payment_id)
      .eq('user_id', user.id)
      .single()

    if (dbError || !paymentRecord) {
      return new Response(
        JSON.stringify({ error: 'Payment not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch payment details from Razorpay
    const razorpayUrl = `https://api.razorpay.com/v1/payments/${payment_id}`
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)

    const razorpayResponse = await fetch(razorpayUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json()
      console.error('Razorpay API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payment details' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentDetails = await razorpayResponse.json()

    // Combine database record with Razorpay details
    const response = {
      ...paymentRecord,
      razorpay_details: paymentDetails
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})