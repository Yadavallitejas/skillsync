/**
 * Validate Firebase configuration
 * This helps catch configuration errors early
 */
export function validateFirebaseConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  requiredVars.forEach((varName) => {
    const value = import.meta.env[varName];
    if (!value || value.includes('your-') || value.includes('123456789')) {
      errors.push(`Missing or placeholder value for ${varName}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

