# ⚠️ IMPORTANT: Firestore Setup Required

## The app is trying to save data but Firestore might not be configured!

If you're seeing errors when saving your profile, follow these steps:

## Step 1: Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **skillsync-7e903**
3. Click **Firestore Database** in the left menu
4. If you see "Create database", click it
5. Choose **Start in test mode** (for development)
6. Select a location (choose closest to you)
7. Click **Enable**

## Step 2: Set Security Rules (Test Mode)

For development, use these rules:

1. Go to **Firestore Database** > **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (TEST MODE ONLY)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

## Step 3: Verify Setup

1. Refresh your browser
2. Try saving your profile again
3. Check the browser console for any errors
4. Check Firestore Console - you should see a `users` collection appear

## Step 4: Check Browser Console

Open Developer Tools (F12) and look for:
- ✅ Success: "Profile saved successfully!"
- ❌ Error: Check the error message

Common errors:
- **"Missing or insufficient permissions"** → Security rules not set
- **"Firestore database not found"** → Database not created
- **"Permission denied"** → User not authenticated

## Quick Test

After setting up Firestore:
1. Sign in with Google
2. Complete onboarding
3. Check Firestore Console > Firestore Database > Data
4. You should see a `users` collection with your user document

---

**Note:** The app now has real-time updates! Your profile will update automatically across all pages when you make changes.

