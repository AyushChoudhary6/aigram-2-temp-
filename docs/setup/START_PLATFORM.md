# 🚀 AIgram Platform - Complete Startup Guide

## Quick Start Commands

### Option 1: Start Both Services Simultaneously (Recommended)

```bash
# Clone and setup (if not already done)
git clone <repository-url>
cd aigram-platform

# Start both backend and frontend in parallel
npm run start:all
```

### Option 2: Start Services Separately

#### Terminal 1 - Backend
```bash
cd backend
./mvnw spring-boot:run
```

#### Terminal 2 - Frontend
```bash
# Make sure you're in the frontend directory (current working directory)
npm start
# This will run: expo start

# Alternative commands:
npx expo start          # Direct Expo command
npm run web            # For web development
npm run android        # For Android development
npm run ios            # For iOS development
```

## Detailed Setup Instructions

### 🔧 Prerequisites

1. **Java 17+** (for backend)
2. **Node.js 18+** (for frontend)
3. **Maven 3.8+** (for backend)
4. **Redis** (for caching - optional for development)

### 📦 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies and run
./mvnw clean install
./mvnw spring-boot:run

# Alternative: Run with specific profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Backend will start on: http://localhost:8080
```

### 📱 Frontend Setup

```bash
# Navigate to frontend directory
cd frontend-aigram

# Install dependencies
npm install

# Start development server
npm start

# For Expo (React Native)
npx expo start

# For web development
npm run web

# Frontend will start on: http://localhost:3000 (web) or Expo DevTools
```

## 🔄 Development Workflow

### Full Stack Development
```bash
# Terminal 1: Backend
cd backend && ./mvnw spring-boot:run

# Terminal 2: Frontend
cd frontend-aigram && npm start

# Terminal 3: Watch logs (optional)
tail -f backend/logs/aigram-backend.log
```

### Hot Reload Development
```bash
# Backend with hot reload
cd backend
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

# Frontend with hot reload (automatic)
cd frontend-aigram
npm start
```

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:8080 | Spring Boot REST API |
| Frontend Web | http://localhost:3000 | React Web Application |
| Expo DevTools | http://localhost:19002 | React Native Development |
| H2 Database Console | http://localhost:8080/h2-console | Database Management |
| API Documentation | http://localhost:8080/swagger-ui.html | Swagger UI |
| Health Check | http://localhost:8080/actuator/health | Service Health |

## 🧪 Testing Commands

### Backend Testing
```bash
cd backend

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=UserServiceTest

# Run integration tests
./mvnw test -Dtest=**/*IntegrationTest

# Run with coverage
./mvnw test jacoco:report
```

### Frontend Testing
```bash
cd frontend-aigram

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

## 🐳 Docker Setup (Alternative)

### Using Docker Compose
```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Commands
```bash
# Backend
cd backend
docker build -t aigram-backend .
docker run -p 8080:8080 aigram-backend

# Frontend
cd frontend-aigram
docker build -t aigram-frontend .
docker run -p 3000:3000 aigram-frontend
```

## 🔧 Configuration

### Backend Configuration
```bash
# Development profile
export SPRING_PROFILES_ACTIVE=dev

# Database configuration
export SPRING_DATASOURCE_URL=jdbc:h2:mem:testdb
export SPRING_DATASOURCE_USERNAME=sa
export SPRING_DATASOURCE_PASSWORD=

# JWT configuration
export JWT_SECRET=mySecretKey
export JWT_EXPIRATION=86400000

# Razorpay configuration
export RAZORPAY_KEY_ID=rzp_test_1234567890
export RAZORPAY_KEY_SECRET=test_secret_key
```

### Frontend Configuration
```bash
# API endpoint
export REACT_APP_API_URL=http://localhost:8080

# Environment
export NODE_ENV=development

# Expo configuration (for React Native)
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
```

## 📊 Monitoring & Debugging

### Backend Monitoring
```bash
# Health check
curl http://localhost:8080/actuator/health

# Application metrics
curl http://localhost:8080/actuator/metrics

# View active profiles
curl http://localhost:8080/actuator/env

# Database console
open http://localhost:8080/h2-console
```

### Frontend Debugging
```bash
# React DevTools (web)
# Install: npm install -g react-devtools
react-devtools

# Expo debugging
# Press 'd' in Expo CLI to open developer menu
# Enable remote debugging in Chrome
```

## 🚨 Troubleshooting

### Common Backend Issues
```bash
# Port already in use
lsof -ti:8080 | xargs kill -9

# Clear Maven cache
./mvnw dependency:purge-local-repository

# Reset H2 database
rm -rf ~/test.mv.db

# Check Java version
java -version
```

### Common Frontend Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset Expo cache
npx expo r -c

# Check Node version
node --version
```

## 🔐 Security Notes

### Development Environment
- JWT secret is set to `mySecretKey` for development
- H2 database console is enabled
- CORS is configured for localhost
- All endpoints are accessible for testing

### Production Considerations
- Change JWT secret to a secure random string
- Disable H2 console
- Configure proper database (PostgreSQL/MySQL)
- Set up proper CORS origins
- Enable HTTPS
- Configure proper logging levels

## 📝 API Testing

### Authentication Endpoints
```bash
# Guest authentication
curl -X POST http://localhost:8080/api/auth/guest/auth \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-device", "platform": "WEB"}'

# Token validation
curl -X POST http://localhost:8080/api/auth/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "your-jwt-token"}'
```

### API Documentation
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## 🎯 Development Tips

1. **Use separate terminals** for backend and frontend
2. **Enable hot reload** for faster development
3. **Check logs regularly** for errors and debugging
4. **Use API documentation** for endpoint testing
5. **Test authentication flow** before other features
6. **Monitor database** through H2 console
7. **Use browser DevTools** for frontend debugging

## 🚀 Production Deployment

### Backend Production
```bash
# Build production JAR
./mvnw clean package -Dmaven.test.skip=true

# Run production build
java -jar target/aigram-backend-1.0.0.jar --spring.profiles.active=prod
```

### Frontend Production
```bash
# Build for production
npm run build

# Serve production build
npm install -g serve
serve -s build -l 3000
```

---

## 🎉 Success Indicators

✅ **Backend Started Successfully:**
- Console shows "Started AigramBackendApplication"
- Health check returns `{"status":"UP"}`
- Swagger UI loads at http://localhost:8080/swagger-ui.html

✅ **Frontend Started Successfully:**
- Browser opens to http://localhost:3000
- Login/Register screens are visible
- No console errors in browser DevTools

✅ **Full Integration Working:**
- Guest authentication works
- API calls return data
- Navigation between screens works
- No CORS errors in browser console

**🎊 Your AIgram platform is now running successfully!**
