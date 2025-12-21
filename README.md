# SkillSync

A peer-to-peer academic collaboration platform where students can sign up, list their skills, find study partners based on a "skills match" algorithm, and chat in real-time.

## Features

- 🔐 **Google Authentication** - Sign in with your Google account
- 📝 **User Profiles** - Set up your profile with skills you can teach and skills you need help with
- 🎯 **Smart Matching** - AI-powered algorithm matches you with peers based on complementary skills
- 💬 **Real-time Chat** - Connect and chat with your matched study partners
- 📅 **Session Scheduling** - Schedule study sessions (UI placeholder)

## Tech Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS
- **Icons:** Lucide React
- **Routing:** React Router DOM
- **Backend:** Firebase (Auth, Firestore)
- **State Management:** React Context API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd skillsync-cursor
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Google Sign-In)
   - Create a Firestore database
   - Copy your Firebase config to `.env` file (use `.env.example` as a template)

4. Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Layout.tsx   # Main layout with navbar
│   └── Onboarding.tsx # User onboarding flow
├── hooks/           # Custom React hooks
│   └── useAuth.tsx  # Authentication hook
├── pages/           # Page components
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   ├── FindPeers.tsx
│   ├── Chat.tsx
│   └── Profile.tsx
├── services/        # Firebase service functions
│   └── firestore.ts
├── firebase/        # Firebase configuration
│   └── config.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Utility functions
│   ├── matching.ts  # Matching algorithm
│   └── cn.ts        # Class name utility
├── App.tsx          # Main app component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## Matching Algorithm

The matching algorithm calculates a score between two users based on:
- **Skills Match:** +10 points for each skill where User A's need matches User B's offer (and vice versa)
- **Major Match:** +5 points if both users have the same major

The score is normalized to a percentage (0-100%) for display purposes.

## Firebase Collections

- `users` - User profiles with skills and preferences
- `matches` - Connections between users
- `chats` - Chat messages for each match

## Development

- Run `npm run dev` to start the development server
- Run `npm run build` to build for production
- Run `npm run preview` to preview the production build

## License

MIT

