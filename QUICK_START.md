# Quick Start Guide

## ✅ Setup Complete!

Your AcadMatch AI project is ready to run. Here's what's been set up:

### Project Structure
- ✅ Vite + React + TypeScript
- ✅ Tailwind CSS configured
- ✅ Firebase integration
- ✅ Authentication with Google Sign-In
- ✅ Real-time chat with Firestore
- ✅ Matching algorithm
- ✅ All core pages and components

## 🚀 Running the App

The development server should already be running. If not, run:

```bash
npm run dev
```

Then open: **http://localhost:5173**

## 📋 Next Steps

### 1. Firebase Console Setup (Required)

Before using the app, complete these Firebase setup steps:

#### Enable Google Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **Authentication** > **Sign-in method**
4. Enable **Google** provider
5. Add authorized domains (localhost is auto-added for development)

#### Create Firestore Database
1. **Firestore Database** > **Create database**
2. Start in **test mode** (for development)
3. Choose a location

#### Set Firestore Security Rules
Copy the rules from `FIREBASE_SETUP.md` to your Firestore Rules tab.

### 2. Test the Application

1. **Sign In**: Click "Get Started with Google" on the home page
2. **Onboarding**: Complete your profile (name, major, skills)
3. **Find Peers**: Go to "Find Peers" to see matched students
4. **Connect**: Click "Connect" on a peer card
5. **Chat**: Go to "Chat" to message your matches

## 🎯 Key Features

### Matching Algorithm
- Matches users based on complementary skills
- +10 points per skill match (A needs what B offers)
- +5 points for same major
- Results sorted by match percentage

### Real-time Chat
- Instant messaging with Firestore listeners
- Message history persists
- Match status updates automatically

### User Profiles
- Skills you can teach (green tags)
- Skills you need help with (blue tags)
- Editable anytime from Profile page

## 🐛 Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to Firebase Console > Authentication > Settings > Authorized domains

### "Missing or insufficient permissions"
- Check Firestore security rules (see FIREBASE_SETUP.md)
- Make sure you're authenticated

### "Index required" error
- Firebase will show a link to create the index - click it
- Or manually create index for `matches` collection on `userIds` field

### App not loading
- Check browser console for errors
- Verify `.env` file has correct Firebase config
- Ensure Firebase project is active

## 📁 Important Files

- `.env` - Your Firebase configuration (keep secret!)
- `src/firebase/config.ts` - Firebase initialization
- `src/utils/matching.ts` - Matching algorithm logic
- `src/services/firestore.ts` - All Firestore operations
- `FIREBASE_SETUP.md` - Detailed Firebase setup guide

## 🎨 Customization

- **Colors**: Edit `tailwind.config.js` to change theme colors
- **Matching Logic**: Modify `src/utils/matching.ts`
- **UI Components**: All components in `src/components/` and `src/pages/`

## 📚 Documentation

- See `README.md` for full project documentation
- See `FIREBASE_SETUP.md` for Firebase configuration details

---

**Happy coding! 🎓**

