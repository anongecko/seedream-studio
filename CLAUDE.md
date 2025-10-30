# SeaDream Studio - Development Guide

**Project Type:** Local-first image generation interface for BytePlus Seedream 4.0  
**Development Approach:** Build for yourself first, expand to multi-user later  
**Quality Standard:** Clean, functional, portfolio-ready

---

## Project Overview

Single-page Next.js app for Seedream 4.0 image generation with Supabase database.

### Current Version: Shared Access (No Auth)
- **Building this now** - Supabase database for presets and history
- Base64 image display
- Open access (everyone can see all presets/generations)
- Fast to build (5-7 hours)

### Future: Private Access (Add Auth Later)
- Add Supabase Auth
- Make presets/history private per user
- Row-level security
- (Add when ready)

---

## Understanding the Seedream API

### Generation Modes (3 Tabs)

The API supports 3 modes based on reference image count:

1. **Text to Image** - No reference images, just prompt
2. **Image to Image** - 1 reference image + prompt
3. **Multi-Image Blending** - 2-10 reference images + prompt

**Note:** We're NOT supporting batch generation (`sequential_image_generation: "auto"`). Only single image generation.

### Key API Parameters

From `API_REFERENCE.md`:

**Required:**
- `model`: Always `"seedream-4-0-250828"`
- `prompt`: Text description (what to generate)

**Image Input (optional):**
- `image`: String (for 1 image) or Array (for 2-10 images)
- Can be URL or base64 data URI
- Requirements: jpeg/png, <10MB, aspect ratio [1/3, 3], >14px width/height

**Generation Settings:**
- `size`: `"1K"`, `"2K"`, `"4K"` or specific pixels like `"2048x2048"`
  - Default: `"2048x2048"`
  - Range: `[1280x720, 4096x4096]`
  - Aspect ratio range: `[1/16, 16]`
- `quality`: `"standard"` (higher quality, slower) or `"fast"` (faster, average quality)
  - Default: `"standard"`
- `seed`: Number for reproducibility, `-1` for random
  - Default: `-1` (random)
  - Same seed + same params = similar results
