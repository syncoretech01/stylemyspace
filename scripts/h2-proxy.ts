/**
 * Minimal HTTP/2 reverse proxy for local audits: production serves over H2/H3, but `next start`
 * speaks HTTP/1.1, which Lighthouse's throttling model penalises with per-connection round-trips.
 *   pnpm tsx scripts/h2-proxy.ts [--upstream=http://localhost:3001] [--port=3443]
 * Generates a self-signed certificate in qa/.certs on first run (gitignored). Audit with
 * `--chrome-flags=--ignore-certificate-errors` and NODE_TLS_REJECT_UNAUTHORIZED=0 for the warmer.
 */
import { createSecureServer } from "node:http2";
import { request as httpRequest } from "node:http";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=") as [string, string]));
const upstream = new URL(args.upstream ?? "http://localhost:3001");
const port = Number(args.port ?? 3443);
const certDir = join(process.cwd(), "qa", ".certs");
const keyPath = join(certDir, "localhost-key.pem");
const certPath = join(certDir, "localhost-cert.pem");

if (!existsSync(keyPath) || !existsSync(certPath)) {
  mkdirSync(certDir, { recursive: true });
  execFileSync("openssl", [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", keyPath, "-out", certPath,
    "-days", "365", "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ]);
}

const HOP = new Set(["connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-connection", "te", "trailer", "host"]);

// The compat `request` event serves both HTTP/2 streams and HTTP/1.1 connections (allowHTTP1).
const server = createSecureServer({ key: readFileSync(keyPath), cert: readFileSync(certPath), allowHTTP1: true });
server.on("request", (req, res) => {
  const outHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.startsWith(":") || HOP.has(k) || v === undefined) continue;
    outHeaders[k] = Array.isArray(v) ? v.join(", ") : String(v);
  }
  outHeaders.host = upstream.host;
  const up = httpRequest({ hostname: upstream.hostname, port: upstream.port, path: req.url ?? "/", method: req.method, headers: outHeaders }, (ures) => {
    const resHeaders: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(ures.headers)) {
      if (HOP.has(k) || v === undefined) continue;
      resHeaders[k] = v;
    }
    res.writeHead(ures.statusCode ?? 502, resHeaders);
    ures.pipe(res);
  });
  up.on("error", () => {
    if (!res.headersSent) res.writeHead(502);
    res.end("upstream error");
  });
  req.pipe(up);
});
server.listen(port, () => console.log(`[h2-proxy] https://localhost:${port} → ${upstream.origin}`));
