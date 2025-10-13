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

    // cek grup / mention
    const isGroup = sender.endsWith("@g.us")
    const mentions =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    // ambil nomor bot
    const botNumber = plana?.user?.id
    ? plana.user.id.split(":")[0] + "@s.whatsapp.net" // samain format jid
      : null

    // cek apakah ada jid mention yang match nomor bot
    const isMentioned = botNumber
    ? mentions.includes(botNumber)
    : false

    console.log("Mentions:", mentions, "BotNumber:", botNumber, "isMentioned:", isMentioned)

    // kalau di grup tapi bot tidak ditag → abaikan
    if (isGroup && !isMentioned) return

    // bersihin teks mention
    if (isGroup && isMentioned) {
      text = text.replace(/@\d+/g, "").trim().toLowerCase()
    } else {
      text = text.toLowerCase()
    }

    // kalau cuma mention tanpa teks
    if (isGroup && isMentioned && text === "") {
      await plana.sendMessage(
        sender,
        { text: "Ya, ada apa Kakak?" },
        { quoted: msg }
      )
      await plana.readMessages([msg.key])
      return
    }

    let handled = false

    // keyword manual
    if (text === "test") {
      await plana.sendMessage(sender, { text: "ini keyword test" }, { quoted: msg })
      await plana.readMessages([msg.key])
      handled = true
    }

    // reset memori
    if (text === "/reset") {
      resetMemory(sender)
      await plana.sendMessage(sender, { text: "Memori kamu sudah dihapus, Kakak ✨" }, { quoted: msg })
      await plana.readMessages([msg.key])
      return
    }

    if (!handled) {
      // cek cache cepat
      if (cache[sender] && cache[sender][text]) {
        await plana.sendMessage(sender, { text: cache[sender][text] }, { quoted: msg })
        await plana.readMessages([msg.key])
        return
      }

      const aiResponse = await autoAI(sender, text)

      if (aiResponse && !aiResponse.startsWith("⚠️")) {
        await plana.sendMessage(sender, { text: aiResponse }, { quoted: msg })
        await plana.readMessages([msg.key])

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