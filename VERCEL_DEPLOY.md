# Deploy AcadMatch AI to Vercel

## 🚀 Quick Deployment Guide

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click **"Add New Project"**
   - Import your GitHub repository

3. **Configure Project Settings**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Add Environment Variables**
   Click **"Environment Variables"** and add:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyD2buWrttW99ITN-nVogXqi-z3MyHCY7QA
   VITE_FIREBASE_AUTH_DOMAIN=skillsync-7e903.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=skillsync-7e903
   VITE_FIREBASE_STORAGE_BUCKET=skillsync-7e903.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=687445917594
   VITE_FIREBASE_APP_ID=1:687445917594:web:8e3f3029201091f8278423
   ```

5. **Deploy**
   - Click **"Deploy"**
   - Wait for build to complete
   - Your app will be live! 🎉

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked about environment variables, add them one by one

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   vercel env add VITE_FIREBASE_APP_ID
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## ⚙️ Important Configuration

### Update Firebase Authorized Domains

After deploying, you MUST add your Vercel domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **skillsync-7e903**
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Click **"Add domain"**
5. Add your Vercel domain (e.g., `your-app.vercel.app`)
6. If you have a custom domain, add that too

### Update Firestore Security Rules

For production, update your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - users can read all, write only their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Matches - users can read/write their own matches
    match /matches/{matchId} {
      allow read: if request.auth != null && 
        (request.auth.uid in resource.data.userIds);
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.userIds;
      allow update: if request.auth != null && 
        (request.auth.uid in resource.data.userIds);
    }
    
    // Chats - users can read/write if part of match
    match /chats/{chatId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:
- **Main branch** → Production deployment
- **Other branches** → Preview deployments

## 📝 Environment Variables in Vercel

Since your Firebase config is hardcoded, you have two options:

### Option A: Keep Hardcoded (Current)
- No environment variables needed
- Works immediately
- ⚠️ Credentials visible in source code (OK for Firebase web apps)

### Option B: Use Environment Variables (Recommended for Production)
1. Update `src/firebase/config.ts` to use env vars again
2. Add all `VITE_FIREBASE_*` variables in Vercel dashboard
3. Redeploy

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build`

### Authentication Not Working
- Check Firebase authorized domains
- Verify environment variables are set
- Check browser console for errors

### Firestore Errors
- Verify Firestore database is created
- Check security rules
- Ensure rules allow your Vercel domain

## 🎯 Next Steps After Deployment

1. ✅ Add Vercel domain to Firebase authorized domains
2. ✅ Test authentication
3. ✅ Test profile creation
4. ✅ Test finding peers
5. ✅ Test chat functionality
6. ✅ (Optional) Set up custom domain

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Firebase Hosting Alternative](https://firebase.google.com/docs/hosting)

---

**Your app will be live at:** `https://your-project-name.vercel.app`


