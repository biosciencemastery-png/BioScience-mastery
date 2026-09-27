import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
export const newToken = () => randomBytes(32).toString("base64url");
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const rateHash = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("hex");
export function seal(value: unknown, key: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((b) => b.toString("base64url"))
    .join(".");
}
export function unseal(value: string, key: string): unknown {
  const [iv, tag, payload] = value
    .split(".")
    .map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  decipher.setAuthTag(tag);
  return JSON.parse(
    Buffer.concat([decipher.update(payload), decipher.final()]).toString(
      "utf8",
    ),
  );
}
export function matchesSecret(actual: string, expected: string) {
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
