import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key'; // Replace with your secret key

// Function to generate JWT token
export const generateToken = (user: { id: number; role: string }): string => {
  return jwt.sign(
    { id: user.id, role: user.role }, // This is the payload
    JWT_SECRET,
    { expiresIn: '1h' } // Set token expiry time to 1 hour
  );
};

// Function to verify JWT token
export const verifyToken = (token: string): { id: number; role: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch (error) {
    console.error('Token verification failed:', error); // Log the error for debugging
    return null; // Return null if the token is invalid or expired
  }
};
