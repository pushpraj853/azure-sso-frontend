# Azure SSO — Complete Flow Diagram Final test

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        WHO IS INVOLVED                                          │
│                                                                                 │
│  [User]──────►[Your App]──────►[Your Backend]──────►[Microsoft Azure AD]        │
│                (React)          (Express)            (login.microsoftonline.com)│
│                :5173             :3001                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Scenario 1 — No Email, Generic Sign In (Standard Multi-Tenant)

**Who:** Any user. No email entered. Just clicks "Sign in with Microsoft."
**Example:** A new user who doesn't know their domain is configured.

```
User                Frontend              Backend               Microsoft Azure
 │                     │                     │
 │  opens /login        │                     │                         │
 │─────────────────────►│                     │                         │
 │                      │                     │                         │
 │  clicks "Sign in"    │                     │                         │
 │─────────────────────►│                     │                         │
 │                      │ GET /auth/login      │                        │
 │                      │─────────────────────►│                        │
 │                      │                      │ builds URL:            │
 │                      │                      │ login.microsoftonline  │
 │                      │                      │ .com/common/oauth2/    │
 │                      │                      │ v2.0/authorize         │
 │                      │                      │ ?client_id=3e6ccaef    │
 │                      │                      │ &scope=openid profile  │
 │                      │                      │ &state=abc123          │
 │◄─────────────────────────────── 302 redirect to Microsoft ──────────│
 │                                                                      │
 │  ┌────────────────────────────────────────────────────────────────┐  │
 │  │        Microsoft Login Page (login.microsoftonline.com)        │  │
 │  │                                                                │  │
 │  │   Enter email: [                    ]                          │  │
 │  │               (user must type email manually)                  │  │
 │  └────────────────────────────────────────────────────────────────┘  │
 │                                                                       │
 │  user types: pushpraj853@gmail.com → clicks Next → enters password   │
 │                                                                       │
 │                             Microsoft validates → issues code        │
 │◄──────────────── redirect to localhost:3001/auth/callback?code=Xk9.. │
 │                      │                      │                        │
 │ GET /auth/callback    │                      │                        │
 │──────────────────────────────────────────────►                        │
 │                      │                      │ POST to MS token URL   │
 │                      │                      │ with code + secret     │
 │                      │                      │──────────────────────►  │
 │                      │                      │◄── JWT token ──────────  │
 │                      │                      │                         │
 │                      │                      │ Decodes JWT:            │
 │                      │                      │ {                       │
 │                      │                      │   tid: "f6b4e700..."    │
 │                      │                      │   name: "Pushpraj"      │
 │                      │                      │   email: "push@gmail"   │
 │                      │                      │   oid: "abc-object-id"  │
 │                      │                      │ }                       │
 │                      │                      │                         │
 │                      │                      │ looks up tid in         │
 │                      │                      │ tenants.json →          │
 │                      │                      │ NOT FOUND (personal)    │
 │                      │                      │ → tenantDisplayName =   │
 │                      │                      │   "Personal Account"    │
 │                      │                      │                         │
 │                      │                      │ saves to session        │
 │◄─── redirect to localhost:5173/auth/callback?success=true ──────────  │
 │                      │                      │                         │
 │ GET /auth/me          │                      │                         │
 │─────────────────────────────────────────────►│                         │
 │◄────────────────────────────── { name, email, tid, tenantDisplayName }│
 │─────────────────────►│                       │                         │
 │   → /dashboard        │                       │                         │
```

**What user sees on dashboard:**

```
Welcome back, Pushpraj 👋
Authenticated via: Personal Account
SSO Mode: Standard Multi-tenant | 🟢 Real Azure
Tenant ID (tid): f6b4e700-728c-4526-8de9-66e3bfa3bdf7
```

---

## Scenario 2 — Email Entered → Standard Tenant (login_hint)

**Who:** User who enters their email. Their domain is NOT in tenants.json.
**Example:** `john@somecompany.com` — not a registered dedicated client.

