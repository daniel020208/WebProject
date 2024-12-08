import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY': JSON.stringify(env.VITE_FINANCIAL_MODELING_PREP_API_KEY)
    },
    plugins: [react()],
    build: {
      outDir: 'build'
    }
  }
})

