# UGCX Backend Architecture

This document explains how the API in `apps/api` works. Each section has a diagram.
Diagrams use Mermaid. GitHub, VS Code (Markdown Preview Mermaid extension), and most Markdown viewers render them.

## 1. The big picture

The backend is one NestJS app. It is a **modular monolith**: one process, many feature modules.
The mobile app calls it over REST (`/api/v1`). PostgreSQL holds all data. Four outside services help.

```mermaid
flowchart LR
    subgraph Clients
        M[Mobile app<br/>Expo / React Native]
        W[Website<br/>later phase]
    end

    subgraph API["NestJS API (apps/api)"]
        direction TB
        MW[Global layer<br/>Validation, Errors, Logs, CORS]
        MOD[16 feature modules]
        MW --> MOD
    end

    subgraph External
        PM[Paymob<br/>card payments]
        R2[Cloudflare R2<br/>video files]
        AB[Ably<br/>real-time chat]
        EX[Expo Push<br/>notifications]
    end

    DB[(PostgreSQL<br/>TypeORM)]

    M -- HTTPS JSON --> MW
    W -. same API .-> MW
    MOD --> DB
    MOD <--> PM
    MOD --> R2
    MOD --> AB
    MOD --> EX
    PM -- webhook --> MOD
```

**Key idea:** the API never stores video bytes and never touches card data.
The app uploads video straight to R2. Paymob hosts the checkout page.

## 2. What happens when the API starts

`main.ts` builds the app and sets up rules that apply to every request.

```mermaid
flowchart TD
    A[NestFactory.create AppModule] --> B[Pino logger]
    B --> C[AllExceptionsFilter<br/>one error format]
    C --> D[ValidationPipe<br/>whitelist + forbid unknown fields]
    D --> E["Global prefix /api/v1"]
    E --> F[CORS<br/>from CORS_ORIGINS env]
    F --> G[Listen on port]
```

`AppModule` loads these first:

| Piece | Job |
|---|---|
| `ConfigModule` | Reads `.env`. `env.validation.ts` stops startup if a value is wrong. |
| `LoggerModule` (pino) | Structured logs. Pretty in dev, JSON in production. |
| `TypeOrmModule` | PostgreSQL connection. `synchronize: false`. Migrations run as a manual deploy step. |
| `ThrottlerModule` | Rate limit: 10 requests per minute. Used on auth, uploads, and `read-all`. |

## 3. Module map

Each folder in `src/modules` is one Nest module. Arrows mean "uses".

```mermaid
flowchart TD
    subgraph Identity
        AUTH[auth]
        USERS[users]
    end
    subgraph Profiles
        BRANDS[brands<br/>+ team members]
        CREATORS[creators<br/>+ payout details]
    end
    subgraph Marketplace
        PRODUCTS[products]
        CAMPAIGNS[campaigns]
        PROPOSALS[proposals]
        COLLABS[collaborations]
        DELIV[deliverables]
    end
    subgraph Money
        ESCROW[escrow]
        TX[transactions<br/>the ledger]
        PAY[payments<br/>Paymob client + webhook]
        ADMIN[admin<br/>vetting + payouts]
    end
    subgraph Support
        MSG[messages<br/>chat]
        NOTIF[notifications]
        STORE[storage<br/>R2 upload URLs]
        HEALTH[health]
    end

    AUTH --> USERS
    BRANDS --> USERS
    CREATORS --> USERS
    CAMPAIGNS --> ESCROW
    CAMPAIGNS --> PAY
    COLLABS --> ESCROW
    COLLABS --> PROPOSALS
    COLLABS --> PAY
    COLLABS --> MSG
    DELIV --> COLLABS
    DELIV --> TX
    ESCROW --> TX
    PAY --> CAMPAIGNS
    PAY --> COLLABS
    ADMIN --> TX
    ADMIN --> CREATORS
    COLLABS --> NOTIF
    CAMPAIGNS --> NOTIF
    DELIV --> NOTIF
    MSG --> NOTIF
    STORE --> COLLABS
```

