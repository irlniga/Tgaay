import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

if (!window.__FB || !window.__FB.apiKey) {
  document.body.innerHTML = '<p style="padding:40px;color:#fff;font-family:sans-serif">Firebase is not configured. Set the FIREBASE_* environment variables in Vercel (see README) and run with <b>vercel dev</b> locally.</p>';
  throw new Error("Missing Firebase config");
}
export const app = initializeApp(window.__FB);
export const auth = getAuth(app), db = getFirestore(app), storage = getStorage(app);
export const requireAuth = cb => onAuthStateChanged(auth, u => u ? cb(u) : location.replace("login.html"));
export const logout = () => signOut(auth).then(() => location.replace("index.html"));
export function toast(m) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = m;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3400);
}
export const busy = (b, on) => { b.dataset.t = b.dataset.t || b.textContent; b.disabled = on; b.textContent = on ? "Please wait…" : b.dataset.t; };