```
User                Frontend              Backend               Microsoft Azure
 │                     │                     │                        │
 │  enters email:       │                     │                        │
 │  john@somecompany.com│                     │                        │
 │  clicks "Continue"   │                     │                        │
 │─────────────────────►│                     │                        │
 │                      │ GET /auth/login      │                        │
 │                      │ ?email=john@some..   │                        │
 │                      │─────────────────────►│                        │
 │                      │                      │ extracts domain:       │
 │                      │                      │ "somecompany.com"      │
 │                      │                      │                        │
 │                      │                      │ looks up in            │
 │                      │                      │ tenants.json by        │
 │                      │                      │ allowedDomains →       │
 │                      │                      │ NOT FOUND              │
 │                      │                      │                        │
 │                      │                      │ builds URL:            │
 │                      │                      │ /common/oauth2/...     │
 │                      │                      │ &login_hint=john@some  │
 │                      │                      │    ↑                   │
 │                      │                      │ This tells Microsoft   │
 │                      │                      │ to PRE-FILL the email  │
 │◄───────────────────────────── 302 redirect ──────────────────────── │
 │                                                                      │
 │  ┌──────────────────────────────────────────────────────────────┐    │
 │  │       Microsoft Login Page                                    │    │
 │  │                                                               │    │
 │  │   john@somecompany.com  ← ALREADY FILLED IN                  │    │
 │  │   [Next]                                                      │    │
 │  └──────────────────────────────────────────────────────────────┘    │
 │                                                                       │
 │                (user only needs to enter password)                    │
```

**Effect:** User skips typing their email. Microsoft page starts at the password step.

---

## Scenario 3 — Email Entered → Dedicated Tenant Match ⭐ (Your Client's Case)

**Who:** A client employee whose company domain IS in tenants.json as `mode: dedicated`.
**Example:** `s.chen@contoso.com` — Contoso is a registered client with their own secrets.

```
User                Frontend              Backend               Microsoft Azure
 │                     │                     │                        │
 │  enters email:       │                     │                        │
 │  s.chen@contoso.com  │                     │                        │
 │  clicks "Continue"   │                     │                        │
 │─────────────────────►│                     │                        │
 │                      │ GET /auth/login      │                        │
 │                      │ ?email=s.chen@...    │                        │
 │                      │─────────────────────►│                        │
 │                      │                      │ extracts domain:       │
 │                      │                      │ "contoso.com"          │
 │                      │                      │                        │
 │                      │                      │ looks up tenants.json  │
 │                      │                      │ by allowedDomains →    │
 │                      │                      │ ✅ FOUND: Contoso Ltd. │
 │                      │                      │ mode: "dedicated"      │
 │                      │                      │ tenantId: "mock-cont." │
 │                      │                      │ clientId: "mock-cont." │
 │                      │                      │                        │
 │                      │                      │ builds URL using       │
 │                      │                      │ CONTOSO's credentials: │
 │                      │                      │                        │
 │                      │                      │ login.microsoftonline  │
 │                      │                      │ .com/                  │
 │                      │                      │ [CONTOSO_TENANT_ID]    │ ← their tenant
 │                      │                      │ /oauth2/v2.0/authorize │
 │                      │                      │ ?client_id=            │
 │                      │                      │ [CONTOSO_CLIENT_ID]    │ ← their app reg
 │                      │                      │ &login_hint=s.chen@.. │
 │                      │                      │                        │
 │◄──────────────────────────── 302 redirect ──────────────────────── │
 │                                                                      │
 │  ┌──────────────────────────────────────────────────────────────┐    │
 │  │       Microsoft Login (CONTOSO'S TENANT)                      │    │
 │  │                                                               │    │
 │  │   s.chen@contoso.com  ← PRE-FILLED                           │    │
 │  │   [Sign in to Contoso Ltd.]                                   │    │
 │  │                                                               │    │
 │  │   (Contoso's branding, their MFA policies, their rules)       │    │
 │  └──────────────────────────────────────────────────────────────┘    │
 │                                                                       │
 │  user enters password → Microsoft (CONTOSO's AD) validates           │
 │                                                                       │
 │◄──── redirect to /auth/callback?code=Xk9... ──────────────────────  │
 │                      │                      │                        │
 │ GET /auth/callback    │                      │                        │
 │─────────────────────────────────────────────►│                        │
 │                      │                      │ POST to Contoso's      │
 │                      │                      │ token endpoint using   │
 │                      │                      │ CONTOSO's clientSecret │
 │                      │                      │──────────────────────► │
 │                      │                      │◄── JWT (from Contoso) ─│
 │                      │                      │                        │
 │                      │                      │ JWT contains:          │
 │                      │                      │ {                      │
 │                      │                      │   tid: "contoso-tid"   │
 │                      │                      │   name: "Sarah Chen"   │
 │                      │                      │   email: "s.chen@..."  │
 │                      │                      │ }                      │
 │                      │                      │                        │
 │                      │                      │ looks up tid in        │
 │                      │                      │ tenants.json →         │
 │                      │                      │ ✅ Contoso Ltd.        │
 │                      │                      │                        │
 │                      │                      │ stores session:        │
 │                      │                      │ {                      │
 │                      │                      │   name: "Sarah Chen"   │
 │                      │                      │   tenantDisplayName:   │
 │                      │                      │     "Contoso Ltd."     │
 │                      │                      │   tenantMode:          │
 │                      │                      │     "dedicated"        │
 │                      │                      │   brandColor: "#0078D4"│
 │                      │                      │ }                      │
 │◄─── redirect to /auth/callback?success=true ──────────────────────  │
 │─────────────────────►│                       │                        │
 │   → /dashboard        │                       │                        │
```

