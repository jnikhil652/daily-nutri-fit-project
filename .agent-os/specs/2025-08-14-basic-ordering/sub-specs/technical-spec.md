# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-14-basic-ordering/spec.md

> Created: 2025-08-14
> Version: 1.0.0

## Technical Requirements

- **Cart Persistence:** Local storage with cloud sync for cart data across devices
- **Real-time Pricing:** Dynamic price calculations including taxes and delivery fees
- **Inventory Validation:** Check fruit availability before order completion
- **Address Management:** Integration with existing delivery addresses from user profiles
- **Payment Integration:** Wallet balance validation and atomic deduction
- **Order Processing:** Atomic order creation with inventory updates
- **Delivery Scheduling:** Time slot management and availability checking
- **Order Confirmation:** Email and push notification after successful order
- **Error Handling:** Comprehensive error handling for payment and inventory issues

## Approach Options

**Option A:** Simple Cart with Manual Sync
- Pros: Fast local operations, simple implementation
- Cons: Data loss risk, no multi-device sync, limited offline capability

**Option B:** Real-time Cart with Database Sync** (Selected)
- Pros: Multi-device sync, persistent cart, real-time updates, data safety
- Cons: Network dependency, more complex implementation

**Option C:** Hybrid Local + Cloud Cart
- Pros: Offline capability, fast operations, eventual sync
- Cons: Complex synchronization logic, potential data conflicts

**Rationale:** Real-time cart with database sync selected to provide seamless multi-device experience, prevent cart abandonment due to data loss, and enable future features like shared family carts and abandoned cart recovery.

## External Dependencies

- **@react-native-async-storage/async-storage** - Local cart caching for offline capability
  - **Justification:** Fast local cart operations and offline access
- **react-hook-form** - Checkout form management and validation
  - **Justification:** Efficient form handling for delivery preferences and checkout
- **date-fns** - Date manipulation for delivery scheduling
  - **Justification:** Reliable date handling for delivery time calculations

## Implementation Architecture

### Data Models
```typescript
interface CartItem {
  id: string
  fruit_id: string
  quantity: number
  price_per_unit: number
  added_at: Date
}

interface Order {
  id: string
  user_id: string
  items: OrderItem[]
  delivery_address: DeliveryAddress
  delivery_date: Date
  delivery_time_slot: string
  subtotal: number
  delivery_fee: number
  tax: number
  total: number
  status: 'pending' | 'confirmed' | 'processing'
  payment_method: 'wallet'
  created_at: Date
}
```

### Component Structure
- **CartProvider:** Global cart state management and persistence
- **CartScreen:** Display cart items with quantity management
- **CartItem:** Individual cart item component with controls
- **CheckoutScreen:** Order review and completion flow
- **AddressSelector:** Choose delivery address from saved addresses
- **DeliveryScheduler:** Select delivery date and time preferences
- **OrderSummary:** Price breakdown and final review
- **OrderConfirmation:** Success screen with order details

### State Management Flow
1. **Add to Cart:** Update local state → Sync to database → Update UI
2. **Modify Cart:** Local optimistic update → Database sync → Rollback on error
3. **Checkout:** Validate cart → Check inventory → Process payment → Create order

### Performance Optimizations
- Optimistic UI updates for cart operations
- Debounced database sync for quantity changes
- Local cart caching for fast app startup
- Background inventory validation

### Error Recovery
- Cart sync failure recovery
- Payment processing failures
- Inventory unavailability handling
- Network connectivity issues
- Wallet insufficient balance scenarios