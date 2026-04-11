require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── DATABASE CONNECTION ──────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// ── EMAIL SETUP ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// ── HELPERS ──────────────────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateOrderNumber() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `NKF-${ts}-${rand}`;
}

async function sendOTPEmail(email, otp, name = '') {
  const greeting = name ? `Hello ${name},` : 'Hello,';
  await transporter.sendMail({
    from: `"Naati Koli Farm" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Your OTP for Naati Koli Farm — ${otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e8d5b7;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:40px;">🐔</span>
          <h2 style="color:#7B3F00;margin:8px 0 0;">Naati Koli Farm</h2>
          <p style="color:#6b4c2a;font-size:13px;margin:4px 0;">Mysore, Karnataka</p>
        </div>
        <p style="color:#2c1a00;">${greeting}</p>
        <p style="color:#2c1a00;">Your one-time password (OTP) is:</p>
        <div style="background:#fdf3e0;border:2px solid #f5c842;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
          <span style="font-size:36px;font-weight:bold;color:#7B3F00;letter-spacing:8px;">${otp}</span>
        </div>
        <p style="color:#6b4c2a;font-size:13px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border:none;border-top:1px solid #e8d5b7;margin:20px 0;">
        <p style="color:#6b4c2a;font-size:12px;text-align:center;">
          📞 9900665887 | 8095222673<br>Fresh desi chicken, delivered to your door.
        </p>
      </div>
    `
  });
}

async function verifyToken(req, res, table) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const [rows] = await pool.query(
    `SELECT * FROM ${table} WHERE token = ? AND expires_at > NOW()`, [token]
  );
  return rows.length > 0 ? rows[0] : null;
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
async function ownerAuth(req, res, next) {
  const session = await verifyToken(req, res, 'owner_sessions');
  if (!session) return res.status(401).json({ error: 'Unauthorized. Please login again.' });
  next();
}

async function customerAuth(req, res, next) {
  const session = await verifyToken(req, res, 'customer_sessions');
  if (!session) return res.status(401).json({ error: 'Unauthorized. Please login again.' });
  req.customerId = session.customer_id;
  next();
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

// Send OTP (customer or owner)
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    if (role === 'owner' && email !== process.env.OWNER_EMAIL) {
      return res.status(403).json({ error: 'This email is not authorized as owner.' });
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query('DELETE FROM otps WHERE email = ?', [email]);
    await pool.query('INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expires]);

    let name = '';
    if (role !== 'owner') {
      const [cust] = await pool.query('SELECT name FROM customers WHERE email = ? LIMIT 1', [email]);
      if (cust.length > 0) name = cust[0].name;
    } else {
      name = 'Abhishek';
    }

    await sendOTPEmail(email, otp, name);
    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Check your Gmail config.' });
  }
});

// Verify OTP (customer)
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, phone, address } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0',
      [email, otp]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP.' });

    await pool.query('UPDATE otps SET used = 1 WHERE id = ?', [rows[0].id]);

    let customerId;
    const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      customerId = existing[0].id;
      if (name || phone || address) {
        await pool.query(
          'UPDATE customers SET name = COALESCE(?,name), phone = COALESCE(?,phone), address = COALESCE(?,address) WHERE id = ?',
          [name || null, phone || null, address || null, customerId]
        );
      }
    } else {
      const [result] = await pool.query(
        'INSERT INTO customers (name, email, phone, address, is_guest) VALUES (?, ?, ?, ?, 0)',
        [name || 'Customer', email, phone || '', address || '']
      );
      customerId = result.insertId;
    }

    const token = uuidv4() + '-' + uuidv4();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO customer_sessions (customer_id, token, expires_at) VALUES (?, ?, ?)',
      [customerId, token, expires]
    );

    const [cust] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    res.json({ success: true, token, customer: cust[0] });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error during verification.' });
  }
});

