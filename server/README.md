# ChickenCenter API — server

Express + MongoDB Atlas + JWT auth (owner/staff roles). This is the backend
for the ChickenCenter app — once deployed, the React frontend (and the
standalone HTML version, with a small tweak) can talk to it from any device.

## 1. Set up MongoDB Atlas (free tier)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free **M0 cluster** (any region close to you).
3. Under **Database Access**, add a database user with a username/password
   (not your Atlas login — a separate DB user). Save the password somewhere safe.
4. Under **Network Access**, add an IP entry. For getting started quickly,
   add `0.0.0.0/0` (allow from anywhere) — you can restrict this later once
   you know your hosting provider's IP range.
5. Click **Connect** → **Drivers** → copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
6. Add a database name before the `?`, e.g.:
   `mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/chickencenter?retryWrites=true&w=majority`
   That full string is your `MONGODB_URI`.

## 2. Configure environment variables

```
cp .env.example .env
```
Fill in:
- `MONGODB_URI` — from step 1 above
- `JWT_SECRET` — any long random string (the .env.example file shows a command to generate one)
- `BOOTSTRAP_KEY` — a one-time secret only you know, used once to create your owner login
- `CORS_ORIGIN` — your deployed frontend URL (comma-separate multiple, e.g. local + production)

## 3. Run locally (optional, to test before deploying)

```
npm install
npm run dev
```
Server starts on `http://localhost:5000`. Visit `http://localhost:5000/api/health` — should return `{"ok":true}`.

## 4. Deploy to a cloud server

Any of these work — pick one:

### Render
1. Push this `server/` folder to a GitHub repo (or the whole project — Render lets you set a "root directory").
2. On https://render.com → New → Web Service → connect your repo.
3. Root directory: `server` (if it's part of a bigger repo).
4. Build command: `npm install`. Start command: `npm start`.
5. Add the same environment variables from your `.env` in Render's dashboard (Environment tab).
6. Deploy. Render gives you a URL like `https://your-app.onrender.com`.

### Railway
1. https://railway.app → New Project → Deploy from GitHub repo.
2. Set the root/start directory to `server` if needed.
3. Add environment variables in the Railway dashboard.
4. Railway auto-detects `npm start` from package.json and deploys. You get a URL like `https://your-app.up.railway.app`.

### DigitalOcean App Platform / any VPS
Same idea — point it at the `server` folder, set the env vars, `npm install && npm start`.
On a raw VPS (Droplet/EC2/etc.), install Node, clone the repo, set `.env`, then run it
behind a process manager like `pm2 start src/index.js` and a reverse proxy (nginx) for HTTPS.

## 5. Create your owner account (one-time)

Once deployed, call this once (Postman, curl, or any HTTP client) — it only
ever works the very first time, before any owner exists:

```
curl -X POST https://your-deployed-url/api/auth/bootstrap-owner \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ram Reddy",
    "email": "you@example.com",
    "password": "choose-a-strong-password",
    "bootstrapKey": "the BOOTSTRAP_KEY you put in your env vars"
  }'
```
This returns a JWT token and your owner user — but you don't need to save that
token manually, just log in normally through the app's Login page afterward.

## 6. Create staff logins (as the owner, from inside the app)

Once you're logged in as owner, the app's Profile page lets you create staff
accounts (name/email/password). Staff logins can record sales and view
reports, but can't delete invoices/expenses or create other staff accounts —
only the owner can.

## API summary

| Method | Route                          | Who           | What |
|--------|--------------------------------|---------------|------|
| POST   | /api/auth/bootstrap-owner      | anyone (once) | Create the first owner account |
| POST   | /api/auth/login                | anyone        | Log in, get a JWT |
| GET    | /api/auth/me                   | signed-in     | Validate token, get fresh profile |
| POST   | /api/auth/staff                | owner         | Create a staff login |
| GET    | /api/auth/staff                | owner         | List staff accounts |
| DELETE | /api/auth/staff/:id            | owner         | Revoke a staff login |
| GET    | /api/invoices                  | signed-in     | List all invoices |
| POST   | /api/invoices                  | signed-in     | Create an invoice |
| PATCH  | /api/invoices/:invId           | signed-in     | Update (e.g. cancel) |
| DELETE | /api/invoices/:invId           | owner         | Delete one invoice |
| POST   | /api/invoices/bulk-delete      | owner         | Delete several at once |
| GET    | /api/expenses                  | signed-in     | List expenses |
| POST   | /api/expenses                  | signed-in     | Add an expense |
| DELETE | /api/expenses/:id              | owner         | Delete an expense |
| GET    | /api/register-history          | signed-in     | Bird carry-forward records |
| PUT    | /api/register-history/:date    | signed-in     | Upsert a day's carry-forward record |
