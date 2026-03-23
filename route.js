export async function POST(req) {
  const { tasks } = await req.json()

  const taskList = tasks.map(t =>
    `- "${t.name}" | priorita: ${t.priority === 'high' ? 'Vysoká' : t.priority === 'medium' ? 'Střední' : 'Nízká'} | čas: ${t.hours}h`
  ).join('\n')

  const systemPrompt = `Jsi asistent pro plánování týdne. Uživatel ti pošle seznam úkolů s prioritou a odhadovaným časem.
Tvým úkolem je rozdělit úkoly do konkrétních dnů v týdnu (Pondělí–Neděle) co nejrozumněji.

Pravidla:
- Vysokoprioritní úkoly zařaď spíše na začátek týdne (Po–St)
- Středně prioritní úkoly rozlož rovnoměrně
- Nízko prioritní úkoly zařaď na konec týdne nebo víkend
- Nepřeplánuj jeden den — každý den max ~8 hodin práce
- Víkend (So, Ne) jen pro nízko prioritní nebo volitelné úkoly

Odpověz POUZE validním JSON (bez markdown, bez kódu) ve formátu:
{
  "plan": {
    "Pondělí": ["úkol1", "úkol2"],
    "Úterý": [],
    "Středa": [],
    "Čtvrtek": [],
    "Pátek": [],
    "Sobota": [],
    "Neděle": []
  },
  "tip": "Krátký motivační tip (1-2 věty česky)"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Úkoly:\n${taskList}` }],
      }),
    })

    const data = await response.json()
    const text = data.content.map(b => b.text || '').join('')
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return Response.json(parsed)
  } catch (e) {
    return Response.json({ error: 'Nepodařilo se vygenerovat plán.' }, { status: 500 })
  }
}
