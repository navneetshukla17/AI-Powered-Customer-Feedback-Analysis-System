// Load environment variables from parent directory or local
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config(); // fallback to local backend .env if any

// HF_TOKEN is mandatory as per PRD
const hfToken = process.env.HF_TOKEN;
if (!hfToken) {
  console.error("FATAL ERROR: HF_TOKEN environment variable is missing!");
  console.error("Please create a .env file at the project root and add HF_TOKEN=your_hugging_face_token.");
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { db } = require('./db');
const { generateSentimentResponse, generateAdminAnalysis } = require('./ai');
const { sendTransactionalEmail } = require('./email');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Submit customer feedback
app.post('/api/feedback', async (req, res) => {
  const { email, rating, review } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
  }

  if (!review || review.trim().length < 10) {
    return res.status(400).json({ error: "Review must be at least 10 characters long." });
  }

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    // Generate AI response
    const aiResponse = await generateSentimentResponse(numericRating, review);

    // Persist to database
    const stmt = db.prepare(`
      INSERT INTO feedback (id, timestamp, email, rating, review, ai_response, status)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted')
    `);
    stmt.run(id, timestamp, email, numericRating, review, aiResponse);

    // Asynchronously trigger immediate sentiment-aware acknowledgement email
    // Handled in background to avoid blocking client response
    sendTransactionalEmail(id, 'acknowledgement', email, aiResponse)
      .catch(err => console.error("Immediate acknowledgement email failed in background:", err));

    return res.status(201).json({
      id,
      timestamp,
      email,
      rating: numericRating,
      review,
      ai_response: aiResponse,
      status: 'submitted'
    });
  } catch (error) {
    console.error("Error submitting feedback:", error.message);
    return res.status(500).json({ error: "An error occurred while saving your feedback." });
  }
});

// Get all feedback for admin dashboard
app.get('/api/feedback', (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM feedback ORDER BY timestamp DESC').all();
    
    // Parse actions JSON if present
    const parsedRecords = records.map(record => {
      let actions = [];
      if (record.actions) {
        try {
          actions = JSON.parse(record.actions);
        } catch {
          actions = [record.actions];
        }
      }
      return { ...record, actions };
    });

    return res.json(parsedRecords);
  } catch (error) {
    console.error("Error fetching feedback list:", error.message);
    return res.status(500).json({ error: "Failed to load reviews." });
  }
});

// Generate or update AI analysis
app.post('/api/feedback/:id/analysis', async (req, res) => {
  const { id } = req.params;

  try {
    const feedback = db.prepare('SELECT rating, review FROM feedback WHERE id = ?').get(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback item not found." });
    }

    const { summary, actions } = await generateAdminAnalysis(feedback.rating, feedback.review);

    const updateStmt = db.prepare(`
      UPDATE feedback
      SET summary = ?, actions = ?
      WHERE id = ?
    `);
    updateStmt.run(summary, JSON.stringify(actions), id);

    return res.json({ id, summary, actions });
  } catch (error) {
    console.error(`Failed to analyze feedback ${id}:`, error.message);
    return res.status(500).json({ error: "Failed to generate AI analysis." });
  }
});

// Send Turnaround Time (TAT) commitment email
app.post('/api/feedback/:id/tat', async (req, res) => {
  const { id } = req.params;
  const { tat_duration } = req.body;

  if (!tat_duration || tat_duration.trim() === "") {
    return res.status(400).json({ error: "TAT duration text is required." });
  }

  try {
    const feedback = db.prepare('SELECT email, status FROM feedback WHERE id = ?').get(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback item not found." });
    }

    // Trigger TAT email
    const emailSent = await sendTransactionalEmail(id, 'tat', feedback.email, tat_duration);

    // Update status to 'acknowledged' if not already in-progress or resolved
    let newStatus = 'acknowledged';
    if (feedback.status === 'in-progress' || feedback.status === 'resolved') {
      newStatus = feedback.status;
    }

    const tatSentAt = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE feedback
      SET status = ?, tat_sent_at = ?
      WHERE id = ?
    `);
    updateStmt.run(newStatus, tatSentAt, id);

    return res.json({
      id,
      status: newStatus,
      tat_sent_at: tatSentAt,
      email_sent: emailSent
    });
  } catch (error) {
    console.error(`Failed to send TAT commitment for ${id}:`, error.message);
    return res.status(500).json({ error: "Failed to log TAT commitment." });
  }
});

// Resolve feedback and trigger completion email
app.post('/api/feedback/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { resolution_notes } = req.body;

  if (!resolution_notes || resolution_notes.trim().length < 20) {
    return res.status(400).json({ error: "Resolution notes must be at least 20 characters long." });
  }

  try {
    const feedback = db.prepare('SELECT email FROM feedback WHERE id = ?').get(id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback item not found." });
    }

    // Trigger resolution email
    const emailSent = await sendTransactionalEmail(id, 'resolution', feedback.email, resolution_notes);

    const resolvedAt = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE feedback
      SET status = 'resolved', resolved_at = ?, resolution_notes = ?
      WHERE id = ?
    `);
    updateStmt.run(resolvedAt, resolution_notes, id);

    return res.json({
      id,
      status: 'resolved',
      resolved_at: resolvedAt,
      resolution_notes,
      email_sent: emailSent
    });
  } catch (error) {
    console.error(`Failed to resolve feedback ${id}:`, error.message);
    return res.status(500).json({ error: "Failed to resolve feedback item." });
  }
});

// Serve built frontend assets in production if built
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log("Serving compiled React frontend static files.");
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
