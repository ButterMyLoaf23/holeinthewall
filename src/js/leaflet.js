const restaurants = [
  { id: 1, name: "The Hickory", cuisine: "american", label: "Smokehouse & comfort food", address: "155 W Main St", rating: "4.8", distance: "0.4 mi", letter: "H", lat: 43.8239, lng: -111.7927 },
  { id: 2, name: "Cucina Fresca", cuisine: "italian", label: "Fresh pasta & Italian plates", address: "22 S 1st E", rating: "4.7", distance: "0.6 mi", letter: "C", lat: 43.8253, lng: -111.7885 },
  { id: 3, name: "The Grind", cuisine: "coffee", label: "Coffee, breakfast & pastries", address: "60 W Main St", rating: "4.9", distance: "0.3 mi", letter: "G", lat: 43.8234, lng: -111.7912 },
  { id: 4, name: "Taqueria La Costa", cuisine: "mexican", label: "Tacos, burritos & salsa", address: "410 S 2nd W", rating: "4.6", distance: "1.1 mi", letter: "T", lat: 43.8178, lng: -111.7982 },
  { id: 5, name: "Mama Inez", cuisine: "mexican", label: "Homestyle Mexican cooking", address: "129 N 2nd E", rating: "4.8", distance: "0.8 mi", letter: "M", lat: 43.8283, lng: -111.7881 },
  { id: 6, name: "Bonsai", cuisine: "asian", label: "Sushi, ramen & small plates", address: "185 S 2nd W", rating: "4.7", distance: "0.9 mi", letter: "B", lat: 43.8201, lng: -111.7971 }
];

const map = L.map("map", { zoomControl: false }).setView([43.8231, -111.7924], 14);
L.control.zoom({ position: "bottomright" }).addTo(map);
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap &copy; CARTO",
  maxZoom: 19
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);
const markerById = new Map();
let activeFilter = "all";
let searchTerm = "";
let sortDescending = true;
const favorites = new Set();

function createMarker(restaurant) {
  const icon = L.divIcon({
    className: "",
    html: `<div class="custom-marker"><span>${restaurant.letter}</span></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38]
  });
  const marker = L.marker([restaurant.lat, restaurant.lng], { icon })
    .bindPopup(`<strong>${restaurant.name}</strong><br><span>${restaurant.label}</span>`);
  marker.on("click", () => selectCard(restaurant.id));
  markerById.set(restaurant.id, marker);
  return marker;
}

restaurants.forEach((restaurant) => createMarker(restaurant));

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

render();
