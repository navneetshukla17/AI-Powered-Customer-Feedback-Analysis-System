const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'feedback.db');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

// Initialize schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      email TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review TEXT NOT NULL,
      ai_response TEXT,
      summary TEXT,
      actions TEXT,
      status TEXT CHECK(status IN ('submitted', 'acknowledged', 'in-progress', 'resolved')) DEFAULT 'submitted',
      tat_sent_at TEXT,
      resolved_at TEXT,
      resolution_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS email_events (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL,
      event_type TEXT CHECK(event_type IN ('acknowledgement', 'tat', 'resolution')) NOT NULL,
      sent_at TEXT NOT NULL,
      success INTEGER NOT NULL,
      FOREIGN KEY (feedback_id) REFERENCES feedback (id)
    );
  `);
  
  console.log('SQLite database tables initialized successfully.');
}

// Migrate from CSV to SQLite if table is empty
function migrateFromCsv() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM feedback').get();
  if (countRow.count > 0) {
    console.log('Feedback table already populated. Skipping CSV migration.');
    return;
  }

  const csvPath = path.join(__dirname, '..', 'feedback_data.csv');
  if (!fs.existsSync(csvPath)) {
    console.log('No feedback_data.csv found. Skipping migration.');
    return;
  }

  console.log(`Found feedback_data.csv at ${csvPath}. Migrating to SQLite...`);
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    if (lines.length <= 1) return; // Only header or empty

    // Simple CSV parser that handles quoted strings with commas and newlines
    const parseCsvLine = (text) => {
      let p = 0;
      const parts = [];
      while (p < text.length) {
        if (text[p] === '"') {
          let end = p + 1;
          while (end < text.length) {
            if (text[end] === '"') {
              if (end + 1 < text.length && text[end + 1] === '"') {
                // Escaped quote ""
                end += 2;
              } else {
                break;
              }
            } else {
              end++;
            }
          }
          let val = text.substring(p + 1, end);
          val = val.replace(/""/g, '"');
          parts.push(val);
          p = end + 1;
          if (p < text.length && text[p] === ',') p++;
        } else {
          let end = p;
          while (end < text.length && text[end] !== ',') {
            end++;
          }
          parts.push(text.substring(p, end));
          p = end + 1;
        }
      }
      return parts;
    };

    const header = parseCsvLine(lines[0]);
    
    // Schema index lookup
    const idIdx = header.indexOf('id');
    const tsIdx = header.indexOf('timestamp');
    const ratingIdx = header.indexOf('rating');
    const reviewIdx = header.indexOf('review');
    const aiRespIdx = header.indexOf('ai_response');
    const summaryIdx = header.indexOf('summary');
    const actionsIdx = header.indexOf('actions');

    const insertStmt = db.prepare(`
      INSERT INTO feedback (id, timestamp, email, rating, review, ai_response, summary, actions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((rows) => {
      for (const rowData of rows) {
        if (!rowData || rowData.length === 0) continue;
        const id = rowData[idIdx] || uuidv4();
        const timestamp = rowData[tsIdx] || new Date().toISOString();
        const rating = parseInt(rowData[ratingIdx] || '5', 10);
        const review = rowData[reviewIdx] || '';
        const aiResponse = rowData[aiRespIdx] || '';
        const summary = rowData[summaryIdx] || '';
        const actions = rowData[actionsIdx] || '';
        
        // Since CSV didn't have email or status, we generate defaults
        const email = 'customer@example.com';
        
        // Determine status based on presence of summary/actions or resolved status
        let status = 'submitted';
        if (summary) {
          status = 'acknowledged';
        }

        // feedback ID must be a UUID format. Generate a new one if it is numeric
        let finalId = id;
        if (/^\d+$/.test(id)) {
          finalId = uuidv4();
        }

        insertStmt.run(finalId, timestamp, email, rating, review, aiResponse, summary, actions, status);
      }
    });

    // Parse full content including potential multi-line records
    // Standard CSV parse fallback for simple rows
    const rowsToMigrate = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parsed = parseCsvLine(line);
      if (parsed.length >= header.length) {
        rowsToMigrate.push(parsed);
      }
    }

    transaction(rowsToMigrate);
    console.log(`Successfully migrated ${rowsToMigrate.length} records to SQLite.`);
  } catch (err) {
    console.error('Error during CSV migration to SQLite:', err);
  }
}

// Initialize database
initSchema();
migrateFromCsv();

module.exports = {
  db,
  dbPath
};
