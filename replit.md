# Adventure Time - Offroad Recovery Assistance App

## Overview
Adventure Time is a mobile application built with Expo and React Native, designed to assist offroaders when their vehicle is stuck or broken on trails. It provides AI-powered image analysis for recovery procedures, offers comprehensive self-recovery guides, and facilitates rescue coordination with nearby offroad enthusiasts. The app aims to be a critical tool for safety and assistance in remote offroad environments, featuring a high-contrast design system optimized for outdoor visibility and gloved use.

## User Preferences
- High-contrast outdoor theme for visibility in bright sunlight
- Large touch targets (56x56pt minimum) for gloved operation
- Offline-first approach for areas without cell service
- Safety-focused design optimized for outdoor recovery scenarios

## System Architecture
The application is built using Expo SDK 54 and React Native, utilizing React Navigation 7 for a tab-based navigation structure. State management is handled with React hooks and AsyncStorage for local persistence. The styling employs a custom theme system with a focus on high visibility colors (e.g., Safety Orange) and generous spacing for usability with gloves.

Key features include:
- **Self-Recovery Guides**: Offline-accessible, categorized, and searchable guides with step-by-step instructions, equipment lists, and safety warnings.
- **AI-Powered Photo Analysis**: Utilizes `expo-image-picker` for photo upload to provide recovery recommendations. (Future integration opportunities with AI Vision APIs like OpenAI Vision or Google Gemini).
- **Nearby Offroaders Map**: An interactive map using `react-native-maps` displays user location, nearby offroaders, and geo-tagged community tips. It integrates with the National Weather Service API for real-time weather and includes a dynamic "Trail Conditions Card" that analyzes weather and community reports to provide risk levels and safety recommendations. A reporting feature allows users to submit geo-tagged trail conditions.
- **Off-Highway GPS Navigation**: A "Navigate" tab offers trail discovery, allowing users to browse and filter off-highway trails by difficulty and land type. Detailed trail information and pre-planned routes are available offline.
- **User Profile**: A customizable profile for contact information, vehicle details, and experience level, with data persisted locally via AsyncStorage.

The project structure is organized into `screens`, `components`, `navigation`, `data`, `utils`, `constants`, `hooks`, and `assets` directories, promoting modularity and maintainability.

## External Dependencies
- **Expo SDK**: Core framework for React Native development.
- **React Navigation**: For app navigation and routing.
- **@react-native-async-storage/async-storage**: For local data persistence.
- **@expo/vector-icons**: For icons (specifically Feather icons).
- **expo-image-picker**: For accessing the device's photo library and camera.
- **expo-location**: For handling user location services and permissions.
- **expo-web-browser**: For opening Stripe Payment Links in an in-app browser.
- **react-native-maps**: For interactive map functionalities (using Google Maps provider).
- **National Weather Service API**: For fetching real-time weather data (no API key required).
- **Stripe Payment Links**: For backend-free donation processing via Stripe's hosted checkout.