# Smart Solar Microgrid Trading System

A peer-to-peer solar energy trading platform built for the SE4040 (Enterprise Application Development) group assignment at SLIIT. Prosumers generate and sell surplus solar energy through community Microgrid Nodes; Grid Operators manage nodes and approve transactions; Backoffice staff manage the platform itself. The system follows a FAT-service architecture: all business logic lives in the Web API, and every client (web app, and the planned Android app) is a thin presentation layer that only calls the API.

## Tech stack

| Layer | Technology |
|---|---|
| Backend API | ASP.NET Core 6 Web API, thin-controller / fat-service pattern, JWT bearer auth |
| Database | MongoDB (Atlas cloud cluster — no local MongoDB install needed) |
| Web app (Backoffice / Grid Operator) | React 16 (Create React App 3.4.1) + Material-UI v4, Formik + Yup, react-router-dom v6-beta |
| Web hosting wrapper | ASP.NET Core `Smart.SolarMicrogridTradingSystem.Web` (hosts the built React app under IIS via `SpaServices`) |
| Mobile app (Prosumer / Grid Operator) | Native Android — planned, calls the same API directly (no separate Mobile API project) |

## Prerequisites

Install these before working on the project:

| Tool | Required version | Notes |
|---|---|---|
| .NET SDK | 6.0.x | Backend targets `net6.0` |
| Node.js | 16.x LTS | Matches `react-scripts 3.4.1`. Node 17+ works but needs `NODE_OPTIONS=--openssl-legacy-provider` set before `npm start`/`npm run build` because of the OpenSSL 3 change |
| npm | bundled with Node 16.x | |
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

Check `public/webConfiguration.json` points at your running API:

```json
{
  "apidomain": "http://localhost:5050",
  "reactDomain": "http://localhost:3000"
}
```

Then start the dev server:

```bash
npm start
```

The app opens at `http://localhost:3000` and logs in against the API above.

> Alternative: running `dotnet run --project Smart.SolarMicrogridTradingSystem.Web` launches the ASP.NET Core wrapper, which auto-starts `npm start` internally and proxies to it — this is closer to how IIS will serve it in production, but slower to iterate with day-to-day.

### 4. Building for deployment (IIS)

```bash
cd Smart.SolarMicrogridTradingSystem.Web/Web
npm run build
cd ../..
dotnet publish Smart.SolarMicrogridTradingSystem.Api -c Release
dotnet publish Smart.SolarMicrogridTradingSystem.Web -c Release
```

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

