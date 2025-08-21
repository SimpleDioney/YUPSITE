const db = require('../database/db');

// Create brands table and add brand_id and preparation_instructions to products
db.serialize(() => {
  // Create brands table
  db.run(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add preparation_instructions column to products table
  db.run(`
    ALTER TABLE products 
    ADD COLUMN preparation_instructions TEXT
  `);

  // Add brand_id column to products table
  db.run(`
    ALTER TABLE products 
    ADD COLUMN brand_id INTEGER REFERENCES brands(id)
  `);

  console.log('Migration completed successfully!');
});
