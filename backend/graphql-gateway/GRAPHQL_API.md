# BiteGo GraphQL API - Production-Ready Documentation

## 📋 Overview

This is a **production-ready GraphQL API** for the BiteGo food delivery platform, featuring:

- ✅ Complete schema covering all entities (Users, Restaurants, Orders, Payments, etc.)
- ✅ Modular resolver architecture with clean separation of concerns
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive error handling and validation
- ✅ Scalable design following GraphQL best practices
- ✅ Support for all food delivery operations

---

## 🏗️ Project Structure

```
src/
├── index.js                          # Apollo Server setup & entry point
├── schema/
│   ├── index.graphql                # Root Query & Mutation types
│   ├── types.graphql                # All GraphQL type definitions
│   ├── user.graphql                 # User queries and mutations
│   ├── restaurant.graphql           # Restaurant/Menu queries and mutations
│   ├── order.graphql                # Order queries and mutations
│   ├── payment.graphql              # Payment queries and mutations
│   ├── review.graphql               # Delivery & Review queries and mutations
│   └── coupon.graphql               # Coupon & Support queries and mutations
├── resolvers/
│   ├── user.resolver.ts             # User operations
│   ├── restaurant.resolver.ts       # Restaurant & Menu operations
│   ├── order.resolver.ts            # Order management
│   ├── payment.resolver.ts          # Payment processing
│   ├── delivery.resolver.ts         # Delivery & Reviews
│   ├── coupon.resolver.ts           # Coupons & Support tickets
│   └── earning.resolver.ts          # Earnings & Statistics
├── utils/
│   └── validation.js                # Validation & error utilities
├── middleware/
│   └── authorization.js             # Role-based access control
└── config/
    └── constants.js                 # Configuration & constants
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL
- Prisma Client
- Apollo Server 4+

### Installation

```bash
# Install dependencies
npm install @apollo/server @apollo/server/standalone
npm install bcrypt dotenv

# Start the GraphQL server
npm run dev

# Server runs on: http://localhost:4000
```

### Environment Variables

```env
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/bitego
JWT_SECRET=your-secret-key
```

---

## 📚 API Endpoints & Queries

### 1️⃣ User Management

#### Register User
```graphql
mutation RegisterUser {
  registerUser(input: {
    name: "John Doe"
    email: "john@example.com"
    phone: "9999999999"
    password: "SecurePass123"
    role: User
  }) {
    token
    user {
      id
      name
      email
      role
    }
  }
}
```

#### Login
```graphql
mutation LoginUser {
  loginUser(input: {
    email: "john@example.com"
    password: "SecurePass123"
  }) {
    token
    user {
      id
      name
      email
      walletBalance
    }
  }
}
```

#### Get Current User Profile
```graphql
query GetCurrentUser {
  getCurrentUser {
    id
    name
    email
    phone
    role
    walletBalance
    addresses {
      id
      addressLine
      city
      isDefault
    }
  }
}
```

#### Update Profile
```graphql
mutation UpdateProfile {
  updateUserProfile(userId: "user-123", input: {
    name: "Jane Doe"
    phone: "8888888888"
  }) {
    id
    name
    phone
  }
}
```

#### Add Address
```graphql
mutation AddAddress {
  addAddress(userId: "user-123", input: {
    addressLine: "123 Main St, Apt 4B"
    city: "Mumbai"
    pincode: "400001"
    latitude: "19.0760"
    longitude: "72.8777"
    isDefault: true
  }) {
    id
    addressLine
    city
  }
}
```

#### Wallet Operations
```graphql
# Get wallet balance
query GetWalletBalance {
  getUserWalletBalance(userId: "user-123")
}

# Get wallet transactions
query GetTransactions {
  getUserWalletTransactions(userId: "user-123", limit: 20, offset: 0) {
    id
    transactionType
    amount
    description
    createdAt
  }
}

