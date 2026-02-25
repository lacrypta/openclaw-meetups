# Environment Setup - Auto Migration

This project uses automated environment variable setup, similar to Prisma migrations.

## How It Works

The `scripts/setup-env.mjs` script runs automatically:
- **Before `npm run dev`** (predev hook)
- **Before `npm run build`** (prebuild hook)

## Priority Flow

1. **✅ Existing .env.local** - If valid, uses it (no changes)
2. **🔄 Supabase CLI** - If running locally (`supabase start`), generates from `supabase status -o env`
3. **📋 .env.example** - Falls back to template (needs manual fill)
4. **☁️ Vercel** - In production, uses Vercel environment variables

## Manual Usage

```bash
# Run setup manually
npm run setup

# Or directly
node scripts/setup-env.mjs
```

## Local Development Setup

### First Time Setup

1. **Clone repo**
   ```bash
   git clone <repo>
   cd openclaw-meetups
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Supabase (optional)**
   ```bash
   npx supabase start
   ```
   This starts a local Supabase instance with Docker.

4. **Run setup (automatic)**
   ```bash
   npm run dev
   ```
   The setup script runs automatically and creates `.env.local`

### Without Local Supabase

If you don't want to run Supabase locally, just use the production instance:

1. Copy `.env.example` to `.env.local`
2. Fill in production values (from Supabase dashboard)
3. Run `npm run dev`

## Production (Vercel)

No `.env.local` needed! Configure these variables in Vercel dashboard:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `ALLOWED_PUBKEYS`

The build will validate that all required variables exist.

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service role key (backend only) | `eyJhbGci...` |
| `JWT_SECRET` | Secret for JWT signing | Random 32-byte hex |
| `ALLOWED_PUBKEYS` | Authorized Nostr pubkeys | Comma-separated hex |

## Troubleshooting

### Build fails with "Missing environment variables"

**Solution**: Run `npm run setup` manually to see details

### "Local Supabase not running"

**Solution**: This is normal if you're using production instance. Just create `.env.local` manually.

### "Could not set up environment variables"

**Solution**: 
1. Run `npx supabase start` (local), OR
2. Copy `.env.example` to `.env.local` and fill values

## Why This Approach?

✅ **No hardcoded URLs** - Everything uses environment variables
✅ **Auto-setup** - Like Prisma, runs before build
✅ **Flexible** - Works with local Supabase or production
✅ **Safe** - `.env.local` is gitignored, secrets never committed
✅ **CI/CD friendly** - Works with Vercel, GitHub Actions, etc.

## Migrating from Hardcoded URLs

Old code:
```typescript
const supabaseUrl = 'https://xxx.supabase.co'; // ❌ hardcoded
```

New code:
```typescript
const supabaseUrl = process.env.SUPABASE_URL || 'https://xxx.supabase.co'; // ✅ env var with fallback
```

Or better yet (TypeScript):
```typescript
const supabaseUrl = process.env.SUPABASE_URL!; // ✅ env var (fails if missing)
```

The setup script ensures the variable exists before build, so TypeScript non-null assertion is safe.
