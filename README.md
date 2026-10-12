#Git Link - https://github.com/pasindu-maduranga/SolarMicroGridTradingSystem.git

#Video Link - https://mysliit-my.sharepoint.com/:v:/g/personal/it22194176_my_sliit_lk/IQCix7aL0ChwQaGRirYwmtYSAWWiw0zamQ3UkKVRkY4U6os?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=N9l94X

# Smart Solar Microgrid Trading System

A peer-to-peer solar energy trading platform built for the SE4040 (Enterprise Application Development) group assignment at SLIIT. Prosumers generate and sell surplus solar energy through community Microgrid Nodes; Grid Operators manage nodes and approve transactions; Backoffice staff manage the platform itself. The system follows a FAT-service architecture: all business logic lives in the Web API, and every client (web app, and the planned Android app) is a thin presentation layer that only calls the API.

## Tech stack

| Layer | Technology |
|---|---|
| Backend API | ASP.NET Core 8 Web API, thin-controller / fat-service pattern, JWT bearer auth |
| Database | MongoDB (Atlas cloud cluster — no local MongoDB install needed) |
| Web app (Backoffice / Grid Operator) | React 16 (Create React App, `react-scripts` 5) + Tailwind CSS + Headless UI, Formik + Yup, react-router-dom v6-beta |
| Web hosting wrapper | ASP.NET Core `Smart.SolarMicrogridTradingSystem.Web` (hosts the built React app under IIS via `SpaServices`) |
| Mobile app (Prosumer / Grid Operator) | Native Android — planned, calls the same API directly (no separate Mobile API project) |

**Frontend styling migration in progress**: per the assignment's tech requirement, the UI is being migrated screen-by-screen from Material-UI v4 to Tailwind CSS + Headless UI (unstyled, accessible components you style entirely with Tailwind). The Login screen is fully migrated (no MUI dependency at all). The Dashboard and User Management screens (User/Role/RolePermission/ScreenManager) are still on Material-UI v4 pending migration — don't be surprised to see both `className="..."` Tailwind utility classes and MUI components/`makeStyles` in the codebase at the same time; that's expected during this transition, not a mistake.

## Prerequisites

Install these before working on the project:

| Tool | Required version | Notes |
|---|---|---|
| .NET SDK | 8.0.x | Backend targets `net8.0` |
| Node.js | 22.x LTS | Standardized team-wide via a committed `.node-version` file — if you use a version manager like `fnm` or `nvm`, it auto-switches to 22 inside this repo without touching your other projects |
| npm | bundled with Node 22.x | |
| Visual Studio 2022 (17+) or VS Code | latest | VS 2022 needed for `.sln`; VS Code + C# Dev Kit also works |
| Git | latest | |
| MongoDB Compass (optional) | latest | Handy for browsing the Atlas cluster's collections, not required |

You do **not** need to install MongoDB locally — the project connects to a shared Atlas cluster.

## Repository structure

```
SolarMicroGridTradingSystem/
├── Smart.SolarMicrogridTradingSystem.Api/       # ASP.NET Core Web API (MongoDB, JWT auth)
│   ├── Controllers/                             # Thin controllers — no business logic
│   ├── Services/ + Services/Interfaces/         # All business logic lives here
│   ├── Models/                                  # Mongo document models
│   ├── Models/Requests/                         # Request DTOs
│   ├── Models/Common/ApiResponse.cs             # Shared response envelope
│   ├── Extensions/ServiceCollectionExtensions.cs# Single place all services are registered (DI)
│   ├── Utils/DataSeeder.cs                      # Seeds an initial admin user + permissions on first run
│   └── appsettings.json                         # Mongo connection string + JWT secret (see Secrets below)
├── Smart.SolarMicrogridTradingSystem.Web/       # ASP.NET Core wrapper that hosts the React app (IIS/SpaServices)
│   └── Web/                                     # The actual React (CRA) app
│       ├── src/views/{Module}/{SubModule}/      # Feature folders, one per sidebar module
│       └── public/webConfiguration.json         # Runtime API base URL config (see Frontend setup below)
└── Smart.SolarMicrogridTradingSystem.sln
```

## Getting started

### 1. Clone and restore

```bash
git clone https://github.com/pasindu-maduranga/SolarMicroGridTradingSystem.git
cd SolarMicroGridTradingSystem
dotnet restore
```

### 2. Backend setup (`Smart.SolarMicrogridTradingSystem.Api`)

`appsettings.json` is committed with **placeholder** values (no real secrets in git). Ask a teammate for the real Mongo Atlas connection string and JWT secret, then:

