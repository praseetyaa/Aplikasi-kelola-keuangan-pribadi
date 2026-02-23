# 💰 DuitKu - Aplikasi Kelola Keuangan Pribadi

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0-blue?style=for-the-badge&logo=javascript" alt="Version">
  <img src="https://img.shields.io/badge/Stack-PHP+MySQL+JS-green?style=for-the-badge" alt="Stack">
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" alt="License">
</p>

> Aplikasi pengelolaan keuangan pribadi yang modern, responsif, dan mudah digunakan. Kelola pemasukan, pengeluaran, dompet, dan target tabunganmu dalam satu aplikasi.

---

## ✨ Fitur Utama

### 🏠 Dashboard
- **Ringkasan Keuangan** - Tampilan cepat saldo total, total pemasukan, dan pengeluaran bulan ini
- **Grafik Tren** - Visualisasi keuangan 6 bulan terakhir
- **Kategori Pengeluaran** - Diagram pie untuk melihat proporsi pengeluaran per kategori
- **Widget Pintas** - Akses cepat ke dompet aktif dan goal planning

### 💳 Transaksi
- **Catat Pemasukan & Pengeluaran** - Input transaksi dengan jumlah, deskripsi, kategori, dan tanggal
- **Filter Canggih** - Filter berdasarkan tipe, kategori, bulan, dan pencarian
- **Infinite Scroll** --load lebih banyak transaksi dengan smooth scrolling
- **Edit & Hapus** - Modal konfirmasi untuk keamanan penghapusan

### 🏷️ Kategori
- **Kelola Kategori** - Tambah, edit, dan hapus kategori pengeluaran & pemasukan
- **Kustomisasi** - Pilih ikon dan warna favorit untuk setiap kategori
- **Pemisahan Tipe** - Tab terpisah untuk kategori pengeluaran dan pemasukan

### 👛 Dompet
- **Multi-Dompet** - Kelola rekening bank, e-wallet, dan kartu kredit
- **Saldo Otomatis** - Total saldo semua dompet dihitung otomatis
- **Kartu Visual** - Tampilan kartu yang menarik dengan gradient

### 🎯 Planning & Wishlist
- **Target Tabungan** - Buat goal menabung dengan target nominal
- **Deadline** - Atur tenggat waktu untuk setiap goal
- **Progress Tracking** - Visualisasi progress pencapaian goal
- **Update Tabungan** - Catat setoran setiap bulan
- **Riwayat Transaksi** - Lihat histori setoran per goal
- **Kalkulator Real-time** - Hitung estimasi waktu selesai berdasarkan nominal setor

### 📊 Laporan
- **Laporan Bulanan/Tahunan** - Ringkasan keuangan periode tertentu
- **Analisis Pemasukan** - Grafik per kategori pemasukan
- **Analisis Pengeluaran** - Grafik per kategori pengeluaran
- **Tren Keuangan** - Visualisasi perubahan finansial dari waktu ke waktu

### 🔔 Notifikasi
- **Pengingat Tabungan** - Notifikasi untuk goal yang belum diupdate bulanan
- **Badge Counter** - Jumlah notifikasi yang belum dibaca
- **Halaman Notifikasi** - Daftar lengkap semua pengingat

### ⚙️ Pengaturan
- **Kustomisasi Branding** - Ubah nama app, tagline, dan logo
- **Tema Warna** - Sesuaikan warna tema aplikasi
- **Preferensi** - Pengaturan tambahan untuk pengalaman pengguna

---

## 🛠️ Teknologi

| Komponen | Teknologi |
|----------|-----------|
| Backend | PHP (Native) |
| Database | MySQL |
| Frontend | Vanilla JavaScript |
| Styling | TailwindCSS |
| Charts | Chart.js |

---

## 📋 Requirements

- PHP 7.4+
- MySQL 5.7+
- Web Server (Apache/Nginx)
- Browser Modern (Chrome, Firefox, Safari, Edge)

---

## 🚀 Cara Install

1. **Clone Repository**
   ```bash
   git clone <repo-url>
   ```

2. **Setup Database**
   - Import file `db.sql` ke MySQL
   - Atau biarkan auto-migration membuat tabel otomatis

3. **Konfigurasi Database**
   - Edit file `api/db.php`
   - Sesuaikan kredensial database

4. **Jalankan Aplikasi**
   - Buka browser
   - Akses `http://localhostAplikasi-kelola-keuangan-pribadi/`
   - Register akun baru

---

## 📱 Tampilan

Aplikasi ini dirancang dengan:
- 🌙 **Dark Mode** - Tampilan eye-friendly
- 📱 **Responsif** - Tampilan optimal di desktop dan mobile
- ✨ **Animasi Halus** - Transisi yang smooth
- 🎨 **UI Modern** - Tampilan terkini dengan glassmorphism

---

## 📄 Lisensi

MIT License - Bebas digunakan dan dimodifikasi

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk keuangan yang lebih baik</p>
  <p><strong>DuitKu</strong> - Kelola Keuangan Mu</p>
</div>
