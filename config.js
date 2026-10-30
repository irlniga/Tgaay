// Vercel serverless function: exposes Firebase WEB config from environment variables.
// (Firebase web config is not secret; security comes from Auth + Firestore Rules.)
module.exports = (req, res) => {
  const e = process.env;
  const cfg = {
    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdj7VhwpLWAwVGZQCl9uwdi2Ax_aLsZsE",
  authDomain: "online-tagay.firebaseapp.com",
  projectId: "online-tagay",
  storageBucket: "online-tagay.firebasestorage.app",
  messagingSenderId: "698949409255",
  appId: "1:698949409255:web:bd3d2d2adf328eb9984542"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
  };
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  res.send('window.__FB=' + JSON.stringify(cfg) + ';');
};
