const fs = require('fs');
const crypto = require('crypto');

const ISSUER_ID = '46781a73-a825-49fa-a503-82d6dabe8b5a';
const KEY_ID = 'ZSQK8UYFZ9';
const PRIVATE_KEY_PATH = './AuthKey_Cancel.p8';
const APP_ID = '6758251454';
const BASE_URL = 'https://api.appstoreconnect.apple.com/v1';

function base64url(input) {
  if (typeof input === 'string') input = Buffer.from(input);
  return input.toString('base64url');
}

function derToRaw(derSig) {
  if (derSig[0] !== 0x30) throw new Error('Invalid DER signature');
  let idx = 2; // after 0x30 L
  function readInt() {
    if (derSig[idx++] !== 0x02) throw new Error('Expected INTEGER');
    const len = derSig[idx++];
    if (len & 0x80) throw new Error('Long-form DER length not supported');
    const bytes = derSig.slice(idx, idx + len);
    idx += len;
    // strip leading zero if present due to high bit
    let trimmed = bytes;
    if (trimmed.length > 32 && trimmed[0] === 0x00) {
      trimmed = trimmed.slice(1);
    }
    if (trimmed.length > 32) throw new Error('Integer too long');
    // pad to 32 bytes
    const padded = Buffer.alloc(32);
    trimmed.copy(padded, 32 - trimmed.length);
    return padded;
  }
  const r = readInt();
  const s = readInt();
  return Buffer.concat([r, s]);
}

function makeJwt() {
  const keyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const privateKey = crypto.createPrivateKey(keyPem);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: 'appstoreconnect-v1',
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const derSig = crypto.sign('SHA256', Buffer.from(signingInput), privateKey);
  const rawSig = derToRaw(derSig);
  return `${signingInput}.${base64url(rawSig)}`;
}

const CANCELLABLE = new Set(['READY_FOR_REVIEW', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES']);

async function api(method, path, body) {
  const jwt = makeJwt();
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = text; }
  }
  if (!res.ok) {
    throw new Error(`API ${method} ${path} failed ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function cancelSubmission(id) {
  const body = {
    data: {
      type: 'reviewSubmissions',
      id,
      attributes: { canceled: true },
    },
  };
  return api('PATCH', `/reviewSubmissions/${id}`, body);
}

async function main() {
  console.log('Listing review submissions...');
  const list = await api('GET', `/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&limit=200&include=appStoreVersionForReview`);
  if (!list.data || list.data.length === 0) {
    console.log('No review submissions found.');
    return;
  }

  for (const sub of list.data) {
    const id = sub.id;
    const state = sub.attributes?.state || 'unknown';
    const versionName = sub.relationships?.appStoreVersionForReview?.data?.id || 'n/a';
    console.log(`Submission ${id}: state=${state} version=${versionName}`);
    if (CANCELLABLE.has(state)) {
      console.log(` -> cancelling ${id}...`);
      try {
        await cancelSubmission(id);
        console.log(` -> cancel PATCH sent`);
      } catch (err) {
        console.error(` -> failed to cancel ${id}: ${err.message}`);
      }
    } else {
      console.log(` -> not cancelling (state=${state})`);
    }
  }
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
