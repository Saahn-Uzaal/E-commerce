# Gettsay Commerce

Starter storefront built with `Next.js`, `Netlify`, and an external `MySQL` database.

## Structure

```text
frontend/   Next.js application, UI, and thin API route wrappers
backend/    Database utilities, catalog services, and MySQL schema
```

## Database setup

For a new database:

```bash
mysql -u <user> -p < backend/database/migrations/001_initial_schema.sql
mysql -u <user> -p < backend/database/seeds/001_sample_catalog.sql
```

If you already created the old schema before this update, run:

```bash
mysql -u <user> -p < backend/database/migrations/002_product_catalog_upgrade.sql
mysql -u <user> -p < backend/database/seeds/001_sample_catalog.sql
```

## Run locally

```bash
npm run setup
cp frontend/.env.example frontend/.env.local
npm run dev
```

## Environment variables

```bash
DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_SSL=false
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Put these values in `frontend/.env.local`. The app falls back to sample catalog data until the MySQL variables are configured.

## Key folders

```text
frontend/src/app                     Pages and API route wrappers
frontend/src/components              Shared UI building blocks
frontend/src/lib                     Frontend-only helpers
backend/src                          Server-side DB and catalog logic
backend/database/migrations          MySQL schema
```

The frontend imports backend services through the `@backend/*` alias.
The Next.js scripts run with `webpack` because this layout imports backend code from outside `frontend/`.

## Deploy to Netlify

1. Push this repository to GitHub.
2. Import the repo into Netlify.
3. Netlify reads the app from `frontend/` via `netlify.toml`.
4. Add the same environment variables from `frontend/.env.local` to Netlify.
5. Run `backend/database/migrations/001_initial_schema.sql` and `backend/database/seeds/001_sample_catalog.sql` on your MySQL instance.
6. Trigger the first production deploy.
