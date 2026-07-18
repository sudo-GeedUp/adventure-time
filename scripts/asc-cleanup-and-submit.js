const fs = require('fs');
const crypto = require('crypto');

const ISSUER_ID = '46781a73-a825-49fa-a503-82d6dabe8b5a';
const KEY_ID = 'ZSQK8UYFZ9';
const PRIVATE_KEY_PATH = './AuthKey_Cancel.p8';
const APP_ID = '6758251454';
const APP_STORE_VERSION_ID = 'ad6f2414-8b0d-4db1-a497-f3ac1a2d45c9';
const BASE_URL = 'https://api.appstoreconnect.apple.com/v1';

const STRAY_IAP_ID = '9c4014bf-b32f-40fc-a979-42aa7b64e526';
const MONTHLY_IAP_ID = '193a8513-ace3-48df-a911-111217ae75a0';
const YEARLY_IAP_ID = '7dd389eb-25fa-4514-983e-af7f40dace0a';

function base64url(input) {
  if (typeof input === 'string') input = Buffer.from(input);
  return input.toString('base64url');
}

function derToRaw(derSig) {
  if (derSig[0] !== 0x30) throw new Error('Invalid DER signature');
  let idx = 2;
  function readInt() {
    if (derSig[idx++] !== 0x02) throw new Error('Expected INTEGER');
    const len = derSig[idx++];
    if (len & 0x80) throw new Error('Long-form DER length not supported');
    const bytes = derSig.slice(idx, idx + len);
    idx += len;
    let trimmed = bytes;
    if (trimmed.length > 32 && trimmed[0] === 0x00) trimmed = trimmed.slice(1);
    if (trimmed.length > 32) throw new Error('Integer too long');
    const padded = Buffer.alloc(32);
    trimmed.copy(padded, 32 - trimmed.length);
    return padded;
  }
  return Buffer.concat([readInt(), readInt()]);
}

function makeJwt() {
  const keyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const privateKey = crypto.createPrivateKey(keyPem);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const payload = { iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const derSig = crypto.sign('SHA256', Buffer.from(signingInput), privateKey);
  const rawSig = derToRaw(derSig);
  return `${signingInput}.${base64url(rawSig)}`;
}

async function api(method, path, body) {
  const jwt = makeJwt();
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  if (text) { try { json = JSON.parse(text); } catch { json = text; } }
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 2000)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function main() {
  // 1. Skipping stray IAP deletion; not supported via this API key/role.

  // 2. Create review submission
  const sub = await api('POST', '/reviewSubmissions', {
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: APP_ID } } },
    },
  });
  const submissionId = sub.data.id;
  console.log(`Created review submission ${submissionId}`);

  // 3. Add app version
  await api('POST', '/reviewSubmissionItems', {
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        reviewSubmission: { data: { type: 'reviewSubmissions', id: submissionId } },
        appStoreVersion: { data: { type: 'appStoreVersions', id: APP_STORE_VERSION_ID } },
      },
    },
  });
  console.log(`Added app version ${APP_STORE_VERSION_ID}`);

  // 4. Add monthly and yearly subscriptions
  for (const [name, id] of [['monthly', MONTHLY_IAP_ID], ['yearly', YEARLY_IAP_ID]]) {
    try {
      await api('POST', '/reviewSubmissionItems', {
        data: {
          type: 'reviewSubmissionItems',
          relationships: {
            reviewSubmission: { data: { type: 'reviewSubmissions', id: submissionId } },
            inAppPurchases: { data: { type: 'inAppPurchases', id } },
          },
        },
      });
      console.log(`Added ${name} IAP ${id}`);
    } catch (err) {
      console.error(`Failed to add ${name} IAP: ${err.message}`);
    }
  }

  // 5. Submit for review
  await api('PATCH', `/reviewSubmissions/${submissionId}`, {
    data: {
      type: 'reviewSubmissions',
      id: submissionId,
      attributes: { submitted: true },
    },
  });
  console.log(`Submitted review submission ${submissionId}`);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