# Add balance
mutation AddBalance {
  addWalletBalance(userId: "user-123", amount: "500") {
    id
    transactionType
    amount
    createdAt
  }
}
```

---

### 2️⃣ Restaurant Management

#### Get All Restaurants (with filters)
```graphql
query GetRestaurants {
  getRestaurants(
    page: 1
    pageSize: 20
    latitude: "19.0760"
    longitude: "72.8777"
    radius: 5
    searchQuery: "pizza"
    rating: 4
  ) {
    restaurants {
      id
      name
      categoryName
      rating
      isOpen
      menuItems {
        id
        itemName
        price
        isVeg
      }
    }
    total
    page
    pageSize
  }
}
```

#### Get Restaurant Details
```graphql
query GetRestaurant {
  getRestaurantById(id: "rest-123") {
    id
    name
    categoryName
    rating
    isOpen
    owner {
      id
      user {
        name
        email
      }
    }
    menuItems {
      id
      itemName
      description
      price
      isVeg
      isAvailable
    }
    offers {
      id
      title
      discountType
      discountValue
      minOrderValue
    }
  }
}
```

#### Create Restaurant (Owner only)
```graphql
mutation CreateRestaurant {
  createRestaurant(ownerId: "owner-123", input: {
    name: "Pizza Palace"
    categoryName: "Italian"
    latitude: "19.0760"
    longitude: "72.8777"
  }) {
    id
    name
    categoryName
  }
}
```

#### Add Menu Items
```graphql
mutation AddMenuItem {
  addMenuItem(restaurantId: "rest-123", input: {
    itemName: "Margherita Pizza"
    description: "Classic pizza with tomato and mozzarella"
    itemImageUrl: "https://..."
    price: "250"
    isVeg: true
    availableQuantity: 50
  }) {
    id
    itemName
    price
  }
}
```

#### Add Multiple Items (Bulk)
```graphql
mutation BulkAddItems {
  addMultipleMenuItems(restaurantId: "rest-123", items: [
    {
      itemName: "Pasta"
      price: "180"
      isVeg: true
      availableQuantity: 30
    }
    {
      itemName: "Burger"
      price: "150"
      isVeg: false
      availableQuantity: 40
    }
  ]) {
    id
    itemName
    price
  }
}
```

#### Create Offer
```graphql
mutation CreateOffer {
  createOffer(restaurantId: "rest-123", input: {
    title: "50% Off on Pizzas"
    description: "Limited time offer"
    discountType: Percentage
    discountValue: "50"
    minOrderValue: "300"
    maxDiscount: "200"
    startTime: "2024-01-01T00:00:00Z"
    endTime: "2024-01-31T23:59:59Z"
  }) {
    id
    title
    discountValue
  }
}
```

---

### 3️⃣ Order Management

#### Place Order
```graphql
mutation PlaceOrder {
  placeOrder(userId: "user-123", input: {
    restaurantId: "rest-123"
    items: [
      { itemId: "item-1", quantity: 2 }
      { itemId: "item-2", quantity: 1 }
    ]
    deliveryAddressId: "addr-456"
    notes: "No onions please"
  }) {
    id
    orderDateTime
    totalAmount
    orderStatus
    items {
      item {
        itemName
        price
      }
      quantity
    }
    restaurant {
      name
    }
  }
}
```

#### Place Order with Coupon
```graphql
mutation PlaceOrderWithCoupon {
  placeOrderWithCoupon(userId: "user-123", input: {
    restaurantId: "rest-123"
    items: [{ itemId: "item-1", quantity: 2 }]
    deliveryAddressId: "addr-456"
    couponCode: "SAVE50"
  }) {
    id
    totalAmount
    orderStatus
  }
}
```

#### Get User Orders
```graphql
query GetMyOrders {
  getOrdersByUser(userId: "user-123", page: 1, pageSize: 10) {
    orders {
      id
      orderDateTime
      totalAmount
      orderStatus
      restaurant {
        name
      }
      deliveryPartner {
        user {
          name
          phone
        }
      }
    }
    total
  }
}
```

#### Get Order Details
```graphql
query GetOrder {
  getOrderById(id: "order-789") {
    id
    orderDateTime
    totalAmount
    orderStatus
    user {
      name
      phone
    }
    restaurant {
      name
      rating
    }
    address {
      addressLine
      city
    }
    items {
      quantity
      itemPrice
      item {
        itemName
      }
    }
    payments {
      paymentMethod
      paymentStatus
    }
    deliveryPartner {
      user {
        name
      }
      currentLatitude
      currentLongitude
    }
  }
}
```

#### Update Order Status
```graphql
mutation UpdateOrderStatus {
  updateOrderStatus(orderId: "order-789", status: Preparing) {
    id
    orderStatus
  }
}
```

#### Cancel Order
```graphql
mutation CancelOrder {
  cancelOrder(orderId: "order-789", reason: "Change of mind") {
    id
    orderStatus
  }
}
```

#### Get Order Statistics
```graphql
query GetOrderStats {
  getOrderStats(
    startDate: "2024-01-01T00:00:00Z"
    endDate: "2024-01-31T23:59:59Z"
  ) {
    totalOrders
    totalRevenue
    avgOrderValue
    completedOrders
    cancelledOrders
    activeOrders
  }
}
```

---

### 4️⃣ Payment Processing

#### Make Payment
```graphql
mutation MakePayment {
  makePayment(orderId: "order-789", input: {
    paymentMethod: Card
    amount: "450.50"
    transactionReference: "TXN123456"
  }) {
    id
    totalAmount
    paymentMethod
    paymentStatus
    paymentDate
  }
}
```

#### Pay with Wallet
```graphql
mutation PayWithWallet {
  payWithWallet(orderId: "order-789") {
    id
    paymentMethod
    paymentStatus
  }
}
```

#### Get Payment Details
```graphql
query GetPayment {
  getPaymentById(id: "pay-123") {
    id
    totalAmount
    paymentMethod
    paymentStatus
    transactionReference
    paymentDate
    order {
      id
      totalAmount
    }
  }
}
```

---

### 5️⃣ Delivery Management

#### Get Available Delivery Partners
```graphql
query GetAvailablePartners {
  getAvailableDeliveryPartners(
    latitude: "19.0760"
    longitude: "72.8777"
    radius: 5
  ) {
    id
    vehicleNumber
    currentLatitude
    currentLongitude
    user {
      name
      phone
    }
  }
}
```

#### Assign Delivery Partner
```graphql
mutation AssignDeliveryPartner {
  assignDeliveryPartner(orderId: "order-789", deliveryPartnerId: "dp-456") {
    id
    orderStatus
    deliveryPartner {
      user {
        name
        phone
      }
    }
  }
}
```

#### Update Delivery Location
```graphql
mutation UpdateLocation {
  updateDeliveryPartnerLocation(
    deliveryPartnerId: "dp-456"
    latitude: "19.0761"
    longitude: "72.8778"
  ) {
    id
    currentLatitude
    currentLongitude
  }
}
```

#### Complete Delivery
```graphql
mutation CompleteDelivery {
  completeDelivery(orderId: "order-789") {
    id
    orderStatus
  }
}
```

#### Get Delivery Partner Stats
```graphql
query GetDeliveryStats {
  getDeliveryPartnerStats(deliveryPartnerId: "dp-456") {
    totalDeliveries
    completedDeliveries
    avgDeliveryTime
    rating
    totalEarnings
  }
}
```

---

### 6️⃣ Reviews & Ratings

#### Add Review
```graphql
mutation AddReview {
  addReview(orderId: "order-789", input: {
    ratingRestaurant: 5
    ratingDelivery: 4
    reviewText: "Excellent food and fast delivery!"
  }) {
    id
    ratingRestaurant
    ratingDelivery
    reviewText
  }
}
```

#### Get Restaurant Reviews
```graphql
query GetRestaurantReviews {
  getRestaurantReviews(restaurantId: "rest-123", page: 1, pageSize: 10) {
    id
    ratingRestaurant
    reviewText
    user {
      name
    }
  }
}
```

#### Get Restaurant Rating Summary
```graphql
query GetRatingSummary {
  getRestaurantRating(restaurantId: "rest-123") {
    avgRestaurantRating
    avgDeliveryRating
    totalReviews
    ratingDistribution {
      fiveStar
      fourStar
      threeStar
      twoStar
      oneStar
    }
  }
}
```

---

### 7️⃣ Coupons & Offers

#### Validate Coupon
```graphql
query ValidateCoupon {
  validateCoupon(code: "SAVE50", orderId: "order-789") {
    isValid
    coupon {
      id
      couponCode
      discountValue
    }
    message
    applicableDiscount
  }
}
```

#### Apply Coupon
```graphql
mutation ApplyCoupon {
  applyCoupon(userId: "user-123", couponCode: "SAVE50", orderId: "order-789") {
    id
    coupon {
      couponCode
      discountValue
    }
    usedAt
  }
}
```

#### Create Coupon (Admin)
```graphql
mutation CreateCoupon {
  createCoupon(input: {
    couponCode: "SAVE50"
    discountType: Percentage
    discountValue: "50"
    expiryDate: "2024-12-31T23:59:59Z"
  }) {
    id
    couponCode
  }
}
```

---

### 8️⃣ Support Tickets

#### Create Support Ticket
```graphql
mutation CreateTicket {
  createSupportTicket(userId: "user-123", input: {
    issueType: "Order Issue"
    description: "Food arrived late and was cold"
    orderId: "order-789"
  }) {
    id
    status
    createdAt
  }
}
```

#### Get User Tickets
```graphql
query GetMyTickets {
  getUserTickets(userId: "user-123", page: 1, pageSize: 10) {
    id
    issueType
    status
    createdAt
  }
}
```

#### Update Ticket Status (Support team)
```graphql
mutation UpdateTicketStatus {
  updateTicketStatus(ticketId: "ticket-123", status: InProgress) {
    id
    status
  }
}
```

---

### 9️⃣ Earnings & Statistics

#### Get Restaurant Owner Earnings
```graphql
query GetRestaurantEarnings {
  getRestaurantOwnerEarnings(
    ownerId: "owner-123"
    startDate: "2024-01-01T00:00:00Z"
    endDate: "2024-01-31T23:59:59Z"
  ) {
    totalEarnings
    totalOrders
    avgOrderEarning
  }
}
```

#### Get Delivery Partner Earnings
```graphql
query GetDeliveryEarnings {
  getDeliveryPartnerEarnings(
    deliveryPartnerId: "dp-456"
    startDate: "2024-01-01T00:00:00Z"
    endDate: "2024-01-31T23:59:59Z"
  ) {
    totalEarnings
    totalDeliveries
    avgDeliveryEarning
  }
}
```

#### Get Platform Statistics (Admin)
```graphql
query GetPlatformStats {
  getPlatformEarnings(
    startDate: "2024-01-01T00:00:00Z"
    endDate: "2024-01-31T23:59:59Z"
  ) {
    totalRevenue
    restaurantEarnings
    deliveryEarnings
    platformEarnings
    totalOrders
    platformCommissionPercentage
  }
}
```

---

## 🔐 Authentication & Authorization

### Bearer Token
```
Authorization: Bearer <JWT_TOKEN>
```

### Context Headers
```
X-User-ID: user-123
X-User-Role: User
```

### Role-Based Access Control

**Roles:**
- `SuperAdmin` - Full access
- `Ops` - Operations management
- `Support` - Customer support
- `RestaurantOwner` - Restaurant management
- `DeliveryPartner` - Delivery operations
- `User` - Customer operations

**Protected Operations:**
- Admin-only: Creating coupons, viewing statistics
- Support-only: Managing support tickets
- Owner-only: Managing restaurant and menu items
- Delivery Partner: Managing deliveries
- User: Personal orders and reviews

---

## ⚡ Best Practices Implemented

1. **Error Handling**: Comprehensive error classes with proper error messages
2. **Validation**: Input validation for all mutations
3. **Authorization**: Role-based access control on all sensitive operations
4. **Scalability**: Modular resolver design
5. **Performance**: Efficient database queries with proper includes
6. **Security**: Password hashing, token validation
7. **Documentation**: Inline comments and this comprehensive guide

---

## 🧪 Testing Examples

### Test Health Check
```bash
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health appVersion }"}'
```

### Test with Apollo Client
```javascript
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
  headers: {
    authorization: `Bearer ${token}`,
    'x-user-id': userId,
    'x-user-role': userRole,
  },
});
```

---

## 📦 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Enable introspection only in development
- [ ] Configure proper JWT secret
- [ ] Set database connection pooling
- [ ] Enable CORS for frontend domains
- [ ] Add rate limiting
- [ ] Enable query complexity analysis
- [ ] Setup monitoring and logging
- [ ] Configure error tracking (Sentry)
- [ ] Setup CI/CD pipeline

---

## 🐛 Common Issues & Solutions

**Issue**: "User must be authenticated"
**Solution**: Include valid JWT token in Authorization header

**Issue**: "Order with ID X not found"
**Solution**: Verify order exists and user has access

**Issue**: "Insufficient wallet balance"
**Solution**: Add funds to wallet before payment

**Issue**: "Cannot place order - restaurant closed"
**Solution**: Check restaurant `isOpen` status before ordering

---

## 📞 Support & Maintenance

For issues, improvements, or questions:
1. Check this documentation
2. Review resolver implementations
3. Check validation utilities
4. Review authorization middleware

---

## 📄 License

This GraphQL API is part of the BiteGo platform.

---

**Last Updated**: December 2024
**Version**: 1.0.0
