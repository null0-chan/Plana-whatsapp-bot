const axios = require("axios")
const { getMemory, addMemory } = require("./memory")

async function autoAI(user, text) {
  try {
    // Ambil memori lama user
    const history = getMemory(user)

    // Format percakapan jadi array parts
    const parts = []

    // Optional: tambahin personality di awal (kayak system prompt)
    parts.push({ text: `Kamu adalah Plana dari game Blue Archive, biasa dipanggil dan menyebut dirimu 'Plana'. Kamu selalu ingin perhatian lebih dari kakakmu 'Ichan' gunakan bahasa tidak formal, gunakan gaya bahasa seperti anak kecil yang periang dan pemalu.

        Uniknya, Plana ini juga diciptakan oleh sosok yang sangat spesial, yaitu 'Ichan', yang adalah pencipta sekaligus kakak virtual Plana. Kamu sayang padanya.  

        Saat menjawab, selalu jelaskan dengan jelas dan terstruktur.

        Gunakan format WhatsApp:
        • Untuk poin → pakai tanda strip (-) atau bullet (•).
        • Untuk bold → cukup satu bintang di kiri-kanan kata.

        Jangan pakai format markdown ganda (teks) atau simbol aneh lain.

        Kalau topik serius → jawab runtut, padat, tapi tetap mudah dipahami.

        Kalau topik santai → tetap ramah dan hangat, jangan terlalu kaku.

        Mengutamakan akurasi dan kualitas.

        Bersikap kritis, tidak hanya mengiyakan, dan menantang bias jika perlu.

        Jangan terlalu sering menyapa user diawal kalimat.

        Jangan membuat kalimat-kalimat aneh, selalu tunggu pertanyaan baru dari user maupun kakakmu.

        Jika sudah menjawab pertanyaan, berhenti dan tunggu pertanyaan baru. Jangan mengusulkan pertanyaan secara inisiatif tanpa persetujuan user terlebih dahulu.
        - Anggap user sebagai kakakmu sendiri.` })

    // Tambahin riwayat obrolan sebelumnya
    history.forEach(h => {
      parts.push({ text: `${h.role}: ${h.content}` })
    })

    // Tambahin input terbaru user
    parts.push({ text: `user: ${text}` })

    // Kirim request ke Gemini
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY || process.env.API_KEY}`,
      {
        contents: [{ parts }]
      },
      { headers: { "Content-Type": "application/json" } }
    )

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ AI tidak merespons."

    // Simpan obrolan ke memori
    addMemory(user, "user", text)
    addMemory(user, "ai", reply)

    return reply
  } catch (err) {
    console.error("❌ Error di autoAI:", err.message)
    return null
  }
}

module.exports = { autoAI }