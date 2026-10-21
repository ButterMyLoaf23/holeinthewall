const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const restaurants = [
  ["hickory", { name: "The Hickory", cuisine: "american", label: "Smokehouse & comfort food", address: "155 W Main St", rating: 4.8, distance: "0.4 mi", letter: "H", lat: 43.8239, lng: -111.7927 }],
  ["cucina-fresca", { name: "Cucina Fresca", cuisine: "italian", label: "Fresh pasta & Italian plates", address: "22 S 1st E", rating: 4.7, distance: "0.6 mi", letter: "C", lat: 43.8253, lng: -111.7885 }],
  ["the-grind", { name: "The Grind", cuisine: "coffee", label: "Coffee, breakfast & pastries", address: "60 W Main St", rating: 4.9, distance: "0.3 mi", letter: "G", lat: 43.8234, lng: -111.7912 }],
  ["taqueria-la-costa", { name: "Taqueria La Costa", cuisine: "mexican", label: "Tacos, burritos & salsa", address: "410 S 2nd W", rating: 4.6, distance: "1.1 mi", letter: "T", lat: 43.8178, lng: -111.7982 }],
  ["mama-inez", { name: "Mama Inez", cuisine: "mexican", label: "Homestyle Mexican cooking", address: "129 N 2nd E", rating: 4.8, distance: "0.8 mi", letter: "M", lat: 43.8283, lng: -111.7881 }],
  ["bonsai", { name: "Bonsai", cuisine: "asian", label: "Sushi, ramen & small plates", address: "185 S 2nd W", rating: 4.7, distance: "0.9 mi", letter: "B", lat: 43.8201, lng: -111.7971 }],
  ["chipotle", { name: "Chipotle", cuisine: "mexican", label: "Burrito", address: "1048 Tamana Dr, Rexburg, ID 83440", rating: 3.7, distance: "0.9 mi", letter: "C", lat: 43.8042207, lng: -111.8065222 }]
];

const previews = restaurants.slice(0, 3);

async function seed() {
  const batch = db.batch();
  restaurants.forEach(([id, data]) => batch.set(db.collection("restaurants").doc(id), data));
  previews.forEach(([id, data]) => batch.set(db.collection("restaurantPreviews").doc(id), data));
  await batch.commit();
  console.log(`Seeded ${restaurants.length} private restaurant records and ${previews.length} public preview records.`);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
