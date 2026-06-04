const HF_API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2-7B-Instruct";

// Hardcoded fallback responses for user feedback
const getUserFallback = (rating) => {
  if (rating >= 4) {
    return "Thank you so much for your wonderful feedback! We're thrilled to hear you had a great experience with us. We look forward to serving you again!";
  } else if (rating === 3) {
    return "Thank you for your feedback. We appreciate you taking the time to share your experience. We're always working to improve!";
  } else {
    return "We sincerely apologize for not meeting your expectations. Your feedback is invaluable to us, and we're committed to making things right.";
  }
};

// Hardcoded fallback analysis for admin view
const getAdminFallback = (rating) => {
  if (rating >= 4) {
    return {
      summary: `Customer is highly satisfied with the service and experience (rated ${rating}/5)`,
      actions: [
        "Send personalized thank you message to customer",
        "Request permission to use review as testimonial",
        "Analyze what went well to replicate success"
      ]
    };
  } else if (rating === 3) {
    return {
      summary: `Customer had a mixed experience with room for improvement (rated ${rating}/5)`,
      actions: [
        "Contact customer to understand specific pain points",
        "Identify service gaps mentioned in the feedback",
        "Implement improvements in areas of concern"
      ]
    };
  } else {
    return {
      summary: `Customer expressed dissatisfaction with the service experience (rated ${rating}/5)`,
      actions: [
        "Reach out immediately to apologize and resolve issue",
        "Conduct internal investigation into problems raised",
        "Offer compensation to recover customer relationship"
      ]
    };
  }
};

// Generate sentiment-aware reply for customer feedback form
async function generateSentimentResponse(rating, review) {
  const hfToken = process.env.HF_TOKEN || "";
  
  if (!hfToken) {
    console.warn("HF_TOKEN missing. Using hardcoded user feedback fallback response.");
    return getUserFallback(rating);
  }

  let context = "";
  if (rating >= 4) {
    context = "You are responding to positive feedback. Be warm and grateful (2-3 sentences).";
  } else if (rating === 3) {
    context = "You are responding to neutral feedback. Be understanding (2-3 sentences).";
  } else {
    context = "You are responding to negative feedback. Be apologetic and solution-focused (2-3 sentences).";
  }

  const prompt = `${context}\n\nCustomer gave ${rating}/5 stars: "${review}"\n\nYour response:`;

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      }),
      signal: AbortSignal.timeout(15000) // 15s timeout
    });

    if (response.ok) {
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        const text = result[0].generated_text || "";
        const cleanText = text.trim();
        if (cleanText.length > 20) {
          return cleanText;
        }
      }
    }
    throw new Error(`Inference API returned status: ${response.status}`);
  } catch (error) {
    console.error("Error generating AI feedback response:", error.message);
    return getUserFallback(rating);
  }
}

// Generate admin analysis (one-sentence summary + three numbered actions)
async function generateAdminAnalysis(rating, review) {
  const hfToken = process.env.HF_TOKEN || "";
  
  if (!hfToken) {
    console.warn("HF_TOKEN missing. Using hardcoded admin analysis fallback.");
    return getAdminFallback(rating);
  }

  const prompt = `Analyze this customer feedback professionally:

Rating: ${rating}/5 stars
Review: "${review}"

Provide:
1. One sentence summary of the key issue/sentiment
2. Three specific actionable recommendations

Format your response exactly as:
SUMMARY: [one sentence]
ACTION 1: [specific action]
ACTION 2: [specific action]
ACTION 3: [specific action]`;

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      }),
      signal: AbortSignal.timeout(20000) // 20s timeout
    });

    if (response.ok) {
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        const text = (result[0].generated_text || "").trim();
        
        let summary = "";
        const actions = [];
        
        if (text.includes("SUMMARY:")) {
          const summaryPart = text.split("SUMMARY:")[1].split("ACTION")[0].trim();
          summary = summaryPart.split("\n")[0].trim();
        }
        
        for (let i = 1; i <= 3; i++) {
          if (text.includes(`ACTION ${i}:`)) {
            let actionText = text.split(`ACTION ${i}:`)[1];
            if (text.includes(`ACTION ${i + 1}:`)) {
              actionText = actionText.split(`ACTION ${i + 1}:`)[0];
            }
            const action = actionText.trim().split("\n")[0].trim();
            if (action && action.length > 5) {
              actions.push(action);
            }
          }
        }

        if (summary && summary.length > 10 && actions.length >= 2) {
          return { summary, actions };
        }
      }
    }
    throw new Error(`Inference API returned status: ${response.status}`);
  } catch (error) {
    console.error("Error generating AI admin analysis:", error.message);
    return getAdminFallback(rating);
  }
}

module.exports = {
  generateSentimentResponse,
  generateAdminAnalysis
};
