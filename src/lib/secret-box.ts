import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Small secrets kept in the database (the mail server password) are sealed with AES-256-GCM.
 * The key is derived from AUTH_SECRET, so a database copy on its own does not reveal them.
 * Changing AUTH_SECRET makes stored secrets unreadable: they then have to be typed in again.
 *
 * Format: v1.<iv>.<tag>.<ciphertext>, each part base64url.
 */
const VERSION = "v1";

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  return Buffer.from(hkdfSync("sha256", s, "chanrai-secret-box", "settings-secrets/v1", 32));
}

export function seal(plain: string): string {
  if (!plain) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

/** The plain text, or null when the value was sealed with another key or has been tampered with. */
export function open(sealed: string): string | null {
  if (!sealed) return "";
  const [v, iv, tag, ct] = sealed.split(".");
  if (v !== VERSION || !iv || !tag || ct === undefined) return null;
  try {
    const t = Buffer.from(tag, "base64url");
    if (t.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"), { authTagLength: 16 });
    decipher.setAuthTag(t);
    return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
