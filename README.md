# Naati Koli Farm — Poultry E-Commerce & Order Management Platform

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)
![Express](https://img.shields.io/badge/Express.js-black?logo=express)
![Brevo](https://img.shields.io/badge/Brevo-Email_API-blue)
![Render](https://img.shields.io/badge/Render-Backend-purple)
![Vercel](https://img.shields.io/badge/Vercel-Frontend-black?logo=vercel)
![Jenkins](https://img.shields.io/badge/Jenkins-CI/CD-orange?logo=jenkins)

A full-stack e-commerce platform designed to manage poultry business operations for **Shiva Murthy Poultry Farm**, Choganahalli, Mysuru. The platform connects farm owners with customers, enabling efficient order management, product catalog management, and real-time order tracking.

---

## 🚀 Live Platform

| Site | URL |
|---|---|
| 🛒 **Customer Storefront** | [poultry-system-ivory.vercel.app](https://poultry-system-ivory.vercel.app) |
| 📊 **Owner Dashboard** | [poultry-system-ivory.vercel.app/owner](https://poultry-system-ivory.vercel.app/owner) |
| 🔧 **Backend API** | [poultry-system-mrqh.onrender.com](https://poultry-system-mrqh.onrender.com) |
| 📁 **GitHub Repository** | [github.com/Abhishekms786/poultry-system](https://github.com/Abhishekms786/poultry-system) |

---

## ✨ Features

### 🛒 For Customers
- Browse live product catalog (Desi Chicken, Eggs, Dressed Chicken, etc.)
- View product images, descriptions, and pricing in multiple units (kg, piece, egg, litre)
- Place orders as a **registered user or guest** (no login required for guests)
- Real-time order status tracking: Pending → Confirmed → On the Way → Delivered
- Email notifications at every order stage
- Bilingual support (English & Kannada)
- Responsive, mobile-first interface

### 📋 For Farm Owners
- Secure **OTP-based email login** (no password needed)
- Add, edit, and delete products from inventory with **image upload support**
- Upload product photos directly from the dashboard — images stored in MySQL
- View and manage all customer orders in real-time
- Update order status with one click (triggers automated customer email)
- Session-based authentication with 24-hour token expiry
- WhatsApp quick-contact button for each customer
- Order search, filter by status, and customer management

### ⚙️ Technical Features
- 5-table MySQL schema: customers, products, orders, OTPs, sessions
- Email-based OTP authentication for both owner and customers (via Brevo API)
- Automated transactional emails at every order lifecycle stage
- Product image upload (stored as LONGBLOB in MySQL, served via REST API)
- Session token management (owner + customer sessions with expiry)
- Guest checkout support (no registration required)
- UptimeRobot monitoring to prevent cold-start delays on Render free tier
- Jenkinsfile for CI/CD pipeline
- Deployed: Frontend on Vercel, Backend on Render

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE (Frontend)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  Customer Storefront │    │    Owner Dashboard       │   │
│  │  (index2.html)       │    │    (index.html)          │   │
│  │  - Browse catalog    │    │  - Manage products       │   │
│  │  - Place orders      │    │  - Upload images         │   │
│  │  - Track status      │    │  - View/update orders    │   │
│  └──────────┬───────────┘    └────────────┬─────────────┘   │
│             └──────────────┬──────────────┘                  │
│          Hosted on Vercel (Static HTML/CSS/JS)               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS REST API Calls
┌──────────────────────────▼──────────────────────────────────┐
│                BACKEND (Node.js + Express)                   │
│  - REST API (products, orders, auth, images)                 │
│  - OTP generation & email via Brevo                          │
│  - Session token management                                  │
│  - Image upload (multer → MySQL LONGBLOB)                    │
│  Deployed on Render                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  DATABASE (MySQL on Aiven)                   │
│  Tables: customers, products, orders, otps,                  │
│          owner_sessions, customer_sessions                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `customers` | Registered customers (name, email, phone, address) |
| `products` | Product catalog with image binary (LONGBLOB), bilingual names |
| `orders` | Full order lifecycle with guest + registered support |
| `otps` | Temporary OTP codes with expiry (10 min) |
| `owner_sessions` | Owner login tokens (24hr expiry) |
| `customer_sessions` | Customer login tokens (7-day expiry) |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/send-otp` | — | Send OTP to customer email |
| POST | `/api/auth/verify-otp` | — | Verify OTP, return session token |
| POST | `/api/owner/verify-otp` | — | Owner OTP login |
| GET | `/api/products` | — | List all products |
| POST | `/api/products` | Owner | Add new product (with image upload) |
| PUT | `/api/products/:id` | Owner | Update price / stock |
| DELETE | `/api/products/:id` | Owner | Delete product |
| GET | `/api/products/:id/image` | — | Serve product image |
| POST | `/api/orders` | — | Place order (guest or registered) |
| GET | `/api/orders/my` | Customer | Get my order history |
| GET | `/api/owner/orders` | Owner | All orders (filter + search) |
| PUT | `/api/owner/orders/:id` | Owner | Update order status |
| GET | `/api/owner/customers` | Owner | All customers with stats |
| GET | `/api/owner/stats` | Owner | Dashboard stats + top products |
| GET | `/api/health` | — | Health check |

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (Aiven cloud) |
| **Email** | Brevo (SMTP API) — OTP + order status notifications |
| **Image Upload** | Multer (memory storage → MySQL LONGBLOB) |
| **Auth** | Email OTP + UUID session tokens |
| **Deployment** | Vercel (frontend), Render (backend) |
| **Monitoring** | UptimeRobot |
| **CI/CD** | Jenkinsfile pipeline |

---

## 📁 Folder Structure

```text
📦 poultry-system
 ┣ 📜 index.js          # Express backend (all API routes, auth, email, image upload)
 ┣ 📜 index.html        # Owner Dashboard (SPA — auth, products, orders, customers)
 ┣ 📜 index2.html       # Customer Storefront (browse, order, track)
 ┣ 📜 db.sql            # MySQL schema and seed products
 ┣ 📜 vercel.json       # Vercel routing config (/ → customer, /owner → dashboard)
 ┣ 📜 render.yaml       # Render deployment config
 ┣ 📜 Jenkinsfile       # Jenkins CI/CD pipeline
 ┣ 📜 package.json      # Node.js dependencies
 ┗ 📂 images/           # Static image assets
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v14+
- MySQL database

### Environment Variables

Create a `.env` file:

```env
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=naatikoli
OWNER_EMAIL=your_owner_email@gmail.com
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
```

### Run Locally

```bash
npm install
npm run dev      # uses nodemon
# OR
npm start        # production
```

### Database Setup

```bash
# Run db.sql once in your MySQL console to create tables and seed products
mysql -u user -p naatikoli < db.sql
```

---

## 🔮 Future Scope

- Push notifications (FCM) for real-time order updates
- Inventory/stock quantity tracking
- Revenue analytics dashboard with charts
- Customer loyalty points system
- Expand to multiple farm locations

---

**Developed by:** Abhishek M S
