import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  MessageSquare, 
  LayoutDashboard, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  X, 
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Mail,
  User,
  Activity,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api' 
  : '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'admin'
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [review, setReview] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Admin Dashboard States
  const [analysisLoading, setAnalysisLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // TAT Modal State
  const [tatModalItem, setTatModalItem] = useState(null);
  const [tatDuration, setTatDuration] = useState('48 hours');
  const [tatSubmitting, setTatSubmitting] = useState(false);

  // Resolve Modal State
  const [resolveModalItem, setResolveModalItem] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  // Fetch feedback records for admin view
  const fetchFeedback = async (showSpinner = true) => {
    if (showSpinner) setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE}/feedback`);
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data);
      } else {
        console.error("Failed to load feedback list.");
      }
    } catch (err) {
      console.error("Error fetching feedback list:", err);
    } finally {
      if (showSpinner) setLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchFeedback();
    }
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFeedback(false);
    setRefreshing(false);
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (review.trim().length < 10) {
      setErrorMsg('Please write a review of at least 10 characters.');
      return;
    }

    setErrorMsg('');
    setSubmittingFeedback(true);

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, rating, review })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissionResult(data);
        // Reset form
        setEmail('');
        setReview('');
        setRating(5);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      setErrorMsg('Server offline or network error. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Generate Admin Analysis
  const handleGenerateAnalysis = async (id) => {
    setAnalysisLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_BASE}/feedback/${id}/analysis`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchFeedback(false);
      } else {
        alert("Failed to generate AI analysis.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalysisLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Handle Send TAT Commitment
  const handleTatSubmit = async (e) => {
    e.preventDefault();
    if (!tatDuration.trim()) return;

    setTatSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/feedback/${tatModalItem.id}/tat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tat_duration: tatDuration })
      });
      if (res.ok) {
        setTatModalItem(null);
        await fetchFeedback(false);
      } else {
        alert("Failed to submit TAT commitment.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTatSubmitting(false);
    }
  };

  // Handle Resolve Commitment
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (resolutionNotes.trim().length < 20) {
      alert("Resolution notes must be at least 20 characters.");
      return;
    }

    setResolveSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/feedback/${resolveModalItem.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: resolutionNotes })
      });
      if (res.ok) {
        setResolveModalItem(null);
        setResolutionNotes('');
        await fetchFeedback(false);
      } else {
        alert("Failed to log resolution details.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolveSubmitting(false);
    }
  };

  // Form validations helper
  const isFormValid = email.includes('@') && review.trim().length >= 10;

  // Analytics Helpers
  const analytics = useMemo(() => {
    if (!feedbackList.length) return { total: 0, avgRating: 0, positivePct: 0, negativePct: 0 };
    const total = feedbackList.length;
    const sum = feedbackList.reduce((acc, row) => acc + row.rating, 0);
    const positive = feedbackList.filter(row => row.rating >= 4).length;
    const negative = feedbackList.filter(row => row.rating <= 2).length;

    return {
      total,
      avgRating: (sum / total).toFixed(1),
      positivePct: Math.round((positive / total) * 100),
      negativePct: Math.round((negative / total) * 100)
    };
  }, [feedbackList]);

  // Charts formatters
  const ratingChartData = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackList.forEach(row => {
      if (counts[row.rating] !== undefined) counts[row.rating]++;
    });
    return Object.keys(counts).map(star => ({
      name: `${star} ★`,
      count: counts[star]
    }));
  }, [feedbackList]);

  const timelineChartData = useMemo(() => {
    const dates = {};
    // Sort oldest first for chart line layout
    const sorted = [...feedbackList].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    sorted.forEach(row => {
      const dateStr = new Date(row.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dates[dateStr] = (dates[dateStr] || 0) + 1;
    });
    return Object.keys(dates).map(date => ({
      date,
      count: dates[date]
    }));
  }, [feedbackList]);

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden">
      
      {/* Sleek Sidebar */}
      <aside className="w-80 bg-slate-900 text-white flex flex-col justify-between shrink-0 border-r border-slate-800 z-10 shadow-xl">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md shadow-indigo-600/30">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide">Customer Feedback</h1>
              <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Powered by AI</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('customer')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'customer' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5" />
                <span>Customer Review Form</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'customer' ? 'opacity-100' : 'opacity-0'}`} />
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'admin' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <LayoutDashboard className="h-5 w-5" />
                <span>Admin Operations</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${activeTab === 'admin' ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          </nav>
        </div>

        {/* Footer App Info */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs uppercase border border-slate-700">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-300 truncate">System Operator</p>
              <p className="text-[10px] text-slate-500 font-medium">Model: Qwen2-7B</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm shrink-0 z-0">
          <div className="flex items-center space-x-3">
            <h2 className="font-bold text-lg text-slate-800">
              {activeTab === 'customer' ? 'Customer portal' : 'Admin Operations Control'}
            </h2>
            {/* <span className="h-4 w-px bg-slate-200"></span> */}
            {/* <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              SQLite Node.js System
            </span> */}
          </div>

          {activeTab === 'admin' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Reload Data'}</span>
            </button>
          )}
        </header>

        {/* Content Body Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">

          {/* CUSTOMER PORTAL TAB */}
          {activeTab === 'customer' && (
            <div className="max-w-2xl mx-auto py-4">
              
              {/* Submission Result Success Card */}
              {submissionResult ? (
                <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl overflow-hidden animate-fadeIn">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                    <div className="bg-white/20 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Feedback Recorded!</h3>
                    <p className="text-emerald-100 text-sm mt-1">
                      A transactional receipt has been successfully dispatched to <span className="font-semibold">{submissionResult.email}</span>.
                    </p>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Review</div>
                      <div className="flex items-center space-x-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${i < submissionResult.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-slate-700 italic bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                        "{submissionResult.review}"
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-6">
                      <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider flex items-center space-x-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        <span>AI Response Output</span>
                      </div>
                      <p className="text-slate-800 text-sm leading-relaxed font-medium">
                        {submissionResult.ai_response}
                      </p>
                    </div>

                    <button
                      onClick={() => setSubmissionResult(null)}
                      className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20"
                    >
                      <span>Submit Another Review</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Main Customer Review Form Card */
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white">
                    <h3 className="text-2xl font-bold">Share Your Experience</h3>
                    <p className="text-indigo-200 text-sm mt-1">We value your review and respond immediately with automated sentiment matching AI.</p>
                  </div>

                  <form onSubmit={handleFeedbackSubmit} className="p-8 space-y-6">
                    {errorMsg && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          placeholder="alex@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-150 text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* Interactive Star Rating Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Rating Score</label>
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center space-x-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(null)}
                              className="focus:outline-none transition-transform duration-100 hover:scale-110 active:scale-95"
                            >
                              <Star
                                className={`h-9 w-9 ${
                                  star <= (hoverRating || rating)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                          {rating === 5 && '😍 Great (5/5)'}
                          {rating === 4 && '😊 Good (4/5)'}
                          {rating === 3 && '😐 Neutral (3/5)'}
                          {rating === 2 && '🙁 Poor (2/5)'}
                          {rating === 1 && '😡 Terribles (1/5)'}
                        </span>
                      </div>
                    </div>

                    {/* Review text area */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="review" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Your Review Details</label>
                        <span className={`text-xs font-medium ${review.trim().length >= 10 ? 'text-slate-400' : 'text-rose-500 font-bold'}`}>
                          {review.trim().length} chars (min 10)
                        </span>
                      </div>
                      <textarea
                        id="review"
                        required
                        rows="5"
                        placeholder="Write at least 10 characters detailing your experience..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all duration-150 text-sm font-medium"
                      ></textarea>
                    </div>

                    {/* Submit action */}
                    <button
                      type="submit"
                      disabled={!isFormValid || submittingFeedback}
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                        isFormValid && !submittingFeedback
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 hover:shadow-indigo-600/30'
                          : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                      }`}
                    >
                      {submittingFeedback ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Generating sentiment response...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit My Feedback</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ADMIN OPERATIONS TAB */}
          {activeTab === 'admin' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Analytics Summary Widget cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Card 1: Total reviews */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reviews</div>
                    <div className="text-2xl font-bold text-slate-800 mt-0.5">{analytics.total}</div>
                  </div>
                </div>

                {/* Card 2: Average Rating */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3.5 bg-amber-50 rounded-xl text-amber-500 shrink-0">
                    <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Rating</div>
                    <div className="text-2xl font-bold text-slate-800 mt-0.5">{analytics.avgRating} <span className="text-sm font-medium text-slate-400">/ 5</span></div>
                  </div>
                </div>

                {/* Card 3: % Positive reviews */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                    <ThumbsUp className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Positive Rate</div>
                    <div className="text-2xl font-bold text-slate-800 mt-0.5">{analytics.positivePct}%</div>
                  </div>
                </div>

                {/* Card 4: % Negative reviews */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3.5 bg-rose-50 rounded-xl text-rose-600 shrink-0">
                    <ThumbsDown className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Negative Rate</div>
                    <div className="text-2xl font-bold text-slate-800 mt-0.5">{analytics.negativePct}%</div>
                  </div>
                </div>
              </div>

              {/* Data Visualization Charts Row */}
              {feedbackList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Rating Distribution Bar Chart */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-6">Rating Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ratingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 650 }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          />
                          <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Submission Timeline Line Chart */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-6">Feedback Submissions Timeline</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 650 }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* RECENT FEEDBACK LIST */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-700 uppercase tracking-wider">Recent Feedback Submissions</h3>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                    {feedbackList.length} reviews loaded
                  </span>
                </div>

                {loadingList ? (
                  /* Loading placeholders skeletons */
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="h-4 w-32 bg-slate-100 rounded"></div>
                          <div className="h-4 w-24 bg-slate-100 rounded"></div>
                        </div>
                        <div className="h-12 bg-slate-50 rounded"></div>
                        <div className="h-4 w-40 bg-slate-100 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : feedbackList.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <AlertCircle className="h-6 w-6 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-lg">No reviews found</h4>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                      Submit feedback using the Customer portal to seed database reviews.
                    </p>
                  </div>
                ) : (
                  feedbackList.map((row) => {
                    const hasAnalysis = row.summary && row.summary !== '';
                    
                    return (
                      <div 
                        key={row.id} 
                        className={`bg-white rounded-2xl border-l-4 shadow-sm border-y border-r border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-md ${
                          row.rating >= 4 ? 'border-l-emerald-500' : (row.rating === 3 ? 'border-l-amber-500' : 'border-l-rose-500')
                        }`}
                      >
                        <div className="p-6 space-y-5">
                          {/* Card header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4.5 w-4.5 ${i < row.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-slate-400">({row.rating}/5)</span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
                                <Mail className="h-3 w-3" />
                                <span className="font-medium text-slate-600">{row.email}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 shrink-0">
                              {/* Custom Badge based on Status */}
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                row.status === 'submitted' ? 'bg-blue-50 border-blue-200 text-blue-600' : 
                                (row.status === 'acknowledged' ? 'bg-amber-50 border-amber-200 text-amber-600' : 
                                (row.status === 'in-progress' ? 'bg-orange-50 border-orange-200 text-orange-600' : 
                                'bg-emerald-50 border-emerald-200 text-emerald-600'))
                              }`}>
                                {row.status}
                              </span>

                              <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(row.timestamp).toLocaleDateString()} {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            </div>
                          </div>

                          {/* Customer feedback review */}
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Review</span>
                            <div className="text-slate-700 text-sm font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                              "{row.review}"
                            </div>
                          </div>

                          {/* AI response inline card */}
                          {row.ai_response && (
                            <div className="space-y-1">
                              <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Immediate AI Response Sent</span>
                              <div className="text-slate-600 text-sm italic bg-indigo-50/20 p-3 rounded-xl border border-indigo-50/50">
                                "{row.ai_response}"
                              </div>
                            </div>
                          )}

                          {/* AI Summary and Action Items Details */}
                          {hasAnalysis ? (
                            <div className="border-t border-slate-100 pt-5 space-y-4">
                              <div className="space-y-1">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Analysis Summary</span>
                                <div className="text-slate-800 text-sm font-bold bg-indigo-50 p-3.5 rounded-xl border-l-4 border-indigo-600">
                                  {row.summary}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended Action Steps</span>
                                <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                                  {row.actions.map((act, i) => (
                                    <li key={i} className="flex items-start space-x-2">
                                      <span className="h-5 w-5 shrink-0 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-500 font-bold mt-0.5">{i+1}</span>
                                      <span className="pt-0.5">{act}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button
                                  onClick={() => handleGenerateAnalysis(row.id)}
                                  disabled={analysisLoading[row.id]}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors duration-150 disabled:opacity-50"
                                >
                                  <RefreshCw className={`h-3 w-3 ${analysisLoading[row.id] ? 'animate-spin' : ''}`} />
                                  <span>{analysisLoading[row.id] ? 'Re-analyzing...' : 'Regenerate Analysis'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold">
                                <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                                <span>No AI Operations Analysis summary generated yet.</span>
                              </div>
                              <button
                                onClick={() => handleGenerateAnalysis(row.id)}
                                disabled={analysisLoading[row.id]}
                                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs shadow transition-all duration-150 flex items-center space-x-1.5"
                              >
                                {analysisLoading[row.id] ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    <span>Analyzing...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Run AI Operations Analysis</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Admin Workflow Options Panel */}
                          <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-3 justify-end items-center">
                            
                            {/* TAT commitment email button */}
                            {(row.status === 'submitted' || row.status === 'acknowledged') && (
                              <button
                                onClick={() => setTatModalItem(row)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold shadow transition-all duration-150 ${
                                  row.tat_sent_at 
                                    ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:shadow-sm'
                                }`}
                                disabled={!!row.tat_sent_at}
                              >
                                {row.tat_sent_at ? 'TAT Sent' : 'Send TAT Commitment'}
                              </button>
                            )}

                            {/* Mark Resolved email button */}
                            {(row.status === 'acknowledged' || row.status === 'in-progress' || row.status === 'submitted') && (
                              <button
                                onClick={() => setResolveModalItem(row)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold shadow transition-all duration-150 ${
                                  row.status === 'resolved'
                                    ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10 hover:shadow-indigo-600/20'
                                }`}
                                disabled={row.status === 'resolved'}
                              >
                                Resolve & Close Loop
                              </button>
                            )}

                            {/* Display TAT Date and Resolution Notes info if resolved */}
                            {row.status === 'resolved' && (
                              <div className="w-full bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60 mt-2 space-y-2 text-xs">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                  <span>Issue Resolved</span>
                                  <span>{new Date(row.resolved_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-600 font-semibold leading-relaxed">
                                  <strong>Resolution Summary:</strong> {row.resolution_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TAT MODAL */}
      {tatModalItem && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-slideUp">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider">TAT Commitment Details</h3>
              <button onClick={() => setTatModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTatSubmit} className="p-6 space-y-4">
              <p className="text-slate-500 text-xs leading-relaxed">
                Commit to a turnaround time (TAT) review phase. This sends an automated response explaining the timeline to <span className="font-bold text-slate-800">{tatModalItem.email}</span>.
              </p>

              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <span className="block font-bold text-slate-400 uppercase tracking-wider">Customer Review snippet</span>
                <p className="text-slate-600 italic">"{tatModalItem.review.length > 80 ? `${tatModalItem.review.substring(0, 80)}...` : tatModalItem.review}"</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tat" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">TAT Duration Text</label>
                <input
                  id="tat"
                  type="text"
                  required
                  placeholder="e.g. 48 hours, 3 business days"
                  value={tatDuration}
                  onChange={(e) => setTatDuration(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTatModalItem(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tatSubmitting || !tatDuration.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase shadow transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {tatSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Dispatch Email</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {resolveModalItem && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-slideUp">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider">Log Issue Resolution Details</h3>
              <button onClick={() => setResolveModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
              <p className="text-slate-500 text-xs leading-relaxed">
                Log the corrective actions taken. This will resolve the review status and send a closure email detailing the fixes to <span className="font-bold text-slate-800">{resolveModalItem.email}</span>.
              </p>

              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <span className="block font-bold text-slate-400 uppercase tracking-wider">Customer Review snippet</span>
                <p className="text-slate-600 italic">"{resolveModalItem.review.length > 80 ? `${resolveModalItem.review.substring(0, 80)}...` : resolveModalItem.review}"</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="notes" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Resolution Notes</label>
                  <span className={`text-[10px] font-bold ${resolutionNotes.trim().length >= 20 ? 'text-slate-400' : 'text-rose-500'}`}>
                    {resolutionNotes.trim().length} chars (min 20)
                  </span>
                </div>
                <textarea
                  id="notes"
                  required
                  rows="4"
                  placeholder="Detail precisely what was done to address and resolve this customer's concerns..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium"
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalItem(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolveSubmitting || resolutionNotes.trim().length < 20}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase shadow transition-all flex items-center justify-center space-x-1.5 text-white ${
                    resolutionNotes.trim().length >= 20 && !resolveSubmitting
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10'
                      : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                  }`}
                >
                  {resolveSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <span>Resolve & Send</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
