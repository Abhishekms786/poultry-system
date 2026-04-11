require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));

// ── DATABASE ─────────────────────────────────────────────────────────────────
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 30000
});

// Test DB connection on startup
pool.getConnection()
  .then(conn => { console.log('✅ MySQL connected!'); conn.release(); })
  .catch(err => console.error('❌ MySQL connection failed:', err.message));

// ── EMAIL ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
});

// ── HELPERS ──────────────────────────────────────────────────────────────────
function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function generateOrderNumber() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3,'0');
  return `NKF-${ts}-${rand}`;
}
async function sendOTPEmail(email, otp, name='') {
  const greeting = name ? `Hello ${name},` : 'Hello,';
  await transporter.sendMail({
    from: `"Naati Koli Farm" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Your OTP — ${otp}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e8d5b7;border-radius:12px;">
      <div style="text-align:center;"><span style="font-size:40px;">🐔</span>
      <h2 style="color:#7B3F00;">Naati Koli Farm</h2><p style="color:#6b4c2a;font-size:13px;">Mysore, Karnataka</p></div>
      <p>${greeting}</p><p>Your OTP is:</p>
      <div style="background:#fdf3e0;border:2px solid #f5c842;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
        <span style="font-size:36px;font-weight:bold;color:#7B3F00;letter-spacing:8px;">${otp}</span></div>
      <p style="color:#6b4c2a;font-size:13px;">Valid for <strong>10 minutes</strong>. Do not share.</p>
      <hr style="border:none;border-top:1px solid #e8d5b7;margin:20px 0;">
      <p style="color:#6b4c2a;font-size:12px;text-align:center;">📞 9900665887 | 8095222673</p></div>`
  });
}

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────
async function ownerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  const [rows] = await pool.query('SELECT * FROM owner_sessions WHERE token=? AND expires_at>NOW()',[token]);
  if (!rows.length) return res.status(401).json({ error: 'Session expired. Please login again.' });
  next();
}
async function customerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  const [rows] = await pool.query('SELECT * FROM customer_sessions WHERE token=? AND expires_at>NOW()',[token]);
  if (!rows.length) return res.status(401).json({ error: 'Session expired. Please login again.' });
  req.customerId = rows[0].customer_id;
  next();
}

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', farm: 'Naati Koli Farm 🐔', db: 'connected' });
  } catch(e) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: e.message });
  }
});

// ── SEND OTP ──────────────────────────────────────────────────────────────────
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (role === 'owner' && email !== process.env.OWNER_EMAIL)
      return res.status(403).json({ error: 'This email is not authorized as owner.' });
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10*60*1000);
    await pool.query('DELETE FROM otps WHERE email=?',[email]);
    await pool.query('INSERT INTO otps (email,otp,expires_at) VALUES (?,?,?)',[email,otp,expires]);
    let name = '';
    if (role === 'owner') { name = 'Abhishek'; }
    else {
      const [c] = await pool.query('SELECT name FROM customers WHERE email=? LIMIT 1',[email]);
      if (c.length) name = c[0].name;
    }
    await sendOTPEmail(email, otp, name);
    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch(err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP: ' + err.message });
  }
});

