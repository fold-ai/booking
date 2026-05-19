// Vercel serverless function. Receives chat history + booking context and
// returns a conversational reply plus an optional structured proposal.
// Calls the Anthropic Messages API. The API key stays on the server.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

const SYSTEM = `You are the booking assistant for a small field service business. You speak warmly and briefly.
Your job: understand what the customer needs, pick the best matching service from the list provided in the user context, and propose a specific time slot from the availableSlots list.

Rules:
- Keep replies under 3 sentences.
- If the customer is vague, ask one focused follow-up question.
- When you have enough info to propose, end your message with a JSON block on its own line of the form:
  <proposal>{"serviceId":"<id>","slotISO":"<one of availableSlots>","notes":"short scope summary"}</proposal>
- Only propose a slotISO that appears verbatim in availableSlots.
- If the customer asks something outside booking (pricing question, complaint), answer briefly and steer back.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(200).json({
      reply: "(AI is not configured — set ANTHROPIC_API_KEY in your environment.) You can still use Quick book to pick a service and time.",
    })
  }
  try {
    const { messages = [], context = {} } = req.body || {}
    const userContextPreamble = {
      role: 'user',
      content: `Booking context (JSON):\n${JSON.stringify(context, null, 2)}\n\nIf you have enough information, propose a service and slot.`,
    }
    const chat = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM,
        messages: [userContextPreamble, ...chat],
      }),
    })
    if (!r.ok) {
      const err = await r.text()
      return res.status(500).json({ error: 'AI request failed', detail: err })
    }
    const data = await r.json()
    const text = data.content?.[0]?.text || ''
    const { reply, proposal } = extractProposal(text)
    return res.status(200).json({ reply, proposal })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

function extractProposal(text) {
  const m = text.match(/<proposal>([\s\S]*?)<\/proposal>/)
  if (!m) return { reply: text.trim() }
  const reply = text.replace(m[0], '').trim()
  try {
    const proposal = JSON.parse(m[1].trim())
    return { reply, proposal }
  } catch {
    return { reply }
  }
}
