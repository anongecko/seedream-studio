# Seedream Studio - Quick Reference

Essential code snippets for rapid development.

---

## Database Migration (Run in Supabase SQL Editor)
[COMPLETED]
```sql
-- Generations table (metadata only, no images)
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
  
  -- Response metadata
  output_size text NOT NULL, -- e.g., "1760x2368"
  generation_time_ms integer,
  
  -- Metadata
  model_version text DEFAULT 'seedream-4-0-250828'
);

CREATE INDEX idx_generations_created ON generations(created_at DESC);
CREATE INDEX idx_generations_mode ON generations(mode);

-- Presets table
CREATE TABLE presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  name text NOT NULL UNIQUE,
  description text,
  mode text NOT NULL,
  
  -- Saved values
  prompt text NOT NULL,
  reference_image_urls text[],
  
  -- Parameters
  size text NOT NULL,
  quality text NOT NULL,
  seed integer NOT NULL
);

CREATE INDEX idx_presets_mode ON presets(mode);
```

---

## Environment Variables (.env.local)
[COMPLETED]
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SEEDREAM_API_URL=https://ark.ap-southeast.bytepluses.com/api/v3
```

---

## Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## Type Definitions

```typescript
// types/api.ts
export type GenerationMode = 'text' | 'image' | 'multi-image';
export type Quality = 'standard' | 'fast';

export interface SeedreamRequest {
  model: 'seedream-4-0-250828';
  prompt: string;
  image?: string | string[];
  size?: string;
  quality?: Quality;
  seed?: number;
  sequential_image_generation: 'disabled';
  response_format: 'b64_json';
  stream: false;
  watermark: false;
}

export interface SeedreamResponse {
  model: string;
  created: number;
  data: Array<{
    b64_json: string;
    size: string;
  }>;
  usage: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
  };
}
```

---

## Seedream API Client

```typescript
// lib/seedream-client.ts
import { supabase } from './supabase/client';

export class SeedreamClient {
  private apiKey: string;
  private baseUrl = process.env.NEXT_PUBLIC_SEEDREAM_API_URL!;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generate(
    prompt: string,
    mode: GenerationMode,
    params: {
      images?: string[];
      size?: string;
      quality?: Quality;
      seed?: number;
    }
  ): Promise<SeedreamResponse> {
    const startTime = Date.now();
    
    const request: SeedreamRequest = {
      model: 'seedream-4-0-250828',
      prompt,
      image: params.images ? 
        (params.images.length === 1 ? params.images[0] : params.images) : 
        undefined,
      size: params.size || '2048x2048',
      quality: params.quality || 'standard',
      seed: params.seed ?? -1,
      sequential_image_generation: 'disabled',
      response_format: 'b64_json',
      stream: false,
      watermark: false,
    };
    
    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Generation failed');
    }
    
    const result: SeedreamResponse = await response.json();
    
    // Save to Supabase
    await this.saveToDatabase(request, result, Date.now() - startTime);
    
    return result;
  }
  
  private async saveToDatabase(
    request: SeedreamRequest,
    response: SeedreamResponse,
    generationTime: number
  ) {
    const images = request.image ? 
      (Array.isArray(request.image) ? request.image : [request.image]) : 
      [];
    
    const mode: GenerationMode = 
      images.length === 0 ? 'text' :
      images.length === 1 ? 'image' :
      'multi-image';
    
    await supabase.from('generations').insert({
      prompt: request.prompt,
      mode,
      reference_image_urls: images.length > 0 ? images : null,
      size: request.size!,
      quality: request.quality!,
      seed: request.seed!,
      output_size: response.data[0].size,
      generation_time_ms: generationTime,
      model_version: response.model,
    });
  }
}
```

---

## Display Base64 Image

```typescript
// components/studio/generation-output.tsx
interface GenerationOutputProps {
  base64Image: string;
  outputSize: string;
}

export function GenerationOutput({ base64Image, outputSize }: GenerationOutputProps) {
  return (
    <div className="space-y-4">
      <img 
        src={`data:image/png;base64,${base64Image}`}
        alt="Generated image"
        className="w-full h-auto rounded-lg"
      />
      <div className="flex gap-2">
        <Button onClick={() => downloadBase64Image(base64Image, 'seedream.png')}>
          Download
        </Button>
        <span className="text-sm text-muted-foreground">
          {outputSize}
        </span>
      </div>
    </div>
  );
}
```

---

## Download Base64 as File

```typescript
// lib/utils.ts
export function downloadBase64Image(base64: string, filename: string) {
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
  
  // Cleanup
  URL.revokeObjectURL(url);
}
```

---

## Preset Operations

```typescript
// hooks/use-presets.ts
import { supabase } from '@/lib/supabase/client';

