# ChickenCenter App

There are two ways to run this:

## 1. Offline demo mode (default, no setup)

Just run the client — it works entirely with localStorage, single device,
demo login (`demo@ramreddy.com` / `demo123`). No database, no server needed.

```
cd client
npm install
npm start
```

## 2. Cloud-backed mode (multi-device, real login, owner/staff roles)

This is the real production setup: MongoDB Atlas for storage, a Node/Express
API (deployable to Render/Railway/DigitalOcean/any VPS), and JWT-based login
with two roles — **owner** (full access, including deletes and staff
management) and **staff** (can record sales/view reports, can't delete or
manage other accounts).

Setup steps:

1. **Deploy the backend** — see `server/README.md` for the full walkthrough
   (MongoDB Atlas free-tier setup, environment variables, deploying to
   Render/Railway/a VPS, and creating your first owner login).

2. **Point the frontend at it** — in `client/`, copy `.env.example` to `.env`
   and set:
   ```
   REACT_APP_API_URL=https://your-deployed-backend-url.onrender.com
   ```
   Then `npm install && npm start` (or `npm run build` for production).
   As soon as that env var is set, the app automatically switches from
   offline/demo mode to talking to your real backend — same UI, same
   features, just backed by a real shared database instead of localStorage.

3. **Log in as owner**, then go to **Profile → Staff Accounts** to create
   logins for your staff.

## What about the standalone `ChickenCenter_App.html` file?

That single-file version stays as the offline-only demo — it's meant for
quick previewing/sharing as one file, not for running a Node server inside
it. For the real multi-device, cloud-backed version, use the `client/` +
`server/` setup above.
