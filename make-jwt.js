const fs = require("fs");
const crypto = require("crypto");

const ISSUER_ID = "46781a73-a825-49fa-a503-82d6dabe8b5a";
const KEY_ID = "ZSQK8UYFZ9";
const PRIVATE_KEY_PATH = "./AuthKey_Cancel.p8";

function base64url(input) {
  if (typeof input === "string") input = Buffer.from(input);
  return input
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function makeJwt() {
  const keyPem = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");

  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "ES256",
    kid: KEY_ID,
    typ: "JWT",
  };

  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200, // 20 minutes
    aud: "appstoreconnect-v1",
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: keyPem,
    format: "pem",
    type: "pkcs8",
  });

  const encodedSignature = base64url(signature);

  return `${signingInput}.${encodedSignature}`;
}

console.log(makeJwt());
