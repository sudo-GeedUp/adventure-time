const fs = require("fs");
const crypto = require("crypto");

const ISSUER_ID = "46781a73-a825-49fa-a503-82d6dabe8b5a";
const KEY_ID = "ZSQK8UYFZ9";
const PRIVATE_KEY_PATH = "./AuthKey_Cancel.p8";
const APP_ID = "6758251454";
const BASE_URL = "https://api.appstoreconnect.apple.com/v1";

function base64url(input) {
  if (typeof input === "string") input = Buffer.from(input);
  return input.toString("base64url");
}

function derToRaw(derSig) {
  if (derSig[0] !== 0x30) throw new Error("Invalid DER signature");
  let idx = 2;
  function readInt() {
    if (derSig[idx++] !== 0x02) throw new Error("Expected INTEGER");
    const len = derSig[idx++];
    if (len & 0x80) throw new Error("Long-form DER length not supported");
    const bytes = derSig.slice(idx, idx + len);
    idx += len;
    let trimmed = bytes;
    if (trimmed.length > 32 && trimmed[0] === 0x00) trimmed = trimmed.slice(1);
    if (trimmed.length > 32) throw new Error("Integer too long");
    const padded = Buffer.alloc(32);
    trimmed.copy(padded, 32 - trimmed.length);
    return padded;
  }
  return Buffer.concat([readInt(), readInt()]);
}

function makeJwt() {
  const keyPem = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
  const privateKey = crypto.createPrivateKey(keyPem);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: KEY_ID, typ: "JWT" };
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: "appstoreconnect-v1",
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const derSig = crypto.sign("SHA256", Buffer.from(signingInput), privateKey);
  const rawSig = derToRaw(derSig);
  return `${signingInput}.${base64url(rawSig)}`;
}

async function api(method, path, body) {
  const jwt = makeJwt();
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
  if (!res.ok)
    throw new Error(
      `${method} ${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 2000)}`,
    );
  return json;
}

(async () => {
  // List all builds for app
  const builds = await api("GET", `/apps/${APP_ID}/builds?limit=200`);
  console.log("=== Builds ===");
  for (const b of builds.data || []) {
    const attr = b.attributes || {};
    console.log(
      `${b.id} | version=${attr.version} | processingState=${attr.processingState} | expired=${attr.expired} | uploaded=${attr.uploadedDate}`,
    );
  }

  // Full app version with build include
  const version = await api(
    "GET",
    `/appStoreVersions/ad6f2414-8b0d-4db1-a497-f3ac1a2d45c9?include=build`,
  );
  console.log("\n=== Version 2.0.0(2) ===");
  console.log(
    "attributes:",
    JSON.stringify(version.data.attributes, null, 2).slice(0, 800),
  );
  const buildIncluded = version.included?.find((x) => x.type === "builds");
  console.log(
    "build included:",
    JSON.stringify(buildIncluded, null, 2).slice(0, 800),
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
