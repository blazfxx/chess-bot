import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadPromptFile(fileName) {
  try {
    return readFileSync(resolve(process.cwd(), fileName), 'utf-8').trim()
  } catch {
    return null
  }
}

function aiProxyPlugin(env) {
  const apiKey = env.AI_API_KEY
  const baseUrl = env.AI_BASE_URL
  const model = env.AI_MODEL
  const meanPrompt = loadPromptFile('systemprompt.txt')
  const nicePrompt = loadPromptFile('niceprompt.txt')

  return {
    name: 'ai-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/ai/chat/completions') {
          const chunks = []
          req.on('data', (chunk) => chunks.push(chunk))
          req.on('end', async () => {
            const raw = Buffer.concat(chunks).toString()
            try {
              const payload = JSON.parse(raw)
              const coachingStyle = req.headers['x-coaching-style']
              const promptOverride = coachingStyle === 'mean' ? meanPrompt : coachingStyle === 'nice' ? nicePrompt : null
              if (promptOverride && payload.messages?.length && payload.messages[0].role === 'system') {
                payload.messages[0].content = promptOverride
              }
              if (model) {
                payload.model = model
              }
              const targetUrl = `${baseUrl}/chat/completions`
              const upstream = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
              })
              res.statusCode = upstream.status
              res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
              const responseBody = await upstream.arrayBuffer()
              res.end(Buffer.from(responseBody))
            } catch (err) {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: { message: `Proxy error: ${err.message}` } }))
            }
          })
        } else {
          next()
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '')
return {
plugins: [react(), aiProxyPlugin(env)],
}
})
