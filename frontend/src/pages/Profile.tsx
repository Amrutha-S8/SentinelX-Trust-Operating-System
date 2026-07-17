import React, { useState, useEffect } from 'react';
import { authAPI } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'overview' | 'totp' | 'passkeys' | 'backup' | 'devices' | 'gdpr';

interface Device {
  _id: string;
  name: string;
  type: string;
  lastUsedAt: string;
  lastUsedIp: string;
}

interface Session {
  sessionId: string;
  createdAt: number;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // TOTP state
  const [totpQR, setTotpQR] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [totpStep, setTotpStep] = useState<'idle' | 'setup' | 'verify'>('idle');

  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupStats, setBackupStats] = useState<{ totalCodes: number; unusedCodes: number } | null>(null);

  // Devices & sessions state
  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Passkey state
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };
