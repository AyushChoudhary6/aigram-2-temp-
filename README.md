# AIGram 🚀

AIGram is a comprehensive, cross-platform social and educational platform built with React Native and React Native Web. It blends the engaging consumption features of short-form video feeds with powerful AI tool marketplaces and gamified learning experiences. 

This repository contains the integrated frontend codebase designed to run seamlessly across iOS, Android, and Web browsers.

---

## 🌟 Core Features

- **📱 Cross-Platform Consistency:** A unified codebase serving iOS, Android, and Desktop/Mobile Web using React Native Web.
- **🎬 Vertical Video Feed:** A TikTok-style short-form video scroller with seamless playback, interactions (like, comment, share), and optimized media delivery.
- **🤖 AI Tools Marketplace:** Discover, purchase, and interact with various AI tools directly within the app.
- **🎮 Gamified Learning & Practice:** Interactive coding exercises featuring a built-in code editor, progress tracking, streaks, and global leaderboards.
- **💼 Business & Admin Ports:** Dedicated dashboards for business users to track analytics and for administrators to manage the platform economy and content.
- **💰 In-App Economy:** A native coin system and wallet setup to purchase premium AI tools or content. (Powered by internal balance systems and payment modals).

---

## 🔄 App Flow & Architecture

### 1. Authentication (`/auth`)
Users can onboard seamlessly via standard email/password, OTP verification for enhanced security, or directly explore the app via "Guest Auth".

### 2. The Main Experience (`/main`)
Once authenticated, users land in the core application ecosystem:
- **Home:** A dynamic grid of mixed media and personalized recommendations.
- **Videos:** Immerse in a continuous vertical video feed.
- **AITools:** Browse the AI marketplace to try new conversational, generative, or utility AI models.
- **Practice:** Engage in gamified programming lessons via `GamifiedPracticeScreen`.

### 3. User & Economy Management (`/profile`)
Users manage their profiles, track their gamified learning progress, and manage their wallet (e.g., buying coin packages to use premium AI integrations).

### 4. Background Integrations
The app interfaces firmly with sophisticated backends:
- **Azure/Firebase:** Storing secure media blobs, real-time database updates for chats/comments, and secure auth. 
- **Analytics & Terraform:** Cloud infrastructure definitions found in the `/terraform` setup to deploy robust backend nodes.

---

## 🛠️ Tech Stack
- **Framework:** React Native, Expo, React Native Web
- **Routing:** React Navigation (Adapted for web linking) 
- **Styling:** Dynamic Flexbox & Theme-based styling
- **Media:** Advanced Video Playback implementations (`VideoPlayback` module)
- **Infrastructure:** Microsoft Azure Integration, Firebase Admin

---

## 📖 Further Documentation
For detailed information on the User Interface layout and design logic mapping between Web and Mobile, please refer to our dedicated [UI Documentation (ui.md)](./ui.md). 

For backend architecture, security, and specific video implementation reports, check the `/docs` folder.