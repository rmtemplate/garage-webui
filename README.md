# Garage Web UI

[![image](misc/img/garage-webui.png)](misc/img/garage-webui.png)

A simple admin web UI for [Garage](https://garagehq.deuxfleurs.fr/), a self-hosted, S3-compatible, distributed object storage service.

[ [Screenshots](misc/SCREENSHOTS.md) | [Install Garage](https://garagehq.deuxfleurs.fr/documentation/quick-start/) | [Garage Git](https://git.deuxfleurs.fr/Deuxfleurs/garage) ]

## Features

- Garage health status
- Cluster & layout management
- Create, update, or view bucket information
- Integrated objects/bucket browser
- Create & assign access keys

## Installation

The Garage Web UI is available as a single executable binary and docker image. You can install it using the command line or with Docker Compose.

### Docker CLI

```sh
$ docker run -p 3909:3909 -v ./garage.toml:/etc/garage.toml:ro --restart unless-stopped --name garage-webui khairul169/garage-webui:latest
```

### Docker Compose

If you install Garage using Docker, you can install this web UI alongside Garage as follows:

```yml
services:
  garage:
    image: dxflrs/garage:v2.0.0
    container_name: garage
    volumes:
      - ./garage.toml:/etc/garage.toml
      - ./meta:/var/lib/garage/meta
      - ./data:/var/lib/garage/data
    restart: unless-stopped
    ports:
      - 3900:3900
      - 3901:3901
      - 3902:3902
      - 3903:3903

  webui:
    image: khairul169/garage-webui:latest
    container_name: garage-webui
    restart: unless-stopped
    volumes:
      - ./garage.toml:/etc/garage.toml:ro
    ports:
      - 3909:3909
    environment:
      API_BASE_URL: "http://garage:3903"
      S3_ENDPOINT_URL: "http://garage:3900"
```

### Without Docker

Get the latest binary from the [release page](https://github.com/khairul169/garage-webui/releases/latest) according to your OS architecture. For example:

```sh
$ wget -O garage-webui https://github.com/khairul169/garage-webui/releases/download/1.1.0/garage-webui-v1.1.0-linux-amd64
$ chmod +x garage-webui
$ sudo cp garage-webui /usr/local/bin
```

Run the program with specified `garage.toml` config path.

```sh
$ CONFIG_PATH=./garage.toml garage-webui
```

If you want to run the program at startup, you may want to create a systemd service.

```sh
$ sudo nano /etc/systemd/system/garage-webui.service
```

```
[Unit]
Description=Garage Web UI
After=network.target

[Service]
Environment="PORT=3919"
Environment="CONFIG_PATH=/etc/garage.toml"
ExecStart=/usr/local/bin/garage-webui
Restart=always

[Install]
WantedBy=default.target
```

Then reload and start the garage-webui service.

```sh
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now garage-webui
```

### Configuration

To simplify installation, the Garage Web UI uses values from the Garage configuration, such as `rpc_public_addr`, `admin.admin_token`, `s3_web.root_domain`, etc.

Example content of `config.toml`:

```toml
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"
metadata_auto_snapshot_interval = "6h"

replication_factor = 3
compression_level = 2

rpc_bind_addr = "[::]:3901"
rpc_public_addr = "localhost:3901" # Required
rpc_secret = "YOUR_RPC_SECRET_HERE"

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
root_domain = ".s3.domain.com"

[s3_web] # Optional, if you want to expose bucket as web
bind_addr = "[::]:3902"
root_domain = ".web.domain.com"
index = "index.html"

[admin] # Required
api_bind_addr = "[::]:3903"
admin_token = "YOUR_ADMIN_TOKEN_HERE"
metrics_token = "YOUR_METRICS_TOKEN_HERE"
```

However, if it fails to load, you can set `API_BASE_URL` & `API_ADMIN_KEY` environment variables instead.

### Environment Variables

Configurable envs:

- `CONFIG_PATH`: Path to the Garage `config.toml` file. Defaults to `/etc/garage.toml`.
- `BASE_PATH`: Base path or prefix for Web UI.
- `API_BASE_URL`: Garage admin API endpoint URL.
- `API_ADMIN_KEY`: Admin API key.
- `S3_REGION`: S3 Region.
- `S3_ENDPOINT_URL`: S3 Endpoint url.

### Authentication

Enable authentication by setting the `AUTH_USER_PASS` environment variable in the format `username:password_hash`, where `password_hash` is a bcrypt hash of the password.

Generate the username and password hash using the following command:

```bash
htpasswd -nbBC 10 "YOUR_USERNAME" "YOUR_PASSWORD"
```

> If command 'htpasswd' is not found, install `apache2-utils` using your package manager.

Then update your `docker-compose.yml`:

```yml
webui:
  ....
  environment:
    AUTH_USER_PASS: "username:$2y$10$DSTi9o..."
```

### Running

Once your instance of Garage Web UI is started, you can open the web UI at http://your-ip:3909. You can place it behind a reverse proxy to secure it with SSL.

## Development

This project is bootstrapped using TypeScript & React for the UI, and Go for backend. If you want to build it yourself or add additional features, follow these steps:

### Setup

```sh
$ git clone https://github.com/khairul169/garage-webui.git
$ cd garage-webui
$ pnpm install
```

Run `pnpm install` with the same OS you will run the dev server from. Several
dependencies (`@swc/core`, `esbuild`, `rollup`) ship platform-specific native
binaries, so installing from WSL and then running from Windows — or the
reverse — leaves you with binaries for the wrong platform and a
`'vite' is not recognized` error. If that happens, delete `node_modules` and
install again from the OS you actually use.

### Local Demo Mode (no Garage required)

To work on the UI you do **not** need a Garage cluster, the S3 API, the Go
backend, a `garage.toml`, or a login. Demo Mode serves every page from an
in-memory mock adapter:

```sh
$ pnpm demo
```

Then open <http://localhost:4280> — the redesigned dashboard loads straight
away, with no authentication step.

> Demo Mode uses port **4280** rather than Vite's default 5173. On Windows
> with Hyper-V or WSL enabled, 5173 usually falls inside a reserved TCP range
> and Vite exits with `EACCES ::1:5173`. Check your machine's reserved ranges
> with `netsh interface ipv4 show excludedportrange protocol=tcp`.

What you get:

- Realistic sample buckets, objects, access keys, nodes and cluster layout.
- Every page and every control is live: search, filters, sorting, tabs,
  list/grid switching, modals, dropdowns, toasts and confirmation dialogs.
- Create / edit / delete really mutate the mock data, so the UI updates the
  way it would against a real cluster. Reloading the page reseeds it.
- Image thumbnails and previews are generated locally as `data:` URIs.
- **No network requests leave the dev server.** Nothing is sent to Garage, the
  S3 API, the Go backend, or any other service.

Demo Mode is switched on by `VITE_DEMO_MODE=true` in `.env.demo`, which
`pnpm demo` loads via `vite --mode demo`. It is gated behind
`import.meta.env.DEV` in `src/lib/consts.ts`, so a production build evaluates
it to `false` at compile time and drops the mock adapter from the bundle —
**it cannot be enabled in a production build.** The sample credentials in
`src/lib/demo/db.ts` are fabricated and prefixed `GKDEMO`; never put real keys
there.

The mock plugs in at the single `api.fetch` boundary in `src/lib/api.ts` and
mirrors the backend's real routes one-for-one, so pages, hooks and queries are
unchanged between demo and live — swapping the adapter out restores the real
service with no UI changes.

### Running against a real Garage instance

Point the dev server at a running backend and start both halves:

```sh
$ cp .env.example .env     # set VITE_API_URL to your backend
$ pnpm dev                 # client + Go backend concurrently
```

Or start each instance separately:

```sh
$ pnpm dev:client
$ pnpm dev:server          # requires Go and air, runs in ./backend
```

### Checks

```sh
$ pnpm lint        # ESLint
$ pnpm typecheck   # tsc --build
$ pnpm build       # tsc + production Vite build
```

## Troubleshooting

Make sure you are using the latest version of Garage. If the data cannot be loaded, please check whether your instance of Garage has the admin API enabled and the ports are accessible.

If you encounter any problems, please do not hesitate to submit an issue [here](https://github.com/khairul169/garage-webui/issues). You can describe the problem and attach the error logs.
