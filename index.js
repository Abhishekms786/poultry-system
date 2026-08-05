require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));

// Multer: store image in memory (we save binary to MySQL)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'naatikoli',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false },
  connectTimeout: 30000
});

pool.getConnection()
  .then(conn => { console.log('MySQL connected!'); conn.release(); })
  .catch(err => console.error('MySQL connection failed:', err.message));

async function sendEmail(email, subject, htmlContent) {
  const data = JSON.stringify({
    sender: { name: 'Naati Koli Farm', email: process.env.BREVO_SENDER_EMAIL },
    to: [{ email: email }],
    subject: subject,
    htmlContent: htmlContent
  });
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
        else reject(new Error('Brevo error: ' + res.statusCode + ' ' + body));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendOTPEmail(email, otp, name) {
  const greeting = name ? 'Hello ' + name + ',' : 'Hello,';
  const html = '<div style="font-family:Arial,sans-serif;padding:24px;max-width:480px;border:1px solid #e8d5b7;border-radius:12px;"><h2 style="color:#7B3F00;">Naati Koli Farm</h2><p>' + greeting + '</p><p>Your OTP is:</p><div style="background:#fdf3e0;border:2px solid #f5c842;border-radius:10px;padding:20px;text-align:center;"><span style="font-size:36px;font-weight:bold;color:#7B3F00;letter-spacing:8px;">' + otp + '</span></div><p>Valid for <strong>10 minutes</strong>. Do not share.</p><p style="font-size:12px;color:#888;">Naati Koli Farm, Mysore | 9900665887</p></div>';
  return sendEmail(email, 'Your OTP - ' + otp, html);
}

async function sendStatusEmail(email, customerName, orderNumber, status) {
  const statusMap = {
    confirmed: { title: 'Order Confirmed!', msg: 'We have confirmed your order and will process it soon.' },
    out_for_delivery: { title: 'Order On The Way!', msg: 'Our delivery person is on the way to deliver your order.' },
    delivered: { title: 'Order Delivered!', msg: 'Thank you for shopping with us. Enjoy your order!' },
    cancelled: { title: 'Order Cancelled', msg: 'Your order has been cancelled. Contact us for more info.' }
  };
  const info = statusMap[status];
  if (!info || !email) return;
  const html = '<div style="font-family:Arial,sans-serif;padding:24px;max-width:480px;border:1px solid #e8d5b7;border-radius:12px;"><h2 style="color:#7B3F00;">Naati Koli Farm</h2><p>Hello ' + (customerName || 'Customer') + ',</p><h3 style="color:#7B3F00;">' + info.title + '</h3><p>' + info.msg + '</p><p><strong>Order Number:</strong> ' + orderNumber + '</p><p><strong>Status:</strong> ' + status.replace(/_/g,' ').toUpperCase() + '</p><p style="font-size:12px;color:#888;">Naati Koli Farm, Mysore | 9900665887</p></div>';
  return sendEmail(email, 'Order Update - ' + orderNumber, html);
}

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function generateOrderNumber() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3,'0');
  return 'NKF-' + ts + '-' + rand;
}

