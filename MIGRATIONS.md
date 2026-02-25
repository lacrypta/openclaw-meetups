# Auto Migrations - Quick Guide

Este proyecto tiene **migraciones automáticas** al estilo Prisma.

## 🚀 TL;DR

```bash
npm run dev      # Setup env + migrar DB + arrancar dev server
npm run build    # Setup env + migrar DB + build producción
```

**Todo automático. No manual steps.**

## ✨ Features

### 1. Environment Variables
- ✅ Auto-genera `.env.local` desde Supabase CLI o `.env.example`
- ✅ Valida variables requeridas
- ✅ Funciona en local y producción

### 2. Database Migrations
- ✅ Auto-aplica migraciones SQL desde `supabase/migrations/`
- ✅ Local: usa Supabase local (Docker)
- ✅ Producción: usa `DATABASE_URL` (Vercel env vars)
- ✅ Safe fallback: skip si no hay DB configurada

## 📝 Creating Migrations

**Opción A: Archivo SQL manual**
```bash
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_column.sql
# Editar el archivo con tu SQL
npm run dev  # Aplica automáticamente
```

**Opción B: Desde Supabase Studio**
```bash
# 1. Hacer cambios en Studio (localhost:54323)
# 2. Generar migration desde los cambios
npx supabase db diff -f add_column
# 3. Dev aplica automáticamente
npm run dev
```

## 🔧 Manual Commands

```bash
npm run setup     # Solo setup de env vars
npm run migrate   # Solo migraciones de DB
```

## 🌐 Production Setup

### Vercel Environment Variables

**Required:**
- `SUPABASE_URL` → https://xxx.supabase.co
- `SUPABASE_SERVICE_KEY` → eyJhbGci...
- `JWT_SECRET` → random-32-byte-hex
- `ALLOWED_PUBKEYS` → pubkey1,pubkey2

**For migrations:**
- `DATABASE_URL` → postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

Get it from: **Supabase Dashboard → Settings → Database → Connection string (Transaction)**

## 🐛 Troubleshooting

### "Local Supabase is not running"
```bash
npx supabase start  # Arranca Supabase local
```

### "DATABASE_URL not found in production"
Agregar en Vercel dashboard → Settings → Environment Variables

### Migrations fail
Check SQL syntax in `supabase/migrations/*.sql`

## 📚 Documentation

Full docs: `docs/ENV_SETUP.md`

## 🎯 The Goal

**Zero config.**
- Git clone
- `npm install`
- `npm run dev`
- **Everything works.**

Así como Prisma. 🎉
