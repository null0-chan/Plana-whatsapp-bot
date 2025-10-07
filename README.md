# About
> _memory.json_ file untuk menyimpan semua percakapan user dengan bot.
> _memory.js_ file yang berisi function untuk menghubungkan dan membaca isi dari file _memory.json_.
> _plana.js_ berisi function tentang bagaimana AI-nya berjalan, disitu juga sudah ada komentar agar lebih mudah dipahami ataupun dibaca.
> _index.js_ file berisi function untuk meminta pairing code untuk terhubung ke whatsapp.
> _case.js_ file berisi prompt internal sebagai personality (untuk sementara ini, karena akan dipindahkan ke _personality.json_).
> _.env_ file berisi API Gemini kamu.

Bot ini hanya difokuskan pada fitur AI-nya, belum berfokus kepada fitur-fitur menyenangkan seperti stiker generate dan sebagainya.

Untuk menjalankan code-nya ada 2 cara, yaitu:
1. Menggunakan Termux
2. Menggunakan panel Ptetrodactyl

# Cara pemasangan 
-- *Bash Termux* --:
1. ```pkg update && pkg upgrade```
2. ```pkg install nodejs```
3. ```node -v``` (untuk melihat versi) minimal v18 atau bisa lebih
4. Cari dimana letak filenya, contoh: ```cd storage/shared/download/Plana-whatsapp-bot```
5. ```npm install dotenv``` (pastikan sudah didalam folder bot-nya) 
6. ```npm install``` jika terjadi error bisa gunakan ```npm install --no-bin-links```
7. ```npm start```
8. Setelah itu masukkan nomor yang ingin dipasang bot diawali 62 (only number) 

-- *Panel Ptetrodactyl* --:
(Tanya ke penjual panelnya aja, soalnya gw lupa kalo ga praktek dipanel langsung) 
