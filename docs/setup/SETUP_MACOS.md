# 🍎 AIgram Platform Setup - macOS

## Prerequisites Installation Guide for macOS

This guide will help you install all necessary tools to run the AIgram AI Business Learning Platform on macOS.

## 📋 Required Software

### 1. **Homebrew** (Package Manager)
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify installation
brew --version
```

### 2. **Java 17+** (Backend)
```bash
# Install OpenJDK 17
brew install openjdk@17

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
java -version
javac -version
```

### 3. **Node.js 18+** (Frontend)
```bash
# Install Node.js via Homebrew
brew install node@18

# Or install latest LTS
brew install node

# Verify installation
node --version
npm --version
```

### 4. **Maven 3.8+** (Backend Build Tool)
```bash
# Install Maven
brew install maven

# Verify installation
mvn --version
```

### 5. **Git** (Version Control)
```bash
# Install Git
brew install git

# Configure Git (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify installation
git --version
```

### 6. **Watchman** (File Watching - Recommended for React Native)
```bash
# Install Watchman for better file watching
brew install watchman

# Verify installation
watchman --version
```

### 7. **Expo CLI** (React Native Development)
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version
```

## 📱 Mobile Development (Optional)

### For iOS Development:
```bash
# Install Xcode from App Store
# Then install Xcode Command Line Tools
xcode-select --install

# Install iOS Simulator (comes with Xcode)
# Verify: Open Xcode > Preferences > Components
```

### For Android Development:
```bash
# Install Android Studio
brew install --cask android-studio

# After installation, open Android Studio and:
# 1. Install Android SDK
# 2. Create an Android Virtual Device (AVD)
# 3. Add Android SDK to PATH
```

## 🔧 System Configuration

### Increase File Limits (Prevents EMFILE errors)
```bash
# Add to ~/.zshrc or ~/.bash_profile
echo 'ulimit -n 65536' >> ~/.zshrc
source ~/.zshrc

# Verify
ulimit -n
```

### Install Additional Development Tools
```bash
# Install useful development tools
brew install curl wget tree jq

# Install VS Code (recommended editor)
brew install --cask visual-studio-code
```

## ✅ Verification Script

Create and run this verification script:

```bash
# Create verification script
cat > verify_setup.sh << 'EOF'
#!/bin/bash
echo "🔍 Verifying AIgram Platform Prerequisites..."
echo ""

# Check Java
if command -v java &> /dev/null; then
    echo "✅ Java: $(java -version 2>&1 | head -n 1)"
else
    echo "❌ Java: Not installed"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: Not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm: Not installed"
fi

# Check Maven
if command -v mvn &> /dev/null; then
    echo "✅ Maven: $(mvn --version | head -n 1)"
else
    echo "❌ Maven: Not installed"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✅ Git: $(git --version)"
else
    echo "❌ Git: Not installed"
fi

# Check Expo
if command -v expo &> /dev/null; then
    echo "✅ Expo CLI: $(expo --version)"
else
    echo "❌ Expo CLI: Not installed"
fi

# Check Watchman
if command -v watchman &> /dev/null; then
    echo "✅ Watchman: $(watchman --version)"
else
    echo "⚠️  Watchman: Not installed (recommended)"
fi

# Check file limits
echo "✅ File limit: $(ulimit -n)"

echo ""
echo "🎉 Setup verification complete!"
EOF

# Make executable and run
chmod +x verify_setup.sh
./verify_setup.sh
```

## 🚀 Quick Setup (All-in-One)

For experienced developers, here's a one-command setup:

```bash
# Install all prerequisites at once
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && \
brew install openjdk@17 node maven git watchman && \
npm install -g @expo/cli && \
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc && \
echo 'ulimit -n 65536' >> ~/.zshrc && \
source ~/.zshrc
```

## 🔧 Troubleshooting

### Common Issues:

**1. Java not found after installation:**
```bash
# Add Java to PATH manually
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

**2. Permission denied errors:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

**3. Xcode license not accepted:**
```bash
sudo xcodebuild -license accept
```

**4. Android SDK not found:**
```bash
# Add Android SDK to PATH
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools/bin' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc
```

## 📱 Next Steps

After installing prerequisites:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd aigram-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npm run install:all
   ```

3. **Start the platform:**
   ```bash
   npm run start:all
   ```

## 🎯 Development Environment

### Recommended VS Code Extensions:
```bash
# Install VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension redhat.java
code --install-extension vscjava.vscode-spring-boot
```

### Optional Tools:
```bash
# Database tools
brew install --cask dbeaver-community

# API testing
brew install --cask postman

# Terminal enhancement
brew install --cask iterm2
```

---

## ✅ Success Checklist

- [ ] Homebrew installed and working
- [ ] Java 17+ installed and in PATH
- [ ] Node.js 18+ installed
- [ ] Maven 3.8+ installed
- [ ] Git installed and configured
- [ ] Expo CLI installed globally
- [ ] Watchman installed (recommended)
- [ ] File limits increased
- [ ] Verification script passes
- [ ] VS Code installed (recommended)

**🎉 You're ready to run the AIgram platform on macOS!**

For platform startup instructions, see [START_PLATFORM.md](./START_PLATFORM.md)
