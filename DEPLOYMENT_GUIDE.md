# Deployment Guide for SynchroServe

## Overview

This guide will help you deploy both the frontend (React) and backend (Node.js/Express) of your SynchroServe application.

## Backend Status ✅

Your backend is already deployed and running at: `https://ssgsonboarding.onrender.com`

## Frontend Deployment Steps

### Step 1: Prepare Your Code

The code has been updated to use the deployed backend. Key changes made:

- Created `src/config/api.js` with centralized API configuration
- Created `src/utils/api.js` with helper functions for API calls
- Updated LeaveManagement components to use the new API utilities
- Updated Auth components (EmployeeLogin, AdminLogin, CentreLogin) to use the deployed backend

### Step 2: Build the React App

```bash
npm run build
```

This creates a `build/` folder with static files.

### Step 3: Deploy to Netlify

#### Option A: Deploy via Netlify UI

1. Go to [https://app.netlify.com/](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
5. Click "Deploy site"

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=build
```

### Step 4: Configure Environment Variables

In your Netlify dashboard:

1. Go to Site settings → Environment variables
2. Add:
   ```
   REACT_APP_API_URL=https://ssgsonboarding.onrender.com
   ```
3. Redeploy the site

### Step 5: Test the Deployment

1. Visit your Netlify URL
2. Test login functionality
3. Test leave management features
4. Verify all API calls work correctly

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure your backend has CORS enabled:

```javascript
const cors = require("cors");
app.use(cors());
```

### API Connection Issues

- Verify the backend URL is correct: `https://ssgsonboarding.onrender.com`
- Check that all API endpoints are working
- Ensure environment variables are set correctly

### Build Issues

- Make sure all dependencies are installed: `npm install`
- Check for any syntax errors in the code
- Verify the build command is correct: `npm run build`

## File Structure After Deployment

```
synchroserve-main/
├── src/
│   ├── config/
│   │   └── api.js          # API configuration
│   ├── utils/
│   │   └── api.js          # API utility functions
│   └── components/
│       ├── Auth/           # Updated auth components
│       └── LeaveManagement/ # Updated leave components
├── build/                  # Generated after npm run build
├── package.json
└── DEPLOYMENT_GUIDE.md     # This file
```

## Next Steps

1. Deploy the frontend to Netlify
2. Test all functionality
3. Share the Netlify URL with your client
4. Monitor the application for any issues

## Support

If you encounter any issues during deployment, check:

1. Netlify deployment logs
2. Browser console for errors
3. Network tab for failed API calls
4. Backend logs on Render dashboard
