# Cloudflare deployment guide

This project keeps its normal two-process MERN development workflow and adds a production Cloudflare workflow:

- React/Vite is built into `client/dist` and served as Worker static assets.
- `/api/*` requests are handled by the existing Express application.
- one Durable Object owns the Mongoose connection to MongoDB Atlas.
- private seller documents are stored in an R2 bucket.
- Firebase ID tokens are verified against Firebase's public signing keys, so no Firebase service-account private key is deployed.

Run all commands from the project root.

## 1. Install the migration dependencies

```bash
npm install
```

This updates `package-lock.json`, installs Wrangler and the Cloudflare types, upgrades Mongoose to version 9, and replaces `firebase-admin` with `jose`.

Generate binding-aware Worker types:

```bash
npm run cloudflare:typegen
```

## 2. Check the project locally

Keep using the normal Node development workflow while coding:

```bash
npm run dev
```

Then check both workspaces:

```bash
npm run typecheck
npm run build
```

## 3. Sign in to Cloudflare

```bash
npx wrangler login
npx wrangler whoami
```

The first command opens Cloudflare in the browser. Approve Wrangler access, return to the terminal, and confirm that `whoami` shows the intended account.

## 4. Create the private document bucket

The configured bucket name is `foran-seller-documents`:

```bash
npx wrangler r2 bucket create foran-seller-documents
```

If that name already exists in your account, either keep the existing private bucket or change `bucket_name` in `wrangler.jsonc` before creating a different one. Do not enable public bucket access: CNIC and company documents must only be downloaded through the authenticated admin API.

## 5. Prepare MongoDB Atlas

Use a dedicated Atlas database user for this application with access only to the `foran_seller_central` database.

Cloudflare Workers do not have one fixed outbound IP on standard plans. For initial testing, Atlas Network Access may need `0.0.0.0/0`. If you use that rule:

- use a long, unique database password;
- grant the database user only the permissions the application needs;
- keep the connection string only in the Cloudflare secret;
- retain Atlas TLS;
- replace broad network access with a private/static-egress arrangement before handling real identity documents if your production requirements demand it.

## 6. Add encrypted Worker secrets

Enter each value only when Wrangler prompts for it. Do not put these production values in `wrangler.jsonc` or commit them.

```bash
npx wrangler secret put MONGODB_URI
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put ADMIN_EMAILS
```

Use the Atlas connection string for `MONGODB_URI`, the Firebase project ID shown in Firebase Project Settings, and a comma-separated list of administrator Google email addresses for `ADMIN_EMAILS`.

## 7. Test in the Worker runtime locally

Create the ignored local Worker environment file:

```bash
cp .dev.vars.example .dev.vars
```

Fill in `.dev.vars`, then run:

```bash
npm run cloudflare:dev
```

Wrangler normally serves the combined application at `http://localhost:8787`. It uses local R2 state while connecting to the Atlas URI in `.dev.vars`. Keep `localhost` in Firebase Authentication's authorized domains.

## 8. Deploy

```bash
npm run cloudflare:deploy
```

The command builds the React client first and then uploads the Worker, static assets, Durable Object migration, and R2 binding. Wrangler prints the deployed `workers.dev` URL.

## 9. Authorize the deployed domain in Firebase

In Firebase Console:

1. Open Authentication.
2. Open Settings, then Authorized domains.
3. Add only the hostname printed by Wrangler, for example `foran-seller-central.example-subdomain.workers.dev`.
4. Do not include `https://` or a path.

Google sign-in will be blocked on the deployed application until this domain is authorized.

## 10. Verify the deployment

Open the health endpoint first:

```text
https://YOUR-WORKERS-DOMAIN/api/v1/health
```

It should return:

```json
{"status":"ok","service":"foran-seller-central-api"}
```

Then test the complete workflow:

1. Sign in as a seller.
2. Upload new test documents and submit an application.
3. Sign in with an email listed in `ADMIN_EMAILS`.
4. Open `/admin` and download each private document.
5. Approve the application.
6. Return as the seller and complete plan selection and the placeholder payment.

To inspect live logs while testing:

```bash
npm run cloudflare:tail
```

## Existing local uploads

Files previously uploaded into `server/uploads` exist only on this computer. Their MongoDB records cannot make those bytes available to Cloudflare. Treat existing records as development test data and have those applications upload the documents again, or migrate the files separately before relying on the old records. New local Node uploads continue using `server/uploads`; new Worker uploads use private R2 storage.

## Custom domain

After the `workers.dev` deployment is working, add a custom domain from Cloudflare Workers & Pages. Add that hostname to Firebase Authorized domains as well. API requests use the same origin (`/api/v1`), so no production API URL needs to be baked into the React bundle.
