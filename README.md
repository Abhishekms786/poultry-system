# Naati Koli Farm — Poultry E-Commerce & Order Management Platform

![Status](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Node.js](https://img.shields.io/badge/Node.js-v14+-green) ![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)

A full-stack e-commerce platform designed to manage poultry business operations for **Shiva Murthy Poultry Farm**, Choganahalli, Mysuru. The platform connects farm owners with customers, enabling efficient order management, product catalog management, and real-time order tracking.

**🚀 Live Platform:**
- 🛒 **Customer Storefront:** https://abhishekms786.github.io/poultry-system/index2.html
- 📊 **Owner Dashboard:** https://abhishekms786.github.io/poultry-system/

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
│  ┌──────────────────┐        ┌──────────────────────┐        │
│  │ Customer Site    │        │   Owner Dashboard    │        │
│  │ (index2.html)    │        │ (poultry-system/)    │        │
│  │ - Browse catalog │        │ - Manage inventory   │        │
│  │ - Place orders   │        │ - View orders        │        │
│  │ - Track status   │        │ - Update status      │        │
│  └────────┬─────────┘        └──────────┬───────────┘        │
│           └─────────────┬───────────────┘                     │
│        Hosted on GitHub Pages                                │
│        (Static HTML/CSS/JavaScript)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS API Calls
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 SERVER SIDE (Backend API)                   │
├─────────────────────────────────────────────────────────────┤
│           Node.js + Express.js REST API                      │
│  - POST /api/auth/send-otp       (Generate OTP)             │
│  - POST /api/auth/verify-otp     (Login with OTP)           │
│  - GET  /api/products            (Fetch all products)       │
│  - GET  /api/orders              (Fetch orders)             │
│  - POST /api/orders              (Create new order)         │
│  - PUT  /api/orders/:id          (Update order status)      │
│  - DELETE /api/products/:id      (Delete product)           │
│        Hosted on Render.com                                  │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                          │
├─────────────────────────────────────────────────────────────┤
│  - users, products, orders, order_items                     │
│        Hosted on Aiven.io                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------│
| Frontend | HTML5, CSS3, JavaScript | Customer site & owner dashboard |
| Hosting (Frontend) | GitHub Pages | Static site hosting |
| Backend | Node.js, Express.js | REST API server |
| Hosting (Backend) | Render.com | Cloud deployment |
| Database | MySQL | Data storage |
| DB Hosting | Aiven.io | Managed MySQL |
| Email Service | Brevo API | Transactional emails |
| Authentication | Email OTP | Secure login |
| Monitoring | UptimeRobot | Uptime tracking |

---

## 📋 Prerequisites

- Node.js (v14+)
- npm
- Git
- MySQL (Aiven recommended)
- Brevo Account
- Render Account
- GitHub Account

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Abhishekms786/poultry-system.git
cd poultry-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create `.env` File
```env
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=poultry_farm_db

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=farm_email@example.com

OWNER_EMAIL=farm_owner@example.com

JWT_SECRET=generate_random_secret_string

PORT=3000

CUSTOMER_URL=http://localhost:5500
OWNER_URL=http://localhost:5501
```

### 4. Start Backend
```bash
node index.js
```

### 5. Start Frontend (Another Terminal)
```bash
python -m http.server 5500
```

Visit:
- Customer: http://localhost:5500/index2.html
- Owner: http://localhost:5501/

---

## 📦 Project Structure

```
poultry-system/
├── index.js                 # Express server
├── index2.html              # Customer site
├── poultry-system/          # Owner dashboard
│   ├── index.html
│   ├── css/style.css
│   └── js/script.js
├── .env                     # Credentials (not in git)
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 Authentication

**Email-Based OTP Flow:**
1. Owner enters email → Backend generates OTP
2. Backend sends OTP via Brevo
3. Owner enters OTP → Backend verifies
4. Backend issues JWT session token
5. Owner logged in securely

**Why OTP?**
- No password storage
- Phishing-resistant
- Easy to use

---

## 💾 Database Schema

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2),
  unit VARCHAR(50),
  stock INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'Pending',
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10, 2),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## 🚀 Deployment

### Frontend (GitHub Pages)
```bash
git add .
git commit -m "Update"
git push origin main
```
Auto-deploys to: https://abhishekms786.github.io/poultry-system/

### Backend (Render)
1. Go to Render.com Dashboard
2. Create new Web Service
3. Connect GitHub repo
4. Set .env variables
5. Deploy!

---

## 📞 API Endpoints

### Auth
```
POST /api/auth/send-otp
{ email: "farm@example.com" }

POST /api/auth/verify-otp
{ email: "farm@example.com", otp: "123456" }
```

### Products
```
GET  /api/products
POST /api/products
PUT  /api/products/:id
DELETE /api/products/:id
```

### Orders
```
GET  /api/orders
POST /api/orders
PUT  /api/orders/:id
```

---

## 📧 Email Notifications

| Event | Recipient | Type |
|-------|-----------|------|
| Order Placed | Customer | Confirmation |
| Order Confirmed | Customer | Acceptance |
| Order Dispatched | Customer | On the Way |
| Order Delivered | Customer | Delivery Confirmation |
| Cancelled | Customer | Cancellation |

---

## 🐛 Troubleshooting

**Backend not starting?**
```bash
lsof -i :3000
kill -9 <PID>
node index.js
```

**Database error?**
- Check `.env` credentials
- Verify MySQL running

**Emails not sending?**
- Verify Brevo API key
- Check sender email verified in Brevo
- Check spam folder

**Frontend not loading?**
- Ensure backend is running
- Clear browser cache
- Check console (F12)

---

## 📈 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Payment gateway (Razorpay)
- [ ] SMS notifications
- [ ] WhatsApp updates
- [ ] Analytics dashboard
- [ ] Low-stock alerts
- [ ] Multi-location support
- [ ] Loyalty program
- [ ] Delivery tracking

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push & open PR

---

## 📄 License

MIT License — see LICENSE file

---

## 👤 Developer

**Abhishek M S**
- 📧 abhishekms1234.x@gmail.com
- 🐙 [@Abhishekms786](https://github.com/Abhishekms786)
- 💼 [linkedin.com/in/abhishekms786](https://linkedin.com/in/abhishekms786)

## 🏪 Farm Business

**Shiva Murthy Poultry Farm**
- 📍 Choganahalli, Mysuru, Karnataka
- 🐔 ~5,000 bird poultry farm
- 📞 Order via online platform

---

## 🙏 Acknowledgments

- Shiva Murthy Poultry Farm
- Render.com
- Aiven.io
- Brevo
- GitHub
- UptimeRobot

---

**Status:** Production Ready ✅  
**Last Updated:** July 2026
