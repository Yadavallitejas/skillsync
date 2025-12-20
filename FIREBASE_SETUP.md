# Firebase Setup Guide

## 1. Firebase Console Setup

### Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Google** as a sign-in provider
5. Add your authorized domains (localhost for development)

### Firestore Database
1. Navigate to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** for development (or set up proper security rules)
4. Choose a location for your database

## 2. Firestore Security Rules (Development)

For development, you can use these permissive rules. **⚠️ IMPORTANT: Update these for production!**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read all, write only their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Matches collection - users can read their own matches, create matches
    match /matches/{matchId} {
      allow read: if request.auth != null && 
        (request.auth.uid in resource.data.userIds);
      allow create: if request.auth != null && 
        request.auth.uid in request.resource.data.userIds;
      allow update: if request.auth != null && 
        (request.auth.uid in resource.data.userIds);
    }
    
    // Chats collection - users can read/write if they're part of the match
    match /chats/{chatId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 3. Firestore Indexes

The app queries matches by `userIds` array. Firebase may require you to create a composite index:

1. Go to **Firestore Database** > **Indexes**
2. If you see a link to create an index, click it
3. Or manually create:
   - Collection: `matches`
   - Fields: `userIds` (Array)
   - Query scope: Collection

## 4. Testing the Setup

1. Start the dev server: `npm run dev`
2. Open http://localhost:5173
3. Click "Get Started with Google"
4. Complete the onboarding flow
5. Try finding peers and sending messages

## 5. Common Issues

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure you're authenticated

### "Index required"
- Create the required Firestore index (see step 3)

### Authentication not working
- Verify Google Sign-In is enabled in Firebase Console
- Check that your domain is authorized
- Verify your `.env` file has correct values

## 6. Production Checklist

Before deploying:
- [ ] Update Firestore security rules (remove test mode)
- [ ] Set up proper CORS and authorized domains
- [ ] Configure Firebase Hosting (optional)
- [ ] Set up environment variables in your hosting platform
- [ ] Test all features thoroughly

