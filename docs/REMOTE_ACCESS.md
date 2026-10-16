
# Remote access and network security

This homelab uses a two-tier remote-access model:

- **Public:** Selected applications are available over HTTPS from the internet, with application-level authentication.
- **Private:** Administrative and sensitive applications are reachable only from authorized LAN or WireGuard clients.

Caddy implements the HTTP access controls. WireGuard runs on the home router, while AdGuard Home provides split DNS resolution.

## Access policy

| Public HTTPS | LAN / WireGuard only |
| --- | --- |
| Jellyfin | Radarr, Sonarr, Prowlarr, Bazarr |
| Immich | qBittorrent |
| Mealie | Homepage, Dozzle, Beszel |
| Ovumcy | AdGuard administration, Uptime Kuma |
| ntfy | Actual Budget, Vaultwarden, Paperless |
| | Dawarich, Zimi, DVinyl, Speedtest Tracker |

These are deployment choices, not universal security recommendations. Public applications still require appropriate authentication, updates, and application-specific hardening.

Vaultwarden is intentionally VPN-only in this deployment. Password synchronization outside the home network therefore depends on VPN connectivity.

ntfy remains publicly reachable so notifications work without an active VPN. Its server configuration uses authenticated access with a default deny policy.

## Request routing

**Public connection**

1. Public DNS resolves the application hostname.
2. The client connects to Caddy over HTTPS.
3. Public routes forward traffic to the application.
4. Private routes reject unauthorized source addresses with HTTP 403.

**Home LAN or WireGuard connection**

1. A trusted client uses AdGuard Home as its DNS resolver.
2. AdGuard rewrites homelab hostnames to the server's LAN address.
3. The client connects to Caddy over HTTPS using the same hostname.
4. Caddy checks the direct peer IP against the configured allowlist.
5. Allowed requests reach the private application.

The access policy is enforced by Caddy, not by DNS. Removing a public DNS record does not independently secure an HTTP endpoint.

## WireGuard

The WireGuard server runs on the home router rather than in Docker or on the Fedora workstation.

Each remote device has its own WireGuard account and configuration. The client routes the home LAN subnet through the VPN while ordinary internet traffic can continue over its normal connection.

Requirements for a new client:

- A working WireGuard tunnel to the home router
- A route to the Fedora host's LAN address
- AdGuard Home configured as the DNS server
- DNS rewrites for the homelab hostnames
- The client's verified VPN address included in Caddy's allowed networks

Do not commit WireGuard configuration exports, private keys, pre-shared keys, or QR codes.

## Split DNS

AdGuard resolves the homelab's HTTPS hostnames to the local Caddy server.

Example:

    radarr.example.com -> 192.168.1.10

A wildcard rewrite may be appropriate if every matching subdomain is hosted locally. Otherwise, create individual records to avoid redirecting externally hosted websites.

VPN clients must actually use AdGuard DNS. A working tunnel alone does not guarantee that a hostname follows the private route.

Verify the selected DNS server and inspect AdGuard's query log when troubleshooting.

## Caddy access control

The private network allowlist is supplied using the `PRIVATE_ACCESS_CIDRS` variable in the ignored `infrastructure/.env` file.

Example only:

    PRIVATE_ACCESS_CIDRS='192.0.2.0/24 198.51.100.2/32'

These are documentation addresses. Replace them with the actual trusted LAN network and verified VPN client addresses before deployment.

Docker Compose passes this variable to Caddy. The shared Caddyfile defines a reusable access-control snippet:

    (private_acl) {
        @outside not remote_ip {$PRIVATE_ACCESS_CIDRS}
    }

The `private_proxy` snippet checks the source address before forwarding requests to private services.

The matcher uses Caddy's direct connection address rather than blindly trusting user-supplied forwarding headers.

This deployment assumes Caddy receives distinguishable source IP addresses from LAN, VPN, and internet connections. That assumption must be verified when changing router configuration, proxies, or Docker networking.

## Adding another remote device

1. Create a separate WireGuard account on the router.
2. Import the client configuration securely.
3. Verify LAN connectivity over the tunnel.
4. Configure AdGuard DNS and test the hostname rewrite.
5. Inspect the client's source IP as observed by Caddy.
6. Add the verified client IP or suitably scoped VPN subnet to `PRIVATE_ACCESS_CIDRS`.
7. Validate and recreate Caddy to apply the updated container environment.
8. Test both authorized and unauthorized connections.

Do not authorize broad address ranges merely because they are reserved for private networks.

## Validation

Perform the following tests after changing the policy:

| Test | Expected result |
| --- | --- |
| Home LAN to private service | Application loads |
| Remote client with WireGuard | Application loads |
| Remote client without WireGuard | HTTP 403 |
| Public application without WireGuard | Application loads |
| Private service over an untrusted IPv6 path | HTTP 403 |
| Application login and permissions | Still enforced |

Also verify that application ports have not been unintentionally exposed through additional router forwarding rules.

## HTTPS and public DNS

The current deployment retains public DNS records for its configured Caddy hostnames.

Caddy manages HTTPS certificates. Removing public DNS records for private applications may require a different certificate validation method, such as DNS-01.

DNS-01 automation with Cloudflare requires a suitable Caddy DNS provider module and appropriately scoped API credentials; it is not part of the standard Caddy image configuration used here.

The deployment uses direct client connections rather than assuming Cloudflare's HTTP reverse proxy is in front of Caddy. Introducing another proxy requires reassessing source-IP matching and trusted proxy settings.

## Other security boundaries

- Application authentication remains necessary, including on the LAN and VPN.
- Databases and internal services use Docker networks rather than host-published ports wherever practical.
- Dozzle and AutoKuma access the Docker Engine through separate, restricted Sockguard proxies.
- Homepage and Glances do not mount the Docker socket.
- Glances retains access to host process information and selected storage paths for monitoring.
- The Fedora host also serves as a general-purpose workstation; host firewall policy is managed separately from these application-level controls.

This configuration is a reference implementation, not a complete security audit or a universal deployment template.