// ── VERIFY OTP (customer) ─────────────────────────────────────────────────────
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, phone, address } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE email=? AND otp=? AND expires_at>NOW() AND used=0',[email,otp]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query('UPDATE otps SET used=1 WHERE id=?',[rows[0].id]);
    let customerId;
    const [existing] = await pool.query('SELECT id FROM customers WHERE email=?',[email]);
    if (existing.length) {
      customerId = existing[0].id;
      if (name||phone||address)
        await pool.query('UPDATE customers SET name=COALESCE(?,name),phone=COALESCE(?,phone),address=COALESCE(?,address) WHERE id=?',
          [name||null,phone||null,address||null,customerId]);
    } else {
      const [result] = await pool.query(
        'INSERT INTO customers (name,email,phone,address,is_guest) VALUES (?,?,?,?,0)',
        [name||'Customer',email,phone||'',address||'']);
      customerId = result.insertId;
    }
    const token = uuidv4()+'-'+uuidv4();
    const expires = new Date(Date.now() + 7*24*60*60*1000);
    await pool.query('INSERT INTO customer_sessions (customer_id,token,expires_at) VALUES (?,?,?)',[customerId,token,expires]);
    const [cust] = await pool.query('SELECT * FROM customers WHERE id=?',[customerId]);
    res.json({ success: true, token, customer: cust[0] });
  } catch(err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// ── VERIFY OTP (owner) ────────────────────────────────────────────────────────
app.post('/api/owner/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (email !== process.env.OWNER_EMAIL) return res.status(403).json({ error: 'Not authorized.' });
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE email=? AND otp=? AND expires_at>NOW() AND used=0',[email,otp]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query('UPDATE otps SET used=1 WHERE id=?',[rows[0].id]);
    const token = uuidv4()+'-'+uuidv4();
    const expires = new Date(Date.now() + 24*60*60*1000);
    await pool.query('INSERT INTO owner_sessions (token,expires_at) VALUES (?,?)',[token,expires]);
    res.json({ success: true, token, owner: { name: 'Abhishek', email } });
  } catch(err) {
    console.error('Owner OTP error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// ── PRODUCTS (public) ─────────────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } catch(err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'Failed to fetch products: ' + err.message });
  }
});

