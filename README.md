## About
Bot ini hanya difokuskan pada fitur AI-nya, belum berfokus kepada fitur-fitur menyenangkan seperti stiker generate dan sebagainya.

### Struktur file
1. ```memory.json``` file untuk menyimpan semua percakapan user dengan bot.
2. ```memory.js``` file yang berisi function untuk menghubungkan dan membaca isi dari file ```memory.json```.
3. ```plana.js```  berisi function tentang bagaimana AI-nya berjalan, disitu juga sudah ada komentar agar lebih mudah dipahami ataupun dibaca.
4. ```index.js``` file berisi function untuk meminta pairing code untuk terhubung ke whatsapp.
5. ```case.js``` file berisi function yang akan menghubung atau memanggil API untuk merespon chat.
6. ```.env``` file berisi API Gemini kamu.
7. ```personality.js``` file yang berisi function untuk menghubungkan dan membaca isi dari file ```personality.json```.
8. ```personality.json``` file yang berisi persona (sifat) AI kamu atau singkatnya prompt internal.
9. ```reminder.js``` file yang berisi function untuk membaca isi dari ```reminder.json```
10. ```lapor.js``` file function untuk fitur 'lapor' yang dikirim dari user ke owner. Intinya buat laporan. command: ```.lapor``` (isi laporan) example: ```.lapor Fitur lapor rusak```

Untuk menjalankan code-nya ada 2 cara, yaitu:
1. Menggunakan Termux
2. Menggunakan panel Ptetrodactyl

## Cara pemasangan 
-- *Bash Termux* --:
1. ```pkg update && pkg upgrade```
2. ```pkg install nodejs```
3. ```node -v``` (untuk melihat versi) minimal v18 atau bisa lebih
4. Cari dimana letak filenya, contoh: ```cd storage/shared/download/Plana-whatsapp-bot```
5. ```npm install dotenv``` jika terjadi error bisa gunakan ```npm install dotenv --no-bin-links``` (pastikan sudah didalam folder bot-nya) 
6. ```npm install``` jika terjadi error bisa gunakan ```npm install --no-bin-links```
7. ```npm start```
8. Setelah itu masukkan nomor yang ingin dipasang bot diawali 62 (only number) 

-- *Panel Ptetrodactyl* --:
(Tanya ke penjual panelnya aja, soalnya gw lupa kalo ga praktek dipanel langsung) 
