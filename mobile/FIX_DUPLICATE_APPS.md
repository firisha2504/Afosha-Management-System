# Fix Duplicate App Installations

## Problem Diagnosis

You currently have the package ID:
```
com.example.ams_mobile
```

This is **Flutter's default example package name** and should be changed for production.

The duplicate apps issue is caused by:
1. Multiple installations with the same package ID but different signatures
2. Or multiple debug/release builds installed simultaneously
3. The default "example" package name is not unique

---

## ✅ Solution: Change Package ID to Production Name

### Step 1: Update Package ID

The package ID should be changed from:
- ❌ `com.example.ams_mobile` (generic example name)

To something like:
- ✅ `com.afosha.ams_mobile` (production name)
- ✅ `et.afosha.mobile` (if you have an Ethiopian domain)
- ✅ `com.yourcompany.afosha` (your actual company domain)

**Choose a unique reverse-domain name format:**
- Format: `com.company.appname` or `country.company.appname`
- Example: `com.afosha.mobile` or `et.afosha.ams`

---

### Step 2: Uninstall All Existing Installations

**On Your Phone:**
1. Go to **Settings** → **Apps**
2. Find all **ams_mobile** apps (both copies)
3. Tap each one and click **Uninstall**
4. Repeat until no ams_mobile apps remain

**Or via command line** (if adb is set up):
```bash
# Find all ams installations
adb shell pm list packages | findstr ams

# Uninstall (use the actual package name from above)
adb uninstall com.example.ams_mobile
```

---

### Step 3: Install Fresh with New Package ID

I'll update the package ID for you to a production-ready name.

**Recommended:** `com.afosha.mobile`

After I update it:
```bash
cd "c:\Users\MyPC\Desktop\Afosha MS\mobile"
flutter clean
flutter pub get
flutter run
```

This will install a **single, clean copy** with the new package ID.

---

## Files That Need Updating

To change package ID properly, these files must be updated:

1. ✅ `android/app/build.gradle.kts` - applicationId & namespace
2. ✅ `android/app/src/main/kotlin/.../MainActivity.kt` - package declaration (if exists)
3. ✅ `ios/Runner.xcodeproj/project.pbxproj` - PRODUCT_BUNDLE_IDENTIFIER (for iOS)

---

## Would you like me to:

**Option A:** Change package ID to `com.afosha.mobile` (recommended)
**Option B:** Change package ID to a different name you specify
**Option C:** Keep as is and just provide uninstall instructions

Let me know which option you prefer, and I'll make the changes!

---

## Quick Manual Fix (If You Prefer)

If you want to do it manually:

1. **Edit `android/app/build.gradle.kts`:**
   ```kotlin
   android {
       namespace = "com.afosha.mobile"  // ← Change this
       
       defaultConfig {
           applicationId = "com.afosha.mobile"  // ← And this
       }
   }
   ```

2. **Uninstall old apps from phone**

3. **Run:**
   ```bash
   flutter clean
   flutter pub get
   flutter run
   ```

---

## Why This Happens

- `com.example.*` is the default Flutter template package name
- Android treats each unique package ID as a separate app
- Multiple builds (debug/release, old/new) with same package ID can coexist
- Changing package ID makes Android treat it as a completely new app
- Uninstalling old ones removes the duplicates

---

## After Fix

✅ Only **one** ams_mobile icon will appear  
✅ Future updates will replace the same app  
✅ No more confusion between versions  
✅ Production-ready package name  
