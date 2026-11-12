# Daftar Tugas Kuliah — Pengembangan Aplikasi Web (Tugas 6)

Aplikasi web pengelola daftar tugas perkuliahan mahasiswa yang dibangun menggunakan **Vite**, **TypeScript (`vanilla-ts`)**, **npm**, dan dikelola menggunakan alur kerja **Git** multi-branch. Proyek ini dibuat untuk memenuhi **Tugas 6 Mata Kuliah Pengembangan Aplikasi Web (PAW)**.

---

## Fitur Aplikasi

1. **Menampilkan Daftar Tugas Kuliah**: Menampilkan kartu tugas lengkap dengan nama mata kuliah, status penyelesaian, serta tanggal deadline yang diformat menggunakan `dayjs` beserta keterangan sisa hari/keterlambatan.
2. **Menambah Tugas Baru**: Formulir validasi untuk menambahkan tugas baru berdasarkan **Judul Tugas**, **Mata Kuliah**, dan **Deadline**.
3. **Mengedit & Menghapus Tugas**: Mengubah data tugas yang sudah ada (memanfaatkan fungsi generic `cariById<T>`) dan menghapus tugas dari daftar.
4. **Toggle Status Tugas**: Mengubah status tugas antara `"Belum Selesai"` dan `"Selesai"` secara instan beserta filter tampilan (`Semua`, `Belum Selesai`, `Selesai`).
5. **Pesan Kosong & Ringkasan Progres**: Menampilkan *empty state* ketika belum ada tugas, serta bar ringkasan jumlah tugas selesai (misal: `2 dari 5 tugas selesai`) lengkap dengan persentase progres.
6. **Penyimpanan Persisten (`localStorage`)**: Seluruh data tugas tersimpan otomatis di browser menggunakan `localStorage` sehingga tidak hilang saat halaman di-refresh.
7. **Tampilan Rapi & Responsif (Mobile-First)**: Menggunakan CSS murni (tanpa library UI eksternal) dengan tata letak 1 kolom di layar ponsel dan 2 kolom di layar tablet/desktop.
8. **Halaman "Tentang Proyek"**: Satu halaman interaktif (tanpa router eksternal) yang merangkum materi Git & GitHub, npm, Semantic Versioning, TypeScript, Vite, Environment Variables, tabel Compiler/Transpiler/Bundler, serta jawaban pertanyaan tugas.

---

## Teknologi yang Digunakan

