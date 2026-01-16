# MeetAndGo Deployment Guide

## Deploy to Vercel + Supabase

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)

---

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click **"New Project"**
3. Configure your project:
   - **Name:** `meetandgo`
   - **Database Password:** Generate and SAVE this password
   - **Region:** Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
4. Wait for project to be created (~2 minutes)

### Get Connection Strings

1. Go to **Settings** → **Database**
2. Scroll to **"Connection string"** section
3. You need TWO connection strings:

**Transaction Pooler (for `DATABASE_URL`):**
- Click "Transaction pooler" 
- Copy the URI, looks like:
  ```
  postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  ```
- Add `?pgbouncer=true` at the end

**Direct Connection (for `DIRECT_URL`):**
- Click "Direct connection"
- Copy the URI (uses port 5432)

---

## Step 2: Push Your Code to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/meetandgo.git
   git push -u origin main
   ```

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `meetandgo` repository
4. Configure **Environment Variables** (click "Environment Variables"):

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
   | `DIRECT_URL` | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres` |
   | `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://your-project.vercel.app` (update after first deploy) |
   | `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |
   | `NEXT_PUBLIC_APP_NAME` | `MeetAndGo` |

5. Click **"Deploy"**

---

## Step 4: Run Database Migration

After the first deployment, you need to push your Prisma schema to Supabase.

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Push schema to database
npx prisma db push

# (Optional) Seed the database
npm run db:seed
```

### Option B: Using Local Environment

1. Create `.env.local` file with your Supabase connection strings:
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```

2. Run migrations:
   ```bash
   npx prisma db push
   ```

3. (Optional) Seed the database:
   ```bash
   npm run db:seed
   ```

---

## Step 5: Update NEXTAUTH_URL

After deployment, update the `NEXTAUTH_URL` environment variable:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` to your actual Vercel URL (e.g., `https://meetandgo.vercel.app`)
3. Redeploy the project

---

## Post-Deployment Checklist

- [ ] Database tables created (check Supabase Table Editor)
- [ ] Can register a new account
- [ ] Can login
- [ ] Can view packages
- [ ] Admin can create packages
- [ ] Booking flow works

---

## Default Admin Account (from seed)

If you ran the seed script:
- **Email:** `admin@meetandgo.com`
- **Password:** `admin123`

⚠️ **Change this password immediately in production!**

---

## Troubleshooting

### "Prisma Client not generated"
Run in your local project:
```bash
npx prisma generate
```
Then redeploy.

### "Connection refused" or Database errors
- Check your connection strings in Vercel environment variables
- Make sure you replaced `[password]` with your actual database password
- Verify the region in the connection string matches your Supabase project

### "NEXTAUTH_URL mismatch"
Update NEXTAUTH_URL to match your Vercel deployment URL exactly.

### Images not persisting
Vercel has a read-only filesystem. For production image uploads, use:
- Supabase Storage
- Cloudinary
- AWS S3
- Vercel Blob

---

## Useful Commands

```bash
# View database in browser
npx prisma studio

# Reset database (CAUTION: deletes all data)
npx prisma db push --force-reset

# Generate Prisma client
npx prisma generate

# Check database connection
npx prisma db pull
```

---

## Cost Estimation (Free Tier)

| Service | Free Tier Limit |
|---------|-----------------|
| **Vercel** | 100GB bandwidth, 100 deployments/day |
| **Supabase** | 500MB database, 1GB file storage, 50,000 monthly active users |

For a small tourism business, the free tier should be sufficient for initial launch.
