#!/bin/bash
# Backend Setup & Run Script for AIgram

echo "======================================"
echo "AIgram Backend Setup & Run"
echo "======================================"

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven not found. Installing..."
    
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install maven
    # For Ubuntu/Debian
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y maven
    # For Windows (with Chocolatey)
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "Please run: choco install maven -y (with admin privileges)"
        exit 1
    fi
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install Java 21+"
    exit 1
fi

java_version=$(java -version 2>&1 | head -1)
echo "✅ Using: $java_version"

# Navigate to backend directory
cd BACK || exit 1

echo ""
echo "🔨 Building backend..."
mvn clean install -DskipTests

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Starting backend server..."
    echo "📍 Server will run on: http://localhost:8080"
    echo ""
    
    # Run the application
    mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
