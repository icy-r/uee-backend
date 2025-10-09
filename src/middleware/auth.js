const { getFirebaseAdmin } = require('../config/firebase');

/**
 * Middleware to verify Firebase authentication token
 * Note: Authentication is not required for MVP, but structure is in place
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For MVP: Allow requests without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    // For MVP: Continue without authentication
    req.user = null;
    next();
  }
};

/**
 * Optional authentication - allows both authenticated and unauthenticated requests
 */
const optionalAuth = authenticate;

/**
 * Required authentication - blocks unauthenticated requests (for future use)
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticate, optionalAuth, requireAuth };

