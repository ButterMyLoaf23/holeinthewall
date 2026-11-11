import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const savedList = document.querySelector("#savedList");
const emptyFavorites = document.querySelector("#emptyFavorites");
const favoriteCount = document.querySelector("#favoriteCount");
const accountEmail = document.querySelector("#accountEmail");
const status = document.querySelector("#accountStatus");
const themeButton = document.querySelector("#themeButton");
const savedTheme = localStorage.getItem("rexburg-bites-theme");
let isDarkMode = savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;

function applyTheme() {
  document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
  themeButton.setAttribute("aria-label", isDarkMode ? "Switch to light mode" : "Switch to dark mode");
  themeButton.setAttribute("aria-pressed", String(isDarkMode));
  themeButton.querySelector(".theme-icon").textContent = isDarkMode ? "☀" : "☾";
  themeButton.querySelector(".theme-label").textContent = isDarkMode ? "Light mode" : "Dark mode";
}
themeButton.addEventListener("click", () => { isDarkMode = !isDarkMode; localStorage.setItem("rexburg-bites-theme", isDarkMode ? "dark" : "light"); applyTheme(); });
applyTheme();

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }

function renderFavorites(restaurants, favoriteIds) {
  const favorites = restaurants.filter((restaurant) => favoriteIds.has(String(restaurant.id)));
  favoriteCount.textContent = favorites.length;
  emptyFavorites.hidden = favorites.length !== 0;
  savedList.innerHTML = favorites.map((restaurant) => `
    <article class="saved-card">
      <div class="restaurant-image" aria-hidden="true">${escapeHtml(restaurant.letter || restaurant.name?.charAt(0) || "R")}</div>
      <div class="card-info"><h3>${escapeHtml(restaurant.name)}</h3><p class="card-meta">${escapeHtml(restaurant.label || "Local favorite")}</p><p class="card-rating"><span class="star" aria-hidden="true">★</span> ${escapeHtml(restaurant.rating || "—")}<span class="distance">${escapeHtml(restaurant.distance || "")}</span></p></div>
      <a class="saved-card-link" href="index.html#explore" aria-label="Explore ${escapeHtml(restaurant.name)} on the map">View</a>
    </article>`).join("");
}

document.querySelector("#signOutButton").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "auth.html"; return; }
  accountEmail.textContent = user.email || "Signed-in Rexburg Bites member";
  const key = `rexburg-bites-favorites:${user.uid}`;
  const favoriteIds = new Set(JSON.parse(localStorage.getItem(key) || "[]").map(String));
  try {
    const snapshot = await getDocs(collection(db, "restaurants"));
    renderFavorites(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })), favoriteIds);
  } catch (error) {
    status.textContent = "Your account loaded, but saved restaurants could not be retrieved.";
    console.error("Unable to load favorites", error);
  }
});
