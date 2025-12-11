# Deployment Guide for Render.com

This guide will help you deploy both the backend and frontend services on Render.com.

## Prerequisites

1. A GitHub account with your repository pushed
2. A Render.com account (sign up at https://render.com)
3. Your repository should be connected to Render

## Quick Start

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub** (make sure `render.yaml` is in the root directory)

2. **Go to Render Dashboard** → New → Blueprint

3. **Connect your repository** and Render will automatically detect the `render.yaml` file

4. **Configure Environment Variables** in the Render dashboard:
   
   **Backend Service (`finance-backend`):**
   - `ALLOWED_ORIGINS`: Your frontend URL (e.g., `https://finance-frontend.onrender.com`)
   - `ALLOWED_HOSTS`: Your backend URL (e.g., `finance-backend.onrender.com`)
   - `SMTP_HOST`: Your SMTP server (if using email features)
   - `SMTP_PORT`: SMTP port (usually 587 or 465)
   - `SMTP_USER`: Your SMTP username
   - `SMTP_PASSWORD`: Your SMTP password
   - `SMTP_FROM_EMAIL`: Your sender email address
   - `AWS_ACCESS_KEY_ID`: (Optional) For S3 backups
   - `AWS_SECRET_ACCESS_KEY`: (Optional) For S3 backups
   - `AWS_BUCKET_NAME`: (Optional) For S3 backups
   - `AWS_REGION`: (Optional) AWS region, default: us-east-1

   **Frontend Service (`finance-frontend`):**
   - `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://finance-backend.onrender.com/api/v1`)

5. **Deploy** - Render will automatically create all services and deploy them

### Option 2: Manual Setup

#### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → New → PostgreSQL
2. Name: `finance-db`
3. Database: `finance_db`
4. User: `finance_user`
5. Plan: Starter (or your preferred plan)
6. Note the **Internal Database URL** (you'll need this)

#### Step 2: Create Redis Instance (Optional but Recommended)

1. Go to Render Dashboard → New → Redis
2. Name: `finance-redis`
3. Plan: Starter
4. Note the **Internal Redis URL**

#### Step 3: Deploy Backend Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `finance-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Context**: `backend`
   - **Plan**: Starter (or your preferred plan)

4. **Environment Variables**:
   ```
   DATABASE_URL=<Internal Database URL from Step 1>
   SECRET_KEY=<Generate a strong secret key>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ALLOWED_ORIGINS=https://finance-frontend.onrender.com
   ALLOWED_HOSTS=finance-backend.onrender.com
   DEBUG=false
   LOG_LEVEL=INFO
   REDIS_URL=<Internal Redis URL from Step 2>
   ```

5. **Health Check Path**: `/health`

6. Click **Create Web Service**

#### Step 4: Deploy Frontend Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `finance-frontend`
   - **Root Directory**: `frontend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Context**: `frontend`
   - **Plan**: Starter (or your preferred plan)

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://finance-backend.onrender.com/api/v1
   NODE_ENV=production
   ```

5. Click **Create Web Service**

## Post-Deployment Steps

### 1. Update Backend CORS Settings

After the frontend is deployed, update the backend's `ALLOWED_ORIGINS` environment variable to include your frontend URL:

```
ALLOWED_ORIGINS=https://finance-frontend.onrender.com
```

### 2. Run Database Migrations

The backend should automatically create tables on first startup. If you need to run migrations manually:

1. Go to your backend service in Render
2. Open the Shell/Console
3. Run:
   ```bash
   cd /app
   alembic upgrade head
   ```

### 3. Verify Deployment

1. **Backend Health Check**: Visit `https://finance-backend.onrender.com/health`
2. **Backend API Docs**: Visit `https://finance-backend.onrender.com/docs`
3. **Frontend**: Visit `https://finance-frontend.onrender.com`

## Important Notes

### Database Migrations

The backend will automatically create tables on first startup. If you need to run Alembic migrations:

1. Use Render's Shell feature to access the backend container
2. Run: `alembic upgrade head`

### Environment Variables

- **Never commit** `.env` files with secrets
- Use Render's environment variable management
- `SECRET_KEY` should be a strong, randomly generated string
- `DATABASE_URL` and `REDIS_URL` are automatically provided by Render when using service references

### CORS Configuration

Make sure `ALLOWED_ORIGINS` in the backend includes your frontend URL. Multiple origins can be comma-separated:

```
ALLOWED_ORIGINS=https://finance-frontend.onrender.com,https://your-custom-domain.com
```

### Custom Domains

You can add custom domains in Render:
1. Go to your service settings
2. Click on "Custom Domains"
3. Add your domain and follow DNS configuration instructions

### Free Tier Limitations

Render's free tier has some limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down may be slow
- Consider upgrading to paid plans for production use

## Troubleshooting

### Backend Issues

1. **Check logs**: Render Dashboard → Your Service → Logs
2. **Verify database connection**: Check `DATABASE_URL` is correct
3. **Check health endpoint**: `/health` should return 200

### Frontend Issues

1. **Check API URL**: Verify `NEXT_PUBLIC_API_URL` points to your backend
2. **Check CORS**: Ensure backend `ALLOWED_ORIGINS` includes frontend URL
3. **Check build logs**: Look for build errors in deployment logs

### Database Connection Issues

1. Use **Internal Database URL** for services on the same Render account
2. External connections require **External Database URL** and IP whitelisting

## Cost Estimation

- **Backend Web Service**: Free tier available (spins down after inactivity)
- **Frontend Web Service**: Free tier available (spins down after inactivity)
- **PostgreSQL Database**: Free tier available (limited to 90 days, then $7/month)
- **Redis**: Free tier available (limited features)

For production, consider:
- **Starter Plan**: $7/month per service
- **Standard Plan**: $25/month per service (better performance)

## Security Best Practices

1. **Use strong SECRET_KEY**: Generate with `openssl rand -hex 32`
2. **Enable HTTPS**: Render provides SSL certificates automatically
3. **Set DEBUG=false** in production
4. **Use environment variables** for all secrets
5. **Regularly update dependencies**

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Render Status: https://status.render.com