**What Sarah sees on dashboard:**

```
Welcome back, Sarah 👋
Authenticated via: Contoso Ltd.   ← their brand color
SSO Mode: Dedicated (client secrets) | 🟢 Real Azure
Tenant ID (tid): mock-contoso-tid-9f3a2b1c
```

---

## Scenario 4 — Mock Mode (No Azure, Local Dev)

**Who:** Developer testing locally without real Azure credentials.
**Example:** Running with `AZURE_MODE=` (empty) in .env.

```
User                Frontend              Backend               Mock Azure Page
 │                     │                     │                  (served by backend)
 │  clicks "Sign in"    │                     │                        │
 │─────────────────────►│                     │                        │
 │                      │ GET /auth/login      │                        │
 │                      │─────────────────────►│                        │
 │                      │                      │ AZURE_MODE != "real"   │
 │                      │                      │ → redirect to          │
 │                      │                      │ /auth/mock-azure       │
 │◄─────────────────── redirect to :3001/auth/mock-azure ─────────────  │
 │                                                                       │
 │ GET /auth/mock-azure  │                      │                        │
 │──────────────────────────────────────────────────────────────────────►│
 │◄──── HTML: fake Microsoft login page with 4 hardcoded accounts ──────│
 │                                                                       │
 │  User picks: Sarah Chen (s.chen@contoso.com)                         │
 │──────────────────────────────────────────────────────────────────────►│
 │                      │                      │                        │
 │ GET /auth/mock-select?userId=contoso-user-001                         │
 │─────────────────────────────────────────────►│                        │
 │                      │                      │ finds user in           │
 │                      │                      │ mockUsers.json          │
 │                      │                      │ reads their tenantId    │
 │                      │                      │ looks up tenants.json   │
 │                      │                      │ creates mock JWT        │
 │                      │                      │ saves to session        │
 │◄─── redirect to /auth/callback?success=true ──────────────────────  │
 │─────────────────────►│                       │                        │
 │   → /dashboard        │                       │                        │
```

---

## The Token — What's Inside (JWT Decoded)

Every successful login produces a JWT that Microsoft (or mock) issues.
Your backend decodes this without verifying signature — Azure already did that.

```
JWT Structure:
┌─────────────────────────────────────────────────────────┐
│  Header.Payload.Signature                                │
│                                                         │
│  Payload (decoded):                                     │
│  {                                                      │
│    "iss": "https://login.microsoftonline.com/f6b4.../v2.0"  ← issuer (MS)
│    "aud": "3e6ccaef-dc5f-47ac-...",          ← your client_id
│    "tid": "f6b4e700-728c-4526-...",          ← TENANT ID (key field)
│    "oid": "abc-123-object-id",               ← unique user ID in that tenant
│    "name": "Pushpraj Sharma",                ← display name
│    "email": "pushpraj853@gmail.com",         ← email
│    "preferred_username": "pushpraj@gmail.com",
│    "exp": 1714376400,                        ← expiry timestamp
│    "iat": 1714372800,                        ← issued at
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Your backend reads "tid"
                          │ and does this:
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 tenants.json lookup                      │
│                                                         │
│  tid = "mock-contoso-tid-9f3a2b1c"                     │
│           ↓                                             │
│  [search tenants where tenantId === tid]                │
│           ↓                                             │
│  Found → {                                              │
│    displayName: "Contoso Ltd.",                         │
│    mode: "dedicated",                                   │
│    brandColor: "#0078D4"                                │
│  }                                                      │
│           ↓                                             │
│  Not Found → tenantDisplayName = raw tid value          │
└─────────────────────────────────────────────────────────┘
```

