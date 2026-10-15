# Configuration guide

Use this guide when adapting the six stacks to a new host. Edit ignored `.env`
files beside each stack's `docker-compose.yml`; keep the tracked examples as
placeholders. `make validate-examples` checks the examples without loading local
`.env` files. `make validate` checks your local configuration without starting
containers or printing its resolved values.

## Environment files

Use `umask 077` before copying the templates so newly created `.env` files are
readable only by their owner. Keep existing files private as well. These files
are read by the host's Compose CLI, rather than mounted into the applications.

Compose gives exported shell variables precedence over `.env` values. Check
your shell when an edit seems to have no effect. Single-quote literal secrets
containing `$`, including bcrypt hashes; unquoted and double-quoted values
undergo interpolation. For example, replace the text inside these quotes with
the complete hash, keeping its dollar signs.

Do not source these files as shell scripts. The formats are different, and a
Compose environment file can contain values that are meaningful to a shell.
See Docker's [environment-file syntax and precedence](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/).

## Values shared between stacks

| Setting | Expected value | Where it must agree |
| --- | --- | --- |
| `BASE_DOMAIN` | DNS domain only, such as `example.com`, without a scheme, path, or trailing slash | Infrastructure, services, Dawarich, and Paperless |
| `PUID` / `PGID` | Numeric IDs for the intended application user/group; inspect with `id -u` and `id -g` | Containers that explicitly receive these values; see ownership below |
| `TZ` | IANA timezone name; examples use `Europe/Sofia` | All six stacks |
| `DATA_PATH` | Absolute host directory, example `/srv/data` | Infrastructure, services, Immich, and Paperless |
| `MOVIES_PATH` | Absolute host directory, example `/srv/media/movies` | Infrastructure, services, and media |
| `TVSHOWS_PATH` | Absolute host directory, example `/srv/media/tvshows` | Infrastructure, services, and media |

Set `SERVER_IP_ADDRESS` in infrastructure to an address assigned to the host's
LAN interface. The example `192.0.2.10` is a documentation address. Set
`DOCKER_SOCK_GID` to the numeric group returned by
`stat -c '%g' /var/run/docker.sock`; it is independent of `PGID`.

## Credentials and application keys

Generate a different value for each independent secret. Keep existing keys
when updating an established deployment: replacing an encryption/signing key
can invalidate sessions or make stored encrypted data unreadable. Changing a
database initialization password in `.env` does not update the password of an
existing database user.

