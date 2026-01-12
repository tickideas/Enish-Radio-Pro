import jwt from 'jsonwebtoken';
import UserModel from '../drizzle/models/User.js';

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' from string

    // Verify token - JWT_SECRET must be set (no fallback for security)
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database
    const user = await UserModel.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found or inactive'
      });
    }
    
    // Add user from payload to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token is not valid' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      error: 'Server error during authentication' 
    });
  }
};

// Admin role check middleware
const adminAuth = async (req, res, next) => {
  try {
    // First run through regular auth
    auth(req, res, (err) => {
      if (err) return next(err);
      
      // Check if user has admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied. Admin privileges required.'
        });
      }

      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      error: 'Server error during admin authentication'
    });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    // JWT_SECRET must be set (no fallback for security)
    if (!process.env.JWT_SECRET) {
      return next(); // Continue without user if secret not configured
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data if token is valid
    const user = await UserModel.findById(decoded.id);
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    }
    
    next();
  } catch (error) {
    // Just continue without user if token is invalid
    next();
  }
};

export { auth, adminAuth, optionalAuth };