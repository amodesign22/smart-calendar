export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  try {
    const { messages, max_tokens } = req.body

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.VITE_ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        messages: messages,
        max_tokens: max_tokens || 1000,
        temperature: 0.2,
      }),
    })

    const data = await response.json()

    // 轉換成 Anthropic 格式讓前端相容
    if (data.choices && data.choices[0]) {
      res.status(200).json({
        content: [{ type: "text", text: data.choices[0].message.content }]
      })
    } else {
      res.status(200).json({ error: JSON.stringify(data) })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}