Note: `payments` and `collaborations` import each other. Nest solves this with `forwardRef`.

## 4. Anatomy of one request

Every endpoint follows the same path: **Controller → Service → Repository → Database**.

```mermaid
sequenceDiagram
    participant App as Mobile app
    participant G as Guards
    participant P as ValidationPipe
    participant C as Controller
    participant S as Service
    participant DB as PostgreSQL
    participant F as ExceptionFilter

    App->>G: HTTP + Bearer token
    G->>G: JwtAuthGuard: token valid?
    G->>G: RolesGuard: brand / creator / admin?
    G->>G: BrandRoleGuard: owner / approver / viewer?
    G->>P: allowed
    P->>P: check DTO, strip unknown fields
    P->>C: clean body
    C->>S: call one method
    S->>DB: query or transaction
    DB-->>S: rows
    S-->>C: result
    C-->>App: JSON
    Note over F: Any thrown error goes to<br/>AllExceptionsFilter and returns<br/>{ error: { code, message } }
```

Rules the code follows:

- Controllers stay thin. They only call a service.
- Services hold business rules.
- Every write endpoint has a DTO checked with `class-validator`.
- Domain errors use `DomainErrorException` with a stable `code` such as `duplicate_proposal`.

## 5. Security layers (three guards)

Access uses two questions. First "what kind of user?" Second "what team role inside the brand?"

```mermaid
flowchart TD
    REQ[Request] --> J{JwtAuthGuard<br/>valid token?}
    J -- no --> R401[401 Unauthorized]
    J -- yes --> RG{RolesGuard<br/>role in JWT:<br/>brand / creator / admin}
    RG -- wrong role --> R403A[403 Forbidden]
    RG -- ok --> BR{BrandRoleGuard<br/>only for brand users}
    BR -- "role not allowed" --> R403B[403 brand_role_forbidden]
    BR -- ok --> H[Handler runs]

    DBM[(brand_members table)] -. looked up per request .-> BR
```

| Guard | Reads from | Checks |
|---|---|---|
| `JwtAuthGuard` | `Authorization` header | Token signature and expiry. Puts `{ userId, role }` on the request. |
| `RolesGuard` | `@Roles(...)` decorator | Coarse role: `brand`, `creator`, `admin`. |
| `BrandRoleGuard` | `@BrandRoles(...)` + `brand_members` table | Team role: `owner`, `approver`, `viewer`. |

The team role is **not** in the JWT. The guard reads it from the database on each request.
So a role change takes effect at once.

Example: `POST /campaigns/:id/escrow/checkout` needs `brand` + `owner`. An `approver` gets 403.

## 6. Authentication flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as AuthController
    participant S as AuthService
    participant DB as PostgreSQL

    U->>A: POST /auth/otp/send
    A->>S: create OTP
    U->>A: POST /auth/otp/verify
    S->>DB: check code
    U->>A: POST /auth/register or /login
    S->>DB: create user, refresh token
    S-->>U: access token (JWT) + refresh token
    Note over U,S: Later, access token expires
    U->>A: POST /auth/refresh
    S->>DB: check refresh token, rotate it
    S-->>U: new tokens
    U->>A: POST /auth/logout
    S->>DB: revoke refresh token
