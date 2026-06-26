# 🐧 AIgram Platform Setup - Linux

## Prerequisites Installation Guide for Linux

This guide will help you install all necessary tools to run the AIgram AI Business Learning Platform on Linux (Ubuntu/Debian and CentOS/RHEL/Fedora).

## 📋 Required Software

### 1. **Update System Packages**

#### Ubuntu/Debian:
```bash
sudo apt update && sudo apt upgrade -y
```

#### CentOS/RHEL/Fedora:
```bash
# CentOS/RHEL 8+
sudo dnf update -y

# CentOS/RHEL 7
sudo yum update -y

# Fedora
sudo dnf update -y
```

### 2. **Java 17+** (Backend)

#### Ubuntu/Debian:
```bash
# Install OpenJDK 17
sudo apt install -y openjdk-17-jdk openjdk-17-jre

# Verify installation
java -version
javac -version

# Set JAVA_HOME (add to ~/.bashrc or ~/.zshrc)
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
source ~/.bashrc
```

#### CentOS/RHEL/Fedora:
```bash
# Install OpenJDK 17
sudo dnf install -y java-17-openjdk java-17-openjdk-devel

# Verify installation
java -version
javac -version

# Set JAVA_HOME (add to ~/.bashrc or ~/.zshrc)
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
source ~/.bashrc
```

### 3. **Node.js 18+** (Frontend)

#### Option A: Using NodeSource Repository (Recommended)
```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# For CentOS/RHEL/Fedora
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

#### Option B: Using Node Version Manager (NVM)
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install and use Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version
npm --version
```

### 4. **Maven 3.8+** (Backend Build Tool)

#### Ubuntu/Debian:
```bash
# Install Maven
sudo apt install -y maven

# Verify installation
mvn --version
```

#### CentOS/RHEL/Fedora:
```bash
# Install Maven
sudo dnf install -y maven

# Verify installation
mvn --version
```

#### Manual Installation (if repository version is outdated):
```bash
# Download and install Maven manually
cd /tmp
wget https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz
sudo tar xzf apache-maven-3.9.6-bin.tar.gz -C /opt
sudo ln -s /opt/apache-maven-3.9.6 /opt/maven

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
echo 'export M2_HOME=/opt/maven' >> ~/.bashrc
echo 'export MAVEN_HOME=/opt/maven' >> ~/.bashrc
echo 'export PATH=$PATH:$M2_HOME/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
mvn --version
```

### 5. **Git** (Version Control)

#### Ubuntu/Debian:
```bash
# Install Git
sudo apt install -y git

# Configure Git (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify installation
git --version
```

#### CentOS/RHEL/Fedora:
```bash
# Install Git
sudo dnf install -y git

# Configure Git (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify installation
git --version
```

### 6. **Watchman** (File Watching - Recommended for React Native)

#### Ubuntu/Debian:
```bash
# Install dependencies
sudo apt install -y build-essential python3-dev libssl-dev libtool pkg-config autoconf automake

# Clone and build Watchman
cd /tmp
git clone https://github.com/facebook/watchman.git
cd watchman
git checkout v2023.01.30.00
sudo ./autogen.sh
sudo ./configure --enable-lenient
sudo make
sudo make install

# Verify installation
watchman --version
```

#### Alternative: Using Snap (Ubuntu)
```bash
# Install Watchman via Snap
sudo snap install watchman

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

### For Android Development:

#### Install Android Studio:
```bash
# Ubuntu/Debian - Download from website or use snap
sudo snap install android-studio --classic

# Or download manually from https://developer.android.com/studio
# Extract and run: ./android-studio/bin/studio.sh
```

#### Set up Android SDK:
```bash
# Add Android SDK to PATH (add to ~/.bashrc or ~/.zshrc)
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc
```

### For iOS Development:
- iOS development requires macOS and Xcode
- Use Expo Go app on physical iOS device for testing
- Consider using Expo EAS Build for iOS builds

## 🔧 System Configuration

### Install Additional Development Tools

#### Ubuntu/Debian:
```bash
# Install useful development tools
sudo apt install -y curl wget tree jq build-essential

# Install VS Code (recommended editor)
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install -y code
```

#### CentOS/RHEL/Fedora:
```bash
# Install useful development tools
sudo dnf install -y curl wget tree jq gcc gcc-c++ make

