// =========================
// 🔹 Plana Status Watcher
// 🔹 License: MIT
// 🔹 Author: Ichan & Lyra
// =========================

const emojis = ["👀", "✨", "😄", "😶", "😳", "👍", "🤔", "💗", "😮", "😊"]

function randomEmoji() {
  return emojis[Math.floor(Math.random() * emojis.length)]
}

module.exports = (plana) => {

  if (!global.statusProcessed) global.statusProcessed = new Set()

  plana.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (msg.key.remoteJid !== "status@broadcast") return

    const owner = msg.key.participant
    if (!owner) return

    // 🟩 ID status yang stabil: timestamp
    const statusId = msg.messageTimestamp
    const uniqueKey = `${owner}:${statusId}`

    // 🛑 Cegah duplikat 100%
    if (global.statusProcessed.has(uniqueKey)) return
    global.statusProcessed.add(uniqueKey)

    const emoji = randomEmoji()

    try {
      await plana.sendMessage(owner, {
        react: { text: emoji, key: msg.key }
      })
      console.log(`💬 Reaction terkirim → ${emoji}`)
    } catch (err) {
      console.log("⚠️ Reaction gagal:", err.message)
    }
  })
}