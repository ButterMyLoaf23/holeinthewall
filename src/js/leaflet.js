import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
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
const darkTiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>",
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
    <article class="restaurant-card" data-id="${restaurant.id}" tabindex="0">
      <div class="restaurant-image" aria-hidden="true">${restaurant.letter}</div>
      <div class="card-info">
        <h3>${restaurant.name}</h3>
        <p class="card-meta">${restaurant.label}</p>
        <div class="card-rating"><span class="star">&#9733;</span> ${restaurant.rating}<span class="distance">${restaurant.distance}</span></div>
      </div>
      <button class="favorite-button ${favorites.has(restaurant.id) ? "is-favorite" : ""}" type="button" data-favorite="${restaurant.id}" aria-label="${favorites.has(restaurant.id) ? "Remove" : "Add"} ${restaurant.name} ${favorites.has(restaurant.id) ? "from" : "to"} favorites">${favorites.has(restaurant.id) ? "&#9829;" : "&#9825;"}</button>
    </article>
  `).join("");
  markerLayer.clearLayers();
  visible.forEach((restaurant) => markerLayer.addLayer(markerById.get(restaurant.id)));
  list.querySelectorAll(".restaurant-card").forEach((card) => {
    card.addEventListener("click", () => selectCard(Number(card.dataset.id)));
    card.addEventListener("keydown", (event) => { if (event.key === "Enter") selectCard(Number(card.dataset.id)); });
  });
  list.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const id = Number(button.dataset.favorite);
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    document.querySelector(".favorite-count").textContent = favorites.size;
    render();
  }));
}

function selectCard(id) {
  document.querySelectorAll(".restaurant-card").forEach((card) => card.classList.toggle("is-selected", Number(card.dataset.id) === id));
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
  else await navigator.clipboard.writeText(window.location.href);
});

const authPanel = document.querySelector("#authPanel");
const authForm = document.querySelector("#authForm");
const authButton = document.querySelector("#accountButton");
const authToggle = document.querySelector("#authToggle");
const authSubmit = document.querySelector("#authSubmit");
const authTitle = document.querySelector("#authTitle");
const authMessage = document.querySelector("#authMessage");
let registering = false;

authButton.addEventListener("click", () => {
  authPanel.hidden = !authPanel.hidden;
  if (!authPanel.hidden) document.querySelector("#authEmail").focus();
});

authToggle.addEventListener("click", () => {
  registering = !registering;
  authTitle.textContent = registering ? "Create an account to view restaurant spots" : "Sign in to view restaurant spots";
  authSubmit.textContent = registering ? "Register" : "Sign in";
  authToggle.textContent = registering ? "Already have an account? Sign in" : "Need an account? Register";
  document.querySelector("#authPassword").setAttribute("autocomplete", registering ? "new-password" : "current-password");
  authMessage.textContent = "";
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "";
  const email = document.querySelector("#authEmail").value.trim();
  const password = document.querySelector("#authPassword").value;
  try {
    if (registering) await createUserWithEmailAndPassword(auth, email, password);
    else await signInWithEmailAndPassword(auth, email, password);
    authForm.reset();
  } catch (error) {
    authMessage.textContent = error.code === "auth/email-already-in-use" ? "An account already exists for that email." : "Unable to authenticate. Check your email and password.";
  }
});

async function loadRestaurants(user) {
  markerLayer.clearLayers();
  markerById.clear();
  restaurants = [];
  try {
    const snapshot = await getDocs(collection(db, user ? "restaurants" : "restaurantPreviews"));
    restaurants = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    restaurants.forEach((restaurant) => createMarker(restaurant));
    render();
    document.querySelector("#authDescription").textContent = user
      ? "You are viewing the full restaurant guide and private marker details."
      : "This preview shows a few public markers. Sign in to unlock the full restaurant guide.";
  } catch (error) {
    authMessage.textContent = user ? "Your account is signed in, but restaurant data could not be loaded." : "Preview markers could not be loaded.";
    console.error("Unable to load restaurant data", error);
  }
}

onAuthStateChanged(auth, async (user) => {
  authButton.textContent = user ? "Sign out" : "Sign in";
  authPanel.hidden = Boolean(user);
  if (user) {
    authMessage.textContent = `Signed in as ${user.email}`;
    authButton.onclick = () => signOut(auth);
  } else {
    authButton.onclick = () => { authPanel.hidden = false; document.querySelector("#authEmail").focus(); };
  }
  await loadRestaurants(user);
});

render();
