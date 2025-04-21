const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(process.env.DATABASE_URL);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create modules table
    db.run(`CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    )`);

    // Create questions table
    db.run(`CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      hint TEXT,
      FOREIGN KEY(module_id) REFERENCES modules(id)
    )`);

    // Create user_progress table
    db.run(`CREATE TABLE IF NOT EXISTS user_progress (
      user_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      score INTEGER,
      last_attempt DATETIME,
      PRIMARY KEY(user_id, module_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(module_id) REFERENCES modules(id)
    )`);
  });
}

module.exports = db;