# MR3C0 Marketplace

A robust, secure marketplace application built with vanilla JavaScript, HTML, and CSS. Perfect for GitHub Pages deployment with a strong backend authentication and product management system.

## Features

### 🔐 Authentication System
- **User Registration** with email verification
- **Secure Login** with account lockout after failed attempts
- **Password Strength Requirements**:
  - Minimum 8 characters
  - Must contain uppercase and lowercase letters
  - Must contain numbers
  - Must contain special characters (!@#$%^&*)
- **Session Management** with JWT-like tokens
- **Password Encryption** with salt generation
- **Account Lockout** after 5 failed login attempts

### 🛍️ Marketplace Backend
- **Product Management System**
- **Shopping Cart** with session storage
- **Order Processing** with inventory tracking
- **Stock Management** with validation
- **Product Search** and filtering
- **Order History** per user

### 🔒 Security Features
- **XSS Protection** with HTML escaping
- **Input Validation** for all user inputs
- **Password Hashing** with salted encryption
- **Session Storage** for user authentication
- **Rate Limiting** on login attempts
- **CSRF Protection** through session tokens

### 📱 Responsive Design
- Mobile-friendly interface
- Smooth animations and transitions
- Modern gradient UI
- Adaptive grid layouts

## Getting Started

### Prerequisites
- GitHub account
- GitHub Pages enabled repository

### Installation

1. Clone this repository
```bash
git clone https://github.com/minn9098/MR3C0.git
cd MR3C0
```

2. Enable GitHub Pages
   - Go to repository Settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch
   - Save

3. Your site will be live at: `https://minn9098.github.io/MR3C0/`

## Usage

### Creating an Account
1. Click "Sign Up" on the login page
2. Enter username (3-20 characters, alphanumeric with `-` and `_`)
3. Enter valid email address
4. Create strong password meeting all requirements
5. Confirm password
6. Account created and automatically logged in

### Logging In
1. Enter your username and password
2. Click "Login"
3. Access the marketplace

### Admin Functions (Console)

Add a product:
```javascript
const product = {
    name: "Laptop",
    description: "High-performance laptop",
    price: 999.99,
    category: "Electronics",
    stock: 10,
    image_url: "https://example.com/image.jpg"
};
marketplace.addProduct(product);
```

Get all products:
```javascript
marketplace.getProducts();
```

Search products:
```javascript
marketplace.searchProducts("laptop");
```

Add to cart:
```javascript
marketplace.addToCart("prod_abc123", 1);
```

Create order:
```javascript
marketplace.createOrder();
```

View user orders:
```javascript
const session = JSON.parse(sessionStorage.getItem('mr3c0_session'));
marketplace.getUserOrders(session.username);
```

## Data Structure

### User Object
```javascript
{
    id: "unique_id",
    username: "john_doe",
    email: "john@example.com",
    passwordHash: "encrypted_hash",
    created_at: "2026-05-05T10:00:00Z",
    last_login: "2026-05-05T10:30:00Z",
    loginAttempts: 0,
    locked: false
}
```

### Product Object
```javascript
{
    id: "prod_abc123_1234567890",
    name: "Product Name",
    description: "Product description",
    price: 99.99,
    category: "Category",
    stock: 10,
    image_url: "https://example.com/image.jpg",
    created_at: "2026-05-05T10:00:00Z",
    updated_at: "2026-05-05T10:00:00Z",
    active: true
}
```

### Order Object
```javascript
{
    id: "ord_abc123_1234567890",
    username: "john_doe",
    items: [
        {
            productId: "prod_abc123",
            productName: "Product",
            quantity: 1,
            price: 99.99,
            subtotal: 99.99
        }
    ],
    total: 99.99,
    status: "pending",
    created_at: "2026-05-05T10:00:00Z",
    updated_at: "2026-05-05T10:00:00Z"
}
```

## Storage

The marketplace uses browser storage for data persistence:
- **localStorage**: Users, products, orders (persists after closing browser)
- **sessionStorage**: User sessions, shopping cart (cleared when tab closes)

## Security Considerations

For production deployment:
1. Implement backend authentication instead of client-side encryption
2. Use HTTPS for all communications
3. Implement proper OAuth/JWT on server
4. Add rate limiting on the server
5. Validate all inputs on the server
6. Use proper database instead of localStorage
7. Implement payment processing securely

## File Structure

```
MR3C0/
├── index.html          # Main HTML file
├── styles.css          # Styling and animations
├── auth.js             # Authentication system
├── marketplace.js      # Product and cart management
└── README.md           # Documentation
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - feel free to use for personal and commercial projects

## Author

Created for MR3C0 Marketplace Platform

---

**Note**: This is a client-side application. For production use, implement a proper backend server for security and scalability.