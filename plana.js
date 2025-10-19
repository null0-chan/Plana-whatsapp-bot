const { autoAI } = require("./case")
const { resetMemory } = require("./memory")

// cache cepat
const cache = {}
if (!global.processedMsgIds) global.processedMsgIds = new Map()

module.exports = async (plana, m) => {
  try {
    const msg = m.messages[0]
    if (!msg.message) return

    // abaikan pesan sendiri & broadcast
    if (msg.key && msg.key.fromMe) return
    if (msg.key && msg.key.remoteJid === "status@broadcast") return

    // 🟢 Auto-read aktif di setiap pesan masuk
    await plana.readMessages([msg.key])

    // anti duplikat
    const msgId = msg.key.id || ""
    const remoteJid = msg.key.remoteJid || ""
    const processedKey = `${remoteJid}:${msgId}`
    const now = Date.now()
    const DUP_WINDOW = 30 * 1000
    for (const [k, ts] of global.processedMsgIds) {
      if (now - ts > DUP_WINDOW) global.processedMsgIds.delete(k)
    }
    if (global.processedMsgIds.has(processedKey)) return
    global.processedMsgIds.set(processedKey, now)

    const sender = msg.key.remoteJid
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""
    let text = body.trim()
    let handled = false

    // cek apakah chat pribadi (bukan grup)
    const isPrivate = !sender.endsWith("@g.us")

    // 🔹 Prefix / mention detection
    const mentionRegex = /(^|\s|[,.!?])plana\b/i
    const isMentioned = mentionRegex.test(text)

    // Kalau bukan private dan gak nyebut "Plana", skip
    if (!isPrivate && !isMentioned) return

    // hapus kata "Plana" biar prompt bersih
    let userText = text.replace(/(^|\s|[,.!?])plana\b/ig, "").trim()

    // kalau ada reply (quote)
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage
      const quotedText =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        ""
      if (quotedText) {
        userText =
          (userText ? userText + "\n\n" : "") +
          `Ini pesan yang direply:\n"${quotedText}"`
      }
    }

    // kalau cuma ngetik "Plana" doang
    if (!userText) {
      await plana.sendMessage(sender, { text: "Iya, ada apa? ✨" }, { quoted: msg })
      return
    }

    text = userText

    // keyword manual
    if (text === "test") {
      await plana.sendMessage(sender, { text: "ini keyword test" }, { quoted: msg })
      handled = true
    }

    // reset memori
    if (text === "/reset") {
      resetMemory(sender)
      await plana.sendMessage(sender, { text: "Memori kamu sudah dihapus, Kakak ✨" }, { quoted: msg })
      return
    }

    if (!handled) {
      // cek cache cepat
      if (cache[sender] && cache[sender][text]) {
        await plana.sendMessage(sender, { text: cache[sender][text] }, { quoted: msg })
        return
      }

      // 🟢 Kirim animasi sedang mengetik
      await plana.presenceSubscribe(sender)
      await plana.sendPresenceUpdate("composing", sender)

      // delay biar lebih natural
      await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 1000))

      const aiResponse = await autoAI(sender, text)

      // 🟢 Hentikan animasi mengetik
      await plana.sendPresenceUpdate("paused", sender)

      if (aiResponse && !aiResponse.startsWith("⚠️")) {
        await plana.sendMessage(sender, { text: aiResponse }, { quoted: msg })

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