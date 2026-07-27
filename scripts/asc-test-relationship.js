const fs = require("fs");
const crypto = require("crypto");

const ISSUER_ID = "46781a73-a825-49fa-a503-82d6dabe8b5a";
const KEY_ID = "ZSQK8UYFZ9";
const PRIVATE_KEY_PATH = "./AuthKey_Cancel.p8";
const SUBMISSION_ID = "9836d964-e5d6-467b-9907-229a510ecf84";
const MONTHLY_IAP_ID = "193a8513-ace3-48df-a911-111217ae75a0";
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
  if (!res.ok) {
    const err = new Error(
      `${method} ${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 2000)}`,
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function testRelationship(relName, typeName, id) {
  try {
    await api("POST", "/reviewSubmissionItems", {
      data: {
        type: "reviewSubmissionItems",
        relationships: {
          reviewSubmission: {
            data: { type: "reviewSubmissions", id: SUBMISSION_ID },
          },
          [relName]: { data: { type: typeName, id } },
        },
      },
    });
    console.log(`SUCCESS with relationship ${relName} type ${typeName}`);
    return true;
  } catch (err) {
    console.log(`FAIL ${relName}/${typeName}: ${err.message.slice(0, 300)}`);
    return false;
  }
}

(async () => {
  // check submission state
  const sub = await api("GET", `/reviewSubmissions/${SUBMISSION_ID}`);
  console.log("Submission state:", sub.data.attributes?.state);

  const relationshipsToTry = [
    ["inAppPurchase", "inAppPurchases"],
    ["inAppPurchases", "inAppPurchases"],
    ["subscription", "subscriptions"],
    ["subscriptions", "subscriptions"],
    ["subscriptionGroup", "subscriptionGroups"],
  ];
  for (const [rel, type] of relationshipsToTry) {
    await testRelationship(rel, type, MONTHLY_IAP_ID);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
