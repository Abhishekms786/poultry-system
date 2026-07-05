# Naati Koli Farm — Poultry E-Commerce & Order Management Platform

![Naati Koli Farm](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Node.js](https://img.shields.io/badge/Node.js-v14+-green) ![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)

A full-stack e-commerce platform designed to manage poultry business operations for **Shiva Murthy Poultry Farm**, Choganahalli, Mysuru. The platform connects farm owners with customers, enabling efficient order management, product catalog management, and real-time order tracking.

**Live Demo:** 
- 🛒 **Customer Storefront:** [abhishekms786.github.io/poultry-system/index2.html](https://abhishekms786.github.io/poultry-system/index2.html)
- 📊 **Owner Dashboard:** [abhishekms786.github.io/poultry-system/](https://abhishekms786.github.io/poultry-system/)

---

## 🎯 Features

### For Customers
- ✅ Browse live product catalog (Desi Chicken, Eggs, Dressed Chicken, etc.)
- ✅ View detailed product information with pricing in multiple units (kg, piece, litre)
- ✅ Place orders with quantity selection
- ✅ Real-time order status tracking (Pending → Confirmed → On the Way → Delivered)
- ✅ Email notifications at each order stage
- ✅ Bilingual support (English & Kannada)
- ✅ Responsive mobile-friendly interface

### For Farm Owners
- 📱 Dedicated owner dashboard to manage operations
- ➕ Add, edit, and delete products from inventory
- 📋 View all customer orders in real-time
- 🔄 Update order status and track fulfillment
- 🔐 Secure email-based OTP authentication (no passwords to remember)
- 📊 Order history and sales tracking
- 💌 Automated email notifications to customers

### Technical Features
- 🔒 Email-based OTP authentication (secure, password-less)
- 🌐 Bilingual product listings (English + Kannada)
- 📧 Transactional email via Brevo API (reliable delivery)
- 🗄️ MySQL database for persistent storage
- ⚡ Express.js REST API for backend operations
- 🚀 Deployed on Render (backend) & GitHub Pages (frontend)
- 🏃 UptimeRobot monitoring to prevent cold-start delays

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE (Frontend)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐        ┌──────────────────────┐        │
│  │ Customer Site    │        │   Owner Dashboard    │        │
│  │ (index2.html)    │        │ (poultry-system/)    │        │
│  │ - Browse catalog │        │ - Manage inventory   │        │
│  │ - Place orders   │        │ - View orders        │        │
│  │ - Track status   │        │ - Update status      │        │
│  └────────┬─────────┘        └──────────┬───────────┘        │
│           │                             │                     │
│           └─────────────┬───────────────┘                     │
│                         │                                     │
│        Hosted on GitHub Pages                                │
│        (Static HTML/CSS/JavaScript)                          │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS API Calls
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 SERVER SIDE (Backend API)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│           Node.js + Express.js REST API                      │
│                                                               │
│  Routes:                                                     │
│  - POST /api/auth/send-otp       (Generate OTP)             │
│  - POST /api/auth/verify-otp     (Login with OTP)           │
│  - GET  /api/products            (Fetch all products)       │
│  - GET  /api/orders              (Fetch orders)             │
│  - POST /api/orders              (Create new order)         │
│  - PUT  /api/orders/:id          (Update order status)      │
│  - DELETE /api/products/:id      (Delete product)           │
│                                                               │
│        Hosted on Render.com                                  │
│        (Free tier with UptimeRobot monitoring)              │
│                                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL Queries
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tables:                                                     │
│  - users (owner account)                                    │
│  - products (inventory: chicken, eggs, etc.)                │
│  - orders (customer orders)                                 │
│  - order_items (individual items in each order)             │
│                                                               │
│        Hosted on Aiven.io (PostgreSQL/MySQL SaaS)          │
│        (SSL certificate for secure connection)              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                       ↑
                       │ Email Notifications
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  EMAIL SERVICE (Brevo API)                  │
├─────────────────────────────────────────────────────────────┤
│  Sends transactional emails:                                │
│  - Order confirmation                                       │
│  - Order status updates                                     │
│  - Delivery notifications                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, JavaScript | Customer site & owner dashboard |
| **Hosting (Frontend)** | GitHub Pages | Static site hosting (free) |
| **Backend** | Node.js, Express.js | REST API server |
| **Hosting (Backend)** | Render.com | Cloud deployment (free tier) |
| **Database** | MySQL | Data storage |
| **DB Hosting** | Aiven.io | Managed MySQL database |
| **Email Service** | Brevo API | Transactional email delivery |
| **Authentication** | Email OTP | Secure, password-less login |
| **Monitoring** | UptimeRobot | Keeps backend awake & monitors uptime |
| **Version Control** | Git & GitHub | Code management & deployment |

---

## 📋 Prerequisites

Before you start, ensure you have:
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **MySQL** (local or hosted - Aiven recommended)
- **Brevo Account** (for email API key)
- **Render Account** (for backend deployment)
- **GitHub Account** (for frontend hosting)

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/Abhishekms786/poultry-system.git
cd poultry-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the project root (do NOT commit this file):
```
# MySQL Database (Aiven)
DB_HOST=your-db-host.aivencloud.com
DB_PORT=your_db_port
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_database_name

# Brevo Email API
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_email@gmail.com

# Owner Email
OWNER_EMAIL=owner@example.com

# JWT Secret (for session management)
JWT_SECRET=your_long_random_secret_string

# Server Port
PORT=3000

# Frontend URLs (for local testing)
CUSTOMER_URL=http://localhost:5500
OWNER_URL=http://localhost:5501
```

### 4. Start the Backend Server
```bash
node index.js
```
Server will run on `http://localhost:3000`

### 5. Open Frontend (In Another Terminal)
Serve the HTML files locally:
```bash
# Using Python (if installed)
python -m http.server 5500  # For customer site
python -m http.server 5501  # For owner dashboard

# Or use Node.js http-server
npx http-server -p 5500
```

Visit:
- 🛒 **Customer Site:** http://localhost:5500/index2.html
- 📊 **Owner Dashboard:** http://localhost:5501/

---

## 📦 Project Structure

```
poultry-system/
├── index.js                      # Main Express server & API routes
├── index2.html                   # Customer storefront
├── poultry-system/               # Owner dashboard folder (GitHub Pages)
│   ├── index.html               # Owner dashboard main page
│   ├── css/
│   │   └── style.css            # Dashboard styling
│   └── js/
│       └── script.js            # Dashboard functionality
├── .env                          # Environment variables (NOT in git)
├── .gitignore                    # Git ignore rules
├── package.json                  # Node.js dependencies
├── package-lock.json             # Dependency lock file
└── README.md                      # This file
```

---

## 🔐 Authentication & Security

### Email-Based OTP Login
Instead of storing passwords, the system uses a **secure email OTP (One-Time Password)** flow:

1. Owner enters email → Backend generates 6-digit OTP
2. Backend sends OTP via Brevo email API
3. Owner enters OTP in login form
4. Backend verifies OTP → Issues session token (JWT)
5. Session token stored in browser cookies
6. Owner remains logged in for the session

**Why OTP?**
- ✅ No password storage needed
- ✅ No password reset headaches
- ✅ Phishing-resistant
- ✅ Easy to use

---

## 💾 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),  -- kg, piece, litre, etc.
  stock INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'Pending',  -- Pending, Confirmed, On the Way, Delivered, Cancelled
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10, 2),
  price_at_purchase DECIMAL(10, 2),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## 🚀 Deployment

### Frontend (GitHub Pages)
```bash
# Push changes to GitHub
git add .
git commit -m "Update website"
git push origin main

# Site automatically deploys at:
# https://abhishekms786.github.io/poultry-system/
```

### Backend (Render.com)
1. Go to [Render.com Dashboard](https://dashboard.render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set environment variables in Render dashboard
5. Deploy! (Auto-deploys on git push)

Backend available at: `https://your-service-name.onrender.com`

---

## 📞 API Endpoints

### Authentication
```
POST /api/auth/send-otp
Request:  { email: "owner@example.com" }
Response: { message: "OTP sent to email" }

POST /api/auth/verify-otp
Request:  { email: "owner@example.com", otp: "123456" }
Response: { token: "jwt_token_here", message: "Login successful" }
```

### Products
```
GET /api/products
Response: [{ id, name, price, unit, stock, description }]

POST /api/products
Request:  { name, price, unit, stock, description }
Response: { id, name, price, ... }

PUT /api/products/:id
Request:  { name, price, stock }
Response: { id, updated fields }

DELETE /api/products/:id
Response: { message: "Product deleted" }
```

### Orders
```
GET /api/orders
Response: [{ id, customer_email, status, total_amount, created_at }]

POST /api/orders
Request:  { customer_email, customer_phone, items: [{product_id, quantity}] }
Response: { order_id, status, total_amount }

PUT /api/orders/:id
Request:  { status: "Confirmed" }
Response: { id, status, updated_at }
```

---

## 📧 Email Notifications

The system sends automated emails at key points:

| Event | Recipient | Email Type |
|-------|-----------|-----------|
| Order Placed | Customer | Order confirmation with details |
| Order Confirmed | Customer | Confirmation of order acceptance |
| Order Dispatched | Customer | "On the Way" notification with ETA |
| Order Delivered | Customer | Delivery confirmation + thank you |
| Order Cancelled | Customer | Cancellation reason & refund info |

---

## 🐛 Troubleshooting

### Backend not starting?
```bash
# Check if port 3000 is in use
lsof -i :3000
# Kill the process
kill -9 <PID>
# Try again
node index.js
```

### Database connection error?
- Verify `.env` file has correct credentials
- Check if MySQL server is running
- Test connection: `mysql -h host -u user -p`

### Emails not sending?
- Verify Brevo API key is correct
- Check if sender email is verified in Brevo
- Check email spam folder
- View logs: `console.log()` in index.js

### Frontend not loading?
- Ensure backend is running (`http://localhost:3000` accessible)
- Clear browser cache (Ctrl+Shift+Delete)
- Check console for JavaScript errors (F12)

---

## 📈 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Payment gateway integration (Razorpay, Stripe)
- [ ] SMS notifications (Twilio)
- [ ] WhatsApp order updates
- [ ] Admin analytics dashboard
- [ ] Inventory low-stock alerts
- [ ] Multi-location support
- [ ] Customer loyalty program
- [ ] Delivery partner management
- [ ] Real-time order tracking (GPS)

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Abhishek M S**  
- 📧 Email: abhishekms1234.x@gmail.com  
- 🐙 GitHub: [@Abhishekms786](https://github.com/Abhishekms786)  
- 💼 LinkedIn: [abhishekms786](https://linkedin.com/in/abhishekms786)

---

## 🙏 Acknowledgments

- **Shiva Murthy Poultry Farm** — Real-world use case and business logic
- **Render.com** — Free backend hosting
- **Aiven.io** — Managed MySQL database
- **Brevo** — Reliable email API
- **GitHub** — Version control and frontend hosting
- **UptimeRobot** — Monitoring and uptime tracking

---

## 📝 Notes

### Why This Tech Stack?
- **Express.js**: Lightweight, fast, perfect for REST APIs
- **MySQL**: Reliable, SQL-based, widely supported
- **Brevo**: More reliable than Gmail SMTP for bulk emails (avoids IP blocking)
- **Render.com**: Free tier sufficient for small business operations
- **GitHub Pages**: Free static hosting for frontend

### Security Considerations
- All credentials stored in `.env` (never commit)
- Email-based OTP instead of passwords
- SSL/TLS for all connections
- Input validation on backend
- CORS enabled only for known domains

### Performance Optimizations
- UptimeRobot pings backend every 5 minutes (prevents cold-start)
- Database queries optimized with indexes
- Static assets cached on GitHub Pages
- Brevo API for email (no SMTP relay bottlenecks)

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Open a GitHub Issue with:
   - Clear problem description
   - Steps to reproduce
   - Error messages/logs
   - Environment details (OS, Node version, etc.)

---

**Last Updated:** July 2026  
**Status:** Production Ready ✅
