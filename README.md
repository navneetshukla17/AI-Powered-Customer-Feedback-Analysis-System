# 🤖 AI-Powered Customer Feedback Analysis System

[![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/)
[![Plotly](https://img.shields.io/badge/Plotly-3F4F75?style=for-the-badge&logo=plotly&logoColor=white)](https://plotly.com/)

> **Production-ready feedback management system powered by Qwen-2 7B LLM**  
> Automatically generates contextual responses to customer reviews and provides actionable business insights through advanced analytics.

[🚀 Live Demo](https://llm-powered-customer-feedback-system-navneet-shukla.streamlit.app/) | [📊 Admin Dashboard](#admin-dashboard) | [📖 Documentation](#features)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Demo Screenshots](#demo-screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Technology Stack](#technology-stack)
- [API Integration](#api-integration)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Connect](#connect)

---

## 🎯 Overview

This intelligent feedback management platform revolutionizes customer service by leveraging Large Language Models (LLMs) to automate response generation and extract actionable insights from customer feedback. The system provides a dual-dashboard approach:

- **Customer Portal**: Beautiful, intuitive interface for submitting feedback with instant AI-generated responses
- **Admin Dashboard**: Comprehensive analytics and insights with automated action recommendations

### Why This Project?

- ⚡ **Instant Response**: Customers receive personalized responses in seconds
- 🎯 **Sentiment-Aware**: AI adjusts tone based on rating (positive/neutral/negative)
- 📊 **Data-Driven**: Real-time analytics help identify trends and improvement areas
- 🤖 **AI-Powered Insights**: Automated analysis generates actionable recommendations
- 💼 **Production-Ready**: Built with scalability and deployment in mind

---

## ✨ Key Features

### Customer Dashboard
- 🌟 **Interactive Star Rating**: Intuitive 1-5 star rating system
- 📝 **Rich Text Feedback**: Detailed review submission with character counter
- 🤖 **Instant AI Response**: Context-aware responses generated using Qwen-2 7B
- 🎨 **Modern UI/UX**: Gradient design with smooth animations and responsive layout
- ✅ **Real-time Validation**: Ensures quality feedback before submission

### Admin Dashboard
- 📊 **Analytics Overview**: 
  - Total reviews count
  - Average rating with trend indicators
  - Positive/negative sentiment distribution
  - Response rate metrics

- 📈 **Visual Analytics**:
  - Rating distribution bar chart
  - Timeline chart showing feedback trends
  - Color-coded sentiment indicators

- 🔍 **AI-Powered Analysis**:
  - One-sentence summary of key issues
  - Three specific actionable recommendations
  - Automated sentiment classification
  - Regenerate analysis capability

- 💡 **Smart Insights**:
  - Identifies patterns in customer feedback
  - Prioritizes action items by urgency
  - Highlights positive trends for reinforcement

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                     │
├──────────────────────┬──────────────────────────────────────┤
│  Customer Dashboard  │        Admin Dashboard               │
│  - Rating Input      │  - Analytics Metrics                 │
│  - Review Form       │  - Visual Charts                     │
│  - AI Response View  │  - Feedback Management               │
└──────────────┬───────┴──────────────┬───────────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  - Streamlit Framework                                       │
│  - Session State Management                                  │
│  - Data Processing (Pandas)                                  │
│  - Visualization (Plotly)                                    │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI/ML LAYER                             │
│  - Hugging Face Inference API                                │
│  - Qwen-2 7B Instruct Model                                  │
│  - Context-Aware Prompt Engineering                          │
│  - Sentiment Analysis                                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  - CSV-based Storage (feedback_data.csv)                     │
│  - Structured Data Schema                                    │
│  - CRUD Operations                                           │
└─────────────────────────────────────────────────────────────┘
```

---
## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager
- Hugging Face API token ([Get one here](https://huggingface.co/settings/tokens))

### Local Setup

1. **Clone the repository**
```bash
git clone https://github.com/navneetshukla17/LLM-powered-customer-feedback-system.git
cd LLM-powered-customer-feedback-system
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure secrets**

Create `.streamlit/secrets.toml`:
```toml
HF_TOKEN = "your_huggingface_token_here"
```

5. **Run the application**

For Customer Dashboard:
```bash
streamlit run user_dashboard.py
```

For Admin Dashboard:
```bash
streamlit run admin_dashboard.py
```

---

## 💻 Usage

### Customer Workflow

1. **Visit the Customer Dashboard**
2. **Select Rating**: Choose 1-5 stars based on experience
3. **Write Review**: Provide detailed feedback (minimum 10 characters)
4. **Submit**: Click "Submit Feedback" button
5. **Receive Response**: Get instant AI-generated personalized response

### Admin Workflow

1. **Access Admin Dashboard**
2. **View Analytics**: Monitor overall metrics and trends
3. **Review Feedback**: Browse through submitted reviews
4. **Generate Analysis**: Click "Generate AI Analysis" for insights
5. **Take Action**: Follow AI-recommended action items

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend** | Streamlit | Interactive web interface |
| **Language** | Python 3.8+ | Core application logic |
| **Data Processing** | Pandas | Data manipulation and storage |
| **Visualization** | Plotly | Interactive charts and graphs |
| **AI/ML** | Qwen-2 7B (HF API) | LLM for text generation |
| **Styling** | Custom CSS | Modern gradient UI |
| **Deployment** | Streamlit Cloud | Cloud hosting |

### Dependencies

```txt
streamlit==1.39.0      # Web framework
pandas==2.2.3          # Data manipulation
plotly==5.24.1         # Interactive visualizations
requests==2.31.0       # HTTP requests for API calls
```

---

## 🔌 API Integration

### Hugging Face Inference API

The system uses the Hugging Face Inference API to access the Qwen-2 7B Instruct model:

```python
HF_API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2-7B-Instruct"

# Example API call
response = requests.post(
    HF_API_URL,
    headers={"Authorization": f"Bearer {HF_TOKEN}"},
    json={
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 100,
            "temperature": 0.7,
            "top_p": 0.9,
            "return_full_text": False
        }
    }
)
```

### Response Generation Logic

The system implements intelligent context-aware prompting:

- **Positive Feedback (4-5 stars)**: Warm, grateful tone
- **Neutral Feedback (3 stars)**: Understanding, improvement-focused
- **Negative Feedback (1-2 stars)**: Apologetic, solution-oriented

---

## 🌐 Deployment

### Streamlit Cloud Deployment

1. **Push to GitHub**
```bash
git add .
git commit -m "Deploy feedback system"
git push origin main
```

2. **Deploy on Streamlit Cloud**
   - Visit [share.streamlit.io](https://share.streamlit.io)
   - Connect your GitHub repository
   - Select `user_dashboard.py` as main file
   - Add HF_TOKEN in secrets
   - Deploy!

3. **Deploy Admin Dashboard**
   - Create second app
   - Select `admin_dashboard.py` as main file
   - Use same secrets configuration

### Environment Variables

Required secrets in Streamlit Cloud:
```toml
HF_TOKEN = "your_huggingface_api_token"
```

---

## 📊 Data Schema

### CSV Structure

```python
{
    'id': int,              # Unique identifier (timestamp-based)
    'timestamp': str,       # ISO format datetime
    'rating': int,          # 1-5 star rating
    'review': str,          # Customer feedback text
    'ai_response': str,     # Generated AI response
    'summary': str,         # AI-generated summary (admin)
    'actions': str          # JSON array of action items
}
```

---

## 🔮 Future Enhancements

### Planned Features

- [ ] **Multi-language Support**: Automatic translation for global customers
- [ ] **Email Notifications**: Alert admins for negative feedback
- [ ] **Database Integration**: PostgreSQL/MongoDB for persistent storage
- [ ] **Advanced Analytics**: 
  - Word cloud from reviews
  - Sentiment trend prediction
  - Topic modeling
- [ ] **Export Functionality**: Download reports as PDF/Excel
- [ ] **User Authentication**: Role-based access control
- [ ] **API Endpoints**: RESTful API for integration
- [ ] **Mobile App**: React Native companion app
- [ ] **Webhook Integration**: Connect with CRM systems
- [ ] **A/B Testing**: Test different AI response strategies

### Performance Optimizations

- [ ] Implement caching for repeated queries
- [ ] Add rate limiting and request queuing
- [ ] Optimize database queries
- [ ] Add CDN for static assets

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/AmazingFeature
```
3. **Commit your changes**
```bash
git commit -m 'Add some AmazingFeature'
```
4. **Push to the branch**
```bash
git push origin feature/AmazingFeature
```
5. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 style guide
- Add docstrings to functions
- Update README for new features
- Test thoroughly before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Connect

**Navneet Shukla**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/navneetshukla17)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/navneet-shukla17/)

---

## 🙏 Acknowledgments

- **Qwen Team** for the powerful LLM
- **Hugging Face** for accessible AI infrastructure
- **Streamlit** for the amazing framework
- **Community** for feedback and support

---

## 📈 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/navneetshukla17/LLM-powered-customer-feedback-system?style=social)
![GitHub Forks](https://img.shields.io/github/forks/navneetshukla17/LLM-powered-customer-feedback-system?style=social)
![GitHub Issues](https://img.shields.io/github/issues/navneetshukla17/LLM-powered-customer-feedback-system)

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ By Navneet Shukla**

</div>
