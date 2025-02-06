import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), nodePolyfills()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    BUILD_COMMIT: JSON.stringify(execSync('git rev-parse HEAD').toString()),
    BUILD_DATETIME: JSON.stringify(new Date().getTime()),
  },
})