---

## Email Input → login_hint Flow (New Enhancement)

```
Login page UI:

  ┌──────────────────────────────────────────────┐
  │  Sign in to Acme Corp                        │
  │                                              │
  │  Work or personal email (optional):          │
  │  ┌────────────────────────────────────┐      │
  │  │  you@yourcompany.com               │      │
  │  └────────────────────────────────────┘      │
  │                                              │
  │  [Sign in with Microsoft]                    │
  │                                              │
  └──────────────────────────────────────────────┘

             │
             ▼ (on button click, passes email to backend)

  GET /auth/login?email=you@yourcompany.com

             │
             ▼ (backend logic)

  ┌─────────────────────────────────────────────┐
  │  Step 1: Extract domain                     │
  │    "you@yourcompany.com" → "yourcompany.com" │
  │                                             │
  │  Step 2: Lookup in tenants.json             │
  │    WHERE allowedDomains includes             │
  │    "yourcompany.com"                         │
  │                                             │
  │  Step 3a: FOUND + mode = "dedicated"        │
  │    → use CLIENT's tenantId in URL           │
  │    → use CLIENT's clientId                  │
  │    → add login_hint=email                   │
  │                                             │
  │  Step 3b: FOUND + mode = "standard"         │
  │    → use /common/ endpoint (your creds)     │
  │    → add login_hint=email                   │
  │                                             │
  │  Step 3c: NOT FOUND or no email             │
  │    → use /common/ endpoint (your creds)     │
  │    → add login_hint=email (if provided)     │
  └─────────────────────────────────────────────┘
```

---

## All Possible Situations — Decision Matrix

| Email entered | Domain in tenants.json | Mode                          | What happens                                                      |
| ------------- | ---------------------- | ----------------------------- | ----------------------------------------------------------------- |
| No            | —                      | —                             | Generic `/common` endpoint, user types email manually on MS page  |
| Yes           | No                     | —                             | `/common` endpoint + `login_hint`, email pre-filled               |
| Yes           | Yes                    | `standard`                    | `/common` endpoint + `login_hint`, email pre-filled               |
| Yes           | Yes                    | `dedicated`                   | **Client's tenant endpoint** + client's `clientId` + `login_hint` |
| Yes           | Yes                    | `dedicated` but no `clientId` | Falls back to `/common` + `login_hint`                            |

---

## Full System Component Map

```
azure-setup/
│
├── azure-frontend/                    (React, Port 5173)
│   └── src/
│       ├── context/AuthContext.jsx    → holds user state, login(email)/logout functions
│       ├── pages/Login.jsx            → email input + MS button → calls login(email)
│       ├── pages/AuthCallback.jsx     → waits at /auth/callback, calls /auth/me
│       ├── pages/Dashboard.jsx        → shows user profile + which tenant authenticated
│       └── pages/AdminTenants.jsx     → CRUD for tenants.json via API
│
├── azure-backend/                     (Express, Port 3001)
│   └── src/
│       ├── server.js                  → sets up express, cors, session
│       ├── routes/auth.js             → /auth/login, /auth/callback, /auth/me, /auth/logout
│       │                                 /auth/mock-azure, /auth/mock-select
│       ├── routes/tenants.js          → GET/POST/PUT/DELETE /api/tenants
│       ├── services/tenantStore.js    → reads/writes tenants.json
│       ├── services/mockAzure.js      → generates fake MS login HTML
│       ├── services/tokenService.js   → JWT create/verify/decode
│       ├── tenants.json               → client registry (Contoso, Fabrikam, ...)
│       └── mockUsers.json             → fake users for mock mode
│
└── .env                               → AZURE_MODE, ACME_TENANT_ID/CLIENT_ID/SECRET
```

