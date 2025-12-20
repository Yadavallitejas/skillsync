# Fix Your .env File

## ❌ Current Problem

Your `.env` file has incorrect format. I can see line 1 has:
```
VITE_FIREBASE_apiKey: "AIzaSyD2buWrttW99ITN-nVogXqi-z3MyHCY7QA",
```

## ✅ Correct Format

Your `.env` file should look like this (NO quotes, NO colons, NO commas):

```env
VITE_FIREBASE_API_KEY=AIzaSyD2buWrttW99ITN-nVogXqi-z3MyHCY7QA
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 🔧 How to Fix

1. **Open your `.env` file**
2. **Replace ALL lines** with the correct format above
3. **Important rules:**
   - Use `=` not `:`
   - NO quotes around values
   - NO trailing commas
   - Variable names must be UPPERCASE: `VITE_FIREBASE_API_KEY` (not `apiKey`)
   - One variable per line

## 📋 Required Variables

Make sure you have all 6 variables with these EXACT names:

1. `VITE_FIREBASE_API_KEY` (you have this value)
2. `VITE_FIREBASE_AUTH_DOMAIN` (get from Firebase Console)
3. `VITE_FIREBASE_PROJECT_ID` (get from Firebase Console)
4. `VITE_FIREBASE_STORAGE_BUCKET` (get from Firebase Console)
5. `VITE_FIREBASE_MESSAGING_SENDER_ID` (get from Firebase Console)
6. `VITE_FIREBASE_APP_ID` (get from Firebase Console)

## 🔄 After Fixing

1. **Save the `.env` file**
2. **Restart the dev server** (stop it with Ctrl+C, then run `npm run dev` again)
3. **Refresh your browser**
4. Check console - you should see "✅ Firebase configuration loaded successfully"

## 📍 Where to Get Firebase Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ Settings > Project settings
4. Scroll to "Your apps" section
5. Click on your web app (or create one)
6. Copy values from the `firebaseConfig` object

