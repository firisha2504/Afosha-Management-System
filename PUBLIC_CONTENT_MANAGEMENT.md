# Public Content Management Feature ✓

**Status**: ✅ COMPLETE  
**Date**: June 18, 2026  
**Access**: Admin only

---

## Overview

Added a new admin panel for managing public-facing content, including the About page tabs, contact information, and organization logo upload capability.

---

## Features

### 1. **Public Content Editor** 📝
Admins can now edit all public About page content through an intuitive UI:

#### Editable Sections:
- **About Afosha** - Organization description
- **Mission & Vision** - Goals and vision statements
- **Rules & Regulations (Heera fi Danbii)** - Constitutional basis and objectives
- **Contact Information** - Phone, email, and address

#### For Each Section:
- ✅ English title and content
- ✅ Afaan Oromoo (Oromiffa) title and content
- ✅ Multi-line text support
- ✅ Real-time preview on public site
- ✅ Save and reset functionality

### 2. **Logo Upload** 🖼️
(Backend endpoint needs implementation)

- Upload organization logo
- Supported formats: SVG, PNG, JPG
- Recommended size: 512x512px (square)
- Preview before upload
- Replaces default "A" logo on public pages

---

## Access

### Navigation:
**Admin Sidebar** → **Public Content** (near bottom, above Backup)

### Route:
`/public-content`

### Permissions:
- ✅ Admin only
- ❌ Auditor - no access
- ❌ Member - no access

---

## How to Use

### Editing Content:

1. **Login as Admin**
2. **Navigate** to sidebar → **Public Content**
3. **Select a tab** (About Afosha, Mission & Vision, etc.)
4. **Edit** both English and Oromiffa versions:
   - Update title
   - Update content (use line breaks for formatting)
5. **Click "Save Changes"**
6. **Visit** `/about` on public site to see changes live

### Uploading Logo (when backend implemented):

1. **Click "Choose File"** in Logo section
2. **Select** your logo image
3. **Preview** the logo
4. **Click "Upload Logo"**
5. Logo will appear on:
   - Public landing page header
   - About page header
   - App icon (may require rebuild)

---

## Technical Details

### Frontend

**New File**: `web/src/pages/PublicContentPage.tsx`

**Features**:
- Tab-based interface for each content section
- Bilingual editing (English + Oromiffa)
- Form validation
- Save/reset functionality
- File upload with preview
- Responsive design

**State Management**:
```typescript
interface ContentTab {
  slug: string;
  title: string;
  titleOm?: string;
  content: string;
  contentOm?: string;
}
```

### Backend API

**Existing Endpoints**:
- `GET /api/public/about` - Fetch all content tabs
- `GET /api/public/content/:slug` - Fetch specific content
- `PUT /api/public/content/:slug` - Update content (Admin only)

**Endpoint to Implement**:
- `POST /api/settings/logo` - Upload logo file

### Route Configuration

**Added to**:
- `web/src/App.tsx` - Route definition
- `web/src/components/Layout.tsx` - Admin navigation

---

## Example Usage

### Updating Contact Information:

1. Select **"Contact Information"** tab
2. Edit English content:
```
Email: info@afosha.org
Phone: +251 930 983 000
Address: Addis Ababa, Ethiopia
Website: www.afosha.org
```

3. Edit Oromiffa content:
```
Imeelii: info@afosha.org
Bilbila: +251 930 983 000
Teessoo: Finfinnee, Itoophiyaa
Marsariitii: www.afosha.org
```

4. Click **"Save Changes"**
5. Changes appear immediately on `/about` page

---

## Logo Upload Implementation

### Backend Route Needed:

**File**: `backend/src/routes/settings.routes.ts`

```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: 'uploads/logo/',
  filename: (req, file, cb) => {
    cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

router.post('/logo', authenticate, authorize('ADMIN'), upload.single('logo'), async (req, res) => {
  // Save logo path to database or settings
  const logoPath = `/uploads/logo/${req.file.filename}`;
  
  await prisma.systemSetting.upsert({
    where: { key: 'organization_logo' },
    create: { key: 'organization_logo', value: logoPath },
    update: { value: logoPath },
  });
  
  sendSuccess(res, { logoPath }, 'Logo uploaded successfully');
});
```

### Frontend Integration:

Logo would replace the hardcoded "A" logo in:
- `PublicLayout.tsx` (public pages)
- `Layout.tsx` (admin dashboard)
- PWA icons (requires regeneration)

---

## Guidelines Panel

The page includes helpful instructions:

📝 **Editing Guidelines**
- Contact Information: Edit phone, email, and address
- About Content: Update organization description
- Rules & Regulations: Edit constitutional basis
- Mission & Vision: Update organizational goals
- Bilingual Support: Always provide both languages
- Preview: Visit public About page to see changes

---

## Benefits

### For Admins:
✅ Easy content management without code changes  
✅ No need to edit database directly  
✅ Bilingual support built-in  
✅ Immediate preview on public site  
✅ Simple, intuitive interface  

### For Organization:
✅ Keep public information up-to-date  
✅ Professional branding with custom logo  
✅ Maintain bilingual content easily  
✅ Control public messaging  

---

## Future Enhancements

### Potential Additions:
1. **Rich Text Editor** - Formatting options (bold, italic, lists)
2. **Image Gallery** - Multiple images for About page
3. **Content History** - Track changes and revert
4. **Preview Mode** - See changes before publishing
5. **Social Media Links** - Edit footer social links
6. **SEO Settings** - Meta descriptions for public pages
7. **Analytics** - Track page views on public content

---

## Testing Checklist

- [ ] Admin can access Public Content page
- [ ] Auditor cannot access page
- [ ] All 4 tabs are editable
- [ ] English content saves correctly
- [ ] Oromiffa content saves correctly
- [ ] Changes reflect on /about page
- [ ] Language toggle works on public site
- [ ] Reset button restores original content
- [ ] Logo upload section displays (when backend ready)
- [ ] Error handling for failed saves

---

## Files Modified

### New Files:
- `web/src/pages/PublicContentPage.tsx` - Main content management page

### Modified Files:
- `web/src/App.tsx` - Added route
- `web/src/components/Layout.tsx` - Added navigation item

---

## Commands

```bash
# Access the feature
# Login as admin, then navigate to:
http://localhost:5173/public-content

# Test public changes
http://localhost:5173/about
```

---

## Summary

✅ **Public Content Management page created**  
✅ **Admin can edit all About page content**  
✅ **Bilingual editing supported**  
✅ **Logo upload UI ready** (backend pending)  
✅ **Navigation added to admin sidebar**  
✅ **Real-time updates on public site**  

Admins now have full control over public-facing content without touching code or database! 🎉
