# Absensi Siswa QR — Versi Sebenarnya (STAGING, belum diterbitkan)

Aplikasi absensi datang, sholat dhuhur, dan pulang siswa SMP Negeri 2 Kebonagung
dengan scan QR Kartu Siswa. Dibangun dari prototipe (`~/workspace/absensi-qr/`,
commit `072fdf60`) dengan data siswa asli dan penyimpanan permanen.

**Status: staging lokal di folder ini. JANGAN timpa repo live `masgurubudi/absensi-qr`
(prototipe) sebelum Mas Budi menyetujui penerbitan.**

## File

| File | Isi |
|---|---|
| `index.html` | Aplikasi (satu halaman: Scan, Rekap Guru, Orang Tua, Kartu & QR) |
| `roster.js` | Daftar siswa asli — 402 siswa aktif TP 2026/2027 (7A–7D, 8A–8E, 9A–9D) |
| `jsQR.min.js` | Pustaka baca QR cadangan (lokal, v1.4.0) |
| `qrcode.min.js` | Pustaka gambar QR kartu (lokal, qrcodejs 1.0.0) |
| `firebase-app-compat.js`, `firebase-firestore-compat.js` | Firebase JS SDK 10.12.5 (lokal, supaya bisa dibuka offline) |
| `sw.js` | Service worker — menyimpan app shell di HP |
| `manifest.webmanifest` | Manifest PWA (nama, ikon, tampil layar penuh) |
| `icon-192.png`, `icon-512.png` | Ikon aplikasi |
| `firestore-rules.txt` | Blok aturan Firestore siap tempel (dipasang Mas Budi) |
| `prototype-orig.html` | Salinan prototipe sebagai pembanding (bukan bagian aplikasi; hapus sebelum terbit) |

## Data siswa (dari spreadsheet Mas Budi, 13 Nov 2026)

- Sumber: Google Sheet "Data Siswa" (tab 1) + tab 2 "QR Siswa".
- Dipakai: **402 siswa aktif TP 2026/2027** (7A–7D: 129, 8A–8E: 139, 9A–9D: 134).
- **Tidak dipakai:** 155 baris "Lulus 9A"–"Lulus 9E" (TP 2025/2026, sudah lulus).
- Kolom NO WA kosong untuk semua baris — tidak ada data sensitif lain yang dipakai.
  Hanya NIS, nama, kelas, dan isi QR yang masuk ke aplikasi.
- Isi QR pada Kartu Siswa: `NIS-NAMA` dengan spasi ditulis `+`, contoh
  `4572-ADIELLA+AGITHA+PUTRI` — sama persis dengan kartu fisik (quickchart).
  Pemindai mencocokkan NIS dari QR ke roster.
- Tab 2 "QR Siswa" berisi tautan Google Forms prefilled per siswa
  (Hadir/Sakit/Izin/Sholat/Halangan/Tidak Sholat) — alur Forms lama sekolah;
  tidak dipakai aplikasi ini, isi QR-nya identik dengan tab 1.

## Aturan waktu (dikonfirmasi Mas Budi)

- Jam masuk: **07.00 WIB** (13 Nov 10.28).
- Terlambat: scan Datang **lewat 07.00** (13 Nov 10.31 — RESMI).
- Jam pulang per hari: **Senin 14.40** (13 Nov 10.28), **Selasa–Kamis 14.00**
  (13 Nov 10.28), **Jumat 11.00** (13 Nov 10.29). **Sabtu dan Minggu libur**
  (tidak masuk — dikonfirmasi Mas Budi 13 Nov 19.01 WIB).
- Mode Pulang hanya bisa di-scan mulai jam pulang hari itu.
- Aturan dapat diubah di halaman **Kartu & QR** (khusus super admin, PIN 112233) dan
  tersimpan di Firestore `config/jadwal` + cache lokal, sehingga semua HP guru
  mengikuti aturan yang sama. Perubahan hanya berlaku untuk scan sesudah
  perubahan; status Terlambat/Tepat dicatat bersama tiap scan Datang.

## Cara kerja offline + multi-guru

- **Scan offline:** kamera + pembaca QR bekerja di HP; tiap catatan langsung
  ditulis ke IndexedDB (tahan tutup halaman/Chrome/HP dimatikan) dan diantrekan.
  Begitu online, antrean terkirim otomatis ke Firestore. Lencana teks
  "… belum terkirim" / "Semua catatan sudah terkirim" selalu terlihat (teks,
  bukan hanya warna).
- **Buka halaman offline:** service worker menyimpan app shell (halaman, roster,
  pustaka) setelah sekali dimuat dengan internet.
