# FinTrack: Personal Finance Manager on Internet Computer

## Overview

FinTrack adalah aplikasi terdesentralisasi (dApp) yang dibangun di atas Internet Computer (ICP) untuk membantu pengguna mengelola keuangan pribadi mereka secara aman dan efisien. Aplikasi ini memungkinkan pengguna untuk mencatat transaksi (pemasukan dan pengeluaran), melacak saldo, melihat laporan keuangan dalam bentuk USD atau IDR, dan mendapatkan saran keuangan berbasis AI. Proyek ini dikembangkan untuk ICP Hackathon, memanfaatkan teknologi blockchain untuk menyimpan data secara terdesentralisasi dan memberikan pengalaman pengguna yang intuitif. Proyek ini memanfaatkan fitur Http Outcalls, Penyimpanan On-Chain, Internet Identity, dan LLM Canister dari ICP.

## Features

- **Pencatatan Transaksi**: Tambahkan pemasukan atau pengeluaran dengan detail seperti jumlah, deskripsi, kategori, dan tanggal melalui antarmuka modal.
- **Manajemen Saldo**: Lihat saldo bulanan atau total, pemasukan, dan pengeluaran dalam IDR atau USD secara real-time.
- **Laporan Keuangan**: Filter transaksi berdasarkan jenis (semua, pemasukan, pengeluaran), kategori, dan bulan untuk analisis mendalam.
- **Konversi Mata Uang**: Dapatkan kurs USD ke IDR secara langsung dari API eksternal untuk fleksibilitas mata uang.
- **Saran AI**: Terima saran keuangan berbasis AI menggunakan model Llama3_1_8B berdasarkan data pemasukan, pengeluaran, dan saldo.
- **Autentikasi Aman**: Login menggunakan Internet Identity untuk keamanan dan privasi pengguna.
- **Desain Responsif**: Antarmuka pengguna yang ramah dan responsif untuk desktop dan perangkat mobile.

## Tech Stack

### Backend
- **Rust**: Bahasa pemrograman untuk canister di Internet Computer.
- **Candid**: Interface description language untuk komunikasi antara frontend dan backend.
- **Internet Computer SDK**: Menggunakan `ic_cdk` untuk fungsi canister dan `ic_stable_structures` untuk penyimpanan data stabil.
- **External API**: Integrasi dengan exchangerate-api.com untuk kurs USD/IDR melalui HTTP outcall.

### Frontend
- **React**: Library JavaScript untuk membangun antarmuka pengguna yang dinamis.
- **Tailwind CSS**: Framework CSS untuk desain modern dan responsif.
- **Internet Identity**: Autentikasi terdesentralisasi melalui `@dfinity/auth-client`.

## Project Structure
```
fintrack/
├── src/
│   ├── backend/
│   │   └── lib.rs              # Logika backend canister
│   ├── frontend/
│   │   ├── AddTransaction.jsx  # Komponen untuk menambah transaksi
│   │   ├── AiAdvice.jsx        # Komponen untuk saran AI
│   │   ├── App.jsx             # Komponen utama aplikasi
│   │   ├── AuthContext.jsx     # Konteks autentikasi dan state global
│   │   ├── Main.jsx            # Entry point aplikasi
│   │   ├── Modal.jsx           # Komponen modal reusable
│   │   ├── Navbar.jsx          # Komponen navigasi
│   │   ├── ReportFinancial.jsx # Komponen laporan keuangan
│   │   └── utils.jsx           # Utilitas untuk komunikasi dengan backend
├── dfx.json                    # Konfigurasi proyek ICP
├── index.css                    # Styling global
└── README.md                    # Dokumentasi proyek
```

## How It Works

