const fs = require("fs");
const crypto = require("crypto");

const { ISSUER_ID, KEY_ID, PRIVATE_KEY_PATH } = require("./asc-config");
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

async function api(method, path) {
  const jwt = makeJwt();
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${jwt}` },
  });
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
      `API ${method} ${path} failed ${res.status}: ${JSON.stringify(json)}`,
    );
  return json;
}

async function main() {
  console.log("=== App Store Versions ===");
  const versions = await api(
    "GET",
    `/apps/${APP_ID}/appStoreVersions?limit=200`,
  );
  for (const v of versions.data || []) {
    console.log(
      `Version ${v.id}: ${v.attributes?.versionString} platform=${v.attributes?.platform} status=${v.attributes?.appVersionState} build=${v.relationships?.build?.data?.id}`,
    );
  }

  console.log("\n=== Subscriptions ===");
  const subs = await api("GET", `/apps/${APP_ID}/subscriptions?limit=200`);
  for (const s of subs.data || []) {
    console.log(
      `Subscription ${s.id}: productId=${s.attributes?.productId} state=${s.attributes?.state} group=${s.relationships?.subscriptionGroup?.data?.id}`,
    );
  }

  console.log("\n=== In-App Purchases ===");
  const iaps = await api("GET", `/apps/${APP_ID}/inAppPurchases?limit=200`);
  for (const i of iaps.data || []) {
    console.log(
      `IAP ${i.id}: productId=${i.attributes?.productId} referenceName=${i.attributes?.referenceName} state=${i.attributes?.state}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
