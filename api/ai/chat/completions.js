import { readFileSync } from 'fs'
import { join } from 'path'

function loadPromptFile(fileName) {
  try {
    return readFileSync(join(process.cwd(), fileName), 'utf-8').trim()
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } })
    return
  }

  const apiKey = process.env.AI_API_KEY
  const baseUrl = process.env.AI_BASE_URL
  const model = process.env.AI_MODEL

  if (!apiKey || !baseUrl) {
    res.status(500).json({ error: { message: 'AI service is not configured.' } })
    return
  }

  try {
    let payload = req.body
    if (typeof payload === 'string') {
      payload = JSON.parse(payload)
    }
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: { message: 'Invalid request body.' } })
      return
    }

    const coachingStyle = req.headers['x-coaching-style']
    const meanPrompt = loadPromptFile('systemprompt.txt')
    const nicePrompt = loadPromptFile('niceprompt.txt')
    const promptOverride = coachingStyle === 'mean' ? meanPrompt : coachingStyle === 'nice' ? nicePrompt : null

    if (promptOverride && payload.messages?.length && payload.messages[0].role === 'system') {
      payload.messages[0].content = promptOverride
    }

    if (model) {
      payload.model = model
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const text = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    res.send(text)
  } catch (err) {
    res.status(502).json({ error: { message: `Proxy error: ${err.message}` } })
  }
}
