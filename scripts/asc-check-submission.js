const fs = require('fs');
const crypto = require('crypto');

const ISSUER_ID = '46781a73-a825-49fa-a503-82d6dabe8b5a';
const KEY_ID = 'ZSQK8UYFZ9';
const PRIVATE_KEY_PATH = './AuthKey_Cancel.p8';
const SUBMISSION_ID = 'd3b09461-9a26-479d-82a7-a863b74b8a53';
const BASE_URL = 'https://api.appstoreconnect.apple.com/v1';

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

(async () => {
  const jwt = makeJwt();
  const url = `${BASE_URL}/reviewSubmissions/${SUBMISSION_ID}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(text.slice(0, 2000));
})().catch(err => { console.error(err); process.exit(1); });