1. **Autentikasi**: Pengguna login menggunakan Internet Identity melalui Navbar, menghasilkan Principal unik sebagai kunci data.
2. **Penyimpanan Data**: Transaksi disimpan di `StableBTreeMap` pada canister backend (`lib.rs`), memastikan data tetap aman.
3. **Manajemen Transaksi**: Pengguna menambahkan transaksi melalui `AddTransaction.jsx`, yang memanggil fungsi seperti `add_transaction` di backend.
4. **Laporan dan Analisis**: Backend menyediakan fungsi seperti `get_filtered_transactions`, `get_balance`, `get_income`, dan `get_expense` untuk menghitung dan menyaring data, ditampilkan di `ReportFinancial.jsx`.
5. **Konversi Mata Uang**: Fungsi `get_usd_to_idr_conversion_rate` mengambil kurs real-time, digunakan di frontend untuk konversi IDR/USD.
6. **Saran AI**: Fungsi `get_ai_advice` mengintegrasikan model AI untuk memberikan saran, ditampilkan melalui `AiAdvice.jsx`.
7. **Frontend**: Antarmuka di `App.jsx` menampilkan saldo dan laporan, dengan state global dikelola oleh `AuthContext.jsx`.

## Installation and Setup

> **Note** Proyek ini menggunakan template LLM Chatbot yang disediakan di editor icp.ninja. Oleh karena itu, dalam **dfx.json** terdapat canister **llm**. Namun, dalam kode Rust, proyek ini menggunakan pustaka **ic_llm**. Jika ingin melakukan deploy di jaringan lokal, perlu menambahkan canister **internet_identity** untuk keperluan pengujian proyek secara lokal. Untuk fitur AI Advice jika dijalankan 
   di local tidak berfungsi dikarenakan pustaka ic_llm hanya berada di jaringan ic mainnet

### Prerequisites
- DFX SDK (versi terbaru)
- Node.js (versi 16 atau lebih tinggi)
- Git

### Steps
1. **Clone Repository**
   ```bash
   git clone https://github.com/demigohu/FinTrack.git
   cd fintrack
   ```
2. **Add Dependencies In Cargo.toml**
   ```bash
    candid = "0.10.13"
    ic-cdk = "0.17.1"
    ic-llm = "0.3.0"
    ic-cdk-macros = "0.17.1"
    serde = { version = "1.0", features = ["derive"] }
    serde_json = "1.0" 
    ic-stable-structures = "0.6"
   ```

3. **Add internet_identity on dfx.json if u want build locally**
   ```bash
    "internet_identity": {
      "candid": "https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity.did",
      "frontend": {},
      "remote": {
        "id": {
          "ic": "rdmx6-jaaaa-aaaaa-aaadq-cai"
        }
      },
      "type": "custom",
      "wasm": "https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_dev.wasm.gz"
    }
   ```
4. **Start Local Internet Computer**
   ```bash
   dfx start --background
   ```
5. **Generate Declarations**
   ```bash
   dfx canister create backend
   dfx canister create frontend
   dfx canister create internet_identity
   dfx canister create llm
   ```
6. **Deploy Canister Locally**
   ```bash
   dfx deploy --network local
   ```
6. **Deploy Canister IC Mainnet**
   ```bash
   dfx deploy --network ic
   ```
7. **Access Application**
   Buka browser dan kunjungi URL canister lokal yang ditampilkan setelah deploy.

## Usage

- **Login**: Klik "Sign In" di Navbar untuk autentikasi dengan Internet Identity.
- **Tambah Transaksi**: Klik "Record Transaction" di `App.jsx`, isi form di `AddTransaction.jsx` (tipe, jumlah, deskripsi, kategori, tanggal), lalu simpan.
- **Lihat Laporan**: Gunakan filter di `ReportFinancial.jsx` untuk melihat transaksi berdasarkan bulan atau tipe, atau klik "View All" untuk detail lengkap.
- **Konversi Mata Uang**: Pilih IDR atau USD dari dropdown di `App.jsx` untuk melihat nilai dalam mata uang berbeda.
- **Dapatkan Saran AI**: Klik "AI Advice" di `App.jsx` untuk melihat rekomendasi keuangan di `AiAdvice.jsx`.

## Future Improvements

- Menambahkan fitur kategori kustom untuk transaksi.
- Integrasi grafik interaktif untuk visualisasi data keuangan.
- Mendukung lebih banyak mata uang dan API kurs alternatif.
- Optimasi performa untuk penyimpanan dan pengambilan transaksi dalam jumlah besar.
- Fitur ekspor laporan ke PDF atau CSV.

