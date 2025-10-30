# Seedream Studio - Architectural Decisions Summary

## Key Changes Made

### 1. Image Display: Base64 (b64_json) ✅

**Decision:** Use `response_format: "b64_json"` instead of URL format

**Why:**
- ✅ **Simpler** - Display immediately with `<img src="data:image/png;base64,..." />`
- ✅ **No extra fetch** - No blob URL conversion needed
- ✅ **More reliable** - No 24-hour URL expiry concerns
- ✅ **Works offline** - Data in memory
- ✅ **Easy download** - Convert to blob only when user clicks download

**Implementation:**
```typescript
// Request
{
  response_format: 'b64_json', // ← Use this
  // ... other params
}

// Display
<img src={`data:image/png;base64,${response.data[0].b64_json}`} />

// Download (if needed)
const blob = base64ToBlob(base64String);
downloadBlob(blob, 'image.png');
```

**Alternative considered:** Fetching URL → blob URL conversion
- ❌ More complex (extra fetch call)
- ❌ Need to manage blob URL lifecycle
- ❌ URL expires after 24 hours
- ❌ Extra network round trip

---

### 2. Database: Supabase from Start ✅

**Decision:** Use Supabase PostgreSQL from the beginning, no auth yet

**Why:**
- ✅ **Easy sharing** - Friends can access presets and see generation history
- ✅ **Cross-device** - Access from any device
- ✅ **No localStorage limits** - Can store unlimited presets/history
- ✅ **Auth later** - Easy to add when ready (just add `user_id` columns + RLS)
- ✅ **Portfolio-ready** - Shows you can work with real databases

**What's stored:**
- ✅ Generation metadata (prompt, params, timestamps)
- ✅ Presets (saved parameter configurations)
- ❌ Images (too large, use base64 in memory only)

**Current setup:** Open/shared tables (no `user_id`)
- Everyone can see all presets
- Everyone can see all generation history
- Good for sharing with friends

**Future upgrade path:**
1. Enable Supabase Auth
2. Add `user_id` columns to tables
3. Enable Row Level Security (RLS)
4. Private data per user

---

### 3. API Parameters: Simplified

**What we support:**
- ✅ 3 generation modes (Text, Image, Multi-Image)
- ✅ All parameters from API_REFERENCE.md
- ❌ No batch generation (always `sequential_image_generation: "disabled"`)
- ❌ No streaming (always `stream: false`)
- ❌ No watermark (always `watermark: false`)

**Fixed parameters:**
```typescript
{
  model: 'seedream-4-0-250828',
  stream: false,
  watermark: false,
  sequential_image_generation: 'disabled',
  response_format: 'b64_json', // Default
}
```

**User-configurable:**
- Prompt (required)
- Reference images (0, 1, or 2-10 based on mode)
- Size (presets or custom dimensions)
- Quality (standard/fast)
- Seed (random or specific number)

---

## Database Schema

### No Auth Version (Current)

```sql
-- Generations (metadata only)
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  prompt text NOT NULL,
  mode text NOT NULL, -- 'text', 'image', 'multi-image'
  reference_image_urls text[],
  
  size text NOT NULL,
  quality text NOT NULL,
  seed integer NOT NULL,
  
  output_size text NOT NULL, -- e.g., "1760x2368"
  generation_time_ms integer,
  model_version text DEFAULT 'seedream-4-0-250828'
);

-- Presets
CREATE TABLE presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  name text NOT NULL UNIQUE,
  description text,
  mode text NOT NULL,
  
  prompt text NOT NULL,
  reference_image_urls text[],
  
  size text NOT NULL,
  quality text NOT NULL,
  seed integer NOT NULL
);
```

### With Auth (Future)

Just add `user_id` columns and RLS policies:

```sql
ALTER TABLE generations ADD COLUMN user_id uuid REFERENCES auth.users(id);
ALTER TABLE presets ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own data
CREATE POLICY "Users view own" ON generations
  FOR SELECT USING (auth.uid() = user_id);
-- ... etc
```

