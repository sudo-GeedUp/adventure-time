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
  // List review submissions and their items
  const subs = await api(
    "GET",
    `/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&limit=200&include=items`,
  );
  for (const sub of subs.data || []) {
    console.log(`\nReviewSubmission ${sub.id} state=${sub.attributes?.state}`);
    const items = await api(
      "GET",
      `/reviewSubmissions/${sub.id}/items?limit=200`,
    );
    for (const item of items.data || []) {
      const type = item.type;
      const rel = item.relationships;
      console.log(
        `  Item ${item.id} type=${type} state=${item.attributes?.state}`,
      );
      if (rel?.appStoreVersion?.data)
        console.log(`    appStoreVersion=${rel.appStoreVersion.data.id}`);
      if (rel?.inAppPurchase?.data)
        console.log(`    inAppPurchase=${rel.inAppPurchase.data.id}`);
      if (rel?.subscription?.data)
        console.log(`    subscription=${rel.subscription.data.id}`);
      if (rel?.appStoreVersionExperiment?.data)
        console.log(`    experiment=${rel.appStoreVersionExperiment.data.id}`);
    }
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
