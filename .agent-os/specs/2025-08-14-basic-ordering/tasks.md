# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-14-basic-ordering/spec.md

> Created: 2025-08-14
> Status: Ready for Implementation (Tests bypassed by user request)

## Tasks

- [ ] 1. Database Schema and Order Foundation
  - [ ] 1.1 Create shopping cart, orders, and order items tables
  - [ ] 1.2 Implement order creation function and triggers
  - [ ] 1.3 Add delivery time slots configuration
  - [ ] 1.4 Test order creation workflow with sample data

- [ ] 2. Shopping Cart State Management
  - [ ] 2.1 Create CartProvider with React Context
  - [ ] 2.2 Implement cart operations (add, remove, update quantity)
  - [ ] 2.3 Add cart persistence with AsyncStorage backup
  - [ ] 2.4 Create real-time cart synchronization with database

- [ ] 3. Cart Management Interface
  - [ ] 3.1 Create CartScreen with item list and total calculation
  - [ ] 3.2 Build CartItem component with quantity controls
  - [ ] 3.3 Add cart badge with item count on navigation
  - [ ] 3.4 Implement swipe-to-delete and bulk operations

- [ ] 4. Add to Cart Integration
  - [ ] 4.1 Add "Add to Cart" buttons to fruit catalog and detail screens
  - [ ] 4.2 Create quantity selector for adding items
  - [ ] 4.3 Implement optimistic UI updates for cart operations
  - [ ] 4.4 Add visual feedback for successful cart additions

- [ ] 5. Checkout and Delivery Selection
  - [ ] 5.1 Create CheckoutScreen with order review
  - [ ] 5.2 Build AddressSelector for delivery address choice
  - [ ] 5.3 Implement DeliveryScheduler for date and time selection
  - [ ] 5.4 Add delivery instructions input field

- [ ] 6. Order Processing and Confirmation
  - [ ] 6.1 Integrate wallet balance validation before order placement
  - [ ] 6.2 Implement order creation with cart conversion
  - [ ] 6.3 Create OrderConfirmationScreen with order details
  - [ ] 6.4 Clear cart after successful order placement
  - [ ] 6.5 Send order confirmation notification