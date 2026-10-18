# Foran.pk Seller Central

MERN seller onboarding application with Firebase provider authentication, manual administrator verification, plan selection, a placeholder store-placement payment step, and a temporary seller dashboard.

## Application flow

1. Sign in with Google through Firebase Authentication.
2. Complete and submit the store-verification form.
3. Wait for an administrator to approve it or request changes.
4. Select Basic or Premium. The selection is stored in `users.plan`.
5. Continue through the placeholder Store Placement Payment screen.
6. Open the temporary seller dashboard.

Apple sign-in is intentionally not enabled yet. There is no manual email/password authentication.

## Before running anything

You need:

- Node.js 24 LTS or another currently supported LTS release
- npm
- A local MongoDB installation or MongoDB Atlas connection string
- A Firebase project with a Web App and Google Authentication enabled
- Firebase Admin service-account values for the Express server

## Step-by-step setup

Run every command below yourself from the project root.

### 1. Confirm your tools

```bash
node --version
npm --version
mongosh --version
```

If you use MongoDB Atlas, `mongosh` is optional.

### 2. Install both workspace applications

```bash
npm install
```

The root `package.json` installs dependencies for both `client` and `server` through npm workspaces.

### 3. Create your local environment files

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Never commit either `.env` file.

### 4. Configure Firebase Authentication

In the Firebase console:

1. Create or select a Firebase project.
2. Add a Web App.
3. Open **Authentication → Sign-in method**.
4. Enable **Google** only.
5. Confirm `localhost` is an authorized domain.
6. Copy the Web App configuration values into `client/.env`.
7. Open **Project settings → Service accounts** and create a service account key.
8. Copy its project ID, client email, and private key into `server/.env`.

Keep the private key inside the environment file. Do not add the downloaded service-account JSON file to this repository.

### 5. Choose the first administrator

Set `ADMIN_EMAILS` in `server/.env` to the Google email address that should access the admin portal:

```dotenv
ADMIN_EMAILS=your-google-account@example.com
```

Multiple administrator emails can be separated with commas.

### 6. Configure MongoDB

For a local database, keep:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/foran_seller_central
```

Or replace it with your MongoDB Atlas connection string.

### 7. Start the application

To start both applications together:

```bash
npm run dev
```

Or use two terminals to reinforce the client/server separation:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Open `http://localhost:5173`.

### 8. Test the approval workflow

Use two different Google accounts:

1. Sign in with a seller account, complete the store form, and submit it.
2. Sign out.
3. Sign in with the email listed in `ADMIN_EMAILS`.
4. Open `/admin`, review the application, and approve it or request changes.
5. Sign back in as the seller and confirm the Approval step restores the saved status.

### 9. Build when you are ready

```bash
npm run typecheck
npm run build
```

## Development-only limitations

- Uploaded identity documents are written to `server/uploads` for local development. Production must use private object storage, malware scanning, encryption, retention rules, and audited access.
- Store Placement Payment does not collect money. Its action creates a `DEMO_COMPLETED` record and opens the dashboard.
- The temporary dashboard will be replaced after its final design is provided.
- The placeholder brand mark should be replaced with the official Foran.pk logo asset.
