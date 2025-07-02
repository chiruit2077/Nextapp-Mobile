# NextApp Auto Parts CRM - Mobile App

<div align="center">
  <img src="https://images.pexels.com/photos/3688890/pexels-photo-3688890.jpeg?auto=compress&cs=tinysrgb&w=400" alt="NextApp Auto Parts CRM" width="120" height="120" style="border-radius: 20px;" />
  
  # NextApp Auto Parts CRM Mobile
  
  **Professional field management app for auto parts dealers**
  
  [![Expo](https://img.shields.io/badge/Expo-53.0.0-blue.svg)](https://expo.dev/)
  [![React Native](https://img.shields.io/badge/React%20Native-0.79.1-green.svg)](https://reactnative.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
  [![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)](#)
</div>

---

## 📱 Features

### 🎨 **Modern Mobile UI/UX**

#### **Enhanced Navigation Architecture**
- **Streamlined 4-Tab Navigation**: Optimized for mobile with essential tabs
  - 🏠 **Dashboard**: Role-based analytics and quick actions
  - 🛒 **Orders**: Complete order lifecycle management
  - 📊 **Reports**: Business intelligence and reporting
  - 👤 **Profile**: User settings and account management
- **Hamburger Menu**: Side drawer for accessing all app sections from any screen
- **Consistent Gradient Headers**: Beautiful headers with proper spacing across all screens
- **Role-Based Navigation**: Dynamic menu items based on user permissions

#### **Order Management System**
- **Multi-step Order Creation**: Intuitive flow with visual progress indicators
- **Store Selection**: Added store selection step for admin and manager roles
- **Role-based Logic**: Automatically uses store from user profile for non-admin roles
- **Cart Integration**: Seamless integration with parts catalog for easy ordering

#### **Advanced Filter & Sort System**
- **Universal Filter Modal**: Consistent filtering experience across all screens
- **Smart Filters**: Context-aware filter options based on data and user role
- **Multi-criteria Sorting**: Advanced sorting with visual indicators
- **Real-time Counts**: Live filter counts for better user guidance

#### **Enhanced Parts Management**
- **Visual Product Cards**: Rich product displays with images and badges
- **Stock Status Indicators**: Real-time stock levels with color-coded alerts
- **Discount Visualization**: Clear pricing with discount breakdowns
- **Category Badges**: Visual categorization for quick identification

#### **Improved Retailers Management**
- **Enhanced Retailer Cards**: Comprehensive retailer information display
- **Credit Limit Indicators**: Visual credit status and high-value badges
- **Status Management**: Clear active/pending/inactive status indicators
- **Contact Integration**: Direct access to retailer contact information

#### **Modern Reports & Analytics**
- **Interactive Dashboards**: Role-based analytics with visual KPIs
- **Performance Metrics**: Real-time business intelligence
- **Growth Indicators**: Trend analysis with visual growth indicators
- **Top Performers**: Leaderboards for products, retailers, and sales

---

## 📱 Cross-Platform Compatibility

### **iOS Devices**
- **iPhone**: Optimized for all iPhone models with proper safe area handling
- **iPad**: Enhanced tablet layout with optimized UI components and spacing
- **iOS-specific features**:
  - Native blur effects for glass UI components
  - iOS-specific input handling (clear buttons, keyboard types)
  - Proper safe area insets for notches and home indicators

### **Android Devices**
- **Phones**: Optimized for various screen sizes and aspect ratios
- **Tablets**: Responsive layouts for larger screens
- **Android-specific features**:
  - Material Design-inspired elevation and shadows
  - Proper status bar handling
  - Adaptive back button behavior

### **Responsive Design**
- **Adaptive Layouts**: UI automatically adjusts to different screen sizes
- **Orientation Support**: Proper handling of portrait and landscape modes
- **Tablet Optimizations**: Enhanced layouts for tablet devices with:
  - Multi-column layouts where appropriate
  - Larger touch targets and text
  - Better use of screen real estate

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/nextapp-autoparts-mobile.git
cd nextapp-autoparts-mobile
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on your device or simulator:
- Scan the QR code with the Expo Go app (Android) or Camera app (iOS)
- Press 'a' for Android simulator
- Press 'i' for iOS simulator
- Press 'w' for web browser

---

## 📂 Project Structure

```
nextapp-autoparts-mobile/
├── 📱 app/                          # Expo Router app directory
│   ├── 🔐 (auth)/                   # Authentication flow
│   │   ├── _layout.tsx              # Auth stack configuration
│   │   └── login.tsx                # Enhanced login with CORS handling
│   ├── 📊 (tabs)/                   # Streamlined tab navigation
│   │   ├── _layout.tsx              # Modern 4-tab layout
│   │   ├── index.tsx                # Role-based dashboard
│   │   ├── parts/                   # Enhanced parts management
│   │   ├── orders/                  # Complete order management
│   │   ├── retailers.tsx            # Enhanced retailer management
│   │   ├── reports.tsx              # Modern analytics dashboard
│   │   ├── inventory.tsx            # Inventory management
│   │   └── profile.tsx              # User profile management
│   ├── _layout.tsx                  # Root layout with providers
│   └── +not-found.tsx               # 404 error handling
├── 🧩 components/                   # Enhanced UI components
│   ├── PlatformSafeAreaView.tsx     # Cross-platform safe area handling
│   ├── TouchableScale.tsx           # Enhanced touch feedback
│   ├── ModernButton.tsx             # Responsive button component
│   ├── ModernCard.tsx               # Adaptive card component
│   ├── ModernHeader.tsx             # Cross-platform header
│   ├── FilterModal.tsx              # Universal filter component
│   ├── SearchBar.tsx                # Platform-optimized search
│   └── [other components]           # Additional UI components
├── 🔄 context/                      # Global state management
│   ├── AuthContext.tsx              # Enhanced authentication
│   └── ToastContext.tsx             # Toast notifications
├── 🌐 services/                     # API integration
│   └── api.ts                       # Enhanced API service with CORS
├── 🪝 hooks/                        # Custom React hooks
│   └── useResponsiveStyles.ts       # Responsive styling utilities
├── 📝 types/                        # TypeScript definitions
│   ├── api.ts                       # API interfaces
│   └── env.d.ts                     # Environment variables
└── 📋 README.md                     # Project documentation
```

---

## 🔧 Key Technical Features

### **Responsive Design System**
- **Device Detection**: Automatic detection of device type (phone/tablet)
- **Orientation Handling**: Responsive layouts for portrait and landscape
- **Platform-Specific Styling**: Optimized UI for iOS and Android
- **Consistent Typography**: Scalable font sizes across devices

### **Cross-Platform Components**
- **PlatformSafeAreaView**: Safe area handling for notches and home indicators
- **TouchableScale**: Enhanced touch feedback with platform-specific animations
- **ModernHeader**: Consistent headers with platform-specific styling
- **FilterModal**: Universal filtering with responsive layouts

### **Performance Optimizations**
- **Efficient List Rendering**: Optimized FlatList configurations
- **Lazy Loading**: On-demand data fetching
- **Memoization**: Preventing unnecessary re-renders
- **Animation Performance**: Hardware-accelerated animations

### **Platform-Specific Enhancements**
- **iOS**: 
  - Native blur effects
  - iOS-specific input handling
  - Proper safe area insets
- **Android**:
  - Material Design-inspired components
  - Proper status bar handling
  - Adaptive back button behavior

---

## 📱 Order Management System

The Order Management System is a comprehensive solution for handling the complete order lifecycle in the auto parts distribution business. It provides role-based access control, real-time status updates, and seamless integration with inventory and customer management systems.

### Key Features
- **Multi-role Access**: Different interfaces for Admin, Manager, Salesman, Storeman, and Retailer
- **Real-time Updates**: Live order status tracking and notifications
- **Advanced Filtering**: Smart search and filter capabilities
- **Mobile-first Design**: Optimized for field operations
- **Status Management**: Comprehensive order lifecycle tracking

### Order Lifecycle
```
New → Pending → Processing → Picked → Dispatched → Completed
  ↓      ↓         ↓          ↓         ↓
 Hold   Hold     Hold       Hold      Hold
  ↓      ↓         ↓          ↓         ↓
Cancelled ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

### User Roles & Permissions

| Feature | Super Admin | Admin | Manager | Storeman | Salesman | Retailer |
|---------|-------------|-------|---------|----------|----------|----------|
| **View Orders** | ✅ All | ✅ Company | ✅ Store | ✅ Assigned | ✅ Created | ✅ Own Only |
| **Create Orders** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Edit Orders** | ✅ | ✅ | ✅ | ❌ | ✅ Limited | ❌ |
| **Update Status** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Cancel Orders** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Reports** | ✅ | ✅ | ✅ | ✅ Limited | ✅ Limited | ❌ |

---

## 🔄 API Integration

The app integrates with a RESTful API for all data operations. Key features include:

- **Authentication**: JWT-based authentication with token refresh
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **CORS Handling**: Platform-specific CORS solutions for web and mobile
- **Caching**: Efficient data caching for improved performance
- **Offline Support**: Basic functionality available without internet connection

---

## 🧪 Testing

### Unit Testing
- Component tests using React Native Testing Library
- API integration tests
- Utility function tests

### Integration Testing
- User flow tests
- Navigation tests
- Form submission tests

### Device Testing
- iOS: iPhone (various models) and iPad
- Android: Phone and tablet testing
- Web: Cross-browser compatibility

---

## 📦 Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

### Web
```bash
npm run build:web
```

---

## 🔒 Security Considerations

- **Authentication**: Secure token storage using expo-secure-store
- **API Security**: HTTPS for all API communications
- **Input Validation**: Client-side and server-side validation
- **Sensitive Data**: Proper handling of sensitive information

---

## 🚀 Deployment

The app can be deployed to:

- **iOS App Store**: Using EAS Build and Submit
- **Google Play Store**: Using EAS Build and Submit
- **Web**: Any static hosting service (Netlify, Vercel, etc.)

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <h3>NextApp Auto Parts CRM Mobile</h3>
  <p><em>Modern mobile CRM with advanced filtering, analytics, and seamless user experience</em></p>
  
  **Built with ❤️ by the NextApp Team**
  
  [🌐 Website](https://yogrind.shop) • [📧 Contact](mailto:support@nextapp.com) • [📖 Docs](https://docs.yogrind.shop)
</div>