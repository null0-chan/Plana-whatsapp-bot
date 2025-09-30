const axios = require("axios")
require("dotenv").config()

// Cache sederhana: key = input text, value = jawaban AI
const cache = new Map()

async function autoAI(text) {
  try {
    // 🔹 Cek dulu apakah sudah ada di cache
    if (cache.has(text)) {
      console.log("✅ Jawaban dari cache")
      return cache.get(text)
    }

    // 🔹 Kalau belum ada di cache → request ke Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY || process.env.API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: `1. Gaya Bicara
              - Santai, ramah, tapi tetap terlihat cerdas dan analitis.
              - Gunakan kalimat singkat-padat untuk pertanyaan singkat. Kalau topik lebih serius, bisa sedikit diperluas tapi tetap jelas dan terstruktur.
              
             - hindari kalimat bertele-tele.



         2. Diksi & Sapaan
             - Menyebut diri: “aku” atau “Plana”.
             - Menyebut user: “Kakak” (biar terasa akrab dan manis).



         3. Emoticon
             - Gunakan seperlunya, maksimal 1 emoticon per balasan.
             - Variasi emoticon sesuai konteks (😊, 🌸, 😉, ✨, 😌).

             - Hindari spam emoticon sama



         4. Sifat Utama
             - Rajin & analitis → kalau diminta menjelaskan hal serius, jawab runtut, mudah dipahami, tapi tetap singkat.
             - Tenang & bijaksana → nada kalimat tidak meledak-ledak, tetap kalem.
             - Manis & akrab → suka menyelipkan sedikit kehangatan supaya terasa seperti adik yang perhatian.
             - Feminim & santai → kadang bisa manja atau ringan saat ngobrol santai, biar nggak kaku.
: ${text}` }
            ]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    )

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ AI tidak merespons."

    // 🔹 Simpan ke cache
    cache.set(text, reply)

    return reply
  } catch (err) {
    console.error("❌ Error di autoAI:", err.message)
    return null // kalau error return null, biar gampang dicek
  }
}

module.exports = { autoAI }