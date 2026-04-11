-- =============================================
-- NAATI KOLI FARM — MySQL Database Setup
-- Run this file once in Railway MySQL console
-- =============================================

CREATE DATABASE IF NOT EXISTS naatikoli;
USE naatikoli;

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(15) NOT NULL,
  address TEXT,
  is_guest TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP CODES
CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_kn VARCHAR(100),
  description VARCHAR(255),
  description_kn VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  in_stock TINYINT(1) DEFAULT 1,
  icon VARCHAR(10) DEFAULT '🍗',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT,
  guest_name VARCHAR(100),
  guest_phone VARCHAR(15),
  guest_address TEXT,
  product_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  delivery_date DATE,
  status ENUM('pending','confirmed','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- OWNER SESSIONS
CREATE TABLE IF NOT EXISTS owner_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMER SESSIONS
CREATE TABLE IF NOT EXISTS customer_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- SEED DEFAULT PRODUCTS
INSERT INTO products (name, name_kn, description, description_kn, price, unit, icon) VALUES
('Whole Chicken', 'ಪೂರ್ಣ ಕೋಳಿ', 'Full desi naati koli, cleaned & ready', 'ಶುದ್ಧ ನಾಟಿ ಕೋಳಿ, ತೊಳೆದು ಸಿದ್ಧ', 320.00, 'kg', '🍗'),
('Curry Cut', 'ಕರಿ ತುಂಡು', 'Cut into pieces, perfect for curry', 'ಕರಿಗೆ ಸರಿಯಾದ ತುಂಡುಗಳು', 350.00, 'kg', '🥩'),
('Desi Eggs', 'ನಾಟಿ ಮೊಟ್ಟೆ', 'Fresh naati eggs, rich yolk', 'ತಾಜಾ ನಾಟಿ ಮೊಟ್ಟೆ, ದಪ್ಪ ಹಳದಿ', 12.00, 'egg', '🥚');
