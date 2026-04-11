# 🐔 Naati Koli Farm — Complete Setup Guide
## Abhishek | Mysore | poultry.mysore@gmail.com

---

## STEP 1 — Get Gmail App Password (5 minutes)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already on)
3. Go to: https://myaccount.google.com/apppasswords
4. Select App: **Mail** | Device: **Other** → type "NaatiKoli"
5. Click **Generate** → copy the 16-character password
6. Save it — you'll need it in Step 3

---

## STEP 2 — Deploy MySQL + Backend on Railway (10 minutes)

1. Go to: https://railway.app → Sign up free (use GitHub login)
2. Click **New Project** → **Deploy from GitHub repo**
   - OR click **New Project** → **Empty Project**
3. Click **+ Add** → **Database** → **MySQL**
4. Wait 30 seconds → click the MySQL service
5. Go to **Connect** tab → copy these values:
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

### Upload your server code:
1. Click **+ Add** → **Empty Service** → name it "naatikoli-server"
2. Go to **Settings** → **Source** → connect your GitHub repo
   - (Upload the `/server` folder contents to a GitHub repo first)
3. OR use Railway CLI:
   ```
   npm install -g @railway/cli
   cd server
   railway login
   railway link
   railway up
   ```

### Set Environment Variables in Railway:
Go to your server service → **Variables** tab → add these:

```
DB_HOST=         (from MySQL MYSQL_HOST)
DB_PORT=         (from MySQL MYSQL_PORT)
DB_USER=         (from MySQL MYSQL_USER)
DB_PASSWORD=     (from MySQL MYSQL_PASSWORD)
DB_NAME=         (from MySQL MYSQL_DATABASE)
GMAIL_USER=      poultry.mysore@gmail.com
GMAIL_APP_PASSWORD= (from Step 1)
OWNER_EMAIL=     poultry.mysore@gmail.com
JWT_SECRET=      naatikoli-mysore-2024-abhishek
PORT=            3000
```

### Run the database setup:
1. In Railway → click MySQL service → **Data** tab → **Query**
2. Paste the entire contents of `db.sql` and run it
3. You should see tables created successfully

### Get your API URL:
- Railway service → **Settings** → **Domains** → Generate domain
- It will look like: `https://naatikoli-server.up.railway.app`

---

## STEP 3 — Update API URL in HTML files (2 minutes)

In **both** `customer/index.html` and `owner/index.html`:

Find this line (near top of `<script>`):
```javascript
const API = 'https://YOUR-RAILWAY-APP.railway.app';
```

Replace with your actual Railway URL:
```javascript
const API = 'https://naatikoli-server.up.railway.app';
```

---

## STEP 4 — Deploy websites on Netlify (5 minutes)

### Customer website:
1. Go to: https://netlify.com → Sign up free
2. Drag and drop the `customer` folder onto Netlify
3. Your customer site is live! (e.g. `naatikoli.netlify.app`)

### Owner dashboard:
1. In Netlify → **Add new site** → drag `owner` folder
2. Your owner dashboard is live! (e.g. `naatikoli-owner.netlify.app`)

---

## STEP 5 — Test everything

1. Open customer site → try ordering as guest ✓
2. Open customer site → login with your email → order → check history ✓
3. Open owner dashboard → login with `poultry.mysore@gmail.com`
4. Check orders appear ✓
5. Update a price → refresh customer site → price changed ✓
6. Toggle egg stock off → refresh customer site → shows Out of Stock ✓

---

## YOUR FILES SUMMARY

```
naatikoli/
├── server/
│   ├── index.js          ← Node.js backend (deploy to Railway)
│   ├── package.json      ← Dependencies
│   ├── db.sql            ← Run this in Railway MySQL once
│   └── .env.example      ← Copy to .env and fill values
├── customer/
│   └── index.html        ← Customer website (deploy to Netlify)
└── owner/
    └── index.html        ← Owner dashboard (deploy to Netlify)
```

---

## FEATURES SUMMARY

### Customer site:
- ✅ Guest ordering (no login needed)
- ✅ Email OTP login
- ✅ Order history (logged in users)
- ✅ English / ಕನ್ನಡ toggle
- ✅ Product listing with live prices
- ✅ WhatsApp order option
- ✅ Tap-to-call buttons

### Owner dashboard:
- ✅ Secure email OTP login
- ✅ Daily stats (orders, revenue, pending)
- ✅ All orders with search & filter
- ✅ Update order status (Pending → Confirmed → On Way → Delivered)
- ✅ WhatsApp customer directly from dashboard
- ✅ Edit product prices
- ✅ Add new products
- ✅ Toggle stock on/off
- ✅ Full customer database
- ✅ Customer order history & total spent

---

## NEED HELP?

Contact railway support: https://help.railway.app
Or message Anthropic Claude for help setting up!

📞 Your numbers: 9900665887 | 8095222673
📧 Your email: poultry.mysore@gmail.com
