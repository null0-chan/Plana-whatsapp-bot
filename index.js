// Import Module 
require("dotenv").config()

const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const chalk = require("chalk")
const readline = require("readline")
const { resolve } = require("path")
const { version } = require("os")

// Metode Pairing
const usePairingCode = true

// Promt Input Terminal
async function question(promt) {
    process.stdout.write(promt)
    const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise((resolve) => r1.question("", (ans) => {
        r1.close()
        resolve(ans)
    }))
    
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./PlanaSesi')
  
  // Versi Terbaru
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`Plana Using WA v${version.join('.')}, isLatest: ${isLatest}`)

  const plana = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !usePairingCode,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    version: version,
    syncFullHistory: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id)
        return msg?.message || undefined
      }
      return proto.Message.fromObject({})
    }
  })

  // Handle Pairing Code
  if (usePairingCode && !plana.authState.creds.registered) {
    try {
      const phoneNumber = await question('☘️ Masukan Nomor Yang Diawali Dengan 62 :\n')
      const code = await plana.requestPairingCode(phoneNumber.trim())
      console.log(`🎁 Pairing Code : ${code}`)
    } catch (err) {
      console.error('Failed to get pairing code:', err)
    }
  }
    // Menyimpan Sesi Login
    plana.ev.on("creds.update", saveCreds)

    // Informasi Koneksi
plana.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update
    if (connection === "close") {
        console.log(chalk.red("❌  Koneksi Terputus, Mencoba Menyambung Ulang"))
        connectToWhatsApp()
    } else if (connection === "open") {
        console.log(chalk.green("✔  Bot Berhasil Terhubung Ke WhatsApp"))

        // 🔔 Jalankan reminder otomatis setelah konek ke WA
        const { startReminder } = require("./commands/reminder")
        startReminder(plana)

        // Status always active
        plana.sendPresenceUpdate("available").catch(err =>
            console.warn("⚠️ Gagal update status available:", err.message)
        )

        // Load module watch status
    require("./commands/plana-reaction")(plana)
    }
})

    // Respon Pesan Masuk
    plana.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0]

        if (!msg.message) return

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        const sender = msg.key.remoteJid
        const pushname = msg.pushName || "Ichan"

        // Log Pesan Masuk Terminal
        const listColor = ["red", "green", "yellow", "magenta", "cyan", "white", "blue"]
        const randomColor = listColor[Math.floor(Math.random() * listColor.length)]

        console.log(
            chalk.yellow.bold("Credit : Ichan"),
            chalk.green.bold("[ WhatsApp ]"),
            chalk[randomColor](pushname),
            chalk[randomColor](" : "),
            chalk.white(body)
            
        )

        require("./Plana")(plana, m)
    })
    
}

// Jalankan Koneksi WhatsApp
connectToWhatsApp()