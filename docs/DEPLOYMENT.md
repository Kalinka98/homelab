# Deployment and validation

[← README](../README.md) · [Configuration](CONFIGURATION.md) · [Architecture](ARCHITECTURE.md)

> **Reference deployment, not an installer.** This guide outlines how to adapt and inspect the repository. The example environment values are deliberately nonworking. Review networking, secrets, storage, access controls, and host firewall rules before starting services.

## Prerequisites

- A Linux host with Docker Engine, Docker Compose plugin, Git, and GNU Make; the reference host runs Fedora Linux.
- Storage mounted at your chosen persistent-data and media paths.
- DNS and a domain if you plan to expose applications over HTTPS.
- Access to your router and firewall configuration for ingress and WireGuard.
- NVIDIA drivers and Container Toolkit for the GPU-enabled services in the published Compose configuration.

## 1. Clone and inspect

```bash
git clone https://github.com/Kalinka98/homelab.git
cd homelab
```

Review the six projects before attempting a deployment:

```text
infrastructure/
media/
services/
immich/
dawarich/
paperless/
```

See the [stack inventory](STACKS.md) for the service responsibilities and upstream links.

## 2. Create the shared networks

Create these once; they are referenced as **external** by multiple Compose projects.

```bash
docker network create homelab-edge
docker network create homelab-ai
```

On a host where these networks already exist, confirm them with `docker network ls` instead of recreating them.

## 3. Copy each environment template

```bash
umask 077
for stack in infrastructure media services immich dawarich paperless; do
  cp -n "$stack/.env.example" "$stack/.env"
done
```

Edit **every** new `.env` file for your host and services. Keep the `.env` files out of Git. Do not source them with a shell: Docker Compose environment interpolation follows its own rules.

At a minimum, review:

- `BASE_DOMAIN`, DNS records, server IP, and `PRIVATE_ACCESS_CIDRS`.
- Distinct application secrets, database passwords, API keys, and existing installation keys.
- Storage locations such as `DATA_PATH`, `MOVIES_PATH`, `TVSHOWS_PATH`, and `DOWNLOADS_PATH`.
- Numeric ownership (`PUID`, `PGID`), Docker socket group where applicable, and SELinux labels.
- Reverse proxy behavior, published host ports, and GPU device reservations.

The [configuration guide](CONFIGURATION.md) includes credential formats and commands, data layout, Fedora/SELinux guidance, and cross-stack settings.

## 4. Validate before deployment

Validate the repository's tracked placeholders without creating local `.env` files:

```bash
make validate-examples
```

After preparing your actual environment files, check their Compose configurations:

```bash
make validate
```

Both commands validate configuration only; they do not test runtime dependencies, actual authentication, filesystem readiness, or network policy enforcement. Avoid printing resolved Compose configuration when it would expose interpolated secrets.

## 5. Start one stack at a time

When the environment and network policies are ready, start infrastructure first:

```bash
cd infrastructure
docker compose up -d
docker compose ps
cd ..
```

Then deploy the remaining stacks individually when their required storage, DNS, secrets, and application-specific dependencies are available. `make up` can start all six stacks after local validation, but is intended only for an already prepared host and is not the recommended first operation on a fresh machine.

## 6. Verify behavior

- Confirm the target host's firewall allows only intended inbound ports.
- Test public routes over HTTPS from an untrusted external connection.
- Test private routes both from authorized LAN/VPN clients and from an untrusted source; the latter should be rejected with HTTP 403.
- Verify applications still require and enforce their own authentication.
- Check monitoring, logging, health status, storage permissions, and service-specific functionality.
- Check that databases and internal API endpoints are not unintentionally published.

Use the [remote access guide](REMOTE_ACCESS.md) for a detailed route policy test matrix.

## Useful commands

| Command | Action |
| --- | --- |
| `make validate-examples` | Validate committed example configuration |
| `make validate` | Validate the six local `.env` configurations |
| `make ps` | Show container state in every stack |
| `make up` | Validate, then start all stacks (prepared host only) |
| `make restart` | Restart services in each stack |
| `make pull` | Pull images from the configured tags |
| `make down` | Stop and remove containers; persistent data remains unless explicitly removed |

Treat rollback, data migrations, backups, and restore tests as separate operations. Never assume container recreation or a successful `docker compose config` protects stored data.
