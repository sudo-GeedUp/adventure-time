const os = require("os");
const path = require("path");

const USAGE = `
Set these before running App Store Connect scripts:

  ASC_ISSUER_ID          Issuer ID from App Store Connect > Users and Access > Integrations
  ASC_KEY_ID             Key ID of your App Store Connect API key
  ASC_PRIVATE_KEY_PATH   Path to the .p8 file, stored OUTSIDE this repo
                         (e.g. ~/.appstoreconnect/private_keys/AuthKey_XXXXXXXXXX.p8)

Put them in .env (gitignored) and run with:

  node --env-file=.env scripts/<script>.js
`;

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error(USAGE);
    process.exit(1);
  }
  return value;
}

function resolveKeyPath(raw) {
  const expanded = raw.startsWith("~")
    ? path.join(os.homedir(), raw.slice(1))
    : raw;
  return path.resolve(expanded);
}

module.exports = {
  ISSUER_ID: required("ASC_ISSUER_ID"),
  KEY_ID: required("ASC_KEY_ID"),
  PRIVATE_KEY_PATH: resolveKeyPath(required("ASC_PRIVATE_KEY_PATH")),
};
