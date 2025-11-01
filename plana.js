const fs = require("fs")
const path = require("path")
const { autoAI } = require("./case")
const { resetMemory } = require("./commands/memory")

// Cache cepat per-user (untuk respon yang sama)
const cache = {}
if (!global.processedMsgIds) global.processedMsgIds = new Map()
if (!global.userLocks) global.userLocks = new Map() // 🔒 Lock per-user biar gak double eksekusi

// 🩷 Load personality.json (sekali aja di awal)
const personalityPath = path.join(__dirname, "commands", "dataBase", "personality.json")
const personalityData = JSON.parse(fs.readFileSync(personalityPath, "utf8"))
const persona = [
  personalityData.plana.prompt,
  personalityData.plana.rules,
  personalityData.plana.behavior
].filter(Boolean).join("\n\n")

// 🩷 Mood Detector Function
function getPlanaMood(text) {
  const romanticTriggers = [
    "sayang", "cantik", "manis", "imut",
    "gemes", "lucu", "plana cantik", "plana sayang"
  ]
  const lower = text.toLowerCase()
  return romanticTriggers.some(trigger => lower.includes(trigger))
    ? "salting"
    : "normal"
}

module.exports = async (plana, m) => {
  try {
    // ✅ Pastikan format pesan valid
    const msg = m?.messages?.[0]
    if (!msg?.message) return

    const sender = msg.key?.remoteJid
    if (!sender) return

    // 🚫 Abaikan pesan dari diri sendiri & broadcast
    if (msg.key.fromMe || sender === "status@broadcast") return

    const msgId = msg.key.id || ""
    const processedKey = `${sender}:${msgId}`
    const now = Date.now()
    const DUP_WINDOW = 30 * 1000 // 30 detik

    // 🧹 Hapus entri lama di processedMsgIds
    for (const [k, ts] of global.processedMsgIds) {
      if (now - ts > DUP_WINDOW) global.processedMsgIds.delete(k)
    }

    // 🚫 Cegah pesan duplikat
    if (global.processedMsgIds.has(processedKey)) return
    global.processedMsgIds.set(processedKey, now)

    // 🔒 Lock per-user (biar gak dobel eksekusi)
    if (global.userLocks.get(sender)) return
    global.userLocks.set(sender, true)

    // 📖 Auto-read message
    try {
      await plana.readMessages([msg.key])
    } catch (err) {
      console.warn("⚠️ Gagal auto-read:", err.message)
    }

    // Ambil isi teks
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      ""
    let text = body.trim()
    if (!text) {
      global.userLocks.delete(sender)
      return
    }

    // 🔹 Cek apakah grup atau private
    const isPrivate = !sender.endsWith("@g.us")
    const mentionRegex = /(^|\s|[,.!?])plana\b/i
    const isMentioned = mentionRegex.test(text)
    if (!isPrivate && !isMentioned && !text.toLowerCase().startsWith(".lapor")) {
  global.userLocks.delete(sender)
  return
}

    // Hapus kata "Plana" biar prompt lebih natural
    let userText = text.replace(/(^|\s|[,.!?])plana\b/ig, "").trim()

    // Jika user reply pesan
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (quoted) {
      const quotedText =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        ""
      if (quotedText) {
        userText += `\n\n(Pesan yang direply: "${quotedText}")`
      }
    }

    // Kalau teks kosong setelah dihapus "Plana"
    if (!userText) userText = text

    // 🔹 Deteksi prefix command
    const prefix = "."
    if (userText.startsWith(prefix)) {
      const command = userText.slice(prefix.length).trim().split(" ")[0].toLowerCase()

      // 🔹 Panggil modul sesuai command
      // di dalam handler prefix
    if (command === "lapor") {
      const { handleReport } = require("./commands/lapor")
      await handleReport(plana, msg, userText, prefix)
      global.userLocks.delete(sender)
      return
    }

      // 🔹 Keyword manual
      if (userText === "test") {
        await plana.sendMessage(sender, { text: "ini keyword test" }, { quoted: msg })
        global.userLocks.delete(sender)
        return
      }

      if (userText === "/reset") {
        await resetMemory(sender)
        await plana.sendMessage(sender, { text: "Memori kamu sudah dihapus, kak ✨" }, { quoted: msg })
        global.userLocks.delete(sender)
        return
      }
    }

    // 🔹 Cegah spam dengan cache respon
    if (cache[sender] && cache[sender][userText]) {
      global.userLocks.delete(sender)
      return
    }

    // ✍️ Simulasi “typing”
    await plana.presenceSubscribe(sender)
    await plana.sendPresenceUpdate("composing", sender)
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 1000))

    const mood = getPlanaMood(userText)
    let aiResponse

    if (mood === "salting") {
      const saltingPrompt = `
${persona}

Konteks: Plana baru saja dipanggil dengan kata manis seperti "sayang", "cantik", atau semacamnya.
Balas sebagai Plana yang kalem, cerdas, dan sedikit tsundere. 
Responnya harus terdengar malu-malu, agak gugup, tapi tetap natural dan hangat.
Gunakan gaya santai seperti chat WhatsApp dan maksimal 1–2 kalimat saja.
Pesan dari user: "${userText}"
`
      aiResponse = await autoAI(sender, saltingPrompt)
    } else {
      const fullPrompt = `${persona}\n\nPesan dari user: "${userText}"`
      aiResponse = await autoAI(sender, fullPrompt)
    }

    await plana.sendPresenceUpdate("paused", sender)

    // 📨 Kirim hasil respon ke WA
    if (aiResponse && typeof aiResponse === "string" && !aiResponse.startsWith("⚠️")) {
      await plana.sendMessage(sender, { text: aiResponse.trim() }, { quoted: msg })

      // Simpan cache respon untuk anti-spam
      if (!cache[sender]) cache[sender] = {}
      cache[sender][userText] = aiResponse
    } else {
      console.log("⚠️ AI gagal atau null, tidak kirim pesan ke WA")
    }

  } catch (err) {
    console.error("❌ Error di plana.js:", err)
  } finally {
    // Pastikan lock dilepas
    const sender = m?.messages?.[0]?.key?.remoteJid
    if (sender) global.userLocks.delete(sender)
  }
}