- **Build Tool & Dev Server**: [Vite](https://vite.dev/) (`^6.0.5`) — template `vanilla-ts` (tanpa framework UI seperti React/Vue)
- **Bahasa Pemrograman**: [TypeScript](https://www.typescriptlang.org/) (`~5.6.2`)
- **Package Manager**: npm (dengan lockfile `package-lock.json`)
- **Library Eksternal (`dependencies`)**: [dayjs](https://day.js.org/) (`^1.11.23`) untuk memformat tanggal deadline dan menghitung selisih hari
- **Styling**: CSS3 Murni (CSS Variables, Flexbox, CSS Grid, Mobile-First Media Queries)
- **Version Control**: Git (lokal)

---

## Cara Menjalankan Proyek

Pastikan **Node.js** dan **npm** sudah terpasang di komputer Anda.

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Menjalankan Server Development (HMR)
```bash
npm run dev
```
Buka URL lokal yang ditampilkan di terminal (umumnya `http://localhost:5173`).

### 3. Memeriksa Tipe Data TypeScript (`typecheck`)
```bash
npm run typecheck
```
Menjalankan `tsc --noEmit` untuk memastikan seluruh kode TypeScript bebas dari error tipe tanpa menghasilkan file JavaScript.

### 4. Membangun Aplikasi untuk Produksi (`build`)
```bash
npm run build
```
Menjalankan pemeriksaan tipe `tsc` lalu membundel aset produksi yang teroptimasi ke dalam folder `dist/` menggunakan Vite (Rollup).

### 5. Menjalankan Pratinjau Hasil Build (`preview`)
```bash
npm run preview
```
Menjalankan server lokal untuk menguji hasil build di dalam folder `dist/`.

---

## Penjelasan Environment Variables (`.env` vs `.env.example`)

Proyek ini menggunakan fitur Environment Variables dari Vite yang diakses melalui `import.meta.env` dengan deklarasi tipe pada `src/vite-env.d.ts`:

```dotenv
VITE_APP_NAME=Daftar Tugas Kuliah
VITE_APP_VERSION=1.0.0
```

- **`.env`**: Berisi konfigurasi environment aktual yang dipakai pada mesin lokal saat menjalankan aplikasi. File `.env` **diabaikan oleh Git** (tercantum di `.gitignore`) agar konfigurasi spesifik mesin atau kredensial sensitif tidak pernah bocor ke repository.
- **`.env.example`**: Berisi template/contoh nama variabel beserta nilai contoh non-rahasia. File ini **wajib ikut di-commit ke Git** (`!.env.example`) sebagai panduan bagi developer lain agar tahu variabel apa saja yang perlu dibuat saat menyalin proyek (`cp .env.example .env`).
- **Catatan Keamanan Penting**: Semua variabel yang diawali dengan prefix `VITE_` akan disisipkan langsung ke dalam bundel kode JavaScript di browser. Oleh karena itu, **jangan pernah** menaruh password, token rahasia, atau `VITE_SECRET_KEY` di dalam file `.env` frontend.

---

## Struktur Folder

```text
daftar-tugas-kuliah/
├── .env                  # Variabel environment lokal (TIDAK di-commit ke Git)
├── .env.example          # Contoh variabel environment non-rahasia (di-commit ke Git)
├── .gitignore            # Daftar file/folder yang diabaikan Git (node_modules, dist, .env)
├── index.html            # Kerangka utama HTML aplikasi
├── package.json          # Daftar scripts, dependencies (dayjs), dan devDependencies (vite, typescript)
├── package-lock.json     # Pengunci versi pohon dependensi secara eksak
├── tsconfig.json         # Konfigurasi compiler TypeScript (strict mode)
├── vite.config.ts        # Konfigurasi Vite (base: '/')
├── README.md             # Dokumentasi proyek
└── src/
    ├── vite-env.d.ts     # Deklarasi tipe TypeScript untuk import.meta.env
    ├── types.ts          # Definisi tipe: Primitive, Array (Task[]), Interface (Task), Union (Status)
    ├── utils.ts          # Fungsi generic cariById<T>, helper localStorage, dan format tanggal dayjs
    ├── style.css         # Desain antarmuka responsif mobile-first
    └── main.ts           # Logika utama DOM, CRUD tugas, dan halaman Tentang Proyek
```

---

## Alur Git yang Dipakai

Pengembangan proyek ini mengikuti alur kerja cabang fitur (*feature branching*) dan *Conventional Commits* (`chore:`, `feat:`, `style:`, `merge:`, `docs:`):

1. **Inisialisasi `main`**:
   - Membuat repository Git pada branch `main` dan melakukan commit awal berisi konfigurasi dasar proyek Vite, `.gitignore`, `.env.example`, dan `package-lock.json`.
2. **Branch `feature/add-task`**:
   - Dibuat dari `main` untuk mengembangkan fondasi aplikasi dalam 3 commit terpisah:
     1. Commit tipe data TypeScript (`src/types.ts`) dan fungsi utilitas generic (`src/utils.ts`).
     2. Commit formulir tambah tugas dan tampilan daftar tugas (`index.html`, `src/main.ts`).
     3. Commit desain responsif mobile-first (`src/style.css`).
   - Digabungkan kembali ke `main` menggunakan `git merge --no-ff feature/add-task`.
3. **Branch `feature/edit-delete`**:
   - Dibuat dari `main` untuk menambahkan fitur manipulasi tugas dalam 2 commit:
     1. Commit fitur hapus tugas dan toggle status selesai/belum selesai.
     2. Commit fitur edit tugas menggunakan fungsi generic `cariById`.
   - Digabungkan kembali ke `main` menggunakan `git merge --no-ff feature/edit-delete`.
4. **Simulasi & Penyelesaian Merge Conflict (`feature/page-title-a` & `feature/page-title-b`)**:
   - Dua branch dibuat dari titik `main` yang sama dan keduanya mengubah baris `<title>` pada `index.html` dengan teks yang berbeda.
   - Branch `feature/page-title-a` digabungkan ke `main` terlebih dahulu (berhasil tanpa konflik).
   - Saat `feature/page-title-b` digabungkan ke `main`, Git mendeteksi **Merge Conflict** pada baris `<title>` di `index.html`.
   - Konflik diselesaikan secara manual dengan menggabungkan kedua teks judul, menghapus penanda `<<<<<<<`, `=======`, dan `>>>>>>>`, lalu disimpan dengan commit `"merge: resolve title conflict"`.
5. **Dokumentasi Akhir**:
   - Menambahkan materi edukasi lengkap pada tab **Tentang Proyek** dan dokumentasi `README.md` di branch `main`.
