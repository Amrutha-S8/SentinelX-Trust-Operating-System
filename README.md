# SentinelX Trust Operating System

A comprehensive 10-layer security platform implementing advanced trust-based security controls with real-time risk assessment, dynamic policy enforcement, and automated threat response.

## 🛡️ Overview

SentinelX implements a revolutionary trust-based security model that continuously evaluates user behavior, device trust, and contextual risk factors to make real-time security decisions. Unlike traditional binary access controls, SentinelX provides adaptive security that scales with risk.

## 🏗️ Architecture

### 10-Layer Security Model

1. **Identity Layer** - Multi-factor authentication, WebAuthn, biometrics
2. **Device Trust** - Device fingerprinting, trust scoring, anomaly detection  
3. **Behavioral Analysis** - ML-based user behavior profiling and anomaly detection
4. **Risk Scoring** - Real-time trust score calculation with multiple factors
5. **Policy Engine** - Dynamic policy enforcement with conditional logic
6. **Approval Workflows** - Multi-level approval chains with break-glass access
7. **Audit Layer** - Immutable audit trail with blockchain verification
8. **Threat Detection** - Attack pattern recognition and threat intelligence
9. **Response Automation** - Automated incident response and threat mitigation
10. **Recovery & Continuity** - Emergency access and business continuity planning

## 🚀 Quick Start

### With Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# Seed database with demo data
docker-compose exec backend npm run seed

# Access application
open http://localhost:3000
```

### Demo Credentials
- **Admin**: admin@sentinelx.io / admin123
- **User**: user1@sentinelx.io / user123
- **Approver**: approver@sentinelx.io / user123

## 💻 Technology Stack

### Backend
- **Node.js** + Express.js + TypeScript
- **MongoDB** for data persistence
- **Redis** for session management and caching
- **JWT** for authentication
- **Machine Learning** algorithms for behavioral analysis

### Frontend  
- **React** + TypeScript + Vite
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API communication

### Infrastructure
- **Docker** + Docker Compose
- **Nginx** for production serving
- **MongoDB** database
- **Redis** cache

## 🔧 Features

### Core Security Features
- ✅ Multi-factor authentication with TOTP
- ✅ Device fingerprinting and trust scoring
- ✅ Real-time behavioral analysis
- ✅ Dynamic trust score calculation
- ✅ Policy-based access control
- ✅ Multi-level approval workflows
- ✅ Immutable audit logging
- ✅ Attack pattern detection
- ✅ Automated threat response
- ✅ Emergency break-glass access

### User Interface Features
- ✅ Interactive trust score dashboard
- ✅ Real-time trust score visualization
- ✅ Approval workflow management
- ✅ Comprehensive audit log viewer
- ✅ Attack simulation tools
- ✅ Security alert management
- ✅ Trust history and trends
- ✅ Policy management interface

### Attack Simulation
- 🎯 SIM Swap Attack Detection
- 🌍 Impossible Travel Scenarios
- 🔐 Credential Stuffing Protection  
- 📲 MFA Fatigue Resistance

## 📊 Trust Scoring Algorithm

SentinelX calculates trust scores using multiple weighted factors:

- **Authentication History** (30%) - Login patterns, MFA usage, failed attempts
- **Device Trust** (20%) - Device fingerprint, location, known device status  
- **Behavioral Analysis** (25%) - Usage patterns, time-based analysis, anomalies
- **Time-based Risk** (15%) - Access time, frequency, business hours
- **Location Analysis** (10%) - Geographic location, travel patterns

## 🔒 Security Features

### Authentication & Authorization
- Multi-factor authentication (TOTP, SMS, Email)
- WebAuthn support for passwordless authentication
- JWT-based session management
- Role-based access control (RBAC)
- Device trust verification

### Policy Engine
- Dynamic policy evaluation
- Conditional logic rules
- Multi-criteria decision making
- Real-time policy updates
- Approval workflow integration

### Audit & Compliance
- Immutable audit trail
- Blockchain verification
- Compliance reporting
- Real-time monitoring
- Security event correlation

## 📁 Project Structure

```
SentinelX/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database schemas
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Security middleware
│   │   └── utils/           # Utilities
│   └── Dockerfile
├── frontend/                # React application  
│   ├── src/
│   │   ├── pages/           # Main pages
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   └── api/             # API client
│   └── Dockerfile
└── docker-compose.yml       # Container orchestration
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB
- Redis

### Backend Development
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend Development  
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Database Seeding
```bash
# With Docker
docker-compose exec backend npm run seed

# Local development
cd backend
npm run seed
```

## 🧪 Testing

### Manual Testing
1. Login with different user roles
2. Trigger trust score evaluations
3. Test approval workflows
4. Simulate security attacks
5. Review audit logs

### Attack Simulation
Navigate to `/simulator` to test:
- SIM swap attacks
- Impossible travel detection  
- Credential stuffing protection
- MFA fatigue scenarios

## 📈 Production Deployment

### Environment Variables
Configure production environment variables:
- Database connection strings
- JWT secrets
- API keys for external services
- Security settings

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Monitoring & Observability

### Health Checks
- `/api/health` - Backend health status
- `/health` - Frontend health status

### Logging
- Structured logging with Winston
- Audit trail logging  
- Security event logging
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📋 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Check the QUICK_START.md for setup instructions
- Review logs for debugging information
- Use the attack simulator to test security features
- Check the audit logs for security events

## 🏆 Key Innovations

- **Continuous Trust Assessment** - Real-time trust scoring
- **ML-Powered Behavioral Analysis** - Advanced anomaly detection
- **Dynamic Policy Engine** - Adaptive security policies
- **Integrated Attack Simulation** - Built-in security testing
- **Blockchain Audit Trail** - Immutable security logging
- **Zero-Trust Architecture** - Never trust, always verify

Built with ❤️ for enterprise security and compliance requirements.