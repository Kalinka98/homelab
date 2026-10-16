
"""Check the intended public/private Caddy route classification."""

from pathlib import Path
import re

PRIVATE = {
    "radarr", "sonarr", "qbittorrent", "prowlarr", "bazarr",
    "status", "speedtest", "logs", "adguard", "monitor",
    "budget", "home", "vault", "zimi", "dawarich",
    "paperless", "vinyl",
}

PUBLIC = {"jellyfin", "immich", "mealie", "cycle", "notify"}


def require(condition, message):
    if not condition:
        raise SystemExit(f"FAIL: {message}")


root = Path("infrastructure/caddy")
main = (root / "Caddyfile").read_text()

require(
    "@outside not remote_ip {$PRIVATE_ACCESS_CIDRS}" in main,
    "Private ACL must use the configured source-IP allowlist",
)

proxy = main.split("(private_proxy) {", 1)[-1]
require(
    "(private_proxy) {" in main
    and "import private_acl" in proxy
    and 'respond @outside "VPN required" 403' in proxy
    and "reverse_proxy {args[0]}" in proxy
    and proxy.index('respond @outside "VPN required" 403')
    < proxy.index("reverse_proxy {args[0]}"),
    "Private proxy must deny untrusted clients before proxying",
)

sites = {}
pattern = re.compile(r"(?m)^([a-z0-9-]+)\.\{\$BASE_DOMAIN\}\s*\{")

for path in sorted((root / "sites").glob("*.caddy")):
    content = path.read_text()
    matches = list(pattern.finditer(content))

    for i, match in enumerate(matches):
        name = match.group(1)
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        body = match.string[match.end():end]

        require(name not in sites, f"Duplicate route: {name}")
        sites[name] = body

expected = PRIVATE | PUBLIC
require(set(sites) == expected,
        f"Route inventory changed: missing={expected - set(sites)}, "
        f"unexpected={set(sites) - expected}")

for name in sorted(PRIVATE):
    body = sites[name]

    if name == "home":
        require(
            "import private_acl" in body
            and 'respond @outside "VPN required" 403' in body
            and "route {" in body
            and body.index('respond @outside "VPN required" 403')
            < body.index("handle_path /quotes/*"),
            "Homepage must deny untrusted clients before handling routes",
        )
    else:
        require(
            re.search(r"(?m)^\s*import private_proxy\s+\S+", body),
            f"{name} is missing its private proxy",
        )

for name in sorted(PUBLIC):
    body = sites[name]
    require(
        "import private_proxy" not in body
        and "import private_acl" not in body,
        f"{name} unexpectedly has a private access policy",
    )

print(f"PASS: {len(PRIVATE)} private and {len(PUBLIC)} public routes checked")
