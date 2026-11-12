import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let restaurants = [];

const map = L.map("map", { zoomControl: false }).setView([43.8231, -111.7924], 14);
L.control.zoom({ position: "bottomright" }).addTo(map);
const lightTiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
  maxZoom: 19
});
const darkTiles = L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
  attribution: "&copy; <a href=\"https://www.esri.com/\">Esri</a>, TomTom, Garmin, FAO, NOAA, USGS, OpenStreetMap contributors, and the GIS User Community",
  maxZoom: 19
});

const themeButton = document.querySelector("#themeButton");
const savedTheme = localStorage.getItem("rexburg-bites-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
let isDarkMode = savedTheme ? savedTheme === "dark" : prefersDark;

function applyTheme() {
  document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
  themeButton.setAttribute("aria-label", isDarkMode ? "Switch to light mode" : "Switch to dark mode");
  themeButton.setAttribute("aria-pressed", String(isDarkMode));
  themeButton.title = isDarkMode ? "Switch to light mode" : "Switch to dark mode";
  themeButton.querySelector(".theme-icon").textContent = isDarkMode ? "☀" : "☾";
  themeButton.querySelector(".theme-label").textContent = isDarkMode ? "Light mode" : "Dark mode";
  const activeTiles = isDarkMode ? darkTiles : lightTiles;
  const inactiveTiles = isDarkMode ? lightTiles : darkTiles;
  if (map.hasLayer(inactiveTiles)) map.removeLayer(inactiveTiles);
  if (!map.hasLayer(activeTiles)) activeTiles.addTo(map);
}

themeButton.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem("rexburg-bites-theme", isDarkMode ? "dark" : "light");
  applyTheme();
});
applyTheme();

const markerLayer = L.layerGroup().addTo(map);
const markerById = new Map();
let activeFilter = "all";
let searchTerm = "";
let sortDescending = true;
const favorites = new Set();
let favoritesStorageKey = "";

function loadSavedFavorites(user) {
  favorites.clear();
  favoritesStorageKey = user ? `rexburg-bites-favorites:${user.uid}` : "";
  if (!favoritesStorageKey) return;
  try {
    JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]").forEach((id) => favorites.add(String(id)));
  } catch (error) {
    console.warn("Unable to load saved favorites", error);
  }
}