---

## State Machine — What the Backend Session Holds

```
Before login:
  session = {}  (empty)

After successful login:
  session = {
    user: {
      oid: "abc-object-id",              unique user ID
      name: "Sarah Chen",
      email: "s.chen@contoso.com",
      preferred_username: "s.chen@...",
      tid: "mock-contoso-tid-9f3a2b1c",  Azure tenant ID
      tenantDisplayName: "Contoso Ltd.", resolved from tenants.json
      tenantMode: "dedicated",           standard | dedicated
      brandColor: "#0078D4",             from tenants.json
      jobTitle: "Software Engineer",
      isMock: false                      true if mock mode
    },
    token: "eyJ..."                      actual token (JWT or mock)
  }

After logout:
  session = {}  (destroyed)
```

---

## Scenario 5 � Admin Adds a New Client Tenant (Protected Flow)

**Who:** An admin (already logged in) registering a new enterprise client.
**Example:** Contoso comes to you and gives you their Azure secrets.

### Step-by-step:

**1. Admin must be logged in first**

- Opens `/admin/tenants`
- `ProtectedRoute` checks `AuthContext` � if no user ? redirect to `/login`
- If user exists ? page renders

**2. Page loads existing tenants**

- `GET /api/tenants` hits the backend
- `requireAuth` middleware checks `req.session.user` � if no session ? `401 Unauthorized`
- If session valid ? reads `tenants.json` ? returns list

**3. Admin fills the form and clicks "Add Tenant"**

- `POST /api/tenants` with `{ displayName, tenantId, allowedDomains, mode, clientId, clientSecret }`
- `requireAuth` checks session again ?
- Backend auto-generates a slug ID e.g. `"contoso-ltd-a3f2b1"`
- Writes the new entry to `tenants.json` on disk immediately

**4. From this exact moment � no restart, no code change needed**

- `tenantStore.js` uses `readFileSync` on every request (no in-memory cache)
- Next login with `anyone@contoso.com` ? domain match found ? dedicated route used

---

## Protection � Two Layers (Defence in Depth)

```
Unauthenticated access attempt:

  Browser: opens /admin/tenants          curl: POST /api/tenants
         �                                       �
  [ProtectedRoute]                      [requireAuth middleware]
  checks AuthContext.user               checks req.session.user
  no user ? redirect /login             no session ? 401 JSON
```

Both layers reject independently. Even if someone bypasses the UI entirely (e.g. via Postman/curl), the backend still blocks them.

---

## Full System Component Map (Updated)

```
azure-setup/
�
+-- azure-frontend/                    (React, Port 5173)
�   +-- src/
�       +-- context/AuthContext.jsx    ? user state, login(email)/logout
�       +-- components/
�       �   +-- ProtectedRoute.jsx     ? redirects to /login if not authenticated
�       �   +-- MicrosoftButton.jsx    ? MS-branded button
�       �   +-- Navbar.jsx             ? auth-aware nav
�       +-- pages/
�       �   +-- Landing.jsx            ? public
�       �   +-- Login.jsx              ? public: email input + MS button
�       �   +-- AuthCallback.jsx       ? public: handles OAuth redirect
�       �   +-- Dashboard.jsx          ? PROTECTED
�       �   +-- AdminTenants.jsx       ? PROTECTED: manage client SSO configs
�       +-- App.jsx                    ? /dashboard + /admin/tenants in ProtectedRoute
�
+-- azure-backend/                     (Express, Port 3001)
�   +-- src/
�       +-- server.js                  ? express + cors + session
�       +-- routes/
�       �   +-- auth.js                ? /auth/login (email domain routing + login_hint)
�       �   �                             /auth/callback, /auth/me, /auth/logout
�       �   �                             /auth/mock-azure, /auth/mock-select
�       �   +-- tenants.js             ? requireAuth on ALL routes
�       �                                 GET/POST/PUT/DELETE /api/tenants
�       +-- services/
�       �   +-- tenantStore.js         ? readFileSync every call � no cache
�       �   +-- mockAzure.js           ? fake MS login HTML (mock mode only)
�       �   +-- tokenService.js        ? JWT helpers
�       +-- tenants.json               ? grows as clients are added via Admin UI
�       +-- mockUsers.json             ? mock mode only
�
+-- .env                               ? AZURE_MODE, ACME credentials
```