export function usePresets() {
  // Load all presets
  const loadPresets = async () => {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };
  
  // Save preset
  const savePreset = async (preset: {
    name: string;
    description?: string;
    mode: GenerationMode;
    prompt: string;
    reference_image_urls?: string[];
    size: string;
    quality: Quality;
    seed: number;
  }) => {
    const { error } = await supabase
      .from('presets')
      .insert(preset);
    
    if (error) throw error;
  };
  
  // Delete preset
  const deletePreset = async (id: string) => {
    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  };
  
  return { loadPresets, savePreset, deletePreset };
}
```

---

## Generation History

```typescript
// hooks/use-history.ts
import { supabase } from '@/lib/supabase/client';

export function useHistory() {
  // Load recent generations
  const loadHistory = async (limit = 50) => {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  };
  
  // Search by prompt
  const searchHistory = async (searchTerm: string) => {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .ilike('prompt', `%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };
  
  // Filter by mode
  const filterByMode = async (mode: GenerationMode) => {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('mode', mode)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };
  
  return { loadHistory, searchHistory, filterByMode };
}
```

---

## API Preview Component

```typescript
// components/studio/api-preview.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ApiPreview({ request }: { request: SeedreamRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(request, null, 2));
  };
  
  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4"
      >
        Show API Call
      </Button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-card rounded-lg border p-4 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">API Request</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={copyToClipboard}>
            Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
            ✕
          </Button>
        </div>
      </div>
      <pre className="text-xs overflow-auto max-h-96">
        {JSON.stringify(request, null, 2)}
      </pre>
    </div>
  );
}
```

---

## URL Validation

```typescript
// lib/utils.ts
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return false;
    
    const contentType = response.headers.get('content-type');
    return contentType?.startsWith('image/') ?? false;
  } catch {
    return false;
  }
}

// Usage in component
const [urlValidation, setUrlValidation] = useState<Record<number, boolean>>({});

const checkUrl = async (index: number, url: string) => {
  const isValid = await validateImageUrl(url);
  setUrlValidation(prev => ({ ...prev, [index]: isValid }));
};
```

---

## Parameter Constants

```typescript
// constants/parameters.ts
export const SIZE_PRESETS = ['1K', '2K', '4K'] as const;

export const COMMON_SIZES = [
  { label: '1:1 Square', value: '2048x2048' },
  { label: '4:3 Landscape', value: '2304x1728' },
  { label: '3:4 Portrait', value: '1728x2304' },
  { label: '16:9 Wide', value: '2560x1440' },
  { label: '9:16 Tall', value: '1440x2560' },
] as const;

export const QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard', description: 'Higher quality, slower' },
  { value: 'fast', label: 'Fast', description: 'Faster, good quality' },
] as const;

export const DEFAULTS = {
  size: '2048x2048',
  quality: 'standard' as const,
  seed: -1,
} as const;
```

---

## Complete Usage Example

```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { SeedreamClient } from '@/lib/seedream-client';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('text');
  const [imageBase64, setImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const client = new SeedreamClient(apiKey);
      const response = await client.generate(prompt, mode, {
        size: '2K',
        quality: 'standard',
        seed: -1,
      });
      
      setImageBase64(response.data[0].b64_json);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <input 
        type="text"
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      
      <textarea
        placeholder="Describe your image..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      
      {imageBase64 && (
        <img 
          src={`data:image/png;base64,${imageBase64}`}
          alt="Generated"
        />
      )}
    </div>
  );
}
```

---

## Key Reminders

1. **Always use `response_format: 'b64_json'`** for simplest display
2. **Save metadata to Supabase** after each generation
3. **Don't save images to database** - too large
4. **API key in localStorage**, not database (until auth added)
5. **No user_id columns yet** - add when adding auth
6. **Validate image URLs** before generation
7. **Show API preview** for transparency
8. **Use 3 modes** - text, image, multi-image
9. **Always set fixed params** - stream:false, watermark:false, etc.
10. **Test with real API** - don't mock the Seedream API
