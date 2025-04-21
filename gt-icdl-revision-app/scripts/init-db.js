const db = require('../config/database');

const modules = [
  {
    name: 'Computer Essentials',
    description: 'Fundamentals of computer hardware, software, and operating systems'
  },
  {
    name: 'Online Essentials',
    description: 'Internet concepts, web browsing, and online communication'
  },
  {
    name: 'IT Security',
    description: 'Security concepts, safe browsing, and data protection'
  },
  {
    name: 'Documents',
    description: 'Word processing and document creation'
  },
  {
    name: 'Presentations',
    description: 'Creating and delivering effective presentations'
  },
  {
    name: 'Spreadsheets',
    description: 'Data organization, analysis, and visualization'
  }
];

const questions = [
  // Computer Essentials
  {
    module_id: 1,
    question: 'What is the main function of an operating system?',
    answer: 'To manage hardware resources and provide common services for computer programs',
    hint: "Think about what allows applications to run on your computer"
  },
  {
    module_id: 1,
    question: 'What does RAM stand for?',
    answer: 'Random Access Memory',
    hint: "It's a type of computer memory"
  },
  
  // Online Essentials
  {
    module_id: 2,
    question: 'What does URL stand for?',
    answer: 'Uniform Resource Locator',
    hint: "It's what you type in the browser address bar"
  },
  {
    module_id: 2,
    question: 'What is the purpose of a web browser?',
    answer: 'To access and display web pages on the internet',
    hint: "Think about applications like Chrome or Firefox"
  },
  
  // IT Security
  {
    module_id: 3,
    question: 'What is a strong password characteristic?',
    answer: 'At least 12 characters long, with a mix of letters, numbers, and symbols',
    hint: "Think about what makes a password hard to guess"
  },
  {
    module_id: 3,
    question: 'What is two-factor authentication?',
    answer: 'A security process that requires two different forms of identification',
    hint: "Think about using both a password and a code sent to your phone"
  }
];

// Initialize database
db.serialize(() => {
  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT
  )`, (err) => {
    if (err) throw err;
    
    db.run(`CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      hint TEXT,
      FOREIGN KEY(module_id) REFERENCES modules(id)
    )`, (err) => {
      if (err) throw err;

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) throw err;

        db.run(`CREATE TABLE IF NOT EXISTS user_progress (
          user_id INTEGER NOT NULL,
          module_id INTEGER NOT NULL,
          score INTEGER,
          last_attempt DATETIME,
          PRIMARY KEY(user_id, module_id),
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(module_id) REFERENCES modules(id)
        )`, (err) => {
          if (err) throw err;

          // Insert modules
          const moduleStmt = db.prepare(`INSERT OR IGNORE INTO modules (name, description) VALUES (?, ?)`);
          modules.forEach(module => {
            moduleStmt.run(module.name, module.description);
          });
          moduleStmt.finalize();

          // Insert questions
          const questionStmt = db.prepare(`INSERT OR IGNORE INTO questions (module_id, question, answer, hint) VALUES (?, ?, ?, ?)`);
          questions.forEach(question => {
            questionStmt.run(question.module_id, question.question, question.answer, question.hint);
          });
          questionStmt.finalize();

          console.log('Database initialized with sample data');
          db.close();
        });
      });
    });
  });
});