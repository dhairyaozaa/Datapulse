/**
 * DataPulse — Frontend Config
 * ─────────────────────────────────────────────────────────
 * LOCAL DEV:      set API_BASE to "http://localhost:8000"
 * GITHUB PAGES:   set API_BASE to your ngrok URL
 *
 * How to get your ngrok URL:
 *   1. Run:  ngrok http 8000
 *   2. Copy the https://xxxx.ngrok-free.app URL
 *   3. Paste it below, save, push to GitHub
 *
 * Tip — get a FREE permanent ngrok domain so the URL never changes:
 *   ngrok http --domain=yourname.ngrok-free.app 8000
 */
const CONFIG = {
  API_BASE: " https://quench-preteen-catalyze.ngrok-free.dev",   // ← change this for GitHub Pages
  MAX_FILE_MB: 50,
};
