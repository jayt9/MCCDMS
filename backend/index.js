// ============================================================
// index.js — server entry point
// Imports the configured Express app and starts listening.
// ============================================================

const app  = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MCC API running on port ${PORT}`);
});