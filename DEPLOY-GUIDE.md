# Usha Event Planner Farrukhabad — Production Deployment Guide (Cloudflare Free Tier)

Everything runs on **₹0/month** using Cloudflare Workers (Static Assets) + Cloudflare D1 SQLite. No external database, no S3 bucket, and zero exposed API keys.

## 1. Exact GitHub Repository Layout
Unzip `usha-event-planner-production.zip` and place the inner files directly at the root of a new **Private** GitHub repository (e.g., `usha-event-planner`):

```text
usha-event-planner/
├── package.json
├── wrangler.jsonc
├── DEPLOY-GUIDE.md
├── src/
│   └── worker.js
└── public/
    ├── index.html
    ├── 404.html
    └── assets/
        ├── app.js
        ├── admin.js
        ├── scene3d.js
        ├── styles.css
        └── photos/
            ├── 01-hero-mandap-pavilion.webp
            ├── 02-stage-royal-varmala.webp
            ├── 03-mandap-silk-jasmine.webp
            ├── 04-haldi-marigold-swing.webp
            ├── 05-mehendi-botanical.webp
            ├── 06-entry-jasmine-walkway.webp
            ├── 07-reception-banquet.webp
            ├── 08-stage-ring-arch.webp
            ├── 09-birthday-garden-arch.webp
            └── 10-planner-blueprints.webp
```

## 2. Create the D1 Database (1 Minute)
1. Open **Cloudflare Dashboard → Storage & Databases → D1 SQL Database → Create**.
2. Name it **`usha-events-db`** and click **Create**.
3. Copy the **Database ID** and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` inside **`wrangler.jsonc`**.
*(All 10 D1 tables, packages, add-ons, photos, and reviews auto-create and seed on the first page load—zero manual SQL required.)*

## 3. Deploy & Save Admin Password Secret (2 Minutes)
1. In **Cloudflare Dashboard → Workers & Pages → Create → Import a repository**, select `usha-event-planner` and click **Save and Deploy**.
2. Open the deployed Worker → **Settings → Variables and Secrets → Add** → add a **Secret**:
   - **Variable name:** `ADMIN_PASSWORD`
   - **Value:** Choose a strong password (12+ characters).
3. Click **Deploy**.

## 4. 1-Second Live Verification
1. Open `https://<your-url>/api/v1/health` and confirm `{"ok":true,"version":"1.0.0","db":true,"admin":true}`.
2. Open `https://<your-url>/#/admin`, sign in with `ADMIN_PASSWORD`, and test:
   - Marking a busy wedding date in **Date Calendar** and checking `#/booking`
   - Editing packages, optional add-ons, or toggling the **Live Offer**
   - Uploading a real decor photo from your phone to **Home**, **About Us**, or **Decor Gallery**
3. Submit a test booking on `#/booking` to confirm the formatted WhatsApp brief opens to **`+91 77050 07229`** and logs in **Analytics & Leads**.
