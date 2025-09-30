const { autoAI } = require("./case")

// cache untuk simpan input-output AI per user
const cache = {}

// processed message IDs untuk anti-dup (global biar konsisten antar event)
if (!global.processedMsgIds) global.processedMsgIds = new Map()

module.exports = async (plana, m) => {
  try {
    const msg = m.messages[0]
    if (!msg.message) return

    // ---- ignore pesan dari bot sendiri dan status broadcast ----
    if (msg.key && msg.key.fromMe) return
    if (msg.key && msg.key.remoteJid === 'status@broadcast') return

    // ---- anti duplikat yang lebih andal (dengan TTL) ----
    const msgId = msg.key.id || ""
    const remoteJid = msg.key.remoteJid || ""
    const processedKey = `${remoteJid}:${msgId}`
    const now = Date.now()
    const DUP_WINDOW = 30 * 1000 // 30 detik window, sesuaikan kalau perlu

    // cleanup entries lama
    for (const [k, ts] of global.processedMsgIds) {
      if (now - ts > DUP_WINDOW) global.processedMsgIds.delete(k)
    }

    // jika sudah diproses, abaikan
    if (global.processedMsgIds.has(processedKey)) return

    // tandai sudah diproses
    global.processedMsgIds.set(processedKey, now)

    const sender = msg.key.remoteJid  
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""  
    const text = body.toLowerCase().trim()  

    let handled = false

    // 🔹 fitur keyword
    if (text === "test") {
      await plana.sendMessage(sender, { text: "ini keyword test" }, { quoted: msg })
      await plana.readMessages([msg.key]) // auto-read
      handled = true
    }

    // (tambahkan keyword lain di sini jika perlu, jangan hapus yang ada)

    // 🔹 kalau belum ditangani keyword, baru lempar ke AI
    if (!handled) {
      // cek cache lokal per-sender dulu (gunakan 'text' yang sudah di-normalize)
      if (cache[sender] && cache[sender][text]) {
        await plana.sendMessage(sender, { text: cache[sender][text] }, { quoted: msg })
        await plana.readMessages([msg.key]) // auto-read
        return
      }

      // panggil AI dengan text (bukan raw body) supaya cache konsisten
      const aiResponse = await autoAI(text)

      // aiResponse bisa null (on error), atau string yang mungkin diawali "⚠️"
      if (aiResponse && !aiResponse.startsWith("⚠️")) {
        await plana.sendMessage(sender, { text: aiResponse }, { quoted: msg })
        await plana.readMessages([msg.key]) // auto-read

        // simpan ke cache per user
        if (!cache[sender]) cache[sender] = {}
        cache[sender][text] = aiResponse
      } else {
        console.log("AI gagal atau null, tidak kirim pesan ke WA")
      }
    }

  } catch (err) {  
    console.error("Error di Plana.js:", err)  
  }
}