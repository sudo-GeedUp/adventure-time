# App Store Metadata

Last updated: 2026-07-31

## App

- **Name:** Its Adventure Time
- **Bundle ID:** `com.masongallegos.itsadventuretime`
- **Version:** 2.1.1 (5)
- **Copyright:** © 2026 Mason Gallegos. All Rights Reserved

## Legal URLs

- **Terms of Use (EULA):** https://thegoodadventuretime.web.app/terms-of-use
- **Privacy Policy:** https://thegoodadventuretime.web.app/privacy-policy
- **Marketing / Support URL:** https://thegoodadventuretime.web.app

## Resolving 3.1.2 Business: Payments - Subscriptions

Apple rejected version 2.1.1 (5) because the App Store metadata was missing a functional link to the Terms of Use (EULA). Follow these steps and then resubmit.

### Step 1 - Redeploy the legal pages

The hosted `terms-of-use.html` and `privacy-policy.html` are already live, but the terms page has just been updated. Redeploy the `website/` folder to Firebase Hosting:

```bash
cd website
firebase deploy --only hosting
```

If you do not have the Firebase CLI installed:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

### Step 2 - Add the EULA in App Store Connect

1. Open [App Store Connect](https://appstoreconnect.apple.com).
2. Go to **My Apps > Its Adventure Time > App Information**.
3. Scroll down to **License Agreement (EULA)**.
4. Select **Apply a custom EULA to all chosen territories**.
5. Paste the Terms of Use URL:
   ```
   https://thegoodadventuretime.web.app/terms-of-use
   ```
6. Click **Save**.

### Step 3 - Confirm the App Description (already in store.config.json)

The `store.config.json` already includes both links in the description. If you want to update App Store Connect directly from this repo, run:

```bash
eas metadata:push
```

This will push `description`, `privacyPolicyUrl`, and related metadata to the App Store for version 2.1.1 (5).

### Step 4 - Reply and resubmit

1. Go to **App Store Connect > Its Adventure Time > App Review > Messages**.
2. Reply to the reviewer:

   > Hello,
   >
   > We have added a custom EULA to the App Store Connect metadata and included the Terms of Use link in the App Description. The Terms of Use (EULA) and Privacy Policy are hosted at:
   > - https://thegoodadventuretime.web.app/terms-of-use
   > - https://thegoodadventuretime.web.app/privacy-policy
   >
   > These links are also tappable from the paywall and subscription screens inside the app.
   >
   > Thank you for the review.

3. Save the reply and click **Resubmit to App Review**.

## What changed to fix this

- `store.config.json` `version` updated from `2.1.1(2)` to `2.1.1(5)`.
- `website/public/terms-of-use.html` updated to list both monthly and yearly subscriptions instead of a fixed $4.99/month price.

## Product IDs

- Monthly: `com.masongallegos.itsadventuretime.premium.monthly.v2`
- Yearly: `com.masongallegos.itsadventuretime.premium.yearly.v2`
