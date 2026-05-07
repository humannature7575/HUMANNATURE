#!/usr/bin/env node

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "true");
    } else {
      args.set(key, next);
      i += 1;
    }
  }
  return args;
}

function parseBoolean(value) {
  if (value === undefined) return true;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  throw new Error(`Invalid --admin value "${value}". Use true or false.`);
}

const args = parseArgs(process.argv.slice(2));
const email = args.get("email");
const uid = args.get("uid");
const serviceAccountPath = args.get("service-account");
const projectId =
  args.get("project") ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "humannature-291de";
const admin = parseBoolean(args.get("admin"));

if (!email && !uid) {
  console.error("Usage: node scripts/set-admin-claim.mjs --email admin@example.com --admin true");
  console.error("   or: node scripts/set-admin-claim.mjs --uid <firebase-uid> --admin true");
  console.error("   add: --service-account path/to/service-account.json when default credentials are not configured");
  process.exit(1);
}

if (!getApps().length) {
  let credential = applicationDefault();

  if (serviceAccountPath) {
    const serviceAccountJson = JSON.parse(
      await readFile(resolve(serviceAccountPath), "utf8"),
    );
    credential = cert(serviceAccountJson);
  }

  initializeApp({
    credential,
    projectId,
  });
}

const auth = getAuth();
const user = email ? await auth.getUserByEmail(email) : await auth.getUser(uid);
const currentClaims = user.customClaims || {};
const customClaims = {
  ...currentClaims,
  admin,
};

await auth.setCustomUserClaims(user.uid, customClaims);
await auth.revokeRefreshTokens(user.uid);

const updatedUser = await auth.getUser(user.uid);

console.log(`Project: ${projectId}`);
console.log(`UID: ${updatedUser.uid}`);
console.log(`Email: ${updatedUser.email || "(no email)"}`);
console.log(`Custom claims: ${JSON.stringify(updatedUser.customClaims || {}, null, 2)}`);
console.log(`Updated admin claim for ${updatedUser.email || updatedUser.uid}: admin=${admin}`);
console.log("Ask the user to sign out and sign back in so the refreshed ID token contains the new claim.");
