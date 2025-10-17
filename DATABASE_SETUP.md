# DAWG AI - Database Setup Guide

## Overview
DAWG AI uses PostgreSQL with Prisma ORM for data persistence.

**Schema includes:**
- Users (authentication, preferences, vocal profiles)
- Projects (songs with BPM, key, genre)
- Tracks (audio tracks with volume, pan, effects)
- Recordings (audio files with metadata, waveforms, AI analysis)

---

## Option 1: Local PostgreSQL (Development)

### Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE dawg_ai;
CREATE USER dawg_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dawg_ai TO dawg_user;

# Exit psql
\q
```

### Update .env.local

```bash
DATABASE_URL="postgresql://dawg_user:your_secure_password@localhost:5432/dawg_ai?schema=public"
```

### Run Migrations

```bash
npx prisma migrate dev --name init
```

---

## Option 2: Docker PostgreSQL (Recommended for Development)

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: dawg-ai-db
    environment:
      POSTGRES_USER: dawg_user
      POSTGRES_PASSWORD: dawg_password
      POSTGRES_DB: dawg_ai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Start Database

```bash
docker-compose up -d
```

### Update .env.local

```bash
DATABASE_URL="postgresql://dawg_user:dawg_password@localhost:5432/dawg_ai?schema=public"
```

### Run Migrations

```bash
npx prisma migrate dev --name init
```

---

## Option 3: Prisma Cloud Database (Free Tier)

Prisma offers a free managed PostgreSQL database perfect for development.

### Setup

```bash
# Start interactive setup
npx prisma dev

# Follow prompts to create cloud database
# This will automatically update DATABASE_URL in .env
```

### Run Migrations

```bash
npx prisma migrate dev --name init
```

---

## Option 4: Cloud Providers (Production)

### Vercel Postgres
```bash
# Install Vercel CLI
npm i -g vercel

# Create database
vercel postgres create dawg-ai-db

# Get connection string
vercel env pull .env.local
```

### Supabase
1. Go to https://supabase.com
2. Create new project
3. Copy connection string from Settings > Database
4. Update `.env.local`:
```bash
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

### Railway
1. Go to https://railway.app
2. Create new PostgreSQL database
3. Copy `DATABASE_URL` from Variables tab
4. Update `.env.local`

---

## Prisma Commands

### Migrations
```bash
# Create migration after schema changes
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only - deletes all data!)
npx prisma migrate reset
```

### Prisma Studio (Database GUI)
```bash
# Open visual database editor
npx prisma studio
```

### Schema Management
```bash
# Regenerate Prisma Client after schema changes
npx prisma generate

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

### Database Introspection
```bash
# Pull database schema into Prisma schema
npx prisma db pull

# Push schema changes without creating migrations
npx prisma db push
```

---

## Schema Overview

### User Model
```prisma
model User {
  id            String
  email         String @unique
  name          String?
  projects      Project[]
  preferences   Json?      // UI settings
  vocalProfile  Json?      // Vocal range, skill level
}
```

### Project Model
```prisma
model Project {
  id          String
  userId      String
  name        String
  bpm         Int @default(120)
  genre       String?
  key         String?
  tracks      Track[]
  settings    Json?
}
```

### Track Model
```prisma
model Track {
  id             String
  projectId      String
  name           String
  volume         Float @default(0.8)
  pan            Float @default(0.0)
  isSolo         Boolean
  isMuted        Boolean
  recordings     Recording[]
  effects        Json?
}
```

### Recording Model
```prisma
model Recording {
  id           String
  trackId      String
  audioUrl     String  // S3/R2 URL
  duration     Float
  format       String
  waveformData Json?
  pitchData    Json?
  vocalAnalysis Json?
}
```

---

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Test connection
psql -h localhost -U dawg_user -d dawg_ai
```

### Migration Errors
```bash
# Reset and start fresh (development only!)
npx prisma migrate reset

# Or manually drop database
psql postgres -c "DROP DATABASE dawg_ai;"
psql postgres -c "CREATE DATABASE dawg_ai;"
```

### Prisma Client Not Found
```bash
# Regenerate client
npx prisma generate

# If using custom output path, check prisma/schema.prisma
# generator client { output = "..." }
```

---

## Next Steps

After database is set up:
1. ✅ Schema is ready
2. ✅ Migrations can be run when DB is available
3. ⏳ Build authentication (Stage 6.2)
4. ⏳ Create save/load endpoints (Stage 6.3)
5. ⏳ Set up S3 storage (Stage 6.4)

**Current Status:** Database schema complete, waiting for DB instance to run migrations.

For development, recommend **Option 2 (Docker)** for quick setup.
