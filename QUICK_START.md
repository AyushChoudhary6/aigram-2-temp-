# 🚀 AIgram Quick Reference Card

## Current Status
```
✅ Frontend: RUNNING (http://localhost:8081)
⏳ Backend: NEEDS SETUP (Maven required)
```

---

## 📋 Quick Start in 3 Steps

### 1️⃣ Install Maven (ONE TIME ONLY)
```bash
# Option A: Manual
# Download: https://maven.apache.org/download.cgi
# Extract to: C:\Maven
# Add C:\Maven\bin to Windows PATH
# Verify: mvn --version

# Option B: Chocolatey
choco install maven -y
```

### 2️⃣ Start Backend
```bash
cd BACK
mvn clean install -DskipTests
mvn spring-boot:run

# Wait for: "Started AigramBackendApplication"
```

### 3️⃣ Frontend Already Running!
```
Open browser: http://localhost:8081
```

---

## 🔗 Connection URLs

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | http://localhost:8081 | ✅ Running |
| Backend API | http://localhost:8080 | ⏳ Needs start |
| API Endpoints | http://localhost:8080/api | ⏳ Needs backend |
| Health Check | http://localhost:8080/health | ⏳ Needs backend |

---

## 📱 Available API Categories

- 🔐 **Authentication:** Login, Register, Token Refresh
- 📹 **Videos:** Upload, Search, Like, Comments
- 👤 **User:** Profile, Settings, Dashboard
- 🤖 **AI Tools:** Execute, List, Usage
- 🏋️ **Practice:** Questions, Leaderboard, Submissions
- 💳 **Payments:** Packages, History

---

## 🛠️ Automated Scripts

| Script | Action |
|--------|--------|
| `setup.bat` | Interactive menu (recommended) |
| `start-backend.bat` | Auto-start backend |
| `start-frontend.bat` | Auto-start frontend |
| `test-integration.bat` | Test connection |

**Usage:** Double-click any .bat file

---

## 🧪 Quick Tests

### Test Backend
```bash
curl http://localhost:8080/health
```

### Test API
```bash
curl -X POST http://localhost:8080/api/upload/sas-token ^
  -H "Content-Type: application/json" ^
  -d "{\"fileName\":\"test.mp4\",\"userId\":\"user123\"}"
```

### Test Frontend
```
Open: http://localhost:8081
Check: Browser DevTools (F12) → Console
Look for: ✅ API Response messages
```

---

## 📁 Important Files

```
.env                          ← Configuration (already set)
src/constants/index.ts       ← API endpoints & config
src/services/api.ts          ← HTTP client
BACK/pom.xml                 ← Backend dependencies
BACK/src/main/.../CorsConfig.java ← CORS settings
```

---

## 🐛 Common Issues & Fixes

| Error | Fix |
|-------|-----|
| `mvn: command not found` | Install Maven (see Step 1) |
| `Port 8080 in use` | `netstat -ano \| findstr :8080` → `taskkill /PID ...` |
| `CORS error in console` | Backend not running |
| `401 Unauthorized` | Check JWT token in browser storage |
| `Cannot reach API` | Start backend first |

---

## 🔍 Debug Mode

Enable in `.env`:
```
EXPO_PUBLIC_DEBUG_API_CALLS=true
EXPO_PUBLIC_DEBUG_AUTHENTICATION=true
```

View in Browser Console (F12):
```
🚀 API Request: POST /api/auth/login
✅ API Response: Status 200
❌ API Error: Status 401
```

---

## 🎯 Development Mode

| Task | Command |
|------|---------|
| Start Frontend | `npm run web` |
| Start Backend | `cd BACK && mvn spring-boot:run` |
| Build Frontend | `npm run build` |
| Lint Frontend | `npm run lint` |
| Type Check | `npm run type-check` |

---

## 🔐 Security Checklist

- ✅ JWT tokens in secure storage
- ✅ CORS configured for localhost
- ✅ Authorization headers included
- ✅ Token refresh automatic
- ⚠️ Debug logging enabled (disable for production)

---

## 📞 Quick Help

**Terminal 1 (Backend):**
```bash
cd "d:\projects\Aigram\frontend-aigram-integratred\frontend-aigram-beIntegrated\BACK"
mvn spring-boot:run
# Keep this running
```

**Terminal 2 (Test):**
```bash
curl http://localhost:8080/health
```

**Browser:**
```
http://localhost:8081
```

---

## ✨ Success = All Green

```
✅ Frontend at http://localhost:8081
✅ Backend at http://localhost:8080
✅ API responding
✅ CORS working
✅ JWT tokens included
✅ Login flow working
```

---

## 📚 Full Guides

- `INTEGRATION_SETUP_GUIDE.md` - Complete setup guide
- `SETUP_COMPLETE.md` - Detailed status and next steps

---

**Time to get running:** ~5 minutes (after Maven install)

**Last Updated:** May 9, 2026