```

All `/auth` routes have a rate limit. Login uses a short-lived JWT plus a stored refresh token.

## 7. Data model

```mermaid
erDiagram
    USER ||--o| BRAND : "owns"
    USER ||--o| CREATOR : "is"
    BRAND ||--o{ BRAND_MEMBER : "has team"
    USER ||--o{ BRAND_MEMBER : "joins as"
    BRAND ||--o{ PRODUCT : "sells"
    BRAND ||--o{ CAMPAIGN : "posts"
    PRODUCT ||--o{ CAMPAIGN : "featured in"
    CAMPAIGN ||--o{ PROPOSAL : "receives"
    CREATOR ||--o{ PROPOSAL : "submits"
    PROPOSAL ||--o| COLLABORATION : "accepted becomes"
    CAMPAIGN ||--o{ COLLABORATION : "contains"
    COLLABORATION ||--o{ DELIVERABLE : "has"
    DELIVERABLE ||--o{ DELIVERABLE_FEEDBACK : "has"
    COLLABORATION ||--o{ MESSAGE : "has chat"
    CAMPAIGN ||--o{ TRANSACTION : "funding rows"
    COLLABORATION ||--o{ TRANSACTION : "hold, release, payout rows"
    CREATOR ||--o{ PAYOUT_REQUEST : "asks"
    CREATOR ||--o| CREATOR_PAYOUT_DETAIL : "has"
    USER ||--o{ NOTIFICATION : "receives"

    CAMPAIGN {
        uuid id
        string status
        numeric escrow_funded_amount
        numeric escrow_allocated_amount
        numeric escrow_refunded_amount
    }
    COLLABORATION {
        uuid id
        string status
        numeric creator_price
        numeric platform_fee
        numeric total_amount
    }
    TRANSACTION {
        uuid id
        string type
        numeric amount
        uuid campaign_id
        uuid collaboration_id
    }
```

Facts that matter:

- **`transactions` is the only ledger.** Campaign rows carry `campaign_id`. Collaboration rows carry `collaboration_id`.
- Money is `numeric(10,2)` in the database. Code converts to integer cents in `common/utils/money.ts`. It never uses `parseFloat` on an amount.
- Ledger rows are never updated after insert.

## 8. State machines

### Campaign

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> live: publish
    live --> paused: pause
    paused --> live: resume
    live --> completed: all slots approved or paid
    live --> cancelled: close
    paused --> cancelled: close
    completed --> [*]
    cancelled --> [*]
```

### Proposal

```mermaid
stateDiagram-v2
    [*] --> applied
    applied --> shortlisted
    applied --> declined
    shortlisted --> declined
    applied --> accepted: brand accepts
    shortlisted --> accepted: brand accepts
    accepted --> [*]
    declined --> [*]
```

### Collaboration (the escrow state machine)

```mermaid
stateDiagram-v2
    [*] --> funded: proposal accepted
    funded --> shipped: brand confirms shipment
    funded --> delivered: creator uploads (shipping step skipped)
    shipped --> delivered: creator uploads
    delivered --> revision_requested: brand asks for changes
    revision_requested --> delivered: creator re-uploads
    delivered --> approved: brand approves
    approved --> paid: admin marks payout paid
    paid --> [*]
```

The enum also has `pending_payment`, `payment_failed`, and `cancelled` for the older per-collaboration payment path.

### Deliverable

```mermaid
stateDiagram-v2
    [*] --> submitted
    submitted --> approved
    submitted --> revision_requested
    submitted --> declined
```

## 9. Money flow: campaign escrow

**Decision:** the brand funds the **campaign**, not each collaboration. Accepting a proposal takes money from the campaign balance. It raises no new charge.

Each campaign keeps three counters:

```
available = funded - allocated - refunded
```

```mermaid
flowchart LR
    BRAND[Brand pays via Paymob] -->|"charge row<br/>+ funded"| POOL[(Campaign escrow<br/>available balance)]
    POOL -->|"accept proposal<br/>hold row<br/>+ allocated"| COLLAB[Collaboration hold<br/>price + 10% fee]
    COLLAB -->|"brand approves<br/>release row + fee row"| SPLIT{Split}
    SPLIT --> CP[Creator price]
    SPLIT --> FEE[Platform fee]
    CP -->|"admin sends money<br/>payout row"| CREATOR[Creator paid]
    POOL -->|"campaign closed<br/>refund row<br/>+ refunded"| BACK[Brand refunded]
```

Ledger row types:

| Type | When | Amount |
|---|---|---|
| `charge` | Paymob webhook says funding worked | Amount the brand paid |
| `hold` | Brand accepts a proposal | Creator price + fee |
| `release` | Brand approves the deliverable | Full total (`price + fee`) |
| `fee` | Same moment as release | Platform fee |
| `payout` | Admin marks creator as paid | Creator price only |
| `refund` | Unused balance returned | Refunded amount |

Check that adds up: `release = payout + fee`.

## 10. Flow: fund a campaign (Paymob)

```mermaid
sequenceDiagram
    participant B as Brand owner
    participant API as CampaignsService
    participant PM as Paymob
    participant WH as Webhook controller
    participant E as EscrowService
    participant DB as PostgreSQL

    B->>API: POST /campaigns/:id/escrow/checkout
    API->>PM: register order
    PM-->>API: order id + checkout URL
    API->>DB: save funding_paymob_order_id
    API-->>B: checkout URL
    B->>PM: pays on hosted page
    PM->>WH: POST /webhooks/paymob?hmac=...
    WH->>WH: verify HMAC signature
    Note right of WH: Bad signature = 400.<br/>No data is read or written.
    WH->>WH: decode merchant_order_id
    WH->>API: applyEscrowWebhook
    API->>DB: BEGIN transaction
    API->>E: applyFunding (lock campaign row)
    E->>DB: insert charge row, add to funded
    API->>DB: COMMIT
    API-->>PM: 200 OK
```

Safety rules:

- The webhook has **no JWT**. The HMAC signature is its login.
- A unique `paymob_reference` in the ledger makes replayed webhooks harmless.
- Campaign rows are locked (`pessimistic_write`) during money changes, so two requests cannot spend the same balance.

## 11. Flow: accept a proposal

```mermaid
sequenceDiagram
    participant B as Brand (owner / approver)
    participant C as CollaborationsService
    participant E as EscrowService
    participant DB as PostgreSQL

    B->>C: POST /proposals/:id/accept
    C->>C: check proposal state + campaign is live
    C->>E: quote(price) => price, fee, total
    C->>DB: BEGIN
    C->>DB: insert collaboration (status funded)
    C->>E: allocate (lock campaign)
    alt balance too low
        E-->>C: InsufficientEscrowError (shows shortfall)
        C->>DB: ROLLBACK
    else balance ok
        E->>DB: insert hold row, add to allocated
        C->>DB: proposal = accepted
        C->>DB: system chat message
        C->>DB: notification rows
        C->>DB: COMMIT
        C-->>B: collaboration
    end
```

Everything runs in one database transaction. If any step fails, nothing is saved.

## 12. Flow: deliver, review, approve, pay

```mermaid
sequenceDiagram
    participant CR as Creator
    participant ST as StorageController
    participant R2 as Cloudflare R2
    participant D as DeliverablesService
    participant BR as Brand
    participant AD as Admin
    participant DB as PostgreSQL

    CR->>ST: POST /collaborations/:id/deliverables/upload-url
    ST-->>CR: signed upload URL
    CR->>R2: upload video directly
    CR->>D: POST /collaborations/:id/deliverables (file key)
    D->>DB: deliverable = submitted, collaboration = delivered
    D-->>BR: notification: deliverable_submitted

    BR->>D: POST /deliverables/:id/review
    alt approve
        D->>DB: BEGIN, lock collaboration
        D->>DB: collaboration = approved
        D->>DB: release row + fee row
        D->>DB: close campaign if all slots done
        D->>DB: COMMIT
        D-->>CR: notification: escrow_released
        AD->>DB: POST /admin/payouts/:id/mark-paid
        Note over AD,DB: Admin sends money by bank,<br/>InstaPay, or Vodafone Cash,<br/>then records the payout row.
        DB-->>CR: collaboration = paid
    else request revision
        D->>DB: revision_requested + feedback
        D-->>CR: notification: revision_requested
    end
```

Payout is manual in this phase. Admin does the bank transfer, then records evidence in the API.
A unique index allows only one `payout` row per collaboration, so a double click cannot pay twice.

## 13. Notifications

One event, two copy strings (brand and creator), two recipients. The catalog is in `packages/shared-types`.

```mermaid
flowchart LR
    SVC[Any service<br/>inside a DB transaction] -->|"record(event, params)"| NS[NotificationsService]
    NS --> DB[(notifications table)]
    SVC -->|"after COMMIT"| PUSH[NotificationsService.push]
    PUSH --> EXPO[Expo Push API]
    EXPO --> PHONE[User's phone]
    APP[Mobile app] -->|"GET /notifications"| DB
```

Design points:

- `record` saves rows **inside** the transaction. If the business step rolls back, so does the notification.
- `push` runs **after** commit, so a failed push cannot break the business action.
- `EVENT_AUDIENCE` maps each event to who gets it (`brand_team`, `brand_owner_approver`, `creator`).

Events: `brief_published`, `proposal_received`, `proposal_shortlisted`, `proposal_declined`, `escrow_funded`, `shipment_confirmed`, `deliverable_submitted`, `revision_requested`, `escrow_released`, `message_received`, `payout_sent`.

## 14. Chat

Messages live in the database. Ably delivers them in real time. The API issues short tokens so the app can connect to Ably.

```mermaid
sequenceDiagram
    participant App as Mobile app
    participant API as MessagesController
    participant AB as Ably
    participant DB as PostgreSQL

    App->>API: POST /collaborations/:id/chat-token
    API->>API: user is a participant? collaboration funded?
    API-->>App: Ably token (scoped to this chat)
    App->>AB: subscribe to chat channel
    App->>API: POST /collaborations/:id/messages
    API->>DB: save message
    API->>AB: publish
    AB-->>App: live message to the other side
```

Chat opens only after a collaboration is funded. System messages (such as "escrow funded") use the same table.

## 15. Endpoint map by role

| Area | Brand | Creator | Admin | Public |
|---|---|---|---|---|
| `/auth/*` | | | | yes (rate limited) |
| `/health` | | | | yes |
| `/webhooks/paymob` | | | | signature only |
| `/brands/me*`, `/brands/me/members` | yes (team role) | | | |
| `/products` | yes | | | |
| `/campaigns` (create, publish, escrow) | yes (team role) | | | |
| `GET /campaigns` (browse) | | yes | | |
| `/campaigns/:id/proposals` | list | create | | |
| `/proposals/:id/accept` | yes | | | |
| `/collaborations/*` | yes | yes | | |
| `/deliverables`, `/collaborations/:id/deliverables` | review | submit | | |
| `/collaborations/:id/messages`, `/chats` | yes | yes | | |
| `/creators/me*` | | yes | | |
| `/notifications`, `/users/me/push-token` | yes | yes | yes | |
| `/admin/creators`, `/admin/payouts` | | | yes | |

## 16. Folder map

```
apps/api/src
├── main.ts                  App start, global pipes and filters
├── app.module.ts            Root module, imports all features
├── config/                  Env loading and validation
├── common/                  Shared code
│   ├── filters/             AllExceptionsFilter
│   ├── exceptions/          DomainErrorException
│   ├── utils/               money.ts, paginate.ts, duration.ts
│   ├── dto/                 Pagination DTO
│   └── enums/               niche, language, brand category
├── database/                Seeder
├── migrations/              Schema changes (run by hand at deploy)
└── modules/
    └── <feature>/
        ├── *.controller.ts  HTTP routes
        ├── *.service.ts     Business rules
        ├── *.module.ts      Wiring
        ├── dto/             Input checks
        └── entities/        Database tables
```

## 17. Rules to remember

1. Escrow funds at the **campaign**. Accepting a proposal never makes a second charge.
2. `transactions` is the **only** ledger.
3. Brand team roles are in `brand_members`, not in the JWT.
4. The notification catalog lives in `packages/shared-types/src/notifications.ts` only.
5. Money is `numeric(10,2)` in the database and integer cents in code.
6. Every money change runs inside a database transaction with a row lock.
7. Never add auth to the Paymob webhook. The HMAC check is its login.
