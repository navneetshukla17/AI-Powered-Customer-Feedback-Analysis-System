const { Resend } = require('resend');
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

const resendApiKey = process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "Customer Feedback Team <onboarding@resend.dev>";

let resend = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
  console.log("Resend.com email client initialized successfully.");
} else {
  console.warn("⚠️ WARNING: RESEND_API_KEY environment variable is missing. Email features will run in Mock Console Mode.");
}

// Helper to determine sentiment tier: positive (4-5), neutral (3), negative (1-2)
function getSentimentTier(rating) {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

// Template definitions
const templates = {
  acknowledgement: {
    positive: {
      subject: "Thank you for your kind words! 🌟",
      html: (email, rating, reviewSnippet, aiResponse) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #22c55e;">You made our day!</h2>
          <p>Hi there,</p>
          <p>Thank you so much for sharing your positive experience. We are thrilled to hear your thoughts!</p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; border-radius: 4px;">
            <strong>Your Review (${rating} ⭐):</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <p><strong>Our Team's Response:</strong></p>
          <p style="color: #475569; line-height: 1.6;">${aiResponse}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    },
    neutral: {
      subject: "Thank you for your feedback",
      html: (email, rating, reviewSnippet, aiResponse) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #d97706;">We value your insights</h2>
          <p>Hi there,</p>
          <p>Thank you for taking the time to share your feedback. We appreciate your honest input as it helps us improve.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #d97706; margin: 20px 0; border-radius: 4px;">
            <strong>Your Review (${rating} ⭐):</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <p><strong>Our Team's Response:</strong></p>
          <p style="color: #475569; line-height: 1.6;">${aiResponse}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    },
    negative: {
      subject: "We hear you — and we're sorry",
      html: (email, rating, reviewSnippet, aiResponse) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #ef4444;">We want to make things right</h2>
          <p>Hi there,</p>
          <p>We are very sorry to hear that your experience did not meet expectations. We take negative feedback seriously and are actively working on resolving the issue.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px;">
            <strong>Your Review (${rating} ⭐):</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <p><strong>Our Team's Response:</strong></p>
          <p style="color: #475569; line-height: 1.6;">${aiResponse}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    }
  },
  tat: {
    positive: {
      subject: "We're on it — here's what to expect",
      html: (email, rating, reviewSnippet, tatDuration) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #3b82f6;">Thank you for your patience</h2>
          <p>Hi there,</p>
          <p>Our team is currently reviewing your review details. We are committed to maintaining high standards and wanted to let you know that we've committed to a resolution timeframe.</p>
          <p><strong>Estimated timeframe for review details:</strong> <span style="font-size: 1.1rem; font-weight: bold; color: #3b82f6;">${tatDuration}</span></p>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>Review quoted:</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    },
    neutral: {
      subject: "We're on it — here's what to expect",
      html: (email, rating, reviewSnippet, tatDuration) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #3b82f6;">Your feedback is under review</h2>
          <p>Hi there,</p>
          <p>We are currently looking into the issues you raised in your review. We expect to complete our assessment shortly.</p>
          <p><strong>Committed turnaround timeline:</strong> <span style="font-size: 1.1rem; font-weight: bold; color: #3b82f6;">${tatDuration}</span></p>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>Review quoted:</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    },
    negative: {
      subject: "We're on it — here's what to expect",
      html: (email, rating, reviewSnippet, tatDuration) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #3b82f6;">We are investigating your concern</h2>
          <p>Hi there,</p>
          <p>We take negative reports very seriously. Our support management has received your feedback and has initiated a detailed review to figure out what happened.</p>
          <p><strong>Committed turnaround time:</strong> <span style="font-size: 1.1rem; font-weight: bold; color: #ef4444;">${tatDuration}</span></p>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>Review quoted:</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <p>We appreciate your patience while we work to resolve this for you.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    }
  },
  resolution: {
    positive: {
      subject: "Your feedback made a difference — here's what changed",
      html: (email, rating, reviewSnippet, resolutionNotes) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #22c55e;">Thank you for helping us grow!</h2>
          <p>Hi there,</p>
          <p>We are writing to let you know that we have reviewed and addressed your feedback. Because of customer reviews like yours, we are continuously improving our service.</p>
          <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; border-radius: 4px;">
            <strong>What we did:</strong><br/>
            <p style="margin-top: 5px; color: #1e3a1e;">${resolutionNotes}</p>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>Your original feedback:</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <p>We invite you to try our service again and experience the improvements firsthand!</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    },
    neutral: {
      subject: "Your feedback made a difference — here's what changed",
      html: (email, rating, reviewSnippet, resolutionNotes) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #22c55e;">Update on your feedback</h2>
          <p>Hi there,</p>
          <p>We wanted to share an update regarding the review you submitted. We have successfully addressed your comments as part of our regular quality improvements.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #475569; margin: 20px 0; border-radius: 4px;">
            <strong>Resolution details:</strong><br/>
            <p style="margin-top: 5px;">${resolutionNotes}</p>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>Your original feedback:</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    },
    negative: {
      subject: "Your feedback made a difference — here's what changed",
      html: (email, rating, reviewSnippet, resolutionNotes) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #22c55e;">We have resolved your issue</h2>
          <p>Hi there,</p>
          <p>First, thank you for holding us accountable. We apologize again for the frustration we caused. We investigated the issue you raised and have implemented changes to prevent it from happening again.</p>
          <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; border-radius: 4px;">
            <strong>Actions taken to resolve this:</strong><br/>
            <p style="margin-top: 5px; color: #14532d;">${resolutionNotes}</p>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>Your original feedback:</strong><br/>
            <p style="font-style: italic; margin-top: 5px;">"${reviewSnippet}"</p>
          </div>
          <p>We hope this demonstrates our commitment to restoring your trust. We hope you will give us another opportunity to serve you.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 0.9rem; color: #64748b;">Best regards,<br/><strong>Customer Feedback Team</strong></p>
        </div>
      `
    }
  }
};

// Main function to send transaction emails
async function sendTransactionalEmail(feedbackId, type, recipientEmail, payloadData) {
  // Fetch feedback item details
  const feedback = db.prepare('SELECT rating, review FROM feedback WHERE id = ?').get(feedbackId);
  if (!feedback) {
    console.error(`Feedback not found for ID: ${feedbackId}. Cannot send email.`);
    return false;
  }

  const sentiment = getSentimentTier(feedback.rating);
  const reviewSnippet = feedback.review.length > 100 ? `${feedback.review.substring(0, 100)}...` : feedback.review;
  const templateConfig = templates[type]?.[sentiment];
  
  if (!templateConfig) {
    console.error(`Invalid email type/sentiment combination: type=${type}, sentiment=${sentiment}`);
    return false;
  }

  const subject = templateConfig.subject;
  const htmlContent = templateConfig.html(recipientEmail, feedback.rating, reviewSnippet, payloadData);
  
  let success = false;
  const sentAt = new Date().toISOString();

  if (resend) {
    try {
      const response = await resend.emails.send({
        from: emailFrom,
        to: recipientEmail,
        subject: subject,
        html: htmlContent
      });

      if (response.error) {
        console.error("Resend API Error details:", response.error);
      } else {
        console.log(`Email successfully dispatched via Resend API to ${recipientEmail}. ID: ${response.data.id}`);
        success = true;
      }
    } catch (error) {
      console.error(`Resend API dispatch failed to ${recipientEmail}:`, error.message);
    }
  } else {
    // Mock sender outputting to logs
    console.log("---------------- MOCK EMAIL OUTBOX ----------------");
    console.log(`FROM: ${emailFrom}`);
    console.log(`TO: ${recipientEmail}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY SNEAK PEEK: ${htmlContent.replace(/<[^>]*>/g, ' ').substring(0, 300).trim()}...`);
    console.log("---------------------------------------------------");
    success = true; // Mark as success in mock environment
  }

  // Log in database
  try {
    const insertStmt = db.prepare(`
      INSERT INTO email_events (id, feedback_id, event_type, sent_at, success)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(uuidv4(), feedbackId, type, sentAt, success ? 1 : 0);
  } catch (dbErr) {
    console.error("Failed to write email event log to SQLite:", dbErr.message);
  }

  return success;
}

module.exports = {
  sendTransactionalEmail
};