| Variable | Required format or source |
| --- | --- |
| `HOMEPAGE_AUTH_SECRET` | Random string of at least 32 characters; generate with `openssl rand -base64 32`. |
| `HOMEPAGE_AUTH_PASSWORD` | Strong, unique plain password, rather than a password hash. See [Homepage authentication](https://github.com/gethomepage/homepage/blob/v2.4.0/docs/installation/index.md). |
| `SPEEDTEST_APP_KEY` | Encryption key: literal `base64:` followed by Base64 encoding of 32 random bytes. Use the generator below and preserve the prefix. See [Speedtest encryption](https://docs.speedtest-tracker.dev/security/encryption). |
| `SPEEDTEST_TRACKER_ADMIN_EMAIL` / `SPEEDTEST_TRACKER_ADMIN_PASSWORD` | Initial Speedtest administrator credentials. These are separate from its encryption key and API token. |
| `OVUMCY_SECRET_KEY` | At least 32 nonplaceholder characters; generate with `openssl rand -hex 32`. Preserve it on existing installations, including those using TOTP. See [Ovumcy's operations guide](https://github.com/ovumcy/ovumcy-web/blob/v1.9.2/docs/self-hosted.md). |
| `OVUMCY_TRUSTED_PROXIES` | Comma-separated trusted proxy IPs/CIDRs matching Caddy's actual source address. See proxy setup below. |
| `IMMICH_DB_PASSWORD` | Alphanumeric password. For a fresh database, `openssl rand -hex 32` meets the [pinned Immich example's requirements](https://github.com/immich-app/immich/blob/v3.3.1/docker/example.env). |
| `DAWARICH_DB_PASSWORD` / `PAPERLESS_DB_PASSWORD` | Independent database passwords; random hex is suitable for fresh databases. |
| `DAWARICH_SECRET_KEY_BASE` | Generate once with `openssl rand -hex 64`, as recommended by [Dawarich](https://dawarich.app/docs/self-hosting/environment-variables/). |
| `PAPERLESS_SECRET_KEY` | Persistent random secret; `openssl rand -hex 32` is suitable. See [Paperless configuration](https://docs.paperless-ngx.com/configuration/#PAPERLESS_SECRET_KEY). |
| `DVINYL_DB_PASSWORD` | For a fresh database, use URI-safe random hex from `openssl rand -hex 32`. This variable is also inserted directly into the MongoDB URI. |
| `DVINYL_PASSJWT` / `DVINYL_SESSION_SECRET` | Two distinct random values; generate each with a separate `openssl rand -hex 32` call. |
| `DVINYL_DISCOGS_TOKEN` | Personal access token issued by your Discogs account, following [DVinyl setup](https://github.com/Kyonew/DVinyl/blob/main/docs/getting-started.md). |

Generate the Speedtest encryption key locally:

```bash
python3 -c 'import base64,secrets; print("base64:" + base64.b64encode(secrets.token_bytes(32)).decode())'
```

For an existing DVinyl database with URI-reserved characters in its password,
keep the raw password for MongoDB and percent-encode only the password component
of the application's URI. The current single-variable setup assumes a URI-safe
value; single-quoting `.env` values does not perform URL encoding. See
[MongoDB connection strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

Homepage widgets use credentials issued by their applications:

| Homepage setting | Source |
| --- | --- |
| `ADGUARD_USERNAME` / `ADGUARD_PASSWORD` | Existing AdGuard account |
| `QBITTORRENT_USERNAME` / `QBITTORRENT_PASSWORD` | Existing qBittorrent Web UI account |
| `JELLYFIN_API_KEY`, `IMMICH_API_KEY`, `SPEEDTEST_API_KEY` | API tokens created in the respective application; `SPEEDTEST_API_KEY` is separate from `SPEEDTEST_APP_KEY` |
| `*_CALENDAR_URL` | Private iCalendar feed URLs from your calendar provider |

Remove the corresponding Homepage widget/integration if you do not use it.
AutoKuma needs an existing Uptime Kuma account; Zimi's management
variables are its own login credentials. `HF_TOKEN` can remain empty when the
selected models do not require Hugging Face authentication.

### Ovumcy proxy setup

Inspect Caddy's current address on the shared network:

```bash
docker inspect --format '{{(index .NetworkSettings.Networks "homelab-edge").IPAddress}}' caddy
```

Use that address, or the smallest suitable proxy network range, in
`OVUMCY_TRUSTED_PROXIES`. An address can change when a container is recreated;
review the setting after network changes. Trust only the intended proxies.
The tracked Caddy route overwrites `X-Real-IP`, matching Ovumcy's `PROXY_HEADER`.

## Storage and ownership

| Host source | Container use |
| --- | --- |
| `MOVIES_PATH`, `TVSHOWS_PATH` | `/movies`, `/tvshows` in Jellyfin, Radarr, Sonarr, Bazarr, and SimpleSubGen; same-path read-only mounts in Glances |
| `DOWNLOADS_PATH` | `/downloads` in qBittorrent, Radarr, and Sonarr |
| `${DATA_PATH}/immich` | Immich `/data`; its PostgreSQL data is separately under `immich/postgres/` |
| `${DATA_PATH}/paperless/media` | Paperless documents; its database, queue, app state, consume, and export directories are under `paperless/data/` |
| `ZIMS_PATH` | Zimi `/zims`; this is an independent setting, so changing `DATA_PATH` does not change it automatically |
| Stack-relative paths such as `./actual/data` or `./data/storage` | Persistent state beneath that stack's directory, rather than beneath `DATA_PATH` |
| `immich-model-cache` | Docker-managed named volume for machine-learning models |

Choose real absolute paths and prepare the storage before starting containers.
Check that any intended disks or network filesystems are mounted. Required-value
guards reject empty paths; they do not verify directory existence or mounted
storage. Compose's short bind syntax can create a missing source directory.

`PUID`/`PGID` are supported by the LinuxServer images and Mealie in this repo.
Jellyfin uses them through Compose's `user` setting, and Paperless receives them
as `USERMAP_UID`/`USERMAP_GID`. They do not set a universal user for the other
images. Database and application directories may need different ownership.
See [LinuxServer ownership](https://docs.linuxserver.io/general/understanding-puid-and-pgid/),
[Mealie configuration](https://mealie.io/documentation/getting-started/installation/backend-config/),
and [Paperless user mapping](https://docs.paperless-ngx.com/configuration/#USERMAP_UID).

For a fresh shared media tree, this example creates only the selected
directories. Replace the IDs and paths with your chosen values:

```bash
sudo install -d -o 1000 -g 1000 -m 2775 \
  /srv/media/movies /srv/media/tvshows /srv/homelab/downloads
```

The setgid bit preserves the group on new subdirectories. Applications using
different users also need compatible group permissions, umasks, or ACLs.
SimpleSubGen uses its image's own user settings. Assign ownership per directory;
do not recursively assign an entire data tree to one container's user.

## Fedora and SELinux

Shared media libraries and downloads use lowercase `:z`, allowing multiple
containers to use the same labels. Single-consumer application directories use
uppercase `:Z`; Dawarich's directories shared by its web, worker, or database
containers retain `:z`. Paperless's Tika and Gotenberg exchange files over HTTP
and do not share its bind directories. Docker applies relabeling when it creates
the containers. See [Docker's SELinux mount options](https://docs.docker.com/engine/storage/bind-mounts/#configure-the-selinux-label).

Glances's host `/`, `/etc/os-release`, Docker sockets, and broad `DATA_PATH`
mounts deliberately have no relabel suffix. Relabeling a parent can overwrite
private labels beneath it, even when the container mount is read-only. Apply
labels only to the intended application directories and review host access
policy separately.

When access fails, inspect ordinary ownership and SELinux context separately
with `ls -ld` and `ls -Zd` on the affected directory, then inspect local AVC
denials. Keep enforcement enabled and target permission or policy changes to
the affected directories and processes.

## Validate and start

Run `make validate-examples` to check the published templates, or `make validate`
after configuring your local `.env` files. `make up` now runs local validation
for all six stacks before starting any of them. It can still stop partway
through startup if an image, network, GPU, or application fails at runtime.

For an existing deployment adopting this cleanup, the Speedtest widget's
internal variable is now `HOMEPAGE_VAR_SPEEDTEST_API_KEY`; recreate Homepage
after updating both its Compose configuration and tracked widget configuration.
Your `SPEEDTEST_API_KEY` in `services/.env` keeps the same name. Removed unused
widget credentials can stay in an existing `.env`, but no longer need to be
provided. Preserve all existing application keys and database credentials.
