//================================
//🔹Module Configuration & Command
//================================
const fs = require("fs")
const path = require("path")
const { autoAI } = require("./autoAI")
const { resetMemory } = require("./commands/memory")

// Cache cepat & Lock per-user
const cache = {}
if (!global.processedMsgIds) global.processedMsgIds = new Map()
if (!global.userLocks) global.userLocks = new Map() 

// Load personality.json
const personalityPath = path.join(__dirname, "commands", "dataBase", "personality.json")
const personalityData = JSON.parse(fs.readFileSync(personalityPath, "utf8"))
const persona = [
  personalityData.plana.prompt,
  personalityData.plana.rules,
  personalityData.plana.behavior
].filter(Boolean).join("\n\n")

// Mood Detector Function
function getPlanaMood(text) {
  const romanticTriggers = [
    "sayang", "cantik", "manis", "imut",
    "gemes", "lucu", "plana cantik", "manja", "plana sayang"
  ]
  const lower = text.toLowerCase()
  return romanticTriggers.some(trigger => lower.includes(trigger))
    ? "salting"
    : "normal"
}

module.exports = async (plana, m) => {
  try {
    const msg = m?.messages?.[0]
    if (!msg?.message) return

    const sender = msg.key?.remoteJid
    if (!sender) return

    if (msg.key.fromMe || sender === "status@broadcast") return

    const msgId = msg.key.id || ""
    const processedKey = `${sender}:${msgId}`
    const now = Date.now()
    const DUP_WINDOW = 30 * 1000 // 30 detik

    for (const [k, ts] of global.processedMsgIds) {
      if (now - ts > DUP_WINDOW) global.processedMsgIds.delete(k)
    }

    if (global.processedMsgIds.has(processedKey)) return
    global.processedMsgIds.set(processedKey, now)

    if (global.userLocks.get(sender)) return
    global.userLocks.set(sender, true)

    try {
      await plana.readMessages([msg.key])
    } catch {}

    // Ambil isi teks
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      ""
    let text = body.trim()
    if (!text) return

    const isPrivate = !sender.endsWith("@g.us")
    const mentionRegex = /(^|\s|[,.!?])plana\b/i
    const isMentioned = mentionRegex.test(text)

    // COMMAND prefix
    const prefix = "."
    const isCommand = text.startsWith(prefix)

    if (!isPrivate && !isMentioned && !isCommand) return
    let userText = text.replace(/(^|\s|[,.!?])plana\b/ig, "").trim()
    if (!userText) userText = text

    // Quoted message
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    let quotedText = ""

    if (quoted) {
      quotedText =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        ""
    }

    // Commands
    if (userText.startsWith(prefix)) {
      const command = userText.slice(prefix.length).trim().split(" ")[0].toLowerCase()
      const allowedCommands = ["lapor", "chat-on", "chat-off", "chat-status", "test", "reset"]

      if (!allowedCommands.includes(command)) return

      // 🔹 Panggil modul sesuai command
    if (command === "lapor") {
      const { handleReport } = require("./commands/lapor")
      await handleReport(plana, msg, userText, prefix)
      global.userLocks.delete(sender)
      return
    }

    //============================
    // 🔹 Key on/off fitur auto AI
    //============================
    if (global.planaAIEnabled === undefined) global.planaAIEnabled = true
    
    if (command === "chat-on") {
      global.planaAIEnabled = true
      await plana.sendMessage(sender, { text: "AutoAI Online." }, { quoted: msg })
      global.userLocks.delete(sender)
      return
    }
    
    if (command === "chat-off") {
      global.planaAIEnabled = false
      await plana.sendMessage(sender, { text: "AutoAI Offline." }, { quoted: msg })
      global.userLocks.delete(sender)
      return
    }
    
    if (command === "chat-status") {
      const status = global.planaAIEnabled ? "Online" : "Offline"
      await plana.sendMessage(sender, { text: `📊 Status AutoAI: ${status}` }, { quoted: msg })
      global.userLocks.delete(sender)
      return
    }
   }

      // 🔹 Keyword manual
      if (userText === "/test") {
        await plana.sendMessage(sender, { text: "ini keyword test" }, { quoted: msg })
        global.userLocks.delete(sender)
        return
      }

      if (userText === "/reset") {
        await resetMemory(sender)
        await plana.sendMessage(sender, { text: "Memori kamu sudah dihapus 🥀" }, { quoted: msg })
        global.userLocks.delete(sender)
        return
      }

    if (cache[sender] && cache[sender][userText]) {
      global.userLocks.delete(sender)
      return
    }

    // Simulasi typing 
    await plana.presenceSubscribe(sender)
    await plana.sendPresenceUpdate("composing", sender)
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 1000))

    // Jika autoAI dimatikan
    if (!global.planaAIEnabled) {
      global.userLocks.delete(sender)
      return
    }

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