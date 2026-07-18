const fs = require('fs');
const crypto = require('crypto');

const ISSUER_ID = '46781a73-a825-49fa-a503-82d6dabe8b5a';
const KEY_ID = 'ZSQK8UYFZ9';
const PRIVATE_KEY_PATH = './AuthKey_Cancel.p8';
const BASE_URL = 'https://api.appstoreconnect.apple.com/v1';
const SUBMISSION_ID = '9836d964-e5d6-467b-9907-229a510ecf84';
const IAP_ID = '9c4014bf-b32f-40fc-a979-42aa7b64e526';

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
  const options = { method, headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  console.log(`${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  return { status: res.status, text, ok: res.ok };
}

(async () => {
  // Try to delete/cancel draft submission
  await api('GET', `/reviewSubmissions/${SUBMISSION_ID}`);
  await api('PATCH', `/reviewSubmissions/${SUBMISSION_ID}`, { data: { type: 'reviewSubmissions', id: SUBMISSION_ID, attributes: { canceled: true } } });
  await api('DELETE', `/reviewSubmissions/${SUBMISSION_ID}`);

  // Inspect and delete stray IAP
  await api('GET', `/inAppPurchases/${IAP_ID}`);
  await api('DELETE', `/inAppPurchases/${IAP_ID}`);
  // inAppPurchasesV2 alternative
  await api('DELETE', `/inAppPurchasesV2/${IAP_ID}`);
})().catch(err => { console.error(err); process.exit(1); });
