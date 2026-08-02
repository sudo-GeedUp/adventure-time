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
  console.log(
    `${method} ${path} -> ${res.status}: ${text ? text.slice(0, 2000) : ""}`,
  );
  if (!res.ok && res.status !== 404) {
    const err = new Error(`${method} ${path} failed ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

(async () => {
  // Try to list and cancel subscription submissions and inAppPurchase submissions
  for (const endpoint of [
    `/apps/${APP_ID}/subscriptionSubmissions`,
    `/apps/${APP_ID}/inAppPurchaseSubmissions`,
    `/subscriptionSubmissions`,
    `/inAppPurchaseSubmissions`,
  ]) {
    try {
      const result = await api("GET", endpoint);
      if (result && result.data) {
        console.log(`\n${endpoint}:`, result.data.length, "items");
        for (const item of result.data) {
          console.log("  id:", item.id, "state:", item.attributes?.state);
          if (
            ["WAITING_FOR_REVIEW", "IN_REVIEW", "READY_FOR_REVIEW"].includes(
              item.attributes?.state,
            )
          ) {
            console.log("  -> cancelling", item.id);
            try {
              await api("DELETE", `/subscriptionSubmissions/${item.id}`);
            } catch (e) {
              console.log("  delete failed:", e.status);
            }
          }
        }
      }
    } catch (err) {
      console.log(`\n${endpoint} failed:`, err.status || err.message);
    }
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
