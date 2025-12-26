# 🌬️ BreatheEasy — Real-Time Air Quality Heatmap + 24-Hour AQI Predictor

A production-ready full-stack application for monitoring air quality in real-time with ML-powered 24-hour forecasting.

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BREATHE EASY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Frontend   │────▶│   Backend    │────▶│  ML Service  │                │
│  │  React+Vite  │◀────│  Express/TS  │◀────│   FastAPI    │                │
│  │  :3000       │     │  :5000       │     │   :8000      │                │
│  └──────────────┘     └──────┬───────┘     └──────────────┘                │
│                              │                                              │
│                              ▼                                              │
│                       ┌──────────────┐     ┌──────────────┐                │
│                       │   MongoDB    │     │   OpenAQ     │                │
│                       │   :27017     │◀────│   API        │                │
│                       └──────────────┘     └──────────────┘                │
│                              ▲                    ▲                         │
│                              │                    │                         │
│                       ┌──────┴───────┐            │                         │
│                       │  Cron Job    │────────────┘                         │
│                       │  (10 min)    │                                      │
│                       └──────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
breathe-easy/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Heatmap.jsx
│   │   │   ├── ForecastModal.jsx
│   │   │   ├── SearchBox.jsx
│   │   │   ├── AQILegend.jsx
│   │   │   ├── TimeSlider.jsx
│   │   │   └── AlertCard.jsx
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── Dockerfile
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── jobs/
│   │   ├── types/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── ml-service/                  # Python + FastAPI + Prophet
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.10+ (for ML service local development)
- MongoDB (or use Docker)

### 1. Clone and Setup Environment

```bash
# Clone the repository
cd breathe-easy

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
```

### 2. Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000
- **MongoDB**: localhost:27017

## 🔧 Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### ML Service
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 📡 API Documentation

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/heatmap` | Get GeoJSON of current AQI readings |
| GET | `/api/predictions/:locationId` | Get 24-hour forecast for location |
| GET | `/api/search?q=city` | Search for cities/coordinates |
| POST | `/api/push/subscribe` | Register for push notifications |
| POST | `/api/ingest` | Trigger data ingestion (internal) |
| GET | `/api/alerts` | Get active alerts |
| POST | `/api/alerts` | Create new alert |

### ML Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/train` | Train Prophet model |
| POST | `/forecast` | Get 24-hour AQI forecast |

### Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## 🎨 AQI Color Scale

| AQI Range | Color | Health Category |
|-----------|-------|-----------------|
| 0-50 | 🟢 Green | Good |
| 51-100 | 🟡 Yellow | Moderate |
| 101-150 | 🟠 Orange | Unhealthy for Sensitive Groups |
| 151-200 | 🔴 Red | Unhealthy |
| 201-300 | 🟣 Purple | Very Unhealthy |
| 300+ | 🟤 Maroon | Hazardous |

## 🔐 Environment Variables

```env
# Backend
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/breatheeasy
ML_SERVICE_URL=http://ml-service:8000
OPENAQ_API_KEY=your_openaq_api_key
JWT_SECRET=your_jwt_secret
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Frontend
VITE_API_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=your_mapbox_token

# ML Service
MONGODB_URI=mongodb://mongodb:27017/breatheeasy
```

## 📊 Database Schema

### Collections

- **locations**: Geographic locations with geo-indexing
- **sensors**: Air quality monitoring sensors
- **aq_readings**: Time-series AQI measurements
- **predictions**: ML model predictions
- **users**: User accounts for alerts
- **alerts**: Threshold-based notifications

## 🐳 Docker Deployment

```bash
# Production build
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild specific service
docker-compose up -d --build backend
```

## ☁️ Cloud Deployment

### Frontend (Vercel/Netlify)
1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables

### Backend (Railway/Render/AWS)
1. Use the Dockerfile
2. Set environment variables
3. Expose port 5000

### ML Service (Railway/Render/AWS)
1. Use the Dockerfile
2. Set environment variables
3. Expose port 8000

## 📝 License

MIT License - feel free to use for any purpose.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
