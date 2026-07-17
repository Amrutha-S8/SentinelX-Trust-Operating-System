# SentinelX Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for development)
- MongoDB (if running locally)
- Redis (if running locally)

## Quick Start with Docker

1. **Clone and navigate to the project:**
   ```bash
   cd SentinelX
   ```

2. **Start the entire system:**
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to start (about 30-60 seconds), then seed the database:**
   ```bash
   docker-compose exec backend npm run seed
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## Demo Credentials

| Role     | Email                 | Password | Description           |
|----------|----------------------|----------|----------------------|
| Admin    | admin@sentinelx.io   | admin123 | Full system access   |
| User     | user1@sentinelx.io   | user123  | Standard user        |
| Approver | approver@sentinelx.io| user123  | Approval workflows   |

## Development Setup

### Backend Development
```bash
cd backend
npm install
npm run seed        # Seed database
npm run dev         # Start dev server
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev         # Start dev server
```

## Testing the System

1. **Login** - Use any of the demo credentials above
2. **Dashboard** - View trust scores and system overview
3. **Trust History** - Examine trust score trends and evaluations
4. **Approval Center** - Test approval workflows
5. **Audit Logs** - Review security audit trail
6. **Attack Simulator** - Test security defenses

## Key Features to Test

### Trust Scoring System
- Login with different users to see varying trust scores
- Trust scores are calculated based on multiple factors
- View detailed trust explanations

### Approval Workflows
- High-risk actions trigger approval requests
- Multi-level approval chains
- Break-glass emergency access

### Attack Simulation
- SIM swap attack detection
- Impossible travel scenarios  
- Credential stuffing protection
- MFA fatigue resistance

### Audit & Compliance
- Immutable audit trail
- Blockchain verification
- Comprehensive security logging

## Architecture Overview

### 10-Layer Security Architecture
1. **Identity Layer** - Multi-factor authentication, WebAuthn
2. **Device Trust** - Device fingerprinting and verification
3. **Behavioral Analysis** - ML-based anomaly detection
4. **Risk Scoring** - Real-time trust score calculation
5. **Policy Engine** - Dynamic policy enforcement
6. **Approval Workflows** - Multi-level approval chains
7. **Audit Layer** - Immutable logging and compliance
8. **Threat Detection** - Attack pattern recognition
9. **Response Automation** - Automated threat response
10. **Recovery & Continuity** - Break-glass and emergency access

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart
```

**Database connection issues:**
```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb
```

**Frontend not loading:**
- Verify backend is running on port 5000
- Check browser console for errors
- Ensure .env file has correct API_URL

### Health Checks
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000/health

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

## Next Steps

1. **Explore the codebase** - Review the 10-layer security implementation
2. **Customize policies** - Modify security policies for your use case
3. **Integration** - Connect to your existing systems
4. **Deployment** - Deploy to production environment

## Support

For issues and questions:
- Check the logs first
- Review the API documentation
- Examine the audit trail for security events
- Test with the attack simulator to verify defenses

## Security Notes

- Change default passwords before production use
- Configure proper SSL/TLS certificates
- Set up monitoring and alerting
- Review and customize security policies
- Enable audit log retention
- Configure backup and disaster recovery