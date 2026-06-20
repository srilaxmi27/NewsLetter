const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const initDB = async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../config/init.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Database initialized and seeded successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
};

module.exports = initDB;