// Owner OTP verify
app.post('/api/owner/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (email !== process.env.OWNER_EMAIL) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0',
      [email, otp]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP.' });

    await pool.query('UPDATE otps SET used = 1 WHERE id = ?', [rows[0].id]);

    const token = uuidv4() + '-' + uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO owner_sessions (token, expires_at) VALUES (?, ?)',
      [token, expires]
    );

    res.json({ success: true, token, owner: { name: 'Abhishek', email } });
  } catch (err) {
    console.error('Owner verify OTP error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PRODUCTS ROUTES
// ════════════════════════════════════════════════════════════════════════════

// Get all products (public)
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// Update product (owner only)
app.put('/api/products/:id', ownerAuth, async (req, res) => {
  try {
    const { price, in_stock, name, description } = req.body;
    await pool.query(
      'UPDATE products SET price = COALESCE(?,price), in_stock = COALESCE(?,in_stock), name = COALESCE(?,name), description = COALESCE(?,description) WHERE id = ?',
      [price ?? null, in_stock ?? null, name ?? null, description ?? null, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, product: updated[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Add new product (owner only)
app.post('/api/products', ownerAuth, async (req, res) => {
  try {
    const { name, name_kn, description, description_kn, price, unit, icon } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required.' });
    const [result] = await pool.query(
      'INSERT INTO products (name, name_kn, description, description_kn, price, unit, icon) VALUES (?,?,?,?,?,?,?)',
      [name, name_kn || '', description || '', description_kn || '', price, unit || 'kg', icon || '🍗']
    );
    const [prod] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.json({ success: true, product: prod[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ORDER ROUTES
// ════════════════════════════════════════════════════════════════════════════

// Place order (guest or logged-in)
app.post('/api/orders', async (req, res) => {
  try {
    const { product_id, quantity, delivery_address, delivery_date, notes,
            guest_name, guest_phone, customer_token } = req.body;

    if (!product_id || !quantity || !delivery_address) {
      return res.status(400).json({ error: 'Product, quantity and address are required.' });
    }

    const [products] = await pool.query('SELECT * FROM products WHERE id = ? AND in_stock = 1', [product_id]);
    if (products.length === 0) return res.status(400).json({ error: 'Product not available.' });

    const product = products[0];
    const total = parseFloat(product.price) * parseFloat(quantity);
    const orderNumber = generateOrderNumber();

    let customerId = null;
    let gName = guest_name;
    let gPhone = guest_phone;

    if (customer_token) {
      const [sessions] = await pool.query(
        'SELECT * FROM customer_sessions WHERE token = ? AND expires_at > NOW()', [customer_token]
      );
      if (sessions.length > 0) {
        customerId = sessions[0].customer_id;
        const [cust] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
        if (cust.length > 0) { gName = cust[0].name; gPhone = cust[0].phone; }
      }
    }

    if (!customerId && (!guest_name || !guest_phone)) {
      return res.status(400).json({ error: 'Name and phone required for guest orders.' });
    }

    const [result] = await pool.query(
      `INSERT INTO orders (order_number, customer_id, guest_name, guest_phone, guest_address,
        product_id, product_name, quantity, unit, price_per_unit, total_amount,
        delivery_address, delivery_date, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orderNumber, customerId, gName, gPhone, delivery_address,
       product_id, product.name, quantity, product.unit, product.price,
       total, delivery_address, delivery_date || null, notes || null]
    );

    const [order] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    res.json({ success: true, order: order[0] });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// Get customer's own orders (logged in only)
app.get('/api/orders/my', customerAuth, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, p.icon FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       WHERE o.customer_id = ? ORDER BY o.created_at DESC`,
      [req.customerId]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// OWNER ROUTES
// ════════════════════════════════════════════════════════════════════════════

// Get all orders
app.get('/api/owner/orders', ownerAuth, async (req, res) => {
  try {
    const { status, date, search } = req.query;
    let q = `SELECT o.*, p.icon,
               COALESCE(c.name, o.guest_name) as customer_name,
               COALESCE(c.phone, o.guest_phone) as customer_phone,
               COALESCE(c.email, '') as customer_email
             FROM orders o
             LEFT JOIN products p ON o.product_id = p.id
             LEFT JOIN customers c ON o.customer_id = c.id
             WHERE 1=1`;
    const params = [];
    if (status) { q += ' AND o.status = ?'; params.push(status); }
    if (date) { q += ' AND DATE(o.created_at) = ?'; params.push(date); }
    if (search) {
      q += ' AND (c.name LIKE ? OR o.guest_name LIKE ? OR o.order_number LIKE ? OR c.phone LIKE ? OR o.guest_phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    q += ' ORDER BY o.created_at DESC';
    const [orders] = await pool.query(q, params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Update order status
app.put('/api/owner/orders/:id', ownerAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    await pool.query(
      'UPDATE orders SET status = COALESCE(?,status), notes = COALESCE(?,notes) WHERE id = ?',
      [status ?? null, notes ?? null, req.params.id]
    );
    const [order] = await pool.query(`
      SELECT o.*, COALESCE(c.name, o.guest_name) as customer_name,
             COALESCE(c.phone, o.guest_phone) as customer_phone
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?`, [req.params.id]);
    res.json({ success: true, order: order[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order.' });
  }
});

// Get all customers
app.get('/api/owner/customers', ownerAuth, async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT c.*,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_spent,
        MAX(o.created_at) as last_order
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id ORDER BY c.created_at DESC
    `);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers.' });
  }
});

// Dashboard stats
app.get('/api/owner/stats', ownerAuth, async (req, res) => {
  try {
    const [[todayOrders]] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE DATE(created_at) = CURDATE()"
    );
    const [[totalOrders]] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE status != 'cancelled'"
    );
    const [[pending]] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
    );
    const [[customers]] = await pool.query("SELECT COUNT(*) as count FROM customers");
    const [recentOrders] = await pool.query(`
      SELECT o.*, COALESCE(c.name, o.guest_name) as customer_name,
             COALESCE(c.phone, o.guest_phone) as customer_phone, p.icon
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC LIMIT 5
    `);
    const [topProducts] = await pool.query(`
      SELECT product_name, COUNT(*) as orders, SUM(total_amount) as revenue
      FROM orders WHERE status != 'cancelled'
      GROUP BY product_name ORDER BY orders DESC
    `);
    res.json({
      today: todayOrders,
      total: totalOrders,
      pending: pending.count,
      customers: customers.count,
      recentOrders,
      topProducts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', farm: 'Naati Koli Farm 🐔' }));

// ── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🐔 Naati Koli Farm server running on port ${PORT}`));
