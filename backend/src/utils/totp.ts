import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configure TOTP
authenticator.options = {
  window: 1, // Allow 1 step before/after for time drift
  step: 30, // 30 second time step
};

export interface TOTPSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export const generateTOTPSecret = async (
  email: string,
  issuer: string = 'SentinelX'
): Promise<TOTPSetup> => {
  // Generate secret
  const secret = authenticator.generateSecret();
  
  // Generate OTP auth URL
  const otpauth = authenticator.keyuri(email, issuer, secret);
  
  // Generate QR code
  const qrCode = await QRCode.toDataURL(otpauth);
  
  // Generate backup codes
  const backupCodes = generateBackupCodes(8);
  
  return {
    secret,
    qrCode,
    backupCodes,
  };
};

export const verifyTOTP = (token: string, secret: string): boolean => {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
};

export const generateBackupCodes = (count: number = 8): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

export const generateRecoveryToken = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};
