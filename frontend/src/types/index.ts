export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface TrustScore {
  currentScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
}

export interface TrustFactor {
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface TrustLog {
  _id: string;
  userId: string;
  action: string;
  trustScore: number;
  riskLevel: string;
  timestamp: string;
  factors?: TrustFactor[];
  explanation?: string;
  confidenceScore?: number;
}

export interface ApprovalRequest {
  _id: string;
  requesterId: User;
  action: string;
  policyType: string;
  status: 'pending' | 'approved' | 'rejected';
  requiredApprovals: number;
  currentApprovals: number;
  actionDetails?: any;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLog {
  _id: string;
  sequenceNumber: number;
  eventType: string;
  action: string;
  userId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  outcome: 'success' | 'failure' | 'pending';
  timestamp: string;
  metadata?: any;
  blockchainHash?: string;
}

export interface Policy {
  _id: string;
  name: string;
  category: string;
  rules: any[];
  isEnabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityAlert {
  _id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  alertType: string;
}

export interface Device {
  _id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  isActive: boolean;
  lastSeen: string;
  trustScore: number;
}

export interface Session {
  _id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  location?: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface TrustEvaluationRequest {
  action: string;
  behavioralData?: any;
  actionRisk?: string;
}

export interface TrustEvaluationResponse {
  trustScore: number;
  riskLevel: string;
  factors: TrustFactor[];
  explanation: string;
  confidenceScore: number;
  recommendations?: string[];
}