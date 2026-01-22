# 📊 Campaign Pulse Dashboard

A full-stack ad campaign analytics platform that provides real-time performance tracking, campaign insights, and interactive visualizations for digital marketing platforms like Google Ads and Facebook Ads.

Built using React, FastAPI, and MongoDB with secure authentication and live WebSocket-based updates.

---
---

## 🔐 Authentication Flow

1. User registers or logs in
2. Backend generates JWT token
3. Token stored in localStorage
4. Token attached to all API requests
5. Protected routes accessible only to authenticated users

---

## ⚡ Real-Time Updates

- WebSocket connection established on dashboard load
- Backend broadcasts campaign updates every few seconds
- Frontend receives and renders updates instantly
- No page refresh required

---

## 📊 Dashboard Capabilities

- Campaign overview metrics
- Spend, revenue, and ROAS tracking
- Platform-wise analytics
- Live performance feed
- Campaign comparison modal

---

## 🧪 Mock Data Support

If no data exists, the system automatically generates:
- Google Ads campaigns
- Facebook Ads campaigns
- 30 days of performance metrics

This allows full functionality without external APIs.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=campaign_pulse
JWT_SECRET_KEY=your_secret_key
CORS_ORIGINS=*