- **Banyak guru bersamaan:** satu dokumen Firestore per siswa per hari
  (`YYYY-MM-DD_NIS`); tiap mode menulis medannya sendiri dengan merge, jadi
  tidak pernah ada baris ganda walau dua guru memindai bersamaan atau antrean
  offline tersinkron belakangan. Rekap Guru membaca dari Firestore (listener
  live bulan berjalan + ambil rentang untuk tanggal/bulan lain). Sebelum
  mencatat, aplikasi memeriksa Firestore bila online — bila guru lain sudah
  mencatat mode itu hari ini, scan ditolak dengan pesan "sudah tercatat".
- **Orang tua** membaca dari data yang sama (Firestore bila online, cache lokal
  bila offline); hanya data anak yang dicari.

## Verifikasi di sandbox (13 Nov 2026)

- **Sintaks:** `node --check` lulus untuk `roster.js`, `sw.js`, `qrcode.min.js`,
  `jsQR.min.js`, kedua file Firebase SDK, dan skrip utama `index.html`.
- **Harness logika** (`/tmp/harness.js`, node + vm dengan stub DOM, offline):
  **42/42 uji lulus**, antara lain: roster 402 siswa; isi QR 4572 persis kartu
  fisik; jam pulang Senin 14.40 / Selasa 14.00 / Jumat 11.00 / Sabtu null /
  Minggu null; tanggal lalu tanpa catatan mengembalikan null (tanpa fabrikasi
  alpa); scan Datang tercatat + status terlambat disimpan bersama scan; scan
  Datang/Sholat ganda ditolak; gate Pulang menolak scan sebelum jam pulang hari
  itu; Berhalangan setelah Sholat ditolak; QR NIS tidak dikenal tidak tercatat;
  tandai Sakit/Izin lalu gugur karena datang; batalkan Izin menghapus catatan
  kosong; scan masuk antrean offline dan tersimpan persisten (IndexedDB +
  fallback localStorage); muat ulang mengembalikan catatan; dokumen jarak jauh
  diterapkan tetapi medan yang masih tertunda tidak ditimpa; gabungJadwal
  sebagian + simpanJadwal mengubah aturan tanpa mengubah hari lain.
- **Perbaikan dari hasil verifikasi:** penutup IIFE pilihan minggu yang hilang
  (kesalahan sintaks) diperbaiki; keterangan sholat harian kini memakai jam
  pulang tanggal itu, bukan jam pulang hari ini; dua sebutan "contoh" terakhir
  (judul Kartu & komentar DATA) dihapus. Build dapat dibuat ulang persis dengan
  `python3 /tmp/transform.py` (terverifikasi identik dengan `diff`).
- **Catatan:** satu-satunya acuan luar yang tersisa adalah `preconnect`
  fonts.gstatic.com (font jatuh kembali offline, tidak menghambat muat).
- **Belum terverifikasi** (butuh HP sungguhan — lihat poin 4 di bawah):
  kamera + jsQR di perangkat, service worker + IndexedDB di Chrome Android,
  sinkronisasi Firestore antar-HP, dan tampilan nyata.
- **Finalisasi 13 Nov 19.01 WIB:** PIN guru dikonfirmasi tetap `1234`; Sabtu
  diubah menjadi libur (`jamPulangFor` mengembalikan null untuk Sabtu, input
  Pulang Sabtu dihapus dari Pengaturan Jadwal, teks UI diperbarui, `gabungJadwal`
  mengabaikan `jamPulang[6]`/`sabtuPlaceholder` dari dokumen lama);
  `prototype-orig.html` dihapus dari staging (dapat dipulihkan dari trash
  30 hari). Verifikasi ulang: `node --check` semua file JS lulus; smoke test
  jadwal (Senin 14.40 / Jumat 11.00 / Sabtu null + bukan hari sekolah /
  Minggu null) lulus.

## Yang masih kurang sebelum terbit

1. **Aturan Firestore** (`firestore-rules.txt`) ditempel & diterbitkan Mas Budi
   di proyek `database-mpi-spendaka`. Sebelum itu aplikasi jalan lokal penuh,
   tetapi catatan belum tersinkron antar-HP.
2. **PIN guru** tetap `1234` untuk semua (dikonfirmasi Mas Budi 13 Nov 19.01 WIB).
3. **Sabtu libur** — tidak masuk (dikonfirmasi Mas Budi 13 Nov 19.01 WIB); tidak ada jam pulang Sabtu di kode maupun di Pengaturan.
4. **Uji HP sungguhan:** buka offline (mode pesawat setelah sekali muat),
   scan beberapa kartu, tutup halaman, nyalakan internet, periksa rekap di HP
   guru lain; uji dua HP memindai siswa yang sama bersamaan; uji ubah jadwal
   di halaman Kartu & QR (PIN super admin) lalu periksa HP lain.
5. Keputusan penerbitan: repo **BARU** (diputuskan Mas Budi 13 Nov 19.01 WIB);
   nama yang diusulkan `absensi-siswa-qr` — menunggu Mas Budi membuatnya sendiri
   (publik), seperti pola repo sebelumnya.