async function ownerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  const [rows] = await pool.query('SELECT * FROM owner_sessions WHERE token=? AND expires_at>NOW()',[token]);
  if (!rows.length) return res.status(401).json({ error: 'Session expired.' });
  next();
}
async function customerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  const [rows] = await pool.query('SELECT * FROM customer_sessions WHERE token=? AND expires_at>NOW()',[token]);
  if (!rows.length) return res.status(401).json({ error: 'Session expired.' });
  req.customerId = rows[0].customer_id;
  next();
}

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); }
  catch(e) { res.status(500).json({ status: 'error', error: e.message }); }
});

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
    res.json({ success: true, message: 'OTP sent to ' + email });
  } catch(err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP: ' + err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, phone, address } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
    const [rows] = await pool.query('SELECT * FROM otps WHERE email=? AND otp=? AND expires_at>NOW() AND used=0',[email,otp]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query('UPDATE otps SET used=1 WHERE id=?',[rows[0].id]);
    let customerId;
    const [existing] = await pool.query('SELECT id FROM customers WHERE email=?',[email]);
    if (existing.length) {
      customerId = existing[0].id;
      if (name||phone||address)
        await pool.query('UPDATE customers SET name=COALESCE(?,name),phone=COALESCE(?,phone),address=COALESCE(?,address) WHERE id=?',[name||null,phone||null,address||null,customerId]);
    } else {
      const [result] = await pool.query('INSERT INTO customers (name,email,phone,address,is_guest) VALUES (?,?,?,?,0)',[name||'Customer',email,phone||'',address||'']);
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

app.post('/api/owner/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (email !== process.env.OWNER_EMAIL) return res.status(403).json({ error: 'Not authorized.' });
    const [rows] = await pool.query('SELECT * FROM otps WHERE email=? AND otp=? AND expires_at>NOW() AND used=0',[email,otp]);
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

app.get('/api/products', async (req, res) => {
  try {
    // Exclude binary image_data from list — served via /api/products/:id/image
    const [rows] = await pool.query('SELECT id,name,name_kn,description,description_kn,price,unit,icon,in_stock,updated_at,(image_data IS NOT NULL) as has_image FROM products ORDER BY id');
    res.json(rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/products/:id', ownerAuth, async (req, res) => {
  try {
    const { price, in_stock, name, description } = req.body;
    await pool.query('UPDATE products SET price=COALESCE(?,price),in_stock=COALESCE(?,in_stock),name=COALESCE(?,name),description=COALESCE(?,description) WHERE id=?',[price??null,in_stock??null,name??null,description??null,req.params.id]);
    const [updated] = await pool.query('SELECT * FROM products WHERE id=?',[req.params.id]);
    res.json({ success: true, product: updated[0] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', ownerAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, name_kn, description, description_kn, price, unit, icon } = req.body;
    if (!name||!price) return res.status(400).json({ error: 'Name and price required.' });
    // Ensure image columns exist (safe migration)
    try {
      await pool.query('ALTER TABLE products ADD COLUMN image_data LONGBLOB');
      await pool.query('ALTER TABLE products ADD COLUMN image_type VARCHAR(50)');
    } catch(e) { /* columns already exist */ }
    const imageData = req.file ? req.file.buffer : null;
    const imageType = req.file ? req.file.mimetype : null;
    const [result] = await pool.query(
      'INSERT INTO products (name,name_kn,description,description_kn,price,unit,icon,image_data,image_type) VALUES (?,?,?,?,?,?,?,?,?)',
      [name,name_kn||'',description||'',description_kn||'',price,unit||'kg',icon||'🍗',imageData,imageType]
    );
    const [prod] = await pool.query('SELECT id,name,name_kn,description,description_kn,price,unit,icon,in_stock,updated_at,(image_data IS NOT NULL) as has_image FROM products WHERE id=?',[result.insertId]);
    res.json({ success: true, product: prod[0] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// Serve product image
app.get('/api/products/:id/image', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT image_data, image_type FROM products WHERE id=?',[req.params.id]);
    if (!rows.length || !rows[0].image_data) return res.status(404).send('No image');
    res.set('Content-Type', rows[0].image_type || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(rows[0].image_data);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// Delete product
app.delete('/api/products/:id', ownerAuth, async (req, res) => {
  try {
    const [prod] = await pool.query('SELECT name FROM products WHERE id=?',[req.params.id]);
    if (!prod.length) return res.status(404).json({ error: 'Product not found.' });
    await pool.query('DELETE FROM products WHERE id=?',[req.params.id]);
    res.json({ success: true, message: `Product "${prod[0].name}" deleted.` });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { product_id, quantity, delivery_address, delivery_date, notes, guest_name, guest_phone, customer_token } = req.body;
    if (!product_id||!quantity||!delivery_address) return res.status(400).json({ error: 'Product, quantity and address are required.' });
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
    if (!customerId && (!guest_name||!guest_phone)) return res.status(400).json({ error: 'Name and phone required for guest orders.' });
    const [result] = await pool.query('INSERT INTO orders (order_number,customer_id,guest_name,guest_phone,guest_address,product_id,product_name,quantity,unit,price_per_unit,total_amount,delivery_address,delivery_date,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[orderNumber,customerId,gName,gPhone,delivery_address,product_id,product.name,quantity,product.unit,product.price,total,delivery_address,delivery_date||null,notes||null]);
    const [order] = await pool.query('SELECT * FROM orders WHERE id=?',[result.insertId]);
    res.json({ success: true, order: order[0] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders/my', customerAuth, async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT o.*,p.icon FROM orders o LEFT JOIN products p ON o.product_id=p.id WHERE o.customer_id=? ORDER BY o.created_at DESC',[req.customerId]);
    res.json(orders);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/owner/orders', ownerAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let q = 'SELECT o.*,p.icon,COALESCE(c.name,o.guest_name) as customer_name,COALESCE(c.phone,o.guest_phone) as customer_phone,COALESCE(c.email,\'\') as customer_email FROM orders o LEFT JOIN products p ON o.product_id=p.id LEFT JOIN customers c ON o.customer_id=c.id WHERE 1=1';
    const params = [];
    if (status) { q+=' AND o.status=?'; params.push(status); }
    if (search) { q+=' AND (c.name LIKE ? OR o.guest_name LIKE ? OR o.order_number LIKE ? OR c.phone LIKE ? OR o.guest_phone LIKE ?)'; const s='%'+search+'%'; params.push(s,s,s,s,s); }
    q+=' ORDER BY o.created_at DESC';
    const [orders] = await pool.query(q,params);
    res.json(orders);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/owner/orders/:id', ownerAuth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    await pool.query('UPDATE orders SET status=COALESCE(?,status),notes=COALESCE(?,notes) WHERE id=?',[status??null,notes??null,req.params.id]);
    const [order] = await pool.query('SELECT o.*,COALESCE(c.name,o.guest_name) as customer_name,COALESCE(c.phone,o.guest_phone) as customer_phone,COALESCE(c.email,\'\') as customer_email FROM orders o LEFT JOIN customers c ON o.customer_id=c.id WHERE o.id=?',[req.params.id]);
    if (status && order[0] && order[0].customer_email) {
      try {
        await sendStatusEmail(order[0].customer_email, order[0].customer_name, order[0].order_number, status);
        console.log('Status email sent to:', order[0].customer_email);
      } catch(emailErr) {
        console.error('Status email failed:', emailErr.message);
      }
    }
    res.json({ success: true, order: order[0] });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/owner/customers', ownerAuth, async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT c.*,COUNT(o.id) as total_orders,SUM(o.total_amount) as total_spent,MAX(o.created_at) as last_order FROM customers c LEFT JOIN orders o ON c.id=o.customer_id GROUP BY c.id ORDER BY c.created_at DESC');
    res.json(customers);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/owner/stats', ownerAuth, async (req, res) => {
  try {
    const [[todayOrders]] = await pool.query("SELECT COUNT(*) as count,COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE DATE(created_at)=CURDATE()");
    const [[totalOrders]] = await pool.query("SELECT COUNT(*) as count,COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE status!='cancelled'");
    const [[pending]] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status='pending'");
    const [[customers]] = await pool.query("SELECT COUNT(*) as count FROM customers");
    const [recentOrders] = await pool.query('SELECT o.*,COALESCE(c.name,o.guest_name) as customer_name,COALESCE(c.phone,o.guest_phone) as customer_phone,p.icon FROM orders o LEFT JOIN customers c ON o.customer_id=c.id LEFT JOIN products p ON o.product_id=p.id ORDER BY o.created_at DESC LIMIT 5');
    const [topProducts] = await pool.query("SELECT product_name,COUNT(*) as orders,SUM(total_amount) as revenue FROM orders WHERE status!='cancelled' GROUP BY product_name ORDER BY orders DESC");
    res.json({ today:todayOrders, total:totalOrders, pending:pending.count, customers:customers.count, recentOrders, topProducts });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Naati Koli Farm running on port ' + PORT));
