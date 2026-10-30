
// Vercel Serverless Function
module.exports = (req, res) => {
  const cfg = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  const missing = Object.entries(cfg)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    return res.status(500).json({
      error: "Firebase configuration is incomplete",
      missing
    });
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store");

  res.status(200).send(
    "window.__FB = " + JSON.stringify(cfg) + ";"
  );
};
