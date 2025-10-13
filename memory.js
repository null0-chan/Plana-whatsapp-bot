// memory.js
const fs = require("fs")
const path = require("path")

const file = path.join(__dirname, "memory.json")

// Baca file JSON, kalau belum ada bikin baru
function loadMemory() {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "{}")
  }
  try {
    const data = fs.readFileSync(file, "utf8")
    return JSON.parse(data || "{}")
  } catch (err) {
    console.error("❌ Gagal baca memory.json:", err)
    return {}
  }
}

// Simpan memori ke file
function saveMemory(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

// Ambil memori user tertentu
function getMemory(user) {
  const mem = loadMemory()
  return mem[user] || []
}

// Tambahin data ke memori user
function addMemory(user, role, content) {
  const mem = loadMemory()
  if (!mem[user]) mem[user] = []
  mem[user].push({ role, content })
  saveMemory(mem)
}

// Reset memori user tertentu
function resetMemory(user) {
  const mem = loadMemory()
  delete mem[user]
  saveMemory(mem)
}

module.exports = { getMemory, addMemory, resetMemory }