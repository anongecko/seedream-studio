# SeaDream Studio Agent Guidelines

## Commands
- **Build**: `npm run build` (Next.js production build)
- **Lint**: `npm run lint` (ESLint with Next.js config)
- **Dev**: `npm run dev` (Start development server)

## Code Style

**Imports & Files**:
- Start client components with `'use client'`
- Use absolute imports: `@/components/...`, `@/lib/...`, `@/types/...`
- Group imports: external libs, internal libs, types (separate `import type`)

**TypeScript**:
- Strict mode enabled - always type everything
- Use `interface` for object shapes, `type` for unions/primitives
- Import types separately: `import type { X } from '...'`

**Naming**:
- Components: PascalCase (e.g., `PromptInput.tsx`)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Hooks: `use` prefix (e.g., `useGeneration`)

**Patterns**:
- Components: Functional with hooks, props interface at top
- Hooks: Return state + actions (e.g., `{ generate, isGenerating, error }`)
- Services: Class-based in `lib/`, singleton exports (e.g., `getSeedreamClient()`)
- Error handling: Try-catch with specific error messages, console.error for DB failures

**Formatting**:
- No trailing commas in arrays/objects (follow existing code)
- Arrow functions for callbacks
- Comments before complex logic only

**API**:
- Use `/api/generate` route for all Seedream calls (CORS workaround)
- Base64 format (`response_format: 'b64_json'`) for immediate display
- Save metadata to Supabase, never store images in DB

**UI**:
- Shadcn/ui components + Tailwind CSS
- Framer Motion for animations
- Lucide React icons
- Custom colors: `ocean-500` (primary), `dream-500` (accent)