---

## What "Admin Login" Means

In this app there is **no separate admin account type**. Any Microsoft account can log in.
The difference is purely **where you land after login**.

```
[Sign in with Microsoft]          ?  after login ? /dashboard
[Admin: Sign in with Microsoft]   ?  after login ? /admin/tenants
```

The admin button is a convenience shortcut � same Microsoft SSO, same token, same session.
The only difference is a `next=/admin/tenants` flag carried through the flow.

---

## Scenario 6 � Admin Login Flow (next param)

**Who:** A developer or company admin who wants to manage client SSO configs.

```
User (Admin)         Frontend              Backend               Microsoft
 �                      �                     �                      �
 �  clicks "Admin:       �                     �                      �
 �  Sign in with MS"     �                     �                      �
 �----------------------?�                     �                      �
 �                       � GET /auth/login      �                      �
 �                       � ?email=...           �                      �
 �                       � &next=/admin/tenants �                      �
 �                       �---------------------?�                      �
 �                       �                      � stores in session:   �
 �                       �                      � loginNext =          �
 �                       �                      � "/admin/tenants"     �
 �                       �                      �                      �
 �                       �                      � builds Azure URL     �
 �?---------------------------- redirect to Microsoft ----------------�
 �                                                                     �
 �  (signs in with Microsoft � identical to normal login)             �
 �                                                                     �
 �?-------------------- redirect to /auth/callback?code=... ----------�
 �                       �                      �                      �
 � GET /auth/callback     �                      �                      �
 �----------------------------------------------?�                      �
 �                       �                      � exchanges code        �
 �                       �                      � decodes JWT           �
 �                       �                      � saves session         �
 �                       �                      �                       �
 �                       �                      � reads loginNext from  �
 �                       �                      � session:              �
 �                       �                      � "/admin/tenants"      �
 �                       �                      �                       �
 �?-- redirect to /auth/callback?success=true&next=%2Fadmin%2Ftenants -�
 �                       �                      �                       �
 � /auth/callback page   �                      �                       �
 �----------------------?�                      �                       �
 �                       � reads ?next param     �                       �
 �                       � = "/admin/tenants"    �                       �
 �                       � calls /auth/me        �                       �
 �                       �---------------------?�                       �
 �                       �?-- user profile ------�                       �
 �                       � navigate(next)         �                       �
 �?-- /admin/tenants ----�                       �                       �
```

**vs normal login:**

```
Normal:   next = "/dashboard"    ? lands on user dashboard
Admin:    next = "/admin/tenants" ? lands on tenant management panel
```

**Important:** The `/admin/tenants` route is still protected by `ProtectedRoute` and
the `/api/tenants` API is protected by `requireAuth`. The `next` param only controls
**where you land** � it does not grant any extra permissions.

In a production app, you would add a role check here (e.g. only users whose
`tid` matches your own Acme tenant can access admin pages).

---

## Admin vs User Login � Key Difference (Summary)

```
Both buttons trigger identical Microsoft SSO.
The only difference is a ?next= flag in the URL:

  User login:   GET /auth/login?next=/dashboard
  Admin login:  GET /auth/login?next=/admin/tenants

Backend stores it in session
         ?
passes it back after callback as ?next= in redirect URL
         ?
AuthCallback reads ?next
         ?
navigates there after /auth/me resolves
```

---

## Add Tenant � Step by Step (Plain English)

1. **Admin logs in via Microsoft SSO** ? session created on backend

2. **Admin opens /admin/tenants**
   ? ProtectedRoute checks: user in session? ? ? renders page
   ? Page calls GET /api/tenants
   ? Backend: requireAuth checks session ? ? returns tenant list

3. **Admin fills form, clicks "Add Tenant"**
   ? POST /api/tenants { displayName, tenantId, domain, mode, clientId, clientSecret }
   ? Backend: requireAuth ? ? writes to tenants.json ? returns new record

4. **From this exact moment**, if anyone logs in with @contoso.com email:
   ? Backend reads tenants.json (no cache) ? finds Contoso ? routes to their tenant
   ? No restart, no code change, instant effect
