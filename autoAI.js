const axios = require("axios")
const { getMemory, addMemory } = require("./commands/memory")
const { getPersonality } = require("./commands/personality") // Ambil personality dari file JSON

async function autoAI(user, text) {
  try {
    // Ambil personality dari file personality.json
    const personality = getPersonality("plana")

    if (!personality || !personality.prompt) {
      console.warn("⚠️ Personality 'plana' belum diatur di personality.json")
    }

    // Ambil memori lama user
    const history = getMemory(user)

    // Format percakapan jadi array parts
    const parts = []

    // Masukkan personality dari file JSON (atau fallback kalau kosong)
    parts.push({
      text: personality?.prompt || "Kamu adalah AI bernama Plana."
    })

    // Tambahkan riwayat obrolan sebelumnya
    history.forEach((h) => {
      parts.push({ text: `${h.role}: ${h.content}` })
    })

    // Tambahkan input terbaru user
    parts.push({ text: `user: ${text}` })

    // Kirim request ke Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
        process.env.GEMINI_API_KEY || process.env.API_KEY
      }`,
      {
        contents: [{ parts }],
        tools: [{ google_search: {} }]
      },
      { headers: { "Content-Type": "application/json" } }
    )

    const reply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ AI tidak merespons."

    // Simpan obrolan ke memori
    // Bersihkan isi pesan agar personality tidak ikut tersimpan
let cleanUserText = text
if (typeof text === "string" && text.includes('Pesan dari user: "')) {
  const match = text.match(/Pesan dari user: "(.*)"/s)
  if (match) cleanUserText = match[1]
}

// Simpan obrolan ke memori (tanpa personality)
addMemory(user, "user", cleanUserText.trim())
addMemory(user, "ai", reply.trim())

    return reply
  } catch (err) {
    console.error("❌ Error di autoAI:", err.message)
    return null
  }
}

module.exports = { autoAI }
