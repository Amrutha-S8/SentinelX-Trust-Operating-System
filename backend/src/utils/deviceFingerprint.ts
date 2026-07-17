import crypto from 'crypto';
import { Request } from 'express';

export interface DeviceInfo {
  fingerprint: string;
  type: string;
  os: string;
  browser: string;
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  hardwareConcurrency?: number;
}

export const generateDeviceFingerprint = (req: Request): DeviceInfo => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Extract custom headers for enhanced fingerprinting
  const screenResolution = req.headers['x-screen-resolution'] as string;
  const timezone = req.headers['x-timezone'] as string;
  const platform = req.headers['x-platform'] as string;
  
  // Parse user agent for device details
  const deviceType = detectDeviceType(userAgent);
  const os = detectOS(userAgent);
  const browser = detectBrowser(userAgent);
  
  // Create fingerprint components
  const components = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    screenResolution || '',
    timezone || '',
    platform || '',
  ].join('|');
  
  // Generate hash-based fingerprint
  const fingerprint = crypto
    .createHash('sha256')
    .update(components)
    .digest('hex');
  
  return {
    fingerprint,
    type: deviceType,
    os,
    browser,
    userAgent,
    screenResolution,
    timezone,
    language: acceptLanguage,
    platform,
  };
};

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function detectOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  
  return 'Unknown';
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/msie|trident/i.test(ua)) return 'Internet Explorer';
  
  return 'Unknown';
}
