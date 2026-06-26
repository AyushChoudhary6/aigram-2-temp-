# AIGram UI Documentation

This document describes the User Interface (UI) structure and design flow of the AIGram application, detailing both the Mobile (iOS/Android) and Web experiences. 

The application is built using React Native and React Native Web, enabling a unified, cross-platform UI experience while naturally accommodating platform-specific distinctions.

---

## 🌎 Global UI and Cross-Platform Distinctions

### Mobile App (iOS / Android)
- **Navigation Type:** Bottom Tab Navigation or a `FloatingNavbar` fixed to the bottom of the viewport.
- **Gestures:** Built around touch interactions, swipe-to-refresh, horizontal swipeable video feeds, and native modal presentations.
- **Layout:** Optimized for portrait mode. Content typically takes the full width of the screen.
- **Header:** Native top headers with back buttons and screen titles.

### Web Application (Desktop & Mobile Browser)
- **Navigation Type:** Responsive layout. On mobile browsers, it mimics the native mobile layout (Bottom Tabs/Floating Navbar). On desktop browsers, it expands into a wider view where navigation can be top-based or side-based, retaining the `FloatingNavbar` logic.
- **Interactions:** Emphasizes mouse clicks, hover effects, and scroll-wheel interactions. Videos and modals open cleanly on large screens (often as centered dialogs or side-by-side splits).
- **Layout:** Utilizes CSS Media Queries and React Native Web responsive styling to limit the max-width of mobile-centric views on desktop, ensuring UI elements like the video feed or AIToolCards do not stretch awkwardly.

---

## 📱 Screen-by-Screen Breakdown

### 1. Authentication Flow (`/screens/auth`)
The entry point for the application.
- **Auth Selection Screen (`AuthSelectionScreen`):** Prompts the user to Login, Register, or enter as a Guest. 
- **Login/Register (`LoginScreen`, `RegisterScreen`):** Standard input fields for user credentials (Email, Password). On Web, fields are centered in a neat container; on Mobile, they stretch comfortably with keyboard-avoiding views.
- **OTP Verification (`OtpVerificationScreen`):** Clean, segmented input boxes for mobile pin verification.
- **Guest Auth (`GuestAuthScreen`):** Quick-start entry skipping standard auth, with distinct UI limitations on advanced features.

### 2. Main Navigation (`/screens/main`)

#### **Home Screen (`HomeScreen`)**
The central feed or dashboard of exactly what the user is interested in.
- **Components:** `MediaGrid` for showcasing content (images, quick videos).
- **Web Layout:** Grid expands gracefully with more columns on larger screens (e.g., 2 columns on mobile, 4+ on desktop).
- **Mobile Layout:** Infinite vertical scroll feed of media items.

#### **Videos Screen (`VideosScreen`)**
TikTok/Reels style vertical video scroller.
- **UI:** Full-screen video playback utilizing the `VideoPlayback` components. 
- **Overlays:** Right-side vertical action bar (Like, Share, Comment, Save). 
- **Web Adaptation:** On desktop, the video player is often constrained to a mobile-dimension container in the center of the screen with comments opening in a side panel next to the video. `CommentSection` is robustly integrated.

#### **Practice & Gamified Learning (`PracticeScreen`, `GamifiedPracticeScreen`)**
Interactive educational screens for the platform.
- **Code Editor (`CodeEditor`):** A Monaco-style or native webview code input interface. On desktop, this utilizes expansive keyboard mapping; on mobile, it employs specialized touch-friendly syntax inputs.
- **Gamification Elements:** `Leaderboard` component showing user rankings. Points, streaks, and progress bars rendered visually.

#### **AI Tools Marketplace (`AIToolsScreen`)**
Displays available AI integrations and models that users can utilize or purchase.
- **Grid View:** `AIToolsMarketplace` and `AIToolCard` components rendering as a grid of available tool integrations.
- **Execution Engine (`AIToolExecution`):** Interface for chatting with or using the specific tool. Looks like a chat interface or specialized form input depending on the AI's modality (text, image gen, video gen).

#### **Profile Screen (`ProfileScreen`)**
User management and wallet.
- **User Info:** Avatar and bio details.
- **Economy:** Displays current "Coins" or balance. Integrates the `CoinPackages` component for purchasing more platform currency.
- **Payments:** `PaymentModal` pops up as a responsive overlay (bottom sheet on mobile, centered modal on web) for transactions.

### 3. Business Floor (`/screens/business`)
- **Business Dashboard (`BusinessDashboard`, `BusinessScreen`):** Tailored views for business accounts. Displays analytics, engagement statistics, and content management tables/lists optimized for denser data rendering (especially enhanced on the Web).

### 4. Admin Features
- **Admin Dashboard (`AdminDashboard`):** Usually restricted or accessed via a distinct route. Provides platform overview, heavy on charts and tables. Best experienced on the Web app due to data density.

---

## 🧩 Key Global Components

- **Floating Navbar (`FloatingNavbar`):** A custom navigation pill that hovers slightly above the bottom of the screen. Provides quick access to Home, Videos, Practice, AI Tools, and Profile.
- **Modals (e.g., `PaymentModal`, `CommentSection`):** 
  - **Mobile:** Rendered as slide-up Bottom Sheets (easy one-handed access).
  - **Web:** Rendered as standardized centered popups with a backdrop blur, or side-drawers ensuring screen real estate isn't wasted.
- **Header/Top Bar:** Often transparent or dynamically colored based on the underlying content (like full-screen videos) to give a modern, immersive feel.

---

## 🎨 Theming and Styling
- The application relies on a unified design system dictated by a central theme config. 
- Supports light and dark modes inherently by leveraging React Native's `useColorScheme` and passing it to standard UI constituent parts.
- Uses flexbox layouts heavily, ensuring that spacing, padding, and alignments automatically adjust between a 300px mobile screen and a 1920px 4K web monitor.