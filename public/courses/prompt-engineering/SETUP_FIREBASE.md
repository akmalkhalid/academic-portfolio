# Firebase Setup for Global Leaderboard

The HTML already works without this — it just falls back to a per-browser localStorage leaderboard. Follow these steps to enable a real shared leaderboard where every visitor sees the same scores.

**Time required:** ~10 minutes (one-time setup).
**Cost:** $0. Firebase's free tier handles ~50,000 reads and 20,000 writes per day, which is way more than a portfolio leaderboard will ever use.

---

## Step 1 — Create a Firebase project

1. Go to **https://console.firebase.google.com** and sign in with a Google account.
2. Click **"Add project"** (or "Create a project").
3. Give it a name like `prompt-architect` (Firebase will append a random suffix to make it unique).
4. **Google Analytics**: you can skip this — the leaderboard doesn't need it. Toggle it off, then "Create project".
5. Wait ~30 seconds for provisioning, then click "Continue".

## Step 2 — Add a Web App to the project

1. On the project's home page, click the **`</>` (web) icon** to register a web app.
2. Give it a nickname like `Leaderboard Web`. **Don't** check "Firebase Hosting" — you're hosting on GitHub Pages.
3. Click **"Register app"**.
4. You'll see a code snippet like this:

   ```js
   const firebaseConfig = {
       apiKey: "AIzaSy...",
       authDomain: "prompt-architect-abc12.firebaseapp.com",
       projectId: "prompt-architect-abc12",
       storageBucket: "prompt-architect-abc12.appspot.com",
       messagingSenderId: "123456789012",
       appId: "1:123456789012:web:abc123def456"
   };
   ```

5. **Copy the values** from this object and paste them over the placeholders in `prompt_engineering_architect.html` (search for `firebaseConfig` near the top of the file). Click "Continue to console".

> **Note on "secrets":** these values look secret but are intentionally public — they identify your project, not authenticate you. Security comes from the rules in Step 4, not from hiding the config. It's fine to commit this to GitHub.

## Step 3 — Enable Cloud Firestore

1. In the Firebase Console's left sidebar, click **"Build" → "Firestore Database"**.
2. Click **"Create database"**.
3. Choose a location closest to your users (e.g., `asia-southeast1` for Malaysia). **You can't change this later.**
4. Pick **"Start in production mode"** (we'll paste proper rules next).
5. Click "Enable".

## Step 4 — Paste the security rules

This is the most important step — without proper rules, anyone can write fake high scores or even delete entries.

1. In Firestore, click the **"Rules"** tab at the top.
2. Replace the entire contents with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /leaderboard/{entry} {
         // Anyone can read the leaderboard.
         allow read: if true;

         // Anyone can submit a score, but only with valid shape.
         allow create: if
              request.resource.data.keys().hasOnly(['name', 'xp', 'date', 'createdAt'])
           && request.resource.data.name is string
           && request.resource.data.name.size() >= 1
           && request.resource.data.name.size() <= 30
           && request.resource.data.xp is number
           && request.resource.data.xp >= 0
           && request.resource.data.xp <= 1500
           && request.resource.data.date is string
           && request.resource.data.date.size() == 10
           && request.resource.data.createdAt == request.time;

         // No one can edit or delete existing entries.
         allow update, delete: if false;
       }
     }
   }
   ```

3. Click **"Publish"**.

**What this enforces:**
- Reads are public (so the leaderboard displays for everyone).
- Each entry must be exactly `{ name, xp, date, createdAt }` — no extra fields, no missing fields.
- `name` is a 1–30 character string.
- `xp` is a number between 0 and 1500 (max realistic score is ~775, so 1500 leaves headroom).
- `createdAt` must be the server's current time (prevents back-dated entries).
- Nobody can update or delete existing rows.

## Step 5 — Authorize your GitHub Pages domain

By default Firebase only allows requests from `localhost` and the Firebase-hosted domain. You need to allow your GitHub Pages domain too.

1. In the Firebase Console, click the gear icon → **"Project settings"**.
2. Scroll down to **"Your apps"** → find your web app → **"App settings"**.
3. Actually, for Firestore (not Auth), this works out of the box from any origin — there's no domain allowlist for Firestore reads/writes with public rules. **You can skip this step.**

(The domain allowlist only matters if you later add Firebase Authentication. For now, your GitHub Pages site will work as soon as the config is pasted and rules are published.)

## Step 6 — Test it

1. Save your edited HTML.
2. Open the page in a browser.
3. Open DevTools console (F12). You should see:
   ```
   [Firebase] Initialised — global leaderboard enabled.
   ```
4. Go through the course, finish the Final Assessment, type a name, hit Save.
5. You should see in the console:
   ```
   [Firebase] Score posted to global leaderboard.
   ```
6. Click the **Leaderboard** nav. The status badge in the header should turn **green** with the text "🌐 Global (live)".
7. Open the same page in an incognito window or a different device — you should see the same entry. Done.

## Step 7 — Commit and push to GitHub

```bash
git add prompt_engineering_architect.html SETUP_FIREBASE.md
git commit -m "Enable Firebase-backed global leaderboard"
git push
```

That's it. The leaderboard is now shared across every visitor to your portfolio site.

---

## Troubleshooting

**Console says "Firebase: Error (auth/...)"**
Wrong values in `firebaseConfig`. Double-check you copied from the right project. The `projectId` is the most common one to mistype.

**Console says "Missing or insufficient permissions"**
Your security rules either weren't published or have a typo. Re-paste them from Step 4 and click Publish again. Make sure the version is `'2'` not `'1'`.

**Status badge stays gray "Local only" but no console errors**
The `firebaseConfig` placeholders weren't replaced. Search the HTML for `YOUR_API_KEY` — if you find it, you missed pasting one of the values.

**"Quota exceeded" errors after a lot of use**
Free tier limits are 50K reads/day and 20K writes/day. A portfolio site will essentially never hit these. If you somehow do, Firebase has a generous Blaze plan but you'd need to deliberately wire up a credit card.

**Want to see who's been writing**
Firestore Console → Data tab. You can browse, sort, and manually delete entries you don't want.

**Worried about spam / fake submissions**
The rules cap XP at 1500 and name at 30 chars, so the worst case is a list of plausible-looking fake entries. If it becomes a problem, you can either:
- Tighten rules further (e.g., add a "lastSubmittedAt" client-stamp and rate-limit, though this is fragile from the client)
- Enable Firebase Anonymous Auth and require `request.auth != null` (still no signup needed, but Firebase rate-limits per session)
- Periodically clean the Firestore collection manually from the console

For a portfolio demo, none of this is usually necessary.
