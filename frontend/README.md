# Roster — MCCDMS frontend (v1)

A simple React frontend for the users / guardians / kids / staff API. Sign-in is a stand-in
for Cognito: it creates a real row in the `users` table rather than authenticating anything.

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. It expects your Express API at `http://localhost:3000`
(see `src/api.js` if yours runs elsewhere).

## Before it'll work, fix two things in your backend

**1. Enable CORS.** Your browser will block requests from `localhost:5173` to `localhost:3000`
until the API allows it:

```bash
npm install cors
```
```javascript
const cors = require("cors");
app.use(cors());
```

**2. Fix the `/staff` route** — it has 7 values but only 3 placeholders, so it'll fail or
insert garbage:

```javascript
app.post("/staff", async (req, res) => {
    const { user_id, first_name, last_name, email, phone, role, active } = req.body;
    const staff = await db.query(
        "INSERT INTO staff (user_id, first_name, last_name, email, phone, role, active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [user_id, first_name, last_name, email, phone, role, active]
    );
    res.json(staff.rows[0]);
});
```

**3. Worth a look:** `/users` currently returns `user.rows[0][1]` — that indexes into the row
object with `[1]`, which isn't how to grab a column from a pg row. It should be:
```javascript
res.json(user.rows[0]);
```

## How it's organized

- `src/api.js` — fetch calls to the four POST endpoints
- `src/components/SignIn.jsx` — the fake sign-in screen (gate before the app)
- `src/components/UserForm.jsx`, `GuardianForm.jsx`, `KidForm.jsx`, `StaffForm.jsx` — one form
  per table, each rendered as a "record card"
- Data created in a session (users, guardians, kids, staff) is kept in React state so the
  dropdowns (e.g. picking a guardian for a kid) populate as you go — there are no GET routes
  in the API yet, so nothing is fetched back from the DB on load.

## Notes / known limits (v1)

- Nothing persists across a page refresh except the signed-in user (localStorage). Add GET
  endpoints when you're ready and this can be swapped for real fetched lists.
- `staff.active` is stored as text (`"true"`/`"false"`) to match your current schema.
- `staff.phone` is sent as a number to match the `INT` column — worth revisiting since phone
  numbers don't behave well as integers (leading zeros, `+1` prefixes, overflow).
