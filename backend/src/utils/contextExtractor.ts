import { Request } from 'express';
import geoip from 'geoip-lite';
import { generateDeviceFingerprint } from './deviceFingerprint';

export interface ContextData {
  device: {
    fingerprint: string;
    type: string;
    os: string;
    browser: string;
    trusted: boolean;
  };
  network: {
    ipAddress: string;
    asn: string;
    country: string;
    vpnDetected: boolean;
    torDetected: boolean;
  };
  timing: {
    localTime: string;
    timezone: string;
    dayOfWeek: string;
    isWorkingHours: boolean;
  };
  environmental: {
    location: {
      lat: number;
      lon: number;
      city: string;
      country: string;
    };
    velocity: number;
    distanceFromLast: number;
  };
}

export const extractContext = (req: Request, trustedDevices: string[] = []): ContextData => {
  // Extract device information
  const deviceInfo = generateDeviceFingerprint(req);
  
  // Extract IP address (handle proxies)
  const ipAddress = (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    ''
  ).split(',')[0].trim();
  
  // Geo-locate IP
  const geo = geoip.lookup(ipAddress);
  
  // Extract timing information
  const now = new Date();
  const timezone = req.headers['x-timezone'] as string || 'UTC';
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = now.getHours();
  const isWorkingHours = hour >= 9 && hour <= 17 && !['Saturday', 'Sunday'].includes(dayOfWeek);
  
  // Detect VPN/Tor (simple heuristics - would be enhanced with external services)
  const vpnDetected = detectVPN(ipAddress);
  const torDetected = detectTor(ipAddress);
  
  return {
    device: {
      fingerprint: deviceInfo.fingerprint,
      type: deviceInfo.type,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      trusted: trustedDevices.includes(deviceInfo.fingerprint),
    },
    network: {
      ipAddress,
      asn: geo?.asn?.toString() || 'unknown',
      country: geo?.country || 'unknown',
      vpnDetected,
      torDetected,
    },
    timing: {
      localTime: now.toISOString(),
      timezone,
      dayOfWeek,
      isWorkingHours,
    },
    environmental: {
      location: {
        lat: geo?.ll?.[0] || 0,
        lon: geo?.ll?.[1] || 0,
        city: geo?.city || 'unknown',
        country: geo?.country || 'unknown',
      },
      velocity: 0, // Calculated from previous location
      distanceFromLast: 0, // Calculated from previous location
    },
  };
};

// Simple VPN detection (would be enhanced with commercial VPN detection APIs)
function detectVPN(ipAddress: string): boolean {
  // Common VPN port patterns, known VPN provider IPs, etc.
  // This is a placeholder - real implementation would use services like IPHub, IPQualityScore
  return false;
}

// Simple Tor detection (would be enhanced with Tor exit node lists)
function detectTor(ipAddress: string): boolean {
  // Check against known Tor exit nodes
  // This is a placeholder - real implementation would check against updated Tor exit node list
  return false;
}

// Calculate distance between two geographic points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate velocity (km/h) between two events
export const calculateVelocity = (
  distance: number,
  timeDiffSeconds: number
): number => {
  if (timeDiffSeconds === 0) return 0;
  const hours = timeDiffSeconds / 3600;
  return distance / hours;
};
