# Security Policy

Cookbook Maker is a client-side, static web application. It has no backend
server, no user accounts, and no server-side data storage — all data lives
in the browser's IndexedDB on the user's own device. This limits the
practical attack surface mostly to the client code itself (e.g. XSS in
rendered recipe content, unsafe handling of imported backup files or QR
payloads).

## Reporting a vulnerability

If you find a security issue, please report it privately rather than opening
a public GitHub issue:

- Use [GitHub's private vulnerability reporting](https://github.com/akrigline/cookbooker/security/advisories/new)
  for this repository, or
- Open a regular issue with no technical details, asking for a private
  channel to share them.

Please include steps to reproduce and, if applicable, the browser/OS you
tested in. This project is maintained on a best-effort basis; there's no
formal SLA, but reports will be acknowledged and addressed as promptly as
possible.
