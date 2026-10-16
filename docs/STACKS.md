# Service inventory and upstream projects

[← README](../README.md) · [Architecture](ARCHITECTURE.md) · [Configuration](CONFIGURATION.md)

This is the application inventory for the six Compose projects. The applications and most container images are maintained by third parties. The original work in this repository is primarily their **deployment, integration, configuration, access policies, validation, and operational setup**, plus a small quotes service.

## 1. Infrastructure

**Directory:** [`infrastructure/`](../infrastructure/)

| Function | Projects |
| --- | --- |
| Reverse proxy | [Caddy](https://github.com/caddyserver/caddy) |
| DNS and split DNS | [AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) |
| Availability checks | [Uptime Kuma](https://github.com/louislam/uptime-kuma), [AutoKuma](https://github.com/BigBoot/AutoKuma) |
| Restricted Docker API access | [Sockguard](https://github.com/CodesWhat/sockguard) |
| Logs and diagnostics | [Dozzle](https://github.com/amir20/dozzle), [Glances](https://github.com/nicolargo/glances), [Beszel](https://github.com/henrygd/beszel) |
| Internet speed history | [Speedtest Tracker](https://github.com/alexjustesen/speedtest-tracker) |
| Notifications | [ntfy](https://github.com/binwiederhier/ntfy) |
| Local LLM server | [Ollama](https://github.com/ollama/ollama) |

The critical integration points are Caddy's public/private route policy, the shared networks, and separate Sockguard proxies for Dozzle and AutoKuma. WireGuard runs **on the router**, outside Docker; it is not a container in this repository.

## 2. Media

**Directory:** [`media/`](../media/)

| Function | Projects |
| --- | --- |
| Media server | [Jellyfin](https://github.com/jellyfin/jellyfin) |
| Movie / series automation | [Radarr](https://github.com/Radarr/Radarr), [Sonarr](https://github.com/Sonarr/Sonarr) |
| Download and indexing tools | [qBittorrent](https://github.com/qbittorrent/qBittorrent), [Prowlarr](https://github.com/Prowlarr/Prowlarr), [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr) |
| Subtitles | [Bazarr](https://github.com/morpheus65535/bazarr), [SimpleSubGen](https://github.com/Kalinka98/SimpleSubGen) |

**SimpleSubGen** is my separate open-source subtitle-generation project. This stack consumes its published container image; its implementation lives in its own repository.

## 3. Personal applications

**Directory:** [`services/`](../services/)

| Function | Projects |
| --- | --- |
| Personal dashboard | [Homepage](https://github.com/gethomepage/homepage) |
| Budgeting and password management | [Actual Budget](https://github.com/actualbudget/actual), [Vaultwarden](https://github.com/dani-garcia/vaultwarden) |
| Recipe management | [Mealie](https://github.com/mealie-recipes/mealie) |
| Offline knowledge library | [Zimi](https://github.com/epheterson/Zimi) |
| Vinyl collection | [DVinyl](https://github.com/Kyonew/DVinyl), [MongoDB](https://github.com/mongodb/mongo) |
| Personal tracking | [Ovumcy](https://github.com/ovumcy/ovumcy-web) |
| Small custom service | [Local quotes API](../services/quotes-service/) |

Mealie uses the shared `homelab-ai` network to connect to local Ollama. The quotes service is implemented locally using Python, FastAPI, and Uvicorn.

## 4. Photos

**Directory:** [`immich/`](../immich/)

[Immich](https://github.com/immich-app/immich) provides photo and video management with its machine-learning service. Its deployment uses [PostgreSQL](https://github.com/postgres/postgres) and [Valkey](https://github.com/valkey-io/valkey) dependencies.

## 5. Location history

**Directory:** [`dawarich/`](../dawarich/)

[Dawarich](https://github.com/Freika/dawarich) manages location history. This Compose project includes its associated [PostgreSQL](https://github.com/postgres/postgres) / [PostGIS](https://github.com/postgis/postgis) and [Redis](https://github.com/redis/redis) services.

## 6. Documents

**Directory:** [`paperless/`](../paperless/)

[Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) provides document management. Its dependencies include [PostgreSQL](https://github.com/postgres/postgres), [Valkey](https://github.com/valkey-io/valkey), [Apache Tika](https://github.com/apache/tika), and [Gotenberg](https://github.com/gotenberg/gotenberg).

## Supporting software and external resources

| Area | Projects and sources |
| --- | --- |
| Host and runtime | [Fedora Linux](https://fedoraproject.org/), [Docker Engine / Moby](https://github.com/moby/moby), [Docker CLI](https://github.com/docker/cli), [Docker Compose](https://github.com/docker/compose), [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-container-toolkit) |
| Configuration tooling | [Git](https://github.com/git/git), [GNU Make](https://www.gnu.org/software/make/), [GitHub Actions checkout](https://github.com/actions/checkout) |
| Quotes API | [Python](https://github.com/python/cpython), [FastAPI](https://github.com/fastapi/fastapi), [Uvicorn](https://github.com/Kludex/uvicorn) |
| Dashboard resources | [Open-Meteo](https://github.com/open-meteo/open-meteo), [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons), [Material Design Icons](https://github.com/Templarian/MaterialDesign) |
| Speech recognition | [Whisper](https://github.com/openai/whisper), configured with `large-v3` |
| Translation | [NLLB / fairseq](https://github.com/facebookresearch/fairseq), [NLLB-200 distilled 600M](https://huggingface.co/facebook/nllb-200-distilled-600M) |
| Document AI | [Qwen3-VL](https://github.com/QwenLM/Qwen3-VL), configured as `qwen3-vl:8b-instruct`; [EmbeddingGemma](https://huggingface.co/google/embeddinggemma-300m) |
| Quotes data | [Sanitized English Quotes](https://huggingface.co/datasets/tengomucho/english_quotes_sanitized), [original English Quotes](https://huggingface.co/datasets/Abirate/english_quotes) |

<details>
<summary>Container image source repositories</summary>

Some images have definitions separate from their application repositories.

| Images | Source repositories |
| --- | --- |
| Caddy / Python base | [Caddy Docker](https://github.com/caddyserver/caddy-docker), [Python official image](https://github.com/docker-library/python) |
| LinuxServer media images | [Radarr](https://github.com/linuxserver/docker-radarr), [Sonarr](https://github.com/linuxserver/docker-sonarr), [qBittorrent](https://github.com/linuxserver/docker-qbittorrent), [Prowlarr](https://github.com/linuxserver/docker-prowlarr), [Bazarr](https://github.com/linuxserver/docker-bazarr) |
| Speedtest Tracker image | [LinuxServer Speedtest Tracker](https://github.com/linuxserver/docker-speedtest-tracker) |
| Databases | [PostgreSQL](https://github.com/docker-library/postgres), [MongoDB](https://github.com/docker-library/mongo), [Redis](https://github.com/redis/docker-library-redis), [Valkey](https://github.com/valkey-io/valkey-container), [PostGIS](https://github.com/postgis/docker-postgis) |
| Immich PostgreSQL | [Image definitions](https://github.com/immich-app/base-images/tree/main/postgres), [VectorChord](https://github.com/supervc-stack/VectorChord), [pgvector](https://github.com/pgvector/pgvector), [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs) |
| Apache Tika | [Tika Docker](https://github.com/apache/tika-docker) |

</details>

## Attribution and licenses

The original code and documentation in this repository are released under the [MIT license](../LICENSE). That license does not relicense third-party containers, applications, models, icons, or datasets. For the included quotations dataset and its documented provenance, see [third-party notices](../THIRD_PARTY_NOTICES.md).

Thanks to the project maintainers and contributors listed above, particularly [LinuxServer.io](https://github.com/linuxserver) for the media images and Speedtest Tracker packaging.
