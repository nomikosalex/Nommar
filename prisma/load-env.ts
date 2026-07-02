// Side-effect import: load .env into process.env before anything reads it.
// Imported first by seed scripts (Next.js loads env on its own).
try {
  process.loadEnvFile();
} catch {
  /* .env optional */
}
