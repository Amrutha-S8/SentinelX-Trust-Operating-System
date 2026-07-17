import crypto from 'crypto';
import { redisClient } from '../config/redis';

const MAGIC_LINK_EXPIRY = 15 * 60; // 15 minutes in seconds

export interface MagicLinkData {
  token: string;
  expiresAt: Date;
}

export const generateMagicLink = async (
  userId: string,
  email: string
): Promise<MagicLinkData> => {
  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiry
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY * 1000);
  
  // Store in Redis with expiry
  const data = JSON.stringify({ userId, email, createdAt: Date.now() });
  await redisClient.setex(`magic:${token}`, MAGIC_LINK_EXPIRY, data);
  
  return { token, expiresAt };
};

export const verifyMagicLink = async (
  token: string
): Promise<{ userId: string; email: string } | null> => {
  try {
    const data = await redisClient.get(`magic:${token}`);
    
    if (!data) {
      return null;
    }
    
    // Delete token after use (one-time use)
    await redisClient.del(`magic:${token}`);
    
    const parsed = JSON.parse(data);
    return {
      userId: parsed.userId,
      email: parsed.email,
    };
  } catch (error) {
    return null;
  }
};