# Install VS Code
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
sudo dnf install -y code
```

### Increase File Limits (Prevents EMFILE errors)
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'ulimit -n 65536' >> ~/.bashrc
source ~/.bashrc

# For system-wide limits (optional)
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
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

# Check environment variables
echo "✅ JAVA_HOME: ${JAVA_HOME:-Not set}"
echo "✅ M2_HOME: ${M2_HOME:-Not set}"

echo ""
echo "🎉 Setup verification complete!"
EOF

# Make executable and run
chmod +x verify_setup.sh
./verify_setup.sh
```

## 🚀 Quick Setup Scripts

### Ubuntu/Debian All-in-One:
```bash
#!/bin/bash
# Quick setup for Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-17-jdk maven git build-essential curl wget tree jq

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Expo CLI
npm install -g @expo/cli

# Set environment variables
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
echo 'ulimit -n 65536' >> ~/.bashrc
source ~/.bashrc

echo "🎉 Setup complete! Please restart your terminal."
```

### CentOS/RHEL/Fedora All-in-One:
```bash
#!/bin/bash
# Quick setup for CentOS/RHEL/Fedora
sudo dnf update -y
sudo dnf install -y java-17-openjdk java-17-openjdk-devel maven git gcc gcc-c++ make curl wget tree jq

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Install Expo CLI
npm install -g @expo/cli

# Set environment variables
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
echo 'ulimit -n 65536' >> ~/.bashrc
source ~/.bashrc

echo "🎉 Setup complete! Please restart your terminal."
```

## 🔧 Troubleshooting

### Common Issues:

**1. Permission denied for npm global installs:**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**2. Java not found after installation:**
```bash
# Find Java installation
sudo find /usr -name "java" -type f 2>/dev/null | grep bin

# Set JAVA_HOME manually
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # Ubuntu/Debian
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk        # CentOS/RHEL/Fedora
```

**3. Maven not found:**
```bash
# Check if Maven is in PATH
which mvn

# If not found, add to PATH
echo 'export PATH=$PATH:/usr/share/maven/bin' >> ~/.bashrc
source ~/.bashrc
```

**4. Watchman build fails:**
```bash
# Install additional dependencies
sudo apt install -y python3-setuptools python3-pip
pip3 install pywatchman

# Or use alternative file watcher
npm install -g chokidar-cli
```

**5. File watching limits:**
```bash
# Increase inotify limits
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf
echo 'fs.inotify.max_queued_events=16384' | sudo tee -a /etc/sysctl.conf
echo 'fs.inotify.max_user_instances=256' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
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
# Database tools (Ubuntu/Debian)
sudo snap install dbeaver-ce

# API testing
sudo snap install postman

# Docker (optional)
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

## 🐳 Docker Alternative

If you prefer containerized development:

```bash
# Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Use Docker for development (logout and login after usermod)
docker --version
docker-compose --version
```

---

## ✅ Success Checklist

- [ ] System packages updated
- [ ] Java 17+ installed and JAVA_HOME set
- [ ] Node.js 18+ installed
- [ ] Maven 3.8+ installed
- [ ] Git installed and configured
- [ ] Expo CLI installed globally
- [ ] Watchman installed (recommended)
- [ ] File limits increased
- [ ] Environment variables set
- [ ] Verification script passes
- [ ] VS Code installed (recommended)

**🎉 You're ready to run the AIgram platform on Linux!**

For platform startup instructions, see [START_PLATFORM.md](./START_PLATFORM.md)

## 💡 Pro Tips

1. **Use package managers** when possible for easier updates
2. **Set up proper file watching limits** to prevent EMFILE errors
3. **Use NVM** for managing multiple Node.js versions
4. **Consider using Docker** for consistent development environment
5. **Install Watchman** for better React Native file watching
6. **Use tmux or screen** for managing multiple terminal sessions

## 🔄 Distribution-Specific Notes

### Arch Linux:
```bash
sudo pacman -S jdk17-openjdk maven nodejs npm git base-devel
```

### openSUSE:
```bash
sudo zypper install java-17-openjdk maven nodejs npm git gcc gcc-c++
```

### Alpine Linux:
```bash
sudo apk add openjdk17 maven nodejs npm git build-base
