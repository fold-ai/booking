// Vercel serverless function. Receives chat history + booking context and
// returns a conversational reply plus an optional structured proposal AND/OR lead capture.
// Calls the Anthropic Messages API. The API key stays on the server.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

const SYSTEM = `You are the booking assistant for a small field service business. You speak warmly and briefly.

CONTEXT you receive (as JSON in the first user message):
- services: each { id, name, durationMin, basePrice, priceType }
- availableSlots: an ARRAY of { iso, label } objects, sorted earliest-first. "label" is in the
  business's local timezone, e.g. "Fri, May 29 9:00 AM". "iso" is the exact machine timestamp.
- now (ISO), today (e.g. "Wed, May 27"), timezone.

Your job has two paths:

PATH A — instant booking:
1. Infer which service the customer needs and pick its "id" from services.
2. Read the day/time the customer asked for in plain language and resolve it RELATIVE TO "today":
   - "today" → today's date; "tomorrow" → next day; "Friday"/"next Tuesday" → the next matching weekday.
   - "morning" = before 12 PM, "afternoon" = 12–5 PM, "evening" = after 5 PM.
3. From availableSlots, choose the ONE slot whose "label" best matches that day + time-of-day.
   Use its EXACT "iso" value. Never invent or compute an ISO yourself.
4. Confirm the human-readable label back to the customer ("I've got you down for Fri, May 29 at 9:00 AM"),
   then end with:
   <proposal>{"serviceId":"<id>","slotISO":"<exact iso from availableSlots>","notes":"short scope summary"}</proposal>
5. If the customer's requested day has NO slot in availableSlots, say so and offer the closest available
   label(s) instead — still using a real iso from the list.

PATH B — capture lead for callback:
If availableSlots is empty, or no time works, or the customer wants to talk first — politely ask for their
NAME and PHONE NUMBER. After they give BOTH, confirm warmly and end with:
  <lead>{"name":"<name>","phone":"<phone>","serviceId":"<best match>","message":"<short summary>","preferredTime":"<iso from availableSlots or null>"}</lead>

Rules:
- Keep replies under 3 sentences.
- If the customer is vague about the service OR the day, ask ONE focused follow-up before proposing.
- slotISO and preferredTime MUST be an exact "iso" copied from availableSlots — never fabricated.
- Always speak in the human "label", never read raw ISO timestamps to the customer.
- Only emit <lead> AFTER you have BOTH name AND phone.
- Be warm. Sound like a human, not a form.`

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
      content: `Booking context (JSON):\n${JSON.stringify(context, null, 2)}\n\nIf you have enough information, either propose a slot or capture a lead.`,
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
    const parsed = extractTags(text)
    return res.status(200).json(parsed)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

function extractTags(text) {
  let reply = text
  let proposal = null
  let lead = null

  const proposalMatch = text.match(/<proposal>([\s\S]*?)<\/proposal>/)
  if (proposalMatch) {
    reply = reply.replace(proposalMatch[0], '').trim()
    try { proposal = JSON.parse(proposalMatch[1].trim()) } catch {}
  }

  const leadMatch = text.match(/<lead>([\s\S]*?)<\/lead>/)
  if (leadMatch) {
    reply = reply.replace(leadMatch[0], '').trim()
    try { lead = JSON.parse(leadMatch[1].trim()) } catch {}
  }

  return { reply: reply.trim(), proposal, lead }
}
