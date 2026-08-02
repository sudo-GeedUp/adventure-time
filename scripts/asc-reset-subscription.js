const fs = require("fs");
const crypto = require("crypto");

const { ISSUER_ID, KEY_ID, PRIVATE_KEY_PATH } = require("./asc-config");
const BASE_URL = "https://api.appstoreconnect.apple.com/v1";

const IAPS = [
  "193a8513-ace3-48df-a911-111217ae75a0", // monthly
  "7dd389eb-25fa-4514-983e-af7f40dace0a", // yearly
];

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
  console.log(`${method} ${path} -> ${res.status}`);
  if (text) console.log(text.slice(0, 2000));
  if (!res.ok) {
    const err = new Error(`${method} ${path} failed ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

(async () => {
  for (const id of IAPS) {
    // Try to set a review note to trigger state recalculation
    try {
      await api("PATCH", `/inAppPurchases/${id}`, {
        data: {
          type: "inAppPurchases",
          id,
          attributes: {
            reviewNote:
              "Premium subscription for full app access. Users can subscribe on the paywall.",
          },
        },
      });
    } catch (err) {
      console.log(`PATCH reviewNote failed for ${id}: ${err.status}`);
    }
  }
  // Check state after
  const list = await api("GET", `/apps/6758251454/inAppPurchases?limit=200`);
  for (const s of list.data || []) {
    console.log(`${s.attributes.productId} | state=${s.attributes.state}`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
