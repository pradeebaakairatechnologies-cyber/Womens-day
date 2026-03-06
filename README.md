# Frontend Deployment Folder

This folder contains ONLY the frontend files needed for Vercel deployment.

## What's Included:
- `/src` - All React source code
- `/public` - All images and static assets
- `package.json` - Dependencies
- `vite.config.js` - Vite configuration
- `.env.production` - Production environment variables
- `vercel.json` - Vercel configuration
- `index.html` - Entry HTML file

## Backend URL Already Configured:
```
VITE_WHATSAPP_SERVER_URL=https://nongenuinely-laccolithic-enola.ngrok-free.dev
```

## Deploy to Vercel:

### Option 1: Using Vercel CLI
```bash
cd frontend-deploy
npm install
vercel --prod
```

### Option 2: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import this `frontend-deploy` folder
3. Click Deploy

### After Deployment:
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add:
   - Name: `VITE_WHATSAPP_SERVER_URL`
   - Value: `https://nongenuinely-laccolithic-enola.ngrok-free.dev`
4. Redeploy

## Done! 🎉
Your frontend will be live on Vercel.

## Note:
Keep your backend running locally with ngrok tunnel active.
