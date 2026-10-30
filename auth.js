import { auth, db, toast, busy } from "./core.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const mode = document.body.dataset.mode, f = document.getElementById("f"), btn = f.querySelector("button[type=submit]");
const errs = { "auth/email-already-in-use": "That email is already registered.", "auth/invalid-credential": "Wrong email or password.", "auth/weak-password": "Password must be at least 6 characters.", "auth/invalid-email": "Enter a valid email address.", "auth/too-many-requests": "Too many attempts. Try again later.", "auth/network-request-failed": "Network error. Check your connection." };
let registering = false;
onAuthStateChanged(auth, u => { if (u && !registering) location.replace("dashboard.html"); });

f.onsubmit = async e => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(f));
  if (mode === "register") {
    if ((v.name || "").trim().length < 2) return toast("Please enter your name.");
    if ((v.password || "").length < 6) return toast("Password must be at least 6 characters.");
    if (v.password !== v.confirm) return toast("Passwords do not match.");
    if (!v.age) return toast("You must confirm you are of legal drinking age.");
  }
  busy(btn, true);
  try {
    if (mode === "register") {
      registering = true;
      const { user } = await createUserWithEmailAndPassword(auth, v.email, v.password);
      await updateProfile(user, { displayName: v.name.trim() });
      await setDoc(doc(db, "users", user.uid), { displayName: v.name.trim(), email: v.email, photoURL: "", bio: "", status: "online", ageConfirmed: true, createdAt: serverTimestamp() });
      location.replace("dashboard.html");
    } else {
      await signInWithEmailAndPassword(auth, v.email, v.password);
    }
  } catch (err) { registering = false; toast(errs[err.code] || "Something went wrong. Please try again."); busy(btn, false); }
};

const forgot = document.getElementById("forgot");
if (forgot) forgot.onclick = async e => {
  e.preventDefault();
  const email = f.email.value.trim();
  if (!email) return toast("Type your email first, then tap Forgot password.");
  try { await sendPasswordResetEmail(auth, email); toast("Reset link sent. Check your inbox."); }
  catch (err) { toast(errs[err.code] || "Could not send reset email."); }
};
