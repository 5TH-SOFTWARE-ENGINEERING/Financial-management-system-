# Quick Start: Deploy to Render.com

## 🚀 Fastest Way (Using Blueprint)

1. **Push your code to GitHub** (make sure these files are in your repo):
   - `render.yaml` (in root)
   - `backend/Dockerfile`
   - `frontend/Dockerfile`

2. **Go to Render.com** → Dashboard → New → **Blueprint**

3. **Connect your GitHub repository**

4. **Render will automatically:**
   - Create PostgreSQL database
   - Create Redis instance
   - Deploy backend service
   - Deploy frontend service

5. **After deployment, configure these environment variables:**

   **Backend Service** (`finance-backend`):
   ```
   ALLOWED_ORIGINS=https://finance-frontend.onrender.com
   ALLOWED_HOSTS=finance-backend.onrender.com
   ```

   **Frontend Service** (`finance-frontend`):
   ```
   NEXT_PUBLIC_API_URL=https://finance-backend.onrender.com/api/v1
   ```

6. **Redeploy both services** after setting environment variables

## 📝 Step-by-Step Manual Setup

### 1. Create Database
- New → PostgreSQL
- Name: `finance-db`
- Database: `finance_db`
- User: `finance_user`

### 2. Create Redis (Optional)
- New → Redis
- Name: `finance-redis`

### 3. Deploy Backend
- New → Web Service
- Connect repo
- Settings:
  - Name: `finance-backend`
  - Root Directory: `backend`
  - Environment: `Docker`
  - Dockerfile Path: `Dockerfile`
  - Docker Context: `backend`
- Environment Variables:
  - `DATABASE_URL` → Link to `finance-db` (Internal URL)
  - `SECRET_KEY` → Generate random string
  - `ALLOWED_ORIGINS` → Your frontend URL (set after frontend deploys)
  - `ALLOWED_HOSTS` → `finance-backend.onrender.com`
  - `REDIS_URL` → Link to `finance-redis` (if created)

### 4. Deploy Frontend
- New → Web Service
- Connect repo
- Settings:
  - Name: `finance-frontend`
  - Root Directory: `frontend`
  - Environment: `Docker`
  - Dockerfile Path: `Dockerfile`
  - Docker Context: `frontend`
- Environment Variables:
  - `NEXT_PUBLIC_API_URL` → `https://finance-backend.onrender.com/api/v1`
  - `NODE_ENV` → `production`

### 5. Update Backend CORS
After frontend is deployed, update backend's `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://finance-frontend.onrender.com
```

## ✅ Verify Deployment

- Backend: `https://finance-backend.onrender.com/health`
- API Docs: `https://finance-backend.onrender.com/docs`
- Frontend: `https://finance-frontend.onrender.com`

## 🔑 Generate SECRET_KEY

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## ⚠️ Important Notes

- Services on free tier spin down after 15 min of inactivity
- First request after spin-down may be slow
- Database free tier expires after 90 days
- For production, upgrade to paid plans

## 🆘 Troubleshooting

**Backend won't start:**
- Check `DATABASE_URL` is correct (use Internal URL)
- Check logs in Render dashboard
- Verify health endpoint: `/health`

**Frontend can't connect to backend:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Check backend `ALLOWED_ORIGINS` includes frontend URL
- Check CORS settings

**Database connection errors:**
- Use Internal Database URL (not External)
- Verify database is running
- Check database credentials

For detailed instructions, see `DEPLOYMENT.md`

