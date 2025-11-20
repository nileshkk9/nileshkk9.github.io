import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// Base path for GitHub Pages
// - If repo is 'username.github.io', use '/'
// - If repo is 'portfolio' (or any other name), use '/portfolio/'
// Update the base path below to match your repository name
const REPO_NAME = 'portfolio'; // Change this to your repo name, or '' for username.github.io

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
