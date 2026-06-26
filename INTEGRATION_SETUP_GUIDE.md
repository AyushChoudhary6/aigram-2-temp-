# 🚀 AIgram Frontend-Backend Integration Setup

## ✅ What I've Done For You

I've created a complete setup and integration for your AIgram project with automatic scripts to get everything running:

### 📦 Created Files:
1. **setup.bat** - Main interactive setup menu (Windows)
2. **start-backend.bat** - Backend startup script (Windows)
3. **start-frontend.bat** - Frontend startup script (Windows)
4. **.env** - Environment configuration (already updated)

### ⚙️ Frontend Setup Status:
- ✅ npm dependencies installed
- ✅ .env configured with localhost backend
- ✅ API client ready with interceptors
- ✅ JWT token management configured
- ✅ All API endpoints defined

### 🔧 Backend Configuration:
- ✅ Spring Boot application ready
- ✅ CORS configured
- ✅ SAS token generation available
- ✅ Requires: Java 21+ and Maven

---

## 🎯 Quick Start (Choose One)

### **Option 1: Interactive Setup (Recommended)**
```bash
# Windows
setup.bat
```
This will present a menu with all options.

---

### **Option 2: Manual Start (Two Terminals)**

#### Terminal 1 - Start Backend:
```bash
# First-time only: Install Maven
# Download from: https://maven.apache.org/download.cgi
# Extract to C:\Maven and add C:\Maven\bin to PATH

# Then run:
cd BACK
mvn clean install -DskipTests
mvn spring-boot:run
```

Wait for message: "Started AigramBackendApplication in X seconds"

#### Terminal 2 - Start Frontend:
```bash
# Wait for backend to start, then in a new terminal:
npm run web
```

Frontend will open at: http://localhost:19006

---

## 🧪 Verify Everything is Working

### Check Backend Health:
```bash
curl http://localhost:8080/health
# Should return: HTTP 200 OK
```

### Check Frontend Connection:
Open browser console (F12) and look for:
```
🚀 API Request: GET http://localhost:8080/api/...
✅ API Response: Status 200
```

---

## 📱 Platform-Specific Configuration

### **Web Browser (Default)**
```
Frontend: http://localhost:19006
Backend: http://localhost:8080/api
```

### **Android Emulator**
Change `.env`:
```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8080
```
Then: `npm run android`

### **iOS Simulator**
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
EXPO_PUBLIC_BACKEND_URL=http://localhost:8080
```
Then: `npm run ios`

### **Physical Device**
Replace `localhost` with your machine's IP:
```
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8080/api
```

---

## 🔐 API Connection Flow

```
┌─────────────────────┐
│  Frontend (Expo)    │
│  - React Native     │
│  - Web Browser      │
└──────────┬──────────┘
           │
           │ HTTP/HTTPS
           │ Authorization: Bearer JWT
           ▼