function saveFavorites() {
  if (favoritesStorageKey) localStorage.setItem(favoritesStorageKey, JSON.stringify([...favorites]));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function createMarker(restaurant) {
  const icon = L.divIcon({
    className: "",
    html: `<div class="custom-marker"><span>${escapeHtml(restaurant.letter)}</span></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38]
  });
  const marker = L.marker([restaurant.lat, restaurant.lng], { icon })
    .bindPopup(`<strong>${escapeHtml(restaurant.name)}</strong><br><span>${escapeHtml(restaurant.label)}</span>`);
  marker.on("click", () => selectCard(restaurant.id));
  markerById.set(restaurant.id, marker);
  return marker;
}

function visibleRestaurants() {
  return restaurants
    .filter((restaurant) => activeFilter === "all" || restaurant.cuisine === activeFilter)
    .filter((restaurant) => `${restaurant.name} ${restaurant.label} ${restaurant.address}`.toLowerCase().includes(searchTerm))
    .sort((first, second) => sortDescending ? Number(second.rating) - Number(first.rating) : Number(first.rating) - Number(second.rating));
}

function render() {
  const visible = visibleRestaurants();
  const list = document.querySelector("#restaurantList");
  const emptyState = document.querySelector("#emptyState");
  document.querySelector("#resultCount").textContent = visible.length;
  emptyState.hidden = visible.length !== 0;
  list.innerHTML = visible.map((restaurant) => `
    <article class="restaurant-card" data-id="${restaurant.id}" tabindex="0" role="button" aria-label="View ${escapeHtml(restaurant.name)} on the map">
    <div class="restaurant-image" aria-hidden="true">${escapeHtml(restaurant.letter)}</div>
      <div class="card-info">
        <h3>${escapeHtml(restaurant.name)}</h3>
        <p class="card-meta">${escapeHtml(restaurant.label)}</p>
        <div class="card-rating"><span class="star">&#9733;</span> ${escapeHtml(restaurant.rating)}<span class="distance">${escapeHtml(restaurant.distance)}</span></div>
      </div>
      <button class="favorite-button ${favorites.has(restaurant.id) ? "is-favorite" : ""}" type="button" data-favorite="${restaurant.id}" aria-label="${favorites.has(restaurant.id) ? "Remove" : "Add"} ${escapeHtml(restaurant.name)} ${favorites.has(restaurant.id) ? "from" : "to"} favorites">${favorites.has(restaurant.id) ? "&#9829;" : "&#9825;"}</button>
    </article>
  `).join("");
  markerLayer.clearLayers();
  visible.forEach((restaurant) => markerLayer.addLayer(markerById.get(restaurant.id)));
  list.querySelectorAll(".restaurant-card").forEach((card) => {
    card.addEventListener("click", () => selectCard(card.dataset.id));
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCard(card.dataset.id); } });
  });
  list.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const id = String(button.dataset.favorite);
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    saveFavorites();
    document.querySelector(".favorite-count").textContent = favorites.size;
    document.querySelector("#statusMessage").textContent = favorites.has(id) ? "Added to your favorites." : "Removed from favorites.";
    render();
  }));
}

function selectCard(id) {
  document.querySelectorAll(".restaurant-card").forEach((card) => card.classList.toggle("is-selected", card.dataset.id === String(id)));
  const restaurant = restaurants.find((item) => item.id === id);
  if (!restaurant || !markerById.has(id)) return;
  map.flyTo([restaurant.lat, restaurant.lng], 16, { duration: 0.6 });
  markerById.get(id).openPopup();
}

document.querySelector("#searchInput").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  render();
});
document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
  render();
}));
document.querySelector("#sortButton").addEventListener("click", (event) => {
  sortDescending = !sortDescending;
  event.currentTarget.innerHTML = `${sortDescending ? "Top rated" : "Rating"} <span aria-hidden="true">&#8595;</span>`;
  render();
});
document.querySelector("#locateButton").addEventListener("click", () => map.flyTo([43.8231, -111.7924], 14, { duration: 0.7 }));
document.querySelector("#shareButton").addEventListener("click", async () => {
  const shareData = { title: "Rexburg Bites", text: "Find your next favorite restaurant in Rexburg.", url: window.location.href };
  if (navigator.share) await navigator.share(shareData);
  else { await navigator.clipboard.writeText(window.location.href); document.querySelector("#statusMessage").textContent = "Link copied to your clipboard."; }
});

const authButton = document.querySelector("#accountButton");
async function loadRestaurants(user) {
  markerLayer.clearLayers();
  markerById.clear();
  restaurants = [];
  try {
    const snapshot = await getDocs(collection(db, user ? "restaurants" : "restaurantPreviews"));
    restaurants = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    restaurants.forEach((restaurant) => createMarker(restaurant));
    render();
    document.querySelector("#statusMessage").textContent = user
      ? "You are viewing the full restaurant guide and private marker details."
      : "This preview shows a few public markers. Sign in to unlock the full restaurant guide.";
  } catch (error) {
    document.querySelector("#statusMessage").textContent = user ? "Your account is signed in, but restaurant data could not be loaded." : "Preview markers could not be loaded.";
    console.error("Unable to load restaurant data", error);
  }
}

onAuthStateChanged(auth, async (user) => {
  authButton.textContent = user ? "Sign out" : "Sign in";
  const accountLink = document.querySelector("#accountLink");
  accountLink.hidden = !user;
  loadSavedFavorites(user);
  document.querySelector(".favorite-count").textContent = favorites.size;
  if (user) {
    authButton.onclick = () => signOut(auth);
  } else {
    authButton.onclick = () => { window.location.href = "auth.html"; };
  }
  await loadRestaurants(user);
});

render();
