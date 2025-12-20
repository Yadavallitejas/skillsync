# .env File Format Guide

## Required Format

Your `.env` file should contain exactly these 6 variables (one per line):

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Important Notes

1. **No quotes needed** - Don't wrap values in quotes
2. **No spaces** - No spaces around the `=` sign
3. **All variables required** - All 6 variables must be present
4. **VITE_ prefix** - All variables MUST start with `VITE_` for Vite to expose them
5. **Restart dev server** - After changing `.env`, restart the dev server

## Where to Find Your Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Click on your web app (or create one)
7. Copy the config values from the `firebaseConfig` object

## Example Firebase Config Object

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "myproject.firebaseapp.com",
  projectId: "myproject-12345",
  storageBucket: "myproject-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

Convert to `.env` format:
```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=myproject-12345
VITE_FIREBASE_STORAGE_BUCKET=myproject-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Verification

After setting up your `.env` file:

1. **Restart the dev server** (stop and run `npm run dev` again)
2. **Check browser console** - You should see "✅ Firebase configuration loaded successfully"
3. **Try signing in** - If you see Firebase errors, check the console for details

## Common Issues

### "Firebase: Error (auth/api-key-not-valid)"
- Check that `VITE_FIREBASE_API_KEY` is correct
- Make sure there are no extra spaces or quotes

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to Firebase Console > Authentication > Settings > Authorized domains
- For localhost, it's usually auto-added, but check if needed

### Environment variables not loading
- Make sure variables start with `VITE_`
- Restart the dev server after changing `.env`
- Check that `.env` is in the root directory (same level as `package.json`)