┌─────────────────────────┐
│  Backend (Spring Boot)  │
│  http://localhost:8080  │
│  - /api/upload/*        │
│  - /api/auth/*          │
│  - /api/videos/*        │
└─────────────────────────┘
           │
           ▼
    ┌─────────────┐
    │ Azure Cloud │
    │ - Cosmos DB │
    │ - Blob      │
    └─────────────┘
```

---

## 🛠️ Troubleshooting

### Problem: "mvn: command not found"
**Solution:**
1. Download Maven: https://maven.apache.org/download.cgi
2. Extract to `C:\Maven`
3. Add `C:\Maven\bin` to Windows PATH
4. Restart terminal and try again

### Problem: Port 8080 already in use
**Solution:**
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID)
taskkill /PID [PID] /F
```

### Problem: Port 19006 already in use
**Solution:**
```bash
# Clear Metro bundler cache
npm start -- --reset-cache
```

### Problem: CORS errors
**Check backend CORS config:**
File: `BACK/src/main/java/com/aigram/backend/config/CorsConfig.java`

Should allow:
- Origin: `http://localhost`, `http://localhost:19006`
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

### Problem: 401 Unauthorized errors
**Check:**
1. Token is being saved: `secureStorage.getItem('aigram_access_token')`
2. Authorization header is included
3. Backend validates token correctly

---

## 📊 API Endpoints Ready to Use

### Authentication:
```
POST /api/auth/register/send-otp
POST /api/auth/register/verify
POST /api/auth/login/send-otp
POST /api/auth/login/verify
POST /api/auth/refresh-token
```

### Video Upload:
```
POST /api/upload/sas-token          (Get Azure SAS token)
POST /api/upload/video              (Store video metadata)
GET  /api/upload/metadata/{videoId}  (Get video info)
```

### User Management:
```
GET  /api/users/profile/me
PUT  /api/users/profile/me
POST /api/users/profile/me/picture
```

### Videos:
```
GET  /api/videos/{videoId}
GET  /api/videos/my-videos
GET  /api/videos/search
POST /api/videos/{videoId}/like
GET  /api/videos/{videoId}/comments
```

### AI Tools:
```
GET  /api/ai-tools
GET  /api/ai-tools/{toolId}
POST /api/ai-tools/{toolId}/execute
```

---

## 🔍 Development Tips

### Enable Debug Logging:
Update `.env`:
```
EXPO_PUBLIC_DEBUG_API_CALLS=true
EXPO_PUBLIC_DEBUG_AUTHENTICATION=true
EXPO_PUBLIC_DEBUG_NAVIGATION=true
```

### View API Calls in Console:
Browser DevTools (F12) → Console
Shows all requests/responses with timing and data

### Test API Manually:
```bash
# Test backend connectivity
curl http://localhost:8080/health

# Test API endpoint
curl -X POST http://localhost:8080/api/upload/sas-token \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.mp4","userId":"user123"}'
```

---

## 📚 Project Structure

```
frontend-aigram-beIntegrated/
├── src/
│   ├── services/
│   │   ├── api.ts              ← HTTP client
│   │   ├── authService.ts      ← Auth logic
│   │   ├── videoService.ts     ← Video upload
│   │   └── ...
│   ├── constants/
│   │   └── index.ts            ← API config
│   ├── components/             ← UI components
│   ├── screens/                ← Screens
│   └── App.tsx                 ← Main app
├── BACK/                        ← Backend
│   ├── src/
│   │   └── main/java/...
│   └── pom.xml
├── .env                        ← Configuration
├── app.config.js               ← Expo config
├── package.json                ← Frontend deps
├── setup.bat                   ← Main setup
├── start-backend.bat           ← Backend runner
└── start-frontend.bat          ← Frontend runner
```

---

## 📝 Environment Variables Reference

| Variable | Purpose | Development | Production |
|----------|---------|-------------|-----------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:8080/api` | `https://api.aigram.com/api` |
| `EXPO_PUBLIC_BACKEND_URL` | Backend base URL | `http://localhost:8080` | `https://api.aigram.com` |
| `EXPO_PUBLIC_ENV` | Environment | `development` | `production` |
| `EXPO_PUBLIC_DEBUG_API_CALLS` | API logging | `true` | `false` |
| `EXPO_PUBLIC_S3_BUCKET` | AWS bucket | `aigram-practice-videos-2026` | Same |
| `EXPO_PUBLIC_AWS_REGION` | AWS region | `ap-south-1` | Same |

---

## ✨ What's Already Configured

### Frontend ✅
- Axios HTTP client with interceptors
- JWT authentication and token refresh
- Request/response logging
- Error handling with retry logic
- CORS-friendly headers
- All API endpoints defined
- TypeScript types for API responses
- Secure token storage

### Backend ✅
- Spring Boot REST API
- CORS configuration
- SAS token generation for Azure
- Cosmos DB integration
- Error handling
- Validation
- Health checks
- Actuator metrics

---

## 🎓 Next Steps

1. **Run setup.bat and select option 1** to start frontend
2. **In another terminal, run setup.bat and select option 4** to start backend
3. **Open http://localhost:19006** in your browser
4. **Test login** with any phone number (development mode)
5. **Check browser console** for API logs

---

## 💡 Tips

- Keep `.env` synchronized between frontend and backend URLs
- Always start backend first, then frontend
- Use `npm run web` for browser testing (fastest feedback)
- Check browser DevTools → Network tab to see API calls
- Backend logs in terminal show detailed error information
- Frontend logs in browser console show client-side issues

---

## 📞 Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review **browser console** (F12) for error messages
3. Check **backend terminal** for server errors
4. Verify **environment variables** in .env
5. Ensure **ports 8080 and 19006** are free

---

**Created:** May 9, 2026
**Project:** AIgram Frontend-Backend Integration
**Status:** ✅ Ready to Run
