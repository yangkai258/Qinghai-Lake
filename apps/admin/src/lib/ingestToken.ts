import { createHash, randomBytes } from 'node:crypto';

// Token = 24 bytes of url-safe random, prefixed with `dtw_ingest_`.
// Hash = sha-256 hex. We never store the plain token.
//
// Why a separate helper: the admin cookie (jose JWT) and the collector
// bearer token have different lifetimes and revocation rules. Mixing
// them forces one policy on the other; splitting them keeps both simple.
const PREFIX = 'dtw_ingest_';
const TOKEN_BYTES = 24;

export function newIngestToken(): { token: string; hash: string } {
  const raw = randomBytes(TOKEN_BYTES).toString('base64url');
  const token = `${PREFIX}${raw}`;
  return { token, hash: hashIngestToken(token) };
}

export function hashIngestToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Extract a bearer token from a header value, tolerating case and a
// stray whitespace without re-implementing half of the HTTP spec.
export function extractBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return m ? m[1] : null;
}