- `sequential_image_generation`: Always `"disabled"` (we don't do batch)
- `response_format`: `"url"` (24-hour download link) or `"b64_json"` (base64 string)
  - Default: `"url"`
- `stream`: Always `false` (we don't do streaming)
- `watermark`: Always `false` (no watermark)

### API Response Format

```json
{
  "model": "seedream-4-0-250828",
  "created": 1757323224,
  "data": [
    {
      "url": "https://...",  // Downloads the image file
      "size": "1760x2368"
    }
  ],
  "usage": {
    "generated_images": 1,
    "output_tokens": 16280,
    "total_tokens": 16280
  }
}
```

**Critical:** The `url` in the response triggers a file download when visited. You need to handle this properly to display images in the UI.

---

## Architecture: Simple but Scalable

**Storage Strategy:**
- ✅ Supabase PostgreSQL for everything (except images)
- ✅ No auth yet - simple session-based or open access
- ✅ Generations metadata in DB
- ✅ Presets in DB
- ✅ Images as base64 in API response (display immediately)

**Why Supabase from the start:**
- Easy to share with friends
- No localStorage limitations
- Cross-device access works
- Adding auth later is straightforward

**Images:**
- Use `response_format: "b64_json"` (simpler than blob URLs)
- Display immediately with `data:image/png;base64,...`
- Can convert to blob for download if needed
- Don't store in DB (too large)

**No Auth (Yet):** Open access or simple identifier. Add Supabase Auth later when ready.

---

## Technology Stack

**Framework:**
- Next.js 15 (App Router)
- TypeScript (strict mode)
- React 19

**UI:**
- Tailwind CSS
- Shadcn/ui components
- Lucide React icons

**Backend & Storage:**
- Supabase (PostgreSQL for metadata)
- No auth yet - add later
- Simple session management

**Package Manager:**
- pnpm (or npm/yarn - your choice)

**Simple, but ready to scale.** Add auth when you want to.

---

## Color Palette

### Brand Colors (Sea + Dream Theme)
```typescript
// tailwind.config.ts theme extension
colors: {
  // Primary (Ocean Blue)
  ocean: {
    50: '#e6f3ff',
    500: '#0087ff',  // Primary brand
    600: '#006acc',
    700: '#004d99',
  },
  // Accent (Dream Green/Teal)
  dream: {
    50: '#e6fffa',
    500: '#00e6b8',  // Accent
    600: '#00b38f',
  },
}
```

---

## Project Structure

```
seedream-studio/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout, theme
│   │   ├── page.tsx                   # Main studio interface
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # Shadcn components (install as needed)
│   │   ├── studio/
│   │   │   ├── mode-tabs.tsx          # 3 tabs: Text/Image/Multi-Image
│   │   │   ├── prompt-input.tsx       # Prompt textarea
│   │   │   ├── image-input.tsx        # URL input(s) with validation
│   │   │   ├── parameter-controls.tsx # size, quality, seed
│   │   │   ├── generation-output.tsx  # Display images from base64
│   │   │   ├── preset-manager.tsx     # Save/load from Supabase
│   │   │   └── api-preview.tsx        # Show API call to be made
│   │   └── layout/
│   │       ├── header.tsx             # Logo, API key input, theme
│   │       └── footer.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   └── types.ts               # Generated DB types
│   │   ├── seedream-client.ts         # Seedream API client
│   │   └── utils.ts                   # cn(), validators
│   ├── hooks/
│   │   ├── use-generation.ts          # Generation state + Supabase
│   │   ├── use-presets.ts             # Supabase presets CRUD
│   │   └── use-api-key.ts             # API key management (localStorage)
│   ├── types/
│   │   ├── api.ts                     # API types from docs
│   │   └── database.ts                # Supabase table types
│   └── constants/
│       └── parameters.ts              # Parameter configs & defaults
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Database schema
├── public/
├── API_REFERENCE.md                   # The provided API docs
├── .env.local.example
└── ...config files
```

---

## Database Schema (Supabase)

### Tables

**`generations`** - Generation history (metadata only, no images)
```sql
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  -- Request metadata
  prompt text NOT NULL,
  mode text NOT NULL, -- 'text', 'image', 'multi-image'
  reference_image_urls text[], -- URLs used as references
  
  -- Parameters
  size text NOT NULL,
  quality text NOT NULL,
  seed integer NOT NULL,
  
  -- Response metadata (NO IMAGE DATA)
  output_size text NOT NULL, -- e.g., "1760x2368"
  generation_time_ms integer,
  
  -- Metadata
  model_version text DEFAULT 'seedream-4-0-250828'
);

CREATE INDEX idx_generations_created ON generations(created_at DESC);
CREATE INDEX idx_generations_mode ON generations(mode);
```

**`presets`** - Parameter presets
```sql
CREATE TABLE presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  name text NOT NULL UNIQUE,
  description text,
  mode text NOT NULL, -- 'text', 'image', 'multi-image'
  
  -- Saved values
  prompt text NOT NULL,
  reference_image_urls text[], -- Optional reference images
  
  -- Parameters
  size text NOT NULL,
  quality text NOT NULL,
  seed integer NOT NULL
);

CREATE INDEX idx_presets_mode ON presets(mode);
```

**Note:** No auth yet, so no `user_id` columns. Tables are open/shared. Add auth later.

### Session State (React)

**Current generation** - Stored in React state, optionally saved to DB
```typescript
interface GenerationResult {
  id: string;
  imageBase64: string; // Base64 string from API
  prompt: string;
  mode: 'text' | 'image' | 'multi-image';
  parameters: {
    size: string;
    quality: string;
    seed: number;
  };
  outputSize: string; // e.g., "1760x2368"
  timestamp: Date;
}
```

**API Key** - Still in localStorage (not in DB until you add auth)
```typescript
localStorage.getItem('seedream:apiKey')
```

---

## Critical: API Parameter Implementation

### Type Definitions

Create these types from `API_REFERENCE.md`:

```typescript
// types/api.ts

export type GenerationMode = 'text' | 'image' | 'multi-image';

export type SizePreset = '1K' | '2K' | '4K';
export type Quality = 'standard' | 'fast';
export type ResponseFormat = 'url' | 'b64_json';

export interface SeedreamRequest {
  model: 'seedream-4-0-250828';
  prompt: string;
  image?: string | string[]; // undefined for text-to-image
  size?: SizePreset | string; // Default: "2048x2048"
  quality?: Quality; // Default: "standard"
  seed?: number; // Default: -1 (random)
  sequential_image_generation: 'disabled'; // Always disabled
  response_format?: ResponseFormat; // Default: "b64_json" (recommended)
  stream: false; // Always false
  watermark: false; // Always false
}

export interface SeedreamResponse {
  model: string;
  created: number;
  data: Array<{
    b64_json: string; // Base64 image data (if response_format: "b64_json")
    url?: string; // Download URL (if response_format: "url")
    size: string; // e.g., "1760x2368"
  }>;
  usage: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
  };
}
```

### Parameter Validation

```typescript
// constants/parameters.ts

export const PARAMETER_CONSTRAINTS = {
  imageUrl: {
    maxCount: 10, // For multi-image mode
    formats: ['jpeg', 'png'],
    maxSize: 10 * 1024 * 1024, // 10 MB
    aspectRatio: { min: 1/3, max: 3 },
    minDimension: 14,
    maxTotalPixels: 6000 * 6000,
  },
  
  size: {
    presets: ['1K', '2K', '4K'],
    customRange: {
      min: { width: 1280, height: 720 },
      max: { width: 4096, height: 4096 },
    },
    aspectRatioRange: { min: 1/16, max: 16 },
    common: [
      { ratio: '1:1', size: '2048x2048' },
      { ratio: '4:3', size: '2304x1728' },
      { ratio: '3:4', size: '1728x2304' },
      { ratio: '16:9', size: '2560x1440' },
      { ratio: '9:16', size: '1440x2560' },
      { ratio: '3:2', size: '2496x1664' },
      { ratio: '2:3', size: '1664x2496' },
      { ratio: '21:9', size: '3024x1296' },
    ],
  },
  
  seed: {
    random: -1,
    min: 0,
    max: 2147483647, // Max int32
  },
  
  quality: {
    options: ['standard', 'fast'],
    descriptions: {
      standard: 'Higher quality, longer generation time',
      fast: 'Faster generation, average quality',
    },
  },
} as const;

export const DEFAULTS = {
  size: '2048x2048',
  quality: 'standard' as Quality,
  seed: -1,
  responseFormat: 'b64_json' as ResponseFormat, // Use b64_json for simpler display
  stream: false,
  watermark: false,
  sequentialImageGeneration: 'disabled' as const,
} as const;
```

---

## Component Requirements

### 1. API Key Input
```typescript
// Single text input in header
// Stored in localStorage on submit
// Validated against API on first use (test generation)
// Show ✓ indicator when valid
```

### 2. Mode Tabs (3 tabs)
```typescript
// Tab 1: Text to Image (no image inputs)
// Tab 2: Image to Image (1 image URL input)
// Tab 3: Multi-Image Blending (2-10 image URL inputs with + button)

// Clear visual indication of current mode
// Switch changes available inputs
```

### 3. Image URL Inputs (Mode-dependent)
```typescript
// For Image to Image mode: Single URL input
// For Multi-Image mode: 
//   - Start with 2 inputs
//   - + button to add more (up to 10)
//   - - button to remove extras
//   - Validation checkmark next to each URL
//   - Visual count: "2/10 images" or "5/10 images"

// Validation per URL:
//   - Check if accessible (optional: HEAD request)
//   - Check format from URL or content-type
//   - Show ✓ or ✗ indicator
//   - Enable Generate button only when all URLs valid
```

### 4. Prompt Input
```typescript
// Large textarea for prompt
// Character count
// Placeholder text varies by mode
```

### 5. Parameter Controls
```typescript
// Size selector:
//   - Quick presets: 1K, 2K, 4K buttons
//   - Or dropdown with common aspect ratios
//   - Or custom width x height inputs
//   - Show tooltip with pixel dimensions

// Quality toggle: standard / fast
//   - Show tooltip explaining tradeoff

// Seed input:
//   - Number input
//   - "Random" button (sets to -1)
//   - Show current value (-1 = random)
//   - Tooltip: "Use same seed to reproduce results"
```

### 6. API Call Preview Panel
```typescript
// Collapsible side panel or modal
// Shows exact JSON that will be sent to API
// Format nicely with syntax highlighting
// Help users understand/debug API calls
// Updates in real-time as they change params

// Example display:
{
  "model": "seedream-4-0-250828",
  "prompt": "A serene ocean sunset...",
  "image": "https://example.com/ref.jpg",
  "size": "2K",
  "quality": "standard",
  "seed": -1,
  "sequential_image_generation": "disabled",
  "response_format": "url",
  "stream": false,
  "watermark": false
}

// Copy button to copy JSON to clipboard
```

### 7. Generation Output
```typescript
// Display generated image from base64
<img src={`data:image/png;base64,${generation.imageBase64}`} />

// Download button (convert base64 to blob)
// Image metadata: size (e.g., "1760x2368"), generation time
// Copy image to clipboard (using base64 data)
// "Save as Preset" button
// "Save to History" button (saves to Supabase)
```

### 8. Preset Manager
```typescript
// Save button (saves to Supabase)
//   - Modal to name preset
//   - Stores: name, mode, prompt, params, optional ref URLs
// Load dropdown (fetches from Supabase)
//   - Shows preset name + mode icon
//   - Click to load (switches mode, fills inputs)
// Delete button per preset (deletes from Supabase)
// All presets are shared (no auth yet)
```

### 9. Generation History
```typescript
// Fetch recent generations from Supabase
// Display as list: prompt snippet, mode, timestamp
// Click to view details (shows all metadata)
// "Regenerate" button (loads params, makes new call)
// Filter by mode
// Search by prompt text
// All generations are shared (no auth yet)
```

---

## Critical: Image Display Strategy

### The Problem

The Seedream API returns URLs that **download the image file** when visited. You can't just use them in `<img src="">` tags directly.

### The Solution: Use `response_format: "b64_json"`

**This is the simplest and most reliable approach.**

```typescript
// Request with b64_json format
const request = {
  model: 'seedream-4-0-250828',
  prompt: 'A serene ocean sunset',
  response_format: 'b64_json', // ← Key parameter
  // ... other params
};

// Response structure
{
  model: "seedream-4-0-250828",
  created: 1757323224,
  data: [{
    b64_json: "iVBORw0KGgoAAAANSUhEUgAA...", // Base64 string
    size: "1760x2368"
  }],
  usage: { ... }
}

// Display directly in React
<img 
  src={`data:image/png;base64,${data[0].b64_json}`} 
  alt="Generated image"
  className="w-full h-auto"
/>
```

### Why b64_json is Better

✅ **Simpler** - No fetch, no blob URL management  
✅ **Immediate display** - Works instantly  
✅ **Reliable** - No URL expiry concerns (24-hour limit)  
✅ **Offline-capable** - Image data in memory  
✅ **Easy download** - Convert base64 to blob if needed

### Converting to Downloadable File (Optional)

If you want a download button:

```typescript
function downloadBase64Image(base64: string, filename: string) {
  // Convert base64 to blob
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Alternative: URL + Fetch to Blob (Not Recommended)

If you really want to use `response_format: "url"`:

```typescript
// Fetch the download URL and convert to displayable format
const response = await fetch(imageUrl);
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);

// Display
<img src={blobUrl} />

// Remember to cleanup
URL.revokeObjectURL(blobUrl);
```

**But this is more complex and unnecessary.** Stick with `b64_json`.

---

## UI/UX Requirements

**Core Principles:**
1. **Mode-first** - Tab selection is primary interaction
2. **Transparency** - Show API call preview so users understand what's happening
3. **Validation** - Visual feedback for all inputs (checkmarks, error states)
4. **Visual feedback** - Loading, error, and success states
5. **Smart defaults** - From API docs (2K, standard quality, random seed)

**Loading States:**
- Skeleton loader for image preview area
- Spinner on "Generate" button during request
- Progress message: "Generating image..." with estimated time

**Error Handling:**
- Toast notifications for errors
- Clear error messages:
  - "Invalid API key - check Settings"
  - "Image URL not accessible"
  - "Network error - try again"
  - "Content filtered by AI safety system"
- Retry button for network failures

**Image URL Validation:**
- Per-URL validation in Multi-Image mode
- Show ✓ or ✗ next to each input
- Disable Generate until all valid
- Helpful error messages:
  - "URL must be accessible"
  - "Only JPEG and PNG supported"
  - "Image too large (max 10MB)"

---

## Code Conventions

### TypeScript Standards

**Strict Type Safety:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### API Client Implementation

```typescript
// lib/seedream-client.ts
import { createClient } from '@supabase/supabase-js';

export class SeedreamClient {
  private apiKey: string;
  private baseUrl = 'https://ark.ap-southeast.bytepluses.com/api/v3';
  private supabase;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  async generate(request: Omit<SeedreamRequest, 'model' | 'stream' | 'watermark' | 'sequential_image_generation'>): Promise<SeedreamResponse> {
    const startTime = Date.now();
    
    // Add fixed params and defaults
    const fullRequest: SeedreamRequest = {
      model: 'seedream-4-0-250828',
      stream: false,
      watermark: false,
      sequential_image_generation: 'disabled',
      response_format: 'b64_json', // Default to base64 for easy display
      ...request,
    };
    
    // Validate request
    this.validateRequest(fullRequest);
    
    // Make API call
    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(fullRequest),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Generation failed');
    }
    
    const result: SeedreamResponse = await response.json();
    const generationTime = Date.now() - startTime;
    
    // Optionally save to Supabase
    await this.saveGeneration(fullRequest, result, generationTime);
    
    return result;
  }
  
  private async saveGeneration(
    request: SeedreamRequest, 
    response: SeedreamResponse,
    generationTime: number
  ) {
    // Determine mode based on image input
    let mode: 'text' | 'image' | 'multi-image' = 'text';
    let imageUrls: string[] = [];
    
    if (request.image) {
      imageUrls = Array.isArray(request.image) ? request.image : [request.image];
      mode = imageUrls.length > 1 ? 'multi-image' : 'image';
    }
    
    // Save metadata to Supabase (NO IMAGE DATA)
    await this.supabase.from('generations').insert({
      prompt: request.prompt,
      mode,
      reference_image_urls: imageUrls.length > 0 ? imageUrls : null,
      size: request.size || '2048x2048',
      quality: request.quality || 'standard',
      seed: request.seed || -1,
      output_size: response.data[0].size,
      generation_time_ms: generationTime,
      model_version: response.model,
    });
  }
  
  private validateRequest(request: SeedreamRequest): void {
    // Validate prompt
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }
    
    // Validate image URLs if present
    if (request.image) {
      const images = Array.isArray(request.image) ? request.image : [request.image];
      if (images.length > 10) {
        throw new Error('Maximum 10 reference images allowed');
      }
    }
    
    // Validate seed
    if (request.seed !== undefined && request.seed < -1) {
      throw new Error('Seed must be -1 or greater');
    }
  }
}
```

---

## Development Workflow

### Phase 1: Setup (30-45 min)
1. `npx create-next-app@latest seedream-studio`
2. Install Shadcn/ui: `npx shadcn@latest init`
3. Install Supabase: `pnpm add @supabase/supabase-js`
4. Setup Supabase project at https://supabase.com
5. Create database tables (run migration SQL)
6. Add Supabase env vars to `.env.local`
7. Install components: button, tabs, input, textarea, etc.
8. **Read API_REFERENCE.md** - understand the 3 modes
9. Create type definitions from API docs

### Phase 2: Core UI (1 hour)
1. Layout (header with API key input, main area, footer)
2. Mode tabs (3 tabs: Text, Image, Multi-Image)
3. Supabase client setup
4. Theme toggle
5. Basic styling

### Phase 3: Text to Image Mode (1-2 hours)
1. Prompt input component
2. Parameter controls (size, quality, seed)
3. API client implementation (with Supabase save)
4. Image display from base64 (`response_format: "b64_json"`)
5. Download functionality
6. Loading states
7. Test with real API

### Phase 4: Image Modes (1-2 hours)
1. Image URL input component
2. URL validation logic
3. Multi-image mode with dynamic inputs (2-10)
4. Visual validation feedback
5. Test both modes with real API

### Phase 5: Database Features (1-2 hours)
1. Preset save/load from Supabase
2. Generation history display from Supabase
3. Search and filter history
4. API call preview panel
5. Mobile responsive
6. Error handling improvements

**Total: 5-7 hours** to working app with database

---

## Performance Optimization

**Image Handling:**
- Convert API URLs to blob URLs immediately after generation
- Revoke blob URLs when component unmounts
- Consider caching in session storage for recent generations
- Use `response_format: "url"` by default (smaller response)

**Code Splitting:**
- Lazy load API preview panel (not needed immediately)
- Dynamic imports for preset manager
- Lazy load image compression if you add upload support

**API Calls:**
- Debounce URL validation checks
- Show loading states immediately
- Handle network errors gracefully

---

## Security Best Practices

**API Key:**
- Stored in localStorage (browser same-origin policy protects it)
- Never logged to console
- Local-only means no server-side concerns

**Input Validation:**
- Validate inputs before API call
- Check parameter ranges
- Sanitize prompt (limit length, remove special chars if needed)

**Image URLs:**
- Validate URL format
- Consider HEAD request to check accessibility (optional)
- Handle errors if URL not accessible

---

## Environment Variables

```bash
# .env.local

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Seedream API endpoint (optional - has default)
NEXT_PUBLIC_SEEDREAM_API_URL=https://ark.ap-southeast.bytepluses.com/api/v3
```

**Note:** User's Seedream API key is entered in the UI and stored in localStorage (not in env vars).

---

## Testing Checklist

### Must Test
- [ ] Text to Image generation (base64 display)
- [ ] Image to Image (1 reference image)
- [ ] Multi-Image Blending (2, 5, 10 images)
- [ ] URL validation (valid and invalid URLs)
- [ ] All parameter combinations
- [ ] Preset save/load/delete (Supabase)
- [ ] Generation history (Supabase)
- [ ] API key validation
- [ ] Image download from base64
- [ ] Base64 display works correctly
- [ ] API preview panel
- [ ] Theme toggle

### Edge Cases
- [ ] Empty prompt
- [ ] Invalid API key
- [ ] Network timeout
- [ ] Invalid image URL
- [ ] Too many images (>10)
- [ ] Seed edge cases (negative, very large)
- [ ] Supabase connection failure

---

## Running Locally

```bash
# Create your project
npx create-next-app@latest seedream-studio
cd seedream-studio

