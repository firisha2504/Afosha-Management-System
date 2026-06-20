# Fix Duplicate Apps and Wrong Icon

**Current Issues:**
1. ❌ **Two "Afosha MS" apps** on phone (duplicates)
2. ❌ **Wrong icon** - Blue scissors (default Flutter icon) instead of green "A" logo

**What We Need:**
1. ✅ **Only ONE app** on phone
2. ✅ **Correct icon** - Green background with white "A" logo

---

## Quick Fix (Automatic)

1. **Connect your phone** to computer via USB
2. **Enable USB Debugging** on phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"
3. **Open PowerShell/Command Prompt** in mobile folder:
   ```powershell
   cd "C:\Users\MyPC\Desktop\Afosha MS\mobile"
   ```
4. **Run the fix script**:
   ```powershell
   .\COMPLETE_FIX.bat
   ```

This will:
- ✅ Uninstall all old versions
- ✅ Generate correct app icons (green "A" logo)
- ✅ Build fresh app
- ✅ Install only ONE app with correct icon

---

## Manual Fix (If Script Doesn't Work)

### Step 1: Uninstall All Old Apps

**On Your Phone:**
1. Go to **Settings** → **Apps**
2. Find ALL apps named "Afosha MS" or "ams_mobile"
3. For EACH app:
   - Tap it
   - Tap **"Uninstall"**
   - Confirm
4. **Verify**: Check home screen - no Afosha icons should remain

### Step 2: Generate App Icons

```powershell
cd "C:\Users\MyPC\Desktop\Afosha MS\mobile"

# Generate icons from the green "A" logo
flutter pub run flutter_launcher_icons
```

**Expected Output:**
```
Creating Android launcher icons
  Creating xxxhdpi launcher icon
  Creating xxhdpi launcher icon
  Creating xhdpi launcher icon
  Creating hdpi launcher icon
  Creating mdpi launcher icon

Successfully generated launcher icons
```

### Step 3: Clean Build

```powershell
# Clean old builds
flutter clean

# Get dependencies
flutter pub get
```

### Step 4: Build and Install

**Option A: Connect via USB (ADB)**
```powershell
# Build
flutter build apk --release

# Install
adb install build\app\outputs\flutter-apk\app-release.apk
```

**Option B: Copy APK to Phone**
1. Build: `flutter build apk --release`
2. Find APK: `build\app\outputs\flutter-apk\app-release.apk`
3. Copy to phone (via USB or cloud)
4. Open APK on phone and install

---

## What the Correct Icon Looks Like

### Current (Wrong):
- 🔵 Blue background
- ✂️ Scissors icon (default Flutter)

### After Fix (Correct):
- 🟢 Green gradient background (#166534 → #15803d)
- ⚪ White letter "A"
- 🟡 Golden decorative circle
- ✨ Professional look matching website

---

## Why Duplicate Apps Happen

### Cause:
Different package IDs are treated as separate apps:
- Old: `com.example.ams_mobile`
- New: `com.afosha.ams_mobile`
- Current: `com.afosha.mobile`

Android sees each as a **different app** → Duplicates appear

### Solution:
Uninstall ALL old versions before installing new one

---

## Troubleshooting

### "adb is not recognized"
**Fix:**
1. Install Android SDK Platform Tools
2. Add to PATH or use full path:
   ```powershell
   C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools\adb.exe
   ```

### "No connected devices"
**Fix:**
1. Enable USB Debugging on phone
2. Connect via USB
3. Accept "Allow USB Debugging" popup on phone
4. Check: `adb devices` (should show your device)

### Icon still wrong after install
**Fix:**
1. Restart your phone
2. Clear launcher cache:
   - Settings → Apps → Launcher → Clear Cache
3. Reinstall app

### Still see TWO apps
**Fix:**
1. Uninstall BOTH manually from Settings → Apps
2. Restart phone
3. Run fix script again

### "flutter is not recognized"
**Fix:**
1. Install Flutter: https://docs.flutter.dev/get-started/install
2. Add to PATH

---

## Verification Checklist

After installation, verify on your phone:

- [ ] **Only ONE "Afosha MS" app** appears on home screen
- [ ] Icon has **green background** (not blue)
- [ ] Icon shows white **"A"** letter clearly
- [ ] Icon matches the website favicon
- [ ] App name is "Afosha MS"
- [ ] Tapping icon launches the app
- [ ] Login screen appears correctly

---

## Quick Commands Summary

```powershell
# Navigate to mobile folder
cd "C:\Users\MyPC\Desktop\Afosha MS\mobile"

# Run automatic fix
.\COMPLETE_FIX.bat
```

**OR Manual:**

```powershell
# Uninstall old versions
adb uninstall com.afosha.mobile
adb uninstall com.afosha.ams_mobile
adb uninstall com.example.ams_mobile

# Generate icons
flutter pub run flutter_launcher_icons

# Clean and build
flutter clean
flutter pub get
flutter build apk --release

# Install
adb install build\app\outputs\flutter-apk\app-release.apk
```

---

## Expected Result

### Before:
- 📱 Two "Afosha MS" apps on phone
- 🔵 Blue scissors icon
- ❌ Confusing and unprofessional

### After:
- 📱 One "Afosha MS" app
- 🟢 Green "A" logo (matches website)
- ✅ Clean and professional

---

## Files Involved

**Icon Source:**
- `mobile/assets/images/app_icon.png` - Base icon image
- `mobile/assets/images/app_icon.svg` - Vector version

**Configuration:**
- `mobile/pubspec.yaml` - flutter_launcher_icons config
- `mobile/android/app/build.gradle.kts` - Package ID

**Generated Icons:**
- `android/app/src/main/res/mipmap-*/ic_launcher.png` - All densities
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/` - iOS icons

---

## Need Help?

If the script doesn't work:
1. Check USB connection
2. Check USB Debugging is enabled
3. Try manual steps above
4. Check troubleshooting section

**The fix is simple: Uninstall old apps, regenerate icons, rebuild!** 🚀
