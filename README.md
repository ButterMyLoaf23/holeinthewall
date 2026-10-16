# Hole in the Wall

## Database and Spark deployment

This project uses **Cloud Firestore** as its cloud NoSQL database. Firestore stores project documents in the `projects` collection.

The project currently stays on Firebase's **Spark plan**, so `projects.html` uses the Firebase Web SDK directly from the browser. The public demo rules allow unauthenticated reads and writes. Do not use this configuration for private or sensitive data; add Firebase Authentication and authenticated rules before production use.

The `functions/` folder contains an optional Express/Cloud Functions backend prepared for a future Blaze-plan upgrade. It is not deployed while the project remains on Spark.

## Deploy

From the repository root, deploy the Spark-compatible Firestore rules and hosting site:

`firebase deploy --only firestore:rules,hosting`

No billing upgrade is required for this command. The Firebase project is configured in `.firebaserc` as `holeinthewall-13f6a`.
