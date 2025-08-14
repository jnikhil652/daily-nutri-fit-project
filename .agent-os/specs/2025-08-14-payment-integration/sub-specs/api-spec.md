# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-14-payment-integration/spec.md

> Created: 2025-08-14
> Version: 1.0.0

## Edge Functions Endpoints

### POST /functions/v1/create-stripe-customer

**Purpose:** Create a Stripe customer for new users
**Parameters:** 
- `user_id`: UUID (required)
- `email`: string (required)
- `name`: string (optional)

**Response:**
```json
{
  "customer_id": "cus_xxxxxxxxxx",
  "success": true
}
```

**Errors:** 
- 400: Invalid user data
- 500: Stripe API error

### POST /functions/v1/create-payment-intent

**Purpose:** Create payment intent for wallet top-up
**Parameters:**
- `amount`: number (required, in cents)
- `currency`: string (default: "usd")
- `customer_id`: string (required)
- `payment_method_id`: string (optional, for saved cards)

**Response:**
```json
{
  "client_secret": "pi_xxxxxx_secret_xxxxx",
  "payment_intent_id": "pi_xxxxxxxxxx",
  "amount": 2500,
  "currency": "usd"
}
```

**Errors:**
- 400: Invalid amount or customer
- 401: Unauthorized user
- 500: Stripe API error

### POST /functions/v1/save-payment-method

**Purpose:** Save payment method to Stripe customer
**Parameters:**
- `payment_method_id`: string (required)
- `customer_id`: string (required) 
- `set_as_default`: boolean (optional)

**Response:**
```json
{
  "payment_method": {
    "id": "pm_xxxxxxxxxx",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025
    },
    "is_default": true
  },
  "success": true
}
```

**Errors:**
- 400: Invalid payment method
- 401: Unauthorized user
- 500: Stripe API error

### GET /functions/v1/list-payment-methods

**Purpose:** Get user's saved payment methods
**Parameters:**
- `customer_id`: string (required)

**Response:**
```json
{
  "payment_methods": [
    {
      "id": "pm_xxxxxxxxxx",
      "card": {
        "brand": "visa", 
        "last4": "4242",
        "exp_month": 12,
        "exp_year": 2025
      },
      "is_default": false
    }
  ],
  "success": true
}
```

**Errors:**
- 401: Unauthorized user
- 500: Stripe API error

### DELETE /functions/v1/remove-payment-method

**Purpose:** Remove saved payment method
**Parameters:**
- `payment_method_id`: string (required)
- `customer_id`: string (required)

**Response:**
```json
{
  "success": true,
  "message": "Payment method removed successfully"
}
```

**Errors:**
- 400: Payment method not found
- 401: Unauthorized user
- 500: Stripe API error

### POST /functions/v1/stripe-webhook

**Purpose:** Handle Stripe webhook events
**Headers:**
- `stripe-signature`: string (required)

**Webhook Events Handled:**
- `payment_intent.succeeded` - Update wallet balance
- `payment_intent.payment_failed` - Handle payment failure
- `payment_method.attached` - Confirm payment method saved
- `customer.updated` - Sync customer data

**Response:**
```json
{
  "received": true
}
```

**Errors:**
- 400: Invalid webhook signature
- 500: Processing error

## Authentication

All endpoints require valid Supabase JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

User ID is extracted from JWT for authorization and customer linking.

## Rate Limiting

- Payment intent creation: 10 requests per minute per user
- Payment method operations: 20 requests per minute per user
- Webhook endpoint: 1000 requests per minute (global)

## Error Response Format

```json
{
  "error": {
    "code": "payment_failed",
    "message": "Your card was declined",
    "details": {
      "decline_code": "insufficient_funds",
      "suggested_action": "Try a different payment method"
    }
  },
  "success": false
}
```