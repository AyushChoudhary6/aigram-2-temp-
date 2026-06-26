# 🪟 AIgram Platform Setup - Windows

## Prerequisites Installation Guide for Windows

This guide will help you install all necessary tools to run the AIgram AI Business Learning Platform on Windows.

## 📋 Required Software

### 1. **Chocolatey** (Package Manager - Recommended)
```powershell
# Run PowerShell as Administrator
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
choco --version
```

### 2. **Java 17+** (Backend)

#### Option A: Using Chocolatey (Recommended)
```powershell
# Install OpenJDK 17
choco install openjdk17 -y

# Verify installation
java -version
javac -version
```

#### Option B: Manual Installation
1. Download OpenJDK 17 from [Adoptium](https://adoptium.net/)
2. Run the installer
3. Add to PATH: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\bin`
4. Set JAVA_HOME: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`

### 3. **Node.js 18+** (Frontend)

#### Option A: Using Chocolatey
```powershell
# Install Node.js LTS
choco install nodejs-lts -y

# Verify installation
node --version
npm --version
```

#### Option B: Manual Installation
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the installer (includes npm)
3. Restart command prompt

### 4. **Maven 3.8+** (Backend Build Tool)

#### Option A: Using Chocolatey
```powershell
# Install Maven
choco install maven -y

# Verify installation
mvn --version
```

#### Option B: Manual Installation
1. Download from [maven.apache.org](https://maven.apache.org/download.cgi)
2. Extract to `C:\Program Files\Apache\maven`
3. Add to PATH: `C:\Program Files\Apache\maven\bin`
4. Set M2_HOME: `C:\Program Files\Apache\maven`

### 5. **Git** (Version Control)

#### Option A: Using Chocolatey
```powershell
# Install Git
choco install git -y

# Configure Git (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify installation
git --version
```

#### Option B: Manual Installation
1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Run installer with default options
3. Use Git Bash or Command Prompt

### 6. **Windows Subsystem for Linux (WSL)** - Optional but Recommended
```powershell
# Enable WSL (requires restart)
wsl --install

# After restart, install Ubuntu
wsl --install -d Ubuntu

# This provides better compatibility for React Native development
```

### 7. **Expo CLI** (React Native Development)
```powershell
# Install Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version
```

## 📱 Mobile Development (Optional)

### For Android Development:
1. **Download Android Studio** from [developer.android.com](https://developer.android.com/studio)
2. **Install Android Studio** with default settings
3. **Open Android Studio** and complete setup:
   - Install Android SDK
   - Create Android Virtual Device (AVD)
4. **Add to PATH** (System Environment Variables):
   ```
   ANDROID_HOME: C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   PATH: %ANDROID_HOME%\platform-tools
   PATH: %ANDROID_HOME%\tools
   PATH: %ANDROID_HOME%\tools\bin
   ```

### For iOS Development:
- iOS development requires macOS and Xcode
- Use Expo Go app on physical iOS device for testing
- Consider using Expo EAS Build for iOS builds

## 🔧 System Configuration

### Environment Variables Setup
1. **Open System Properties** → Advanced → Environment Variables
2. **Add/Update these variables:**

```
JAVA_HOME: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
M2_HOME: C:\Program Files\Apache\maven
ANDROID_HOME: C:\Users\%USERNAME%\AppData\Local\Android\Sdk

PATH additions:
%JAVA_HOME%\bin
%M2_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

### Install Additional Development Tools
```powershell
# Install useful development tools
choco install curl wget jq -y

# Install VS Code (recommended editor)
choco install vscode -y

# Install Windows Terminal (better terminal)
choco install microsoft-windows-terminal -y
```

## ✅ Verification Script

Create and run this verification script:

```powershell
# Create verification script (save as verify_setup.ps1)
@"
Write-Host "🔍 Verifying AIgram Platform Prerequisites..." -ForegroundColor Cyan
Write-Host ""

# Check Java
try {
    `$javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✅ Java: `$javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Java: Not installed" -ForegroundColor Red
}

# Check Node.js
try {
    `$nodeVersion = node --version
    Write-Host "✅ Node.js: `$nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js: Not installed" -ForegroundColor Red
}

# Check npm
try {
    `$npmVersion = npm --version
    Write-Host "✅ npm: `$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm: Not installed" -ForegroundColor Red
}

# Check Maven
try {
    `$mvnVersion = mvn --version | Select-String "Apache Maven"
    Write-Host "✅ Maven: `$mvnVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Maven: Not installed" -ForegroundColor Red
}

# Check Git
try {
    `$gitVersion = git --version
    Write-Host "✅ Git: `$gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git: Not installed" -ForegroundColor Red
}

# Check Expo
try {
    `$expoVersion = expo --version
    Write-Host "✅ Expo CLI: `$expoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Expo CLI: Not installed" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Setup verification complete!" -ForegroundColor Green
"@ | Out-File -FilePath "verify_setup.ps1" -Encoding UTF8

# Run the script
powershell -ExecutionPolicy Bypass -File verify_setup.ps1
```

## 🚀 Quick Setup (All-in-One)

For experienced developers using Chocolatey:

```powershell
# Run PowerShell as Administrator
# Install all prerequisites at once
choco install openjdk17 nodejs-lts maven git vscode microsoft-windows-terminal -y
npm install -g @expo/cli
refreshenv
```

## 🔧 Troubleshooting

### Common Issues:

**1. PowerShell Execution Policy:**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**2. Java not found after installation:**
```powershell
# Check JAVA_HOME
echo $env:JAVA_HOME

# Set manually if needed
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot", "Machine")
```

**3. npm permission errors:**
```powershell
# Set npm prefix to user directory
npm config set prefix %APPDATA%\npm
```

**4. Android SDK not found:**
```powershell
# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

**5. Path not updated:**
```powershell
# Refresh environment variables
refreshenv
# Or restart PowerShell/Command Prompt
```

### WSL Setup (Recommended for better compatibility):
```bash
# Inside WSL Ubuntu
sudo apt update
sudo apt install -y curl wget git

# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Expo CLI
npm install -g @expo/cli
```

## 📱 Next Steps

After installing prerequisites:

1. **Clone the repository:**
   ```powershell
   git clone <your-repo-url>
   cd aigram-platform
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   npm run install:all
   ```

3. **Start the platform:**
   ```powershell
   npm run start:all
   ```

## 🎯 Development Environment

### Recommended VS Code Extensions:
```powershell
# Install VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension redhat.java
code --install-extension vscjava.vscode-spring-boot
code --install-extension ms-vscode.powershell
```

### Optional Tools:
```powershell
# Database tools
choco install dbeaver -y

# API testing
choco install postman -y

# Better terminal
choco install microsoft-windows-terminal -y
```

## 🐧 Alternative: Using WSL2 (Recommended)

For the best development experience, consider using WSL2:

```powershell
# Install WSL2 with Ubuntu
wsl --install -d Ubuntu

# Then follow the Linux setup guide inside WSL
```

Benefits of WSL2:
- Better compatibility with React Native
- Faster file system operations
- Native Linux environment
- Better Docker support

---

## ✅ Success Checklist

- [ ] Chocolatey installed (or manual installations complete)
- [ ] Java 17+ installed and JAVA_HOME set
- [ ] Node.js 18+ installed
- [ ] Maven 3.8+ installed and M2_HOME set
- [ ] Git installed and configured
- [ ] Expo CLI installed globally
- [ ] Environment variables configured
- [ ] Verification script passes
- [ ] VS Code installed (recommended)
- [ ] Android Studio installed (for mobile dev)

**🎉 You're ready to run the AIgram platform on Windows!**

For platform startup instructions, see [START_PLATFORM.md](./START_PLATFORM.md)

## 💡 Pro Tips

1. **Use Windows Terminal** for better command-line experience
2. **Consider WSL2** for better React Native compatibility
3. **Use Chocolatey** for easier package management
4. **Set up proper antivirus exclusions** for node_modules folders
5. **Use Git Bash** if you prefer Unix-like commands
