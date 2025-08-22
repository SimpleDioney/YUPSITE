const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'ecommerce.db'));

// Criar tabelas
db.serialize(() => {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de produtos
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      photo TEXT,
      price REAL NOT NULL,
      type TEXT CHECK(type IN ('package', 'kg')) NOT NULL,
      unit_value REAL,
      stock REAL DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de pedidos
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      subtotal REAL NOT NULL,  -- Valor total dos produtos sem frete e sem desconto
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      coupon_code TEXT,
      discount_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'pending',
      delivery_address TEXT,
      delivery_status TEXT DEFAULT 'pending',
      delivery_fee REAL DEFAULT 0,
      is_printed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Tabela de itens do pedido
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      product_name TEXT,
      product_photo TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value REAL NOT NULL,
    expires_at DATETIME,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Tabela de categorias
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Tabela de associação entre produtos e categorias (relação N:N)
  db.run(`
    CREATE TABLE IF NOT EXISTS product_categories (
      product_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY (product_id, category_id),
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    )
  `);

  // Tabela de estoque (log de movimentações)
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      type TEXT CHECK(type IN ('add', 'remove')) NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Tabela de banners
  db.run(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      photo TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      type TEXT CHECK(type IN ('normal', 'celular')) DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adiciona a coluna is_printed se ela não existir
  db.all("PRAGMA table_info(orders)", (err, columns) => {
    if (err) {
        console.error("Erro ao obter informações da tabela de pedidos", err);
        return;
    }

    const hasIsPrintedColumn = columns.some(column => column.name === 'is_printed');
    if (!hasIsPrintedColumn) {
        db.run('ALTER TABLE orders ADD COLUMN is_printed BOOLEAN DEFAULT 0', (err) => {
            if (err) {
                console.error("Erro ao adicionar a coluna is_printed na tabela de pedidos", err);
            } else {
                console.log("Coluna is_printed adicionada a tabela de pedidos.");
            }
        });
    }
  });
});

module.exports = db;