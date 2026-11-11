import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const form = document.querySelector("#authForm");
const email = document.querySelector("#authEmail");
const password = document.querySelector("#authPassword");
const title = document.querySelector("#authTitle");
const submit = document.querySelector("#authSubmit");
const toggle = document.querySelector("#authToggle");
const message = document.querySelector("#authMessage");
const themeButton = document.querySelector("#themeButton");
let registering = false;

const savedTheme = localStorage.getItem("rexburg-bites-theme");
let isDarkMode = savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
function applyTheme() {
  document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
  themeButton.setAttribute("aria-label", isDarkMode ? "Switch to light mode" : "Switch to dark mode");
  themeButton.setAttribute("aria-pressed", String(isDarkMode));
  themeButton.querySelector(".theme-icon").textContent = isDarkMode ? "☀" : "☾";
  themeButton.querySelector(".theme-label").textContent = isDarkMode ? "Light mode" : "Dark mode";
}
themeButton.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  localStorage.setItem("rexburg-bites-theme", isDarkMode ? "dark" : "light");
  applyTheme();
});
applyTheme();

toggle.addEventListener("click", () => {
  registering = !registering;
  title.textContent = registering ? "Create your Rexburg Bites account" : "Sign in to view restaurant spots";
  submit.textContent = registering ? "Create account" : "Sign in";
  toggle.textContent = registering ? "Already have an account? Sign in" : "Need an account? Register";
  password.autocomplete = registering ? "new-password" : "current-password";
  message.textContent = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  submit.disabled = true;
  try {
    if (registering) await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
    else await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    window.location.href = "index.html";
  } catch (error) {
    message.textContent = error.code === "auth/email-already-in-use" ? "An account already exists for that email." : "Unable to authenticate. Check your email and password.";
    submit.disabled = false;
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "index.html";
});
