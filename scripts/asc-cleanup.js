const fs = require("fs");
const crypto = require("crypto");

const { ISSUER_ID, KEY_ID, PRIVATE_KEY_PATH } = require("./asc-config");
const SUBMISSION_ID = "9836d964-e5d6-467b-9907-229a510ecf84";
const STRAY_SUBSCRIPTION_ID = "6792252149";
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
  // Try deleting stray subscription via /subscriptions endpoint
  try {
    await api("DELETE", `/subscriptions/${STRAY_SUBSCRIPTION_ID}`);
    console.log("Deleted stray subscription");
  } catch (err) {
    console.log("Delete subscription failed, continuing");
  }

  // List and delete reviewSubmissionItems for current submission
  try {
    const items = await api(
      "GET",
      `/reviewSubmissions/${SUBMISSION_ID}/items?limit=200`,
    );
    for (const item of items.data || []) {
      try {
        await api("DELETE", `/reviewSubmissionItems/${item.id}`);
        console.log(`Deleted item ${item.id}`);
      } catch (err) {
        console.log(`Failed to delete item ${item.id}: ${err.status}`);
      }
    }
  } catch (err) {
    console.log("List items failed:", err.status);
  }

  // Try to cancel the submission
  try {
    await api("PATCH", `/reviewSubmissions/${SUBMISSION_ID}`, {
      data: {
        type: "reviewSubmissions",
        id: SUBMISSION_ID,
        attributes: { canceled: true },
      },
    });
    console.log("Canceled submission");
  } catch (err) {
    console.log("Cancel submission failed:", err.status);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