# Install dependencies
pnpm install
pnpm add @supabase/supabase-js

# Setup Shadcn
npx shadcn@latest init

# Setup Supabase
# 1. Go to https://supabase.com and create new project
# 2. Copy your project URL and anon key
# 3. Create .env.local with your keys:
#    NEXT_PUBLIC_SUPABASE_URL=your-url
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Run database migration
# In Supabase dashboard → SQL Editor, run the migration from:
# supabase/migrations/001_initial_schema.sql

# Run dev server
pnpm dev
```

Open http://localhost:3000 and start generating!

---

## Success Criteria

**It works when:**
- ✅ All 3 modes generate images successfully
- ✅ Images display from base64 immediately
- ✅ URL validation works (checkmarks/errors)
- ✅ API preview shows correct JSON
- ✅ Parameters match API_REFERENCE.md spec
- ✅ Presets save/load from Supabase
- ✅ Generation history saves to Supabase
- ✅ No TypeScript errors
- ✅ UI is responsive and intuitive
- ✅ Images download successfully from base64

---

## Important Notes for Agentic Development

### When Implementing Parameters:
1. **Reference API_REFERENCE.md for everything**
2. Don't hardcode parameter values - use constants
3. Only 3 modes (not 8) - Text, Image, Multi-Image
4. Always set: `stream: false`, `watermark: false`, `sequential_image_generation: "disabled"`
5. Default to `response_format: "b64_json"` for simplest display

### When Building Image Inputs:
1. Mode determines image input count (0, 1, or 2-10)
2. Each URL needs validation feedback (✓ or ✗)
3. Disable Generate button until all inputs valid
4. Show count: "X/10 images" in Multi-Image mode

### When Handling API Responses:
1. Use `response_format: "b64_json"` - don't use URL format
2. Display with: `<img src={\`data:image/png;base64,${b64_json}\`} />`
3. Convert base64 to blob for download button if needed
4. Save metadata (not images) to Supabase after generation

### When Working with Supabase:
1. Setup tables first (run migration SQL)
2. Save generation metadata after each successful generation
3. Presets load from Supabase, not localStorage
4. No auth yet - tables are open/shared
5. Don't store images in DB (too large - use base64 in memory only)

### When Testing:
1. Test with real API key against real API
2. Test all 3 modes
3. Test edge cases (invalid URLs, network failures)
4. Verify base64 display works immediately
5. Check API preview accuracy
6. Test Supabase save/load operations

### After Completing Instructed Tasks:
1. Use appropriate memory mcp database(s) to CONCISELY log key decisions you made that's necessary information to pick up with the next steps information necessary for another agent's next steps. **DO NOT** create additional documentation unless absolutely necessary and after asking permission. 
2. When logging to memory mcp, avoid duplicate entries. Especially do not repeat information that's already in a core document within the project, such as API_REFERENCE.md
3. Don't be wordy when explaining what you did in the chat (after logging to memory). Be viciously concise in communication and list what was completed in brief bullet points. 

#### In memory MCP:
**Focus on:**
1. Features completed
2. Key decisions made when making those features that a future developer must know to continue
3. How to use what you've made (api, schemas, etc.)

**DON'T mention:**
- Reasoning for obvious decisions that you made that can be inferred
- How you followed best practices (that's implied)
- Commands that need to be used for future steps (every agent knows how to use pnpm or a built-in mcp)
- Anything else that's obvious to a developer that's read the CLAUDE.md, API_REFERENCE.md, QUICK_REFERENCE.md, and ARCHITECTURE_SUMMARY.md
- Next steps for building the project. You'll tell next steps to me, not log in memory

#### When discussing changes in chat after completing tasks:
- Say in concise bullet point form what's been completed. For features added, note if they need more improvements later to meet specifications set
- Then say (brief bullet points) what the **immediate** next steps are
- List anything that can be improved upon (from what you just did), and ask if you should either make those improvements now, or proceed to the next steps

---

## Resources

### Essential Documentation
- `API_REFERENCE.md` - **The API docs provided above**
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [Seedream API Endpoint](https://ark.ap-southeast.bytepluses.com/api/v3)

### Useful Libraries
- `react-hot-toast` - Toast notifications
- `zod` - Runtime type validation (optional)
- `@radix-ui/react-*` - Primitives (via Shadcn)

---

## FAQ

**Q: Do I need a database?**  
A: Yes, we're using Supabase from the start to make it easy to share with friends. No auth yet though.

**Q: How do I display images from the API?**  
A: Use `response_format: "b64_json"` and display with `<img src={\`data:image/png;base64,${b64}\`} />`. Simple and immediate.

**Q: Why not use the URL response format?**  
A: URLs trigger downloads, not display. Base64 is simpler - works immediately with no extra fetch calls.

**Q: Do I store images in Supabase?**  
A: No. Only metadata (prompt, params, timestamps). Images are too large at 4K resolution.

**Q: How do generation history and presets work without auth?**  
A: Tables are open/shared for now. Everyone can see all presets and generations. Add auth later when you want private data.

**Q: How many generation modes are there?**  
A: 3 modes based on reference image count: Text (0), Image (1), Multi-Image (2-10).

**Q: Do I need to support batch generation?**  
A: No. Always use `sequential_image_generation: "disabled"`.

**Q: What's the API preview for?**  
A: Shows the exact JSON being sent to the API. Helps users understand and debug. Also looks professional for portfolio.

**Q: When should I add authentication?**  
A: When you want private presets/history or need to control access. For now, open sharing is fine for friends.

---

## Adding Authentication (Phase 2)

When you're ready for private presets and generation history:

### What Changes

**Current state:** Supabase database exists, but tables are open/shared (no `user_id` columns)

**With auth:** Add user authentication and make presets/history private per user

### Steps to Add Auth

1. **Enable Supabase Auth**
   - Go to Supabase dashboard → Authentication
   - Enable Email auth (or magic link, OAuth, etc.)
   - Configure email templates

2. **Add `user_id` columns to tables**
   ```sql
   -- Modify generations table
   ALTER TABLE generations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
   CREATE INDEX idx_generations_user ON generations(user_id);
   
   -- Modify presets table
   ALTER TABLE presets ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
   CREATE INDEX idx_presets_user ON presets(user_id);
   ```

3. **Enable Row Level Security (RLS)**
   ```sql
   -- Generations: Users can only see their own
   ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view own generations" ON generations
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own generations" ON generations
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   
   -- Presets: Users can only see/edit their own
   ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view own presets" ON presets
     FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own presets" ON presets
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can delete own presets" ON presets
     FOR DELETE USING (auth.uid() = user_id);
   ```

4. **Update UI Components**
   - Add login/signup UI (use Shadcn form components)
   - Add auth state to header (show user email, logout button)
   - Update API calls to include `user_id` from `auth.user()`
   - Add auth middleware to protect routes

5. **Update API Client**
   ```typescript
   // lib/seedream-client.ts
   private async saveGeneration(...) {
     const { data: { user } } = await this.supabase.auth.getUser();
     if (!user) return; // Skip if not logged in
     
     await this.supabase.from('generations').insert({
       user_id: user.id, // Add user_id
       // ... rest of fields
     });
   }
   ```

### Migration Strategy

**Option A: Fresh Start**
- Clear existing data
- Add auth
- Users start fresh with private data

**Option B: Keep Public Data**
- Leave old records without `user_id`
- New records have `user_id`
- Old public data visible to all, new data private

### That's It!

Core generation logic stays exactly the same. You're just adding user accounts and making data private.
