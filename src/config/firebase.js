const admin = require('firebase-admin');

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    console.log('⚠️  Firebase already initialized');
    return admin;
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }

  return admin;
};

const getFirebaseAdmin = () => {
  if (!firebaseInitialized) {
    throw new Error('Firebase has not been initialized');
  }
  return admin;
};

module.exports = { initializeFirebase, getFirebaseAdmin };

