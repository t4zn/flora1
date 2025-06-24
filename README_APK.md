# Flora - Convert to APK Instructions

## Method 1: Using PWABuilder (Recommended)

1. **Visit PWABuilder**
   - Go to https://www.pwabuilder.com/
   - Enter your Flora app URL: `https://your-replit-url.replit.app`

2. **Generate APK**
   - Click "Start" and let PWABuilder analyze your app
   - Select "Android" platform
   - Click "Generate Package"
   - Download the generated APK file

3. **Install APK**
   - Transfer the APK to your Android device
   - Enable "Install from Unknown Sources" in settings
   - Install the APK

## Method 2: Using Capacitor

1. **Install Capacitor**
   ```bash
   npm install -g @capacitor/cli
   npm install @capacitor/core @capacitor/android
   ```

2. **Initialize Capacitor**
   ```bash
   npx cap init Flora com.flora.app
   ```

3. **Add Android Platform**
   ```bash
   npx cap add android
   ```

4. **Build APK**
   ```bash
   npx cap run android
   ```

## Method 3: Using Cordova

1. **Install Cordova**
   ```bash
   npm install -g cordova
   ```

2. **Create Cordova Project**
   ```bash
   cordova create FloraApp com.flora.app Flora
   cd FloraApp
   ```

3. **Add Android Platform**
   ```bash
   cordova platform add android
   ```

4. **Build APK**
   ```bash
   cordova build android
   ```

## Method 4: Online APK Builders

1. **AppsGeyser**
   - Visit https://appsgeyser.com/
   - Select "Website" option
   - Enter your Flora app URL
   - Customize app settings
   - Generate and download APK

2. **Appy Pie**
   - Visit https://www.appypie.com/
   - Choose "Website to App" converter
   - Enter your Flora URL
   - Design and build APK

## PWA Features Included

- **Offline Support**: Service worker caches app for offline use
- **App Icons**: 192x192 and 512x512 PNG icons
- **Splash Screen**: Automatically generated
- **Full Screen**: Standalone display mode
- **Theme Colors**: Green theme matching Flora branding

## App Features

- Plant identification using AI
- Botanical expert chatbot
- Camera integration
- Scientific plant database
- Care tips and guidance
- Mobile-optimized interface

## Requirements

- Android 5.0+ (API level 21)
- Camera permission for plant photos
- Internet connection for AI features
- 50MB storage space

## Distribution

1. **Google Play Store**: Requires developer account ($25)
2. **Direct APK**: Share APK file directly
3. **Alternative Stores**: Amazon Appstore, Samsung Galaxy Store

Your Flora app is now PWA-ready and can be converted to an APK using any of the methods above!