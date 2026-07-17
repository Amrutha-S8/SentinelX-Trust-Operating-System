import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { TrustScore } from '../models/TrustScore';
import { Policy } from '../models/Policy';
import { Device } from '../models/Device';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinelx';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await TrustScore.deleteMany({});
    await Policy.deleteMany({});
    await Device.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@sentinelx.io',
      password: adminPassword,
      role: 'admin',
      department: 'Security',
      isActive: true,
    });
    await admin.save();
    console.log('Created admin user');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'user1@sentinelx.io',
      password: userPassword,
      role: 'user',
      department: 'Engineering',
      isActive: true,
    });
    await user.save();

    // Create approver user
    const approver = new User({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'approver@sentinelx.io',
      password: userPassword,
      role: 'approver',
      department: 'Security',
      isActive: true,
    });
    await approver.save();
    console.log('Created users');

    // Create initial trust scores
    const adminTrustScore = new TrustScore({
      userId: admin._id,
      currentScore: 95,
      riskLevel: 'low',
      factors: [
        { name: 'Authentication History', value: 95, weight: 0.3, contribution: 28.5 },
        { name: 'Device Trust', value: 90, weight: 0.2, contribution: 18 },
        { name: 'Behavioral Analysis', value: 98, weight: 0.25, contribution: 24.5 },
        { name: 'Time-based Risk', value: 100, weight: 0.15, contribution: 15 },
        { name: 'Location Analysis', value: 92, weight: 0.1, contribution: 9.2 },
      ],
      lastUpdated: new Date(),
    });
    await adminTrustScore.save();

    const userTrustScore = new TrustScore({
      userId: user._id,
      currentScore: 78,
      riskLevel: 'medium',
      factors: [
        { name: 'Authentication History', value: 80, weight: 0.3, contribution: 24 },
        { name: 'Device Trust', value: 75, weight: 0.2, contribution: 15 },
        { name: 'Behavioral Analysis', value: 82, weight: 0.25, contribution: 20.5 },
        { name: 'Time-based Risk', value: 70, weight: 0.15, contribution: 10.5 },
        { name: 'Location Analysis', value: 80, weight: 0.1, contribution: 8 },
      ],
      lastUpdated: new Date(),
    });
    await userTrustScore.save();
    console.log('Created trust scores');

    // Create default policies
    const policies = [
      {
        name: 'High-Value Transaction Policy',
        category: 'financial',
        description: 'Requires additional approval for transactions over $10,000',
        rules: [
          {
            condition: 'transaction.amount > 10000',
            action: 'require_approval',
            requiredApprovals: 2,
            allowedApprovers: ['manager', 'admin'],
          },
        ],
        isEnabled: true,
        createdBy: admin._id,
      },
      {
        name: 'Low Trust Score Policy',
        category: 'security',
        description: 'Blocks actions when trust score is below 40',
        rules: [
          {
            condition: 'trustScore < 40',
            action: 'block',
            message: 'Trust score too low to perform this action',
          },
        ],
        isEnabled: true,
        createdBy: admin._id,
      },
      {
        name: 'Break Glass Policy',
        category: 'emergency',
        description: 'Emergency access policy for critical situations',
        rules: [
          {
            condition: 'emergency === true',
            action: 'break_glass',
            requiredApprovals: 1,
            allowedApprovers: ['admin'],
            auditRequired: true,
          },
        ],
        isEnabled: true,
        createdBy: admin._id,
      },
      {
        name: 'Off-Hours Access Policy',
        category: 'temporal',
        description: 'Additional verification required for access outside business hours',
        rules: [
          {
            condition: 'isBusinessHours === false',
            action: 'additional_verification',
            methods: ['sms', 'email'],
          },
        ],
        isEnabled: true,
        createdBy: admin._id,
      },
    ];

    for (const policyData of policies) {
      const policy = new Policy(policyData);
      await policy.save();
    }
    console.log('Created default policies');

    // Create trusted devices
    const adminDevice = new Device({
      userId: admin._id,
      deviceId: 'admin-laptop-001',
      deviceName: 'Admin MacBook Pro',
      deviceType: 'laptop',
      fingerprint: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        screenResolution: '2560x1600',
        timezone: 'America/New_York',
      },
      isActive: true,
      trustScore: 95,
      lastSeen: new Date(),
    });
    await adminDevice.save();

    const userDevice = new Device({
      userId: user._id,
      deviceId: 'user-laptop-001',
      deviceName: 'John\'s Windows Laptop',
      deviceType: 'laptop',
      fingerprint: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        screenResolution: '1920x1080',
        timezone: 'America/Los_Angeles',
      },
      isActive: true,
      trustScore: 78,
      lastSeen: new Date(),
    });
    await userDevice.save();
    console.log('Created trusted devices');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('Admin: admin@sentinelx.io / admin123');
    console.log('User: user1@sentinelx.io / user123');
    console.log('Approver: approver@sentinelx.io / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

export { seed };