app.put('/api/products/:id', ownerAuth, async (req, res) => {
  try {
    const { price, in_stock, name, description } = req.body;
    await pool.query(
      'UPDATE products SET price=COALESCE(?,price),in_stock=COALESCE(?,in_stock),name=COALESCE(?,name),description=COALESCE(?,description) WHERE id=?',
      [price??null, in_stock??null, name??null, description??null, req.params.id]);
    const [updated] = await pool.query('SELECT * FROM products WHERE id=?',[req.params.id]);
    res.json({ success: true, product: updated[0] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', ownerAuth, async (req, res) => {
  try {
    const { name, name_kn, description, description_kn, price, unit, icon } = req.body;
    if (!name||!price) return res.status(400).json({ error: 'Name and price required.' });
    const [result] = await pool.query(
      'INSERT INTO products (name,name_kn,description,description_kn,price,unit,icon) VALUES (?,?,?,?,?,?,?)',
      [name,name_kn||'',description||'',description_kn||'',price,unit||'kg',icon||'🍗']);
    const [prod] = await pool.query('SELECT * FROM products WHERE id=?',[result.insertId]);
    res.json({ success: true, product: prod[0] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── ORDERS ────────────────────────────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const { product_id, quantity, delivery_address, delivery_date, notes, guest_name, guest_phone, customer_token } = req.body;
    if (!product_id||!quantity||!delivery_address)
      return res.status(400).json({ error: 'Product, quantity and address are required.' });
    const [products] = await pool.query('SELECT * FROM products WHERE id=? AND in_stock=1',[product_id]);
    if (!products.length) return res.status(400).json({ error: 'Product not available.' });
    const product = products[0];
    const total = parseFloat(product.price) * parseFloat(quantity);
    const orderNumber = generateOrderNumber();
    let customerId = null, gName = guest_name, gPhone = guest_phone;
    if (customer_token) {
      const [sessions] = await pool.query('SELECT * FROM customer_sessions WHERE token=? AND expires_at>NOW()',[customer_token]);
      if (sessions.length) {
        customerId = sessions[0].customer_id;
        const [cust] = await pool.query('SELECT * FROM customers WHERE id=?',[customerId]);
        if (cust.length) { gName = cust[0].name; gPhone = cust[0].phone; }
      }
    }
    if (!customerId && (!guest_name||!guest_phone))
      return res.status(400).json({ error: 'Name and phone required for guest orders.' });
    const [result] = await pool.query(
      `INSERT INTO orders (order_number,customer_id,guest_name,guest_phone,guest_address,
        product_id,product_name,quantity,unit,price_per_unit,total_amount,delivery_address,delivery_date,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orderNumber,customerId,gName,gPhone,delivery_address,
       product_id,product.name,quantity,product.unit,product.price,total,delivery_address,delivery_date||null,notes||null]);
    const [order] = await pool.query('SELECT * FROM orders WHERE id=?',[result.insertId]);
    res.json({ success: true, order: order[0] });
  } catch(err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/my', customerAuth, async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT o.*,p.icon FROM orders o LEFT JOIN products p ON o.product_id=p.id WHERE o.customer_id=? ORDER BY o.created_at DESC',
      [req.customerId]);
    res.json(orders);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── OWNER ROUTES ──────────────────────────────────────────────────────────────
app.get('/api/owner/orders', ownerAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let q = `SELECT o.*,p.icon,COALESCE(c.name,o.guest_name) as customer_name,
               COALESCE(c.phone,o.guest_phone) as customer_phone,COALESCE(c.email,'') as customer_email
             FROM orders o LEFT JOIN products p ON o.product_id=p.id LEFT JOIN customers c ON o.customer_id=c.id WHERE 1=1`;
    const params = [];
    if (status) { q+=' AND o.status=?'; params.push(status); }
    if (search) {
      q+=' AND (c.name LIKE ? OR o.guest_name LIKE ? OR o.order_number LIKE ? OR c.phone LIKE ? OR o.guest_phone LIKE ?)';
      const s=`%${search}%`; params.push(s,s,s,s,s);
    }
    q+=' ORDER BY o.created_at DESC';
    const [orders] = await pool.query(q,params);
    res.json(orders);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/owner/orders/:id', ownerAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    await pool.query('UPDATE orders SET status=COALESCE(?,status),notes=COALESCE(?,notes) WHERE id=?',
      [status??null,notes??null,req.params.id]);
    const [order] = await pool.query(
      `SELECT o.*,COALESCE(c.name,o.guest_name) as customer_name,COALESCE(c.phone,o.guest_phone) as customer_phone
       FROM orders o LEFT JOIN customers c ON o.customer_id=c.id WHERE o.id=?`,[req.params.id]);
    res.json({ success: true, order: order[0] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/owner/customers', ownerAuth, async (req, res) => {
  try {
    const [customers] = await pool.query(
      `SELECT c.*,COUNT(o.id) as total_orders,SUM(o.total_amount) as total_spent,MAX(o.created_at) as last_order
       FROM customers c LEFT JOIN orders o ON c.id=o.customer_id GROUP BY c.id ORDER BY c.created_at DESC`);
    res.json(customers);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/owner/stats', ownerAuth, async (req, res) => {
  try {
    const [[todayOrders]] = await pool.query("SELECT COUNT(*) as count,COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE DATE(created_at)=CURDATE()");
    const [[totalOrders]] = await pool.query("SELECT COUNT(*) as count,COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE status!='cancelled'");
    const [[pending]] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status='pending'");
    const [[customers]] = await pool.query("SELECT COUNT(*) as count FROM customers");
    const [recentOrders] = await pool.query(
      `SELECT o.*,COALESCE(c.name,o.guest_name) as customer_name,COALESCE(c.phone,o.guest_phone) as customer_phone,p.icon
       FROM orders o LEFT JOIN customers c ON o.customer_id=c.id LEFT JOIN products p ON o.product_id=p.id
       ORDER BY o.created_at DESC LIMIT 5`);
    const [topProducts] = await pool.query(
      "SELECT product_name,COUNT(*) as orders,SUM(total_amount) as revenue FROM orders WHERE status!='cancelled' GROUP BY product_name ORDER BY orders DESC");
    res.json({ today:todayOrders, total:totalOrders, pending:pending.count, customers:customers.count, recentOrders, topProducts });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🐔 Naati Koli Farm running on port ${PORT}`));
