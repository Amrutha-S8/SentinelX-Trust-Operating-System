import crypto from 'crypto';
import QRCode from 'qrcode';
import { redisClient } from '../config/redis';

const QR_EXPIRY = 5 * 60; // 5 minutes in seconds

export interface QRLoginSession {
  sessionId: string;
  qrCode: string;
  expiresAt: Date;
}

export const generateQRLoginSession = async (userId: string): Promise<QRLoginSession> => {
  // Generate unique session ID
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  // Generate QR code payload
  const payload = JSON.stringify({
    sessionId,
    timestamp: Date.now(),
    userId,
  });
  
  // Generate QR code image
  const qrCode = await QRCode.toDataURL(payload);
  
  // Store session in Redis with pending status
  const sessionData = JSON.stringify({
    userId,
    status: 'pending',
    createdAt: Date.now(),
  });
  await redisClient.setex(`qr:${sessionId}`, QR_EXPIRY, sessionData);
  
  const expiresAt = new Date(Date.now() + QR_EXPIRY * 1000);
  
  return {
    sessionId,
    qrCode,
    expiresAt,
  };
};

export const verifyQRLoginSession = async (
  sessionId: string,
  userId: string
): Promise<boolean> => {
  try {
    const data = await redisClient.get(`qr:${sessionId}`);
    
    if (!data) {
      return false;
    }
    
    const session = JSON.parse(data);
    
    // Verify user ID matches
    if (session.userId !== userId) {
      return false;
    }
    
    // Update session status to verified
    session.status = 'verified';
    session.verifiedAt = Date.now();
    
    // Store updated session (keep TTL)
    const ttl = await redisClient.ttl(`qr:${sessionId}`);
    await redisClient.setex(`qr:${sessionId}`, ttl, JSON.stringify(session));
    
    return true;
  } catch (error) {
    return false;
  }
};

export const getQRLoginStatus = async (
  sessionId: string
): Promise<{ status: string; userId?: string } | null> => {
  try {
    const data = await redisClient.get(`qr:${sessionId}`);
    
    if (!data) {
      return null;
    }
    
    const session = JSON.parse(data);
    return {
      status: session.status,
      userId: session.status === 'verified' ? session.userId : undefined,
    };
  } catch (error) {
    return null;
  }
};

export const deleteQRLoginSession = async (sessionId: string): Promise<void> => {
  await redisClient.del(`qr:${sessionId}`);
};
