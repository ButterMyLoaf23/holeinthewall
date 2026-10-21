# Hole in the Wall

## Database and Spark deployment

This project uses **Cloud Firestore** as its cloud NoSQL database. Firestore stores project documents in the `projects` collection.

The project currently stays on Firebase's **Spark plan**, so `projects.html` uses the Firebase Web SDK directly from the browser. The public demo rules allow unauthenticated reads and writes. Do not use this configuration for private or sensitive data; add Firebase Authentication and authenticated rules before production use.

The `functions/` folder contains an optional Express/Cloud Functions backend prepared for a future Blaze-plan upgrade. It is not deployed while the project remains on Spark.

## Deploy

From the repository root, deploy the Spark-compatible Firestore rules and hosting site:

`firebase deploy --only firestore:rules,hosting`

No billing upgrade is required for this command. The Firebase project is configured in `.firebaserc` as `holeinthewall-13f6a`.

## Security and maintenance evidence

This project includes a security hardening pass for cloud deployment:

- Firestore rules allow public reads for the classroom demo, but validate project field names, types, and lengths on create. Updates and deletes are denied.
- The optional Functions API disables the Express fingerprint, limits JSON bodies to 32 KB, validates request fields, restricts CORS to the Firebase hosting domains (plus the local emulator), and sends defensive HTTP headers.
- Firebase Hosting sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.
- Functions use the Node 22 LTS runtime declaration. The dependency lockfile is committed so deployments use reviewed versions instead of floating installs.

Before deployment, run:

`npm run security:check --prefix functions`

The current production dependency audit returned **0 vulnerabilities** with `npm audit --omit=dev`. This is the local equivalent of a Snyk/npm audit checkpoint; a CI pipeline should run the same check and fail on high-severity findings. CVEs should be reviewed after every dependency update, and packages with a vulnerable version should be upgraded or replaced before deployment.

## Accounts and protected restaurant data

The home page now uses Firebase Authentication with email/password accounts. The map tiles remain public, and a small `restaurantPreviews` collection provides a few non-sensitive sample markers to logged-out visitors. The full restaurant cards and marker coordinates are loaded only after Firebase reports an authenticated user. Firestore rules enforce the boundary with `allow read: if request.auth != null` for the `restaurants` collection, while browser writes are denied for both collections.

Before using accounts, enable **Authentication > Sign-in method > Email/Password** in the Firebase console. To populate the protected restaurant collection, run the Admin SDK seed script from an environment with Google Application Default Credentials or a service-account credential:

`npm run seed:restaurants --prefix functions`

The seed command populates both the private full collection and the three-marker public preview collection.

Do not place service-account keys in this repository. The seed script is intentionally separate from the browser code so restaurant data cannot be modified by ordinary users.