---

## Component Architecture

### Core Components

1. **Mode Tabs** (3 tabs)
   - Text to Image
   - Image to Image
   - Multi-Image Blending

2. **Image URL Inputs** (dynamic)
   - None for Text mode
   - 1 input for Image mode
   - 2-10 inputs for Multi-Image mode
   - Validation checkmark per URL

3. **Parameter Controls**
   - Size (presets or custom)
   - Quality (standard/fast toggle)
   - Seed (number input + random button)

4. **API Preview Panel**
   - Shows exact JSON being sent
   - Real-time updates
   - Copy to clipboard
   - Collapsible

5. **Generation Output**
   - Display base64 image
   - Download button
   - Metadata (size, time)
   - Save as preset
   - Save to history

6. **Preset Manager**
   - Load from Supabase
   - Save to Supabase
   - Delete from Supabase
   - Shows all presets (no auth yet)

7. **Generation History**
   - Fetch from Supabase
   - Shows metadata only (no images)
   - Search and filter
   - Regenerate with same params
   - Shows all history (no auth yet)

---

## Development Timeline

### Updated Estimate: 5-7 hours

**Phase 1: Setup (45 min)**
- Next.js + TypeScript
- Shadcn/ui
- Supabase setup
- Database migration

**Phase 2: Core UI (1 hour)**
- Layout + theme
- Mode tabs
- Basic styling

**Phase 3: Text to Image (1-2 hours)**
- Prompt input
- Parameters
- API client
- Base64 display
- Supabase save

**Phase 4: Image Modes (1-2 hours)**
- URL inputs
- Validation
- Multi-image support

**Phase 5: Database Features (1-2 hours)**
- Presets CRUD
- History display
- API preview
- Mobile responsive

---

## Why These Decisions Make Sense

### Base64 vs URL
- **Faster development** - Less code to write
- **More reliable** - No URL expiry edge cases
- **Simpler debugging** - Data is right there
- **Better UX** - Immediate display

### Supabase from Start
- **Future-proof** - Auth is one migration away
- **Shareable** - Can already share with friends
- **Portfolio-ready** - Shows database skills
- **No migration pain** - Don't need to move from localStorage later

### No Auth Yet
- **Faster to build** - One less system to implement
- **Good for testing** - Easier to develop and debug
- **Easy to add** - Clear upgrade path when needed
- **Works for friends** - Open sharing is fine for small groups

---

## What Users See

**Current version:**
1. Open app at your-domain.com
2. Enter their Seedream API key (stored in localStorage)
3. Select mode (Text/Image/Multi-Image)
4. Enter prompt and parameters
5. See API preview (optional panel)
6. Click Generate
7. Image displays immediately from base64
8. Can download, save as preset, or save to history
9. All presets and history visible to everyone (no login)

**Future with auth:**
- Add login/signup screen
- Private presets and history per user
- Everything else stays the same

---

## Technical Stack Summary

**Frontend:**
- Next.js 15 (App Router)
- TypeScript (strict)
- React 19
- Tailwind CSS
- Shadcn/ui

**Backend:**
- Supabase PostgreSQL (metadata only)
- No auth yet (add later)
- No file storage (images in memory only)

**API:**
- Seedream 4.0 API
- Base64 response format
- 3 generation modes
- No batch/streaming

**Storage:**
- Supabase: presets, generation history (metadata)
- localStorage: user's API key
- React state: current generation images (base64)

---

## Migration Path to Private/Auth

When you're ready to add authentication:

**Time estimate:** 2-3 hours

**Steps:**
1. Enable Supabase Auth in dashboard
2. Add `user_id` columns to tables
3. Enable Row Level Security
4. Add login/signup UI
5. Update API client to include `user_id`

**What stays the same:**
- All generation logic
- Image display
- Parameter controls
- API integration
- UI components

**What changes:**
- Data becomes private per user
- Need to login to access
- RLS enforces data isolation

That's it! The architecture is designed to make this easy.
