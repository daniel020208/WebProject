import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Create a dynamic define object with all VITE_ prefixed env variables
  const defineEnv = {}
  Object.keys(env).forEach(key => {
    if (key.startsWith('VITE_')) {
      defineEnv[`import.meta.env.${key}`] = JSON.stringify(env[key])
    }
  })
  
  return {
    define: defineEnv,
    plugins: [react()],
    build: {
      outDir: 'build',
      // Make sure Rollup doesn't expose your secrets in source maps
      sourcemap: false
    }
  }
})

