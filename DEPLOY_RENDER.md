# Deploying BreatheEasy to Render

This guide walks you through deploying the BreatheEasy Air Quality Monitoring application on Render.

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **MongoDB Atlas** - You already have this: `mongodb+srv://learningDB:shivam1234@cluster0.xm2akip.mongodb.net/breatheeasy`
4. **OpenAQ API Key** - You already have this

---

## Option 1: One-Click Deploy with Blueprint (Recommended)

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - BreatheEasy Air Quality Monitor"

# Add your GitHub repo as remote
git remote add origin https://github.com/YOUR_USERNAME/breatheeasy.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create all 3 services
5. Click **"Apply"**

### Step 3: Configure Environment Variables

After deployment, go to each service and set the required environment variables:

**For `breatheeasy-backend`:**
| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://learningDB:shivam1234@cluster0.xm2akip.mongodb.net/breatheeasy` |
| `OPENAQ_API_KEY` | `86029db1bf216721fa0fef1e0974bbc773efd7f7493cff3dd2cab75487b0588b` |

> The other variables (`ML_SERVICE_URL`, `FRONTEND_URL`, `JWT_SECRET`) are auto-configured.

---

## Option 2: Manual Deployment (Step by Step)

### Service 1: ML Service (Deploy First)

1. **Render Dashboard** → **New** → **Web Service**
2. Connect GitHub repository
3. Configure:
   - **Name:** `breatheeasy-ml`
   - **Root Directory:** `ml-service`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Click **Create Web Service**
5. Copy the URL (e.g., `https://breatheeasy-ml.onrender.com`)

### Service 2: Backend

1. **New** → **Web Service**
2. Configure:
   - **Name:** `breatheeasy-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | `mongodb+srv://learningDB:shivam1234@cluster0.xm2akip.mongodb.net/breatheeasy` |
   | `OPENAQ_API_KEY` | `86029db1bf216721fa0fef1e0974bbc773efd7f7493cff3dd2cab75487b0588b` |
   | `ML_SERVICE_URL` | `https://breatheeasy-ml.onrender.com` (from Step 1) |
   | `JWT_SECRET` | (any random string) |
4. Click **Create Web Service**
5. Copy the URL (e.g., `https://breatheeasy-backend.onrender.com`)

### Service 3: Frontend

1. **New** → **Static Site**
2. Configure:
   - **Name:** `breatheeasy-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://breatheeasy-backend.onrender.com` (from Step 2) |
4. Click **Create Static Site**

---

## Post-Deployment Setup

### 1. Trigger Initial Data Ingestion

After all services are running, trigger data ingestion:

```bash
curl -X POST https://breatheeasy-backend.onrender.com/api/ingest/trigger
```

Or visit: `https://breatheeasy-backend.onrender.com/api/ingest/trigger`

### 2. Verify Health Endpoints

- **Backend:** `https://breatheeasy-backend.onrender.com/health`
- **ML Service:** `https://breatheeasy-ml.onrender.com/health`
- **Frontend:** `https://breatheeasy-frontend.onrender.com`

### 3. Update CORS (If needed)

If you see CORS errors, update the `FRONTEND_URL` environment variable in the backend service to match your frontend URL.

---

## Service URLs

After deployment, your services will be available at:

| Service | URL |
|---------|-----|
| Frontend | `https://breatheeasy-frontend.onrender.com` |
| Backend API | `https://breatheeasy-backend.onrender.com` |
| ML Service | `https://breatheeasy-ml.onrender.com` |
| API Docs | `https://breatheeasy-ml.onrender.com/docs` |

---

## Troubleshooting

### Build Failures

**Backend:**
- Ensure `tsconfig.json` has `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`
- Check that all TypeScript errors are resolved

**ML Service:**
- Prophet requires additional dependencies. If build fails, try adding to `requirements.txt`:
  ```
  pystan==3.7.0
  cmdstanpy==1.2.0
  ```

**Frontend:**
- Ensure `VITE_API_URL` is set before building

### Connection Issues

- Check that MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allow all IPs)
- Verify all environment variables are correctly set

### Cold Starts

Render free tier services spin down after 15 minutes of inactivity. First request may take 30-60 seconds.

---

## Upgrade to Paid Plan

For production use, consider Render's paid plans:
- **No cold starts**
- **More resources**
- **Custom domains**
- **Auto-scaling**

---

## Need Help?

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
