# SunEra Lifestyle

An e-commerce storefront + admin panel for **SunEra Lifestyle** — 100% natural Ayurvedic
wellness products (Detox Tea, Immunity Kadha, Slim Fit Powder, Sanjivani Dravya, and more)
and women's ethnic wear (kurtis & suit sets).

> स्वस्थ जीवन, खुशहाल जीवन — *Way to Wellness.*

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftheb1ackswordsman%2FSuneraLifestyle&env=MONGODB_URI,JWT_ACCESS_SECRET,JWT_REFRESH_SECRET,CLOUDINARY_CLOUD_NAME,CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET,NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,ADMIN_PORTAL_CODE&envDescription=Secrets%20for%20database%2C%20auth%2C%20image%20uploads%20and%20admin%20access%20(see%20.env.example)&envLink=https%3A%2F%2Fgithub.com%2Ftheb1ackswordsman%2FSuneraLifestyle%2Fblob%2Fmain%2F.env.example)

Click the button, and Vercel will prompt you for the environment variables above.

**The build always succeeds even if you leave them blank** — the public storefront renders
with built-in sample data. Fill the variables in to enable the database, admin panel, auth,
image uploads and payments. You can also add/change them later in **Vercel → Project →
Settings → Environment Variables** (redeploy after changing).

> **Important — MongoDB Atlas + Vercel:** Vercel functions connect from rotating IPs, so in
> Atlas go to **Network Access → Add IP Address → Allow access from anywhere (`0.0.0.0/0`)**,
> otherwise the database connection will be blocked.

After the first deploy, seed the database (run locally with your production `MONGODB_URI` in
`.env`): `npm run seed:admin && npm run seed:catalog`.

## Tech stack

- **Next.js 15** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **MongoDB** (Mongoose) · **Cloudinary** (image uploads) · **Razorpay** (payments)
- JWT auth (customer + admin)

## Getting started

```bash
npm install

# 1. Configure environment
cp .env.example .env      # then fill in real values (never commit .env)

# 2. Seed the database (requires a reachable MongoDB — see note below)
npm run seed:admin        # creates the admin user
npm run seed:catalog      # seeds the Ayurvedic + ethnic-wear catalog

# 3. Run
npm run dev               # http://localhost:3000
```

Admin panel: `http://localhost:3000/admin/login` (products live at `/admin/products`).

## Environment variables

All secrets live in `.env` (git-ignored). See [`.env.example`](.env.example) for the full list:
`MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_*`, `RAZORPAY_*`,
SMTP settings, and `ADMIN_PORTAL_CODE`. Override `ADMIN_SEED_PASSWORD` for production.

> **MongoDB Atlas note:** if seeding fails with a connection error, whitelist your IP in
> Atlas → **Network Access → Add IP Address** (use `0.0.0.0/0` for open dev access).

## Project structure

```
src/
  app/            App Router routes (storefront, shop, product, cart, admin, api)
  components/     UI, layout, home, product, shop, admin components
  models/         Mongoose models (Product, Category, User, …)
  lib/            db, auth, shop queries, payments, email, cloudinary
  data/mock/      catalog + imagery used as on-brand fallback when the DB is offline
scripts/          seed-admin.ts, seed-catalog.ts
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run type-check` | TypeScript check |
| `npm run seed:admin` | Create/refresh the admin user |
| `npm run seed:catalog` | Seed categories + products |