## Yang TIDAK berubah dari prototipe

4 mode scan terpisah, tolak scan ganda per mode, aturan Belum/Tidak Sholat,
penandaan Sakit/Izin wali kelas, halaman Orang Tua, Kartu & QR + unduh,
Rekap Harian/Mingguan/Bulanan + CSV, teks galat kamera yang benar
(Chrome > Setelan > Setelan situs > Kamera).

## Beranda + PIN (13 Nov 2026, setelah terbit pertama)
- Tampilan awal = beranda biru gaya contoh "Presensi Siswa" Mas Budi: logo
  sekolah (di-embed base64 di index.html, tetap tampil offline), 4 tombol besar
  hijau: Scan Absensi, Rekap Guru, Orang Tua, Kartu & QR. Tiap halaman punya
  tombol "← Beranda". Tidak ada spanduk sholat di beranda.
- PIN guru **1234** → Scan Absensi dan Rekap Guru; PIN super admin **112233**
  → KHUSUS Kartu & QR; Orang Tua tanpa PIN. Masing-masing cukup sekali per sesi
  (sessionStorage); gerbang PIN Rekap Guru yang lama memakai sistem yang sama.

- Pengaturan Jadwal PINDAH dari Rekap Guru ke halaman Kartu & QR (13 Nov 21.44 WIB): hanya super admin (PIN 112233) yang dapat mengubah jadwal; Rekap Guru (PIN 1234) tidak lagi berisi tab Pengaturan; penandaan Sakit/Izin wali kelas tetap di Rekap Guru.

## Tampilan Scan disederhanakan (13 Nov 2026, 22.20 WIB)
- Setelah masuk (PIN 1234), halaman Scan hanya menampilkan: chip tanggal/jam,
  4 kartu mode, tombol "📷 Nyalakan Kamera", dan 4 penghitung — ditambah satu
  tombol "📋 CARA CADANGAN".
- Daftar kartu nama siswa + ketik NIS (cara manual) pindah ke balik tombol
  CARA CADANGAN; isinya tidak berubah (judul dan lencana mengikuti mode yang
  terpilih), hanya tersembunyi sampai tombol ditekan, ditekan lagi / tombol
  "✕ Tutup Cara Cadangan" untuk menyembunyikan lagi. Status sinkron dan
  "Aktivitas Scan Terakhir" disembunyikan dari halaman Scan (status sinkron
  tetap terlihat di halaman Rekap Guru).

## Navigasi disederhanakan + note Orang Tua dihapus (14 Nov 2026, 12.29 & 12.31 WIB)
- Baris 4 tombol menu (nav.tabs) tidak pernah tampil lagi: di beranda navigasi
  lewat 4 tombol besar hijau; di tiap menu (Scan, Rekap Guru, Orang Tua,
  Kartu & QR) hanya ada tombol "← Beranda" di atas. Nav tetap ada di DOM
  karena mesin pindah halaman JS memakai klik tombolnya (goView).
- Saat isian PIN tampil di beranda, keempat tombol besar disembunyikan
  (class pin-aktif); tombol Batal mengembalikannya. PIN tetap: guru 1234
  (Scan & Rekap), super admin 112233 (Kartu & QR), Orang Tua tanpa PIN.
- Halaman Orang Tua (koreksi 14 Nov 12.34 WIB, menggantikan hapus kotak): kotak
  keterangan emas TIDAK dihapus — ISINYA DIGANTI menjadi judul "Pantau
  Kehadiran Anak" + paragraf pengantar di dalam kotak; teks lama di dalam
  kotak ("Data yang tampil di sini adalah hasil scan QR ...") dihapus. Susunan:
  tombol "← Beranda", kotak emas (judul + paragraf), lalu "Cari Data Anak".
  Isian NIS + Cari, pilih nama, Lihat Data, dan semua fungsi tidak berubah.
- Verifikasi: node --check lulus; harness navigasi /tmp/harness-nav.js 36/36 lulus.

## Judul & paragraf header dihapus (14 Nov 2026, 12.43 WIB)
- Judul besar "Absensi Siswa dengan QR Kartu Siswa" dan paragraf "Satu QR yang sama untuk tiga absensi ..." di header aplikasi dihapus (beranda sudah jelas ini aplikasi Absensi). Yang tetap: baris "SMP NEGERI 2 KEBONAGUNG · KABUPATEN PACITAN", chip tanggal/jam, chip jadwal, dan semua isi/fungsi lain. Judul dokumen <title> "Aplikasi Absensi Siswa QR" tidak berubah.
- Verifikasi: node --check lulus; harness navigasi /tmp/harness-nav.js 36/36 lulus; pemeriksaan statis header 10/10 lulus.