```bash
cd Smart.SolarMicrogridTradingSystem.Api
git update-index --skip-worktree appsettings.json
```

Then edit `appsettings.json` locally and fill in the real values:

```json
"MongoDbSettings": {
  "ConnectionString": "<real Atlas connection string>",
  "DatabaseName": "SolarMicrogridTradingSystem"
},
"JwtSettings": {
  "Secret": "<real JWT secret>"
}
```

> `--skip-worktree` tells Git to stop tracking further changes to this file, so your real credentials never accidentally get committed or overwritten by someone else's placeholder values. You only need to run it once per machine.

Run the API:

```bash
dotnet run --project Smart.SolarMicrogridTradingSystem.Api
```

The API starts at `http://localhost:5050`, with Swagger UI at `http://localhost:5050/swagger`.

On first run against an empty database, `DataSeeder` automatically creates a Super Admin role and login:

- **Username:** `admin`
- **Password:** `Admin@123`

### 3. Frontend setup (`Smart.SolarMicrogridTradingSystem.Web/Web`)

```bash
cd Smart.SolarMicrogridTradingSystem.Web/Web
npm install
```

> A `postinstall` script automatically runs `patch-package`, which applies a small persisted fix to a broken nested dependency (`material-table`'s bundled `@material-ui/pickers` has a real upstream bug that fails to compile under Webpack 5). You don't need to do anything — it just works as part of `npm install`. The patch lives in `patches/` and is committed to git.

Copy `.env.example` to `.env` (sets the dev server's port):

```bash
cp .env.example .env
```

Check `public/webConfiguration.json` points at your running API:

```json
{
  "apidomain": "http://localhost:5050",
  "reactDomain": "http://localhost:5020"
}
```

Then start the dev server:

```bash
npm start
```

The app opens at `http://localhost:5020` (set via `.env`'s `PORT`) and logs in against the API above.

> Alternative: running `dotnet run --project Smart.SolarMicrogridTradingSystem.Web` launches the ASP.NET Core wrapper, which auto-starts `npm start` internally and proxies to it — this is closer to how IIS will serve it in production, but slower to iterate with day-to-day.

### 4. Building for deployment (IIS)

```bash
cd Smart.SolarMicrogridTradingSystem.Web/Web
npm run build
cd ../..
dotnet publish Smart.SolarMicrogridTradingSystem.Api -c Release
dotnet publish Smart.SolarMicrogridTradingSystem.Web -c Release
```

## Secrets

| Secret | Where it lives | How it's handled |
|---|---|---|
| MongoDB Atlas connection string | `Smart.SolarMicrogridTradingSystem.Api/appsettings.json` | Committed with a placeholder value. Each developer runs `git update-index --skip-worktree` on this file (see step 2 above) and fills in the real value locally — it never gets committed. |
| JWT signing secret | Same file, `JwtSettings:Secret` | Same pattern as above. |

**Never commit real values for either of these.** If you ever run `git add -A` or `git commit -a`, double-check `git status` first — if `appsettings.json` shows up as a change, your skip-worktree bit isn't set on this machine; re-run the command in step 2.

## Git branching strategy

| Branch | Purpose |
|---|---|
| `main` | Final, submission/viva-ready state |
| `develop` | Default branch — day-to-day integration |
| `feature/<developer>/<name>` | e.g. `feature/pasindu/user-management` — one folder per developer, one branch per task underneath |
| `bugfix/<developer>/<name>` | Same pattern for bug fixes |
| `release/qa` | Testing gate, cut from `develop` before a milestone |
| `release/production` | Confirmed-good state, promoted from `release/qa` into `main` and back into `develop` |
| `hotfix/<issue-name>` | Urgent one-off fix on already-released code, branched from `main` |

Always branch from `develop` for new work, and open a PR back into `develop` when done.

## Common commands

| Task | Command |
|---|---|
| Run API | `dotnet run --project Smart.SolarMicrogridTradingSystem.Api` |
| Run web app (dev) | `npm start` (inside `Smart.SolarMicrogridTradingSystem.Web/Web`) |
| Build API | `dotnet build` |
| Build web app | `npm run build` (inside `Web/Web`) |
| Restore backend packages | `dotnet restore` |
| Restore frontend packages | `npm install` (inside `Web/Web`) |
| Stop tracking your local `appsettings.json` changes | `git update-index --skip-worktree Smart.SolarMicrogridTradingSystem.Api/appsettings.json` |
| Resume tracking it again | `git update-index --no-skip-worktree Smart.SolarMicrogridTradingSystem.Api/appsettings.json` |

