# Offroad Recovery App - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - The app needs user accounts for:
- Rescue coordination with nearby offroaders
- Profile visibility when requesting help
- Saving favorite guides and recovery history

**Implementation:**
- Use SSO (Apple Sign-In for iOS, Google Sign-In for cross-platform)
- Login/signup screens with privacy policy & terms of service links
- Profile screen with:
  - User-customizable avatar (generate 4 rugged offroad-themed avatars: jeep silhouette, mountain terrain, tire tracks, compass)
  - Display name and vehicle type fields
  - Log out and delete account options (nested under Settings > Account)

### Navigation
**Tab Navigation** (4 tabs)

**Tab Structure:**
1. **Guides** - Browse self-recovery guides by category
2. **AI Scan** - Upload photos for AI-powered recovery analysis
3. **Nearby** - Map view of nearby offroaders who can assist
4. **Profile** - User settings, saved guides

### Screen Specifications

#### 1. Guides Screen (Home Tab)
- **Purpose:** Browse categorized self-recovery guides, accessible offline
- **Layout:**
  - Transparent header with search bar (right button: filter icon)
  - Scrollable content with category cards
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components:**
  - Search bar in header
  - Category cards: "Stuck in Mud," "Sand Recovery," "Rock Crawling," "Mechanical Issues," "Winching," "Tire Repairs"
  - Each card shows category icon, title, number of guides
  - Tapping card navigates to guide list (stack navigation)
- **Offline:** Cache all guide content locally

#### 2. Guide Detail Screen (Modal from Guides)
- **Purpose:** View step-by-step recovery instructions
- **Layout:**
  - Default navigation header (left: back, right: bookmark icon)
  - Scrollable content with large text and diagrams
  - Safe area: top = Spacing.xl, bottom = insets.bottom + Spacing.xl
- **Components:**
  - Guide title and difficulty badge
  - Required equipment list with checkboxes
  - Numbered step cards with illustrations
  - Safety warning callouts (yellow background)
  - "Mark as completed" button at bottom

#### 3. AI Scan Screen (Tab 2)
- **Purpose:** Upload vehicle/situation photos for AI analysis
- **Layout:**
  - Transparent header with title "AI Recovery Scan"
  - Scrollable content area
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components:**
  - Large camera button with "Take Photo" label
  - "Upload from Gallery" secondary button
  - Recent scans list (thumbnail, timestamp, situation type)
  - Empty state: illustration of phone camera with instructions
- **Flow:** After photo capture → AI Analysis Results screen (stack navigation)

#### 4. AI Analysis Results Screen (Stack from AI Scan)
- **Purpose:** Display AI-generated recovery recommendations
- **Layout:**
  - Default header (left: back, right: share icon)
  - Scrollable content
  - Safe area: top = Spacing.xl, bottom = insets.bottom + Spacing.xl
- **Components:**
  - Uploaded photo preview
  - Situation summary card (AI-detected issue type)
  - Recommended recovery procedure (step-by-step)
  - Difficulty and risk assessment badges
  - "Save to Guides" action button
  - Disclaimer text: "AI suggestions - use professional judgment"

#### 5. Nearby Screen (Tab 3)
- **Purpose:** Map view of nearby offroaders available to help
- **Layout:**
  - Custom header with GPS accuracy indicator (left: location icon, right: refresh button)
  - Map fills entire screen beneath header
  - Bottom sheet overlay for offroader details (draggable)
  - Safe area: map extends under tab bar; bottom sheet respects tabBarHeight + Spacing.xl
- **Components:**
  - Map with user location (blue dot) and nearby offroaders (orange pins)
  - Tapping pin shows offroader card in bottom sheet
  - Offroader card: avatar, name, vehicle type, distance, contact button
  - Empty state: "No offroaders nearby - guides available offline"
- **Offline:** Show cached last-known positions with "Offline" indicator

#### 6. Profile Screen (Tab 4)
- **Purpose:** Manage user settings and app preferences
- **Layout:**
  - Transparent header with title "Profile"
  - Scrollable form
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components:**
  - Avatar selection (4 preset rugged avatars)
  - Display name and vehicle type fields
  - Offline mode toggle
  - Download guides for offline use button
  - Settings link (navigates to Settings screen in stack)
  - Saved guides list

#### 7. Settings Screen (Stack from Profile)
- **Purpose:** App preferences and account management
- **Layout:**
  - Default header (left: back, title: "Settings")
  - Scrollable list
  - Safe area: top = Spacing.xl, bottom = insets.bottom + Spacing.xl
- **Components:**
  - Theme toggle (light/dark - default to high-contrast mode)
  - Notification preferences
  - Location sharing permissions
  - Cache management ("Clear offline guides")
  - Account section: Log out, Delete account (with confirmations)
  - Privacy policy and terms of service links

## Design System

### Color Palette
**High-Contrast Outdoor Theme:**
- Primary: Safety Orange (#FF6B35) - primary actions, critical features
- Secondary: Trail Brown (#8B4513) - navigation, category headers
- Accent: GPS Blue (#2196F3) - location indicators, map elements
- Background: Off-White (#F5F5F5) for light mode, Dark Charcoal (#1E1E1E) for dark mode
- Success: Forest Green (#2E7D32)
- Warning: Caution Yellow (#FBC02D)
- Error: Alert Red (#D32F2F)
- Text: High contrast black (#000000) or white (#FFFFFF) depending on mode
- Borders: Medium Gray (#BDBDBD)

### Typography
- **Headings:** Bold, 24-28pt for outdoor readability
- **Body:** Regular, 18-20pt (larger than standard for gloved use)
- **Labels:** Semibold, 16pt
- **Buttons:** Bold, 18pt
- Font: System font (San Francisco for iOS, Roboto for Android)

### Touch Targets
- Minimum 56x56pt for all interactive elements (larger for gloved hands)
- Card tap areas: full card width, minimum 80pt height
- Spacing between interactive elements: minimum 16pt

### Visual Feedback
- All touchable elements scale down slightly (0.95) when pressed
- Map pins bounce when selected
- Loading states show pulse animation for offline sync

### Icons
- Use Feather icons from @expo/vector-icons
- Icon size: 28pt minimum for visibility
- Navigation uses outlined style

### Critical Assets
1. **4 User Avatars** (rugged offroad theme):
   - Jeep silhouette on mountain background
   - Topographic map pattern circle
   - Tire tread pattern circle
   - Compass rose design
2. **Category Illustrations:**
   - Vehicle stuck in mud (brown/orange tones)
   - Vehicle on rocks (gray/brown tones)
   - Winch recovery diagram (simple line art)
   - Tire repair tools (wrench, jack icons)
3. **Empty States:**
   - Phone camera with mountain backdrop for AI Scan
   - Map pin with "No Signal" for offline Nearby view

### Accessibility
- Support dynamic type scaling
- VoiceOver labels for all interactive elements
- High contrast mode by default
- Haptic feedback for critical actions
- Offline indicators clearly visible (yellow badge with "Offline" text)
- Red/green color combinations avoided; use icons + text labels