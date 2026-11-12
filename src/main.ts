import './style.css';
import type { Status, Task } from './types';
import {
  cariById,
  escapeHtml,
  formatDeadline,
  hitungRingkasanTugas,
  muatTugasDariStorage,
  simpanTugasKeStorage,
} from './utils';

// Membaca konfigurasi dari environment variables menggunakan import.meta.env
// Tipe primitif: string
const namaAplikasi: string = import.meta.env.VITE_APP_NAME || 'Daftar Tugas Kuliah';
const versiAplikasi: string = import.meta.env.VITE_APP_VERSION || '1.0.0';

// State utama aplikasi menggunakan tipe Array: Task[]
let daftarTugas: Task[] = muatTugasDariStorage();
let filterAktif: 'Semua' | Status = 'Semua';
let idSedangDiedit: number | null = null;

// Mengambil referensi elemen DOM
const elAppName = document.getElementById('env-app-name');
const elAppVersion = document.getElementById('env-app-version');
const elSummary = document.getElementById('summary-container');
const elTaskList = document.getElementById('task-list-container');
const elForm = document.getElementById('task-form') as HTMLFormElement | null;
const elFormHeading = document.getElementById('form-heading');
const elInputId = document.getElementById('input-id') as HTMLInputElement | null;
const elInputJudul = document.getElementById('input-judul') as HTMLInputElement | null;
const elInputMatkul = document.getElementById('input-matkul') as HTMLInputElement | null;
const elInputDeadline = document.getElementById('input-deadline') as HTMLInputElement | null;
const elBtnSubmit = document.getElementById('btn-submit') as HTMLButtonElement | null;
const elBtnCancelEdit = document.getElementById('btn-cancel-edit') as HTMLButtonElement | null;
const elFormError = document.getElementById('form-error');
const elTabBtnTugas = document.getElementById('tab-btn-tugas');
const elTabBtnTentang = document.getElementById('tab-btn-tentang');
const elViewTugas = document.getElementById('view-tugas');
const elViewTentang = document.getElementById('view-tentang');
const elAboutContent = document.getElementById('about-content');

// Menampilkan nama dan versi aplikasi di header
if (elAppName) elAppName.textContent = namaAplikasi;
if (elAppVersion) elAppVersion.textContent = versiAplikasi;

// Merender ringkasan jumlah tugas selesai dan total tugas
function renderRingkasan(): void {
  if (!elSummary) return;

  const ringkasan = hitungRingkasanTugas(daftarTugas);
  const persentase: number =
    ringkasan.totalTugas > 0 ? Math.round((ringkasan.jumlahSelesai / ringkasan.totalTugas) * 100) : 0;

  elSummary.innerHTML = `
    <div class="summary-stats">
      <div class="stat-item">
        <span class="stat-label">Total Tugas</span>
        <strong class="stat-value">${ringkasan.totalTugas}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">Belum Selesai</span>
        <strong class="stat-value stat-pending">${ringkasan.jumlahBelum}</strong>
      </div>
      <div class="stat-item">
        <span class="stat-label">Selesai</span>
        <strong class="stat-value stat-done">${ringkasan.jumlahSelesai}</strong>
      </div>
      <div class="stat-progress">
        <div class="progress-text">
          <span>Ringkasan: <strong>${ringkasan.jumlahSelesai} dari ${ringkasan.totalTugas}</strong> tugas selesai</span>
          <span>${persentase}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${persentase}%"></div>
        </div>
      </div>
    </div>
  `;
}

// Merender daftar tugas kuliah atau pesan kosong jika belum ada tugas
function renderDaftarTugas(): void {
  if (!elTaskList) return;

  // Pesan kosong ketika belum ada tugas sama sekali
  if (daftarTugas.length === 0) {
    elTaskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Belum Ada Tugas Kuliah</h3>
        <p>Daftar tugas masih kosong. Silakan tambahkan tugas baru melalui formulir untuk mulai mencatat jadwal pengumpulan.</p>
      </div>
    `;
    return;
  }

  const tugasTerfilter: Task[] =
    filterAktif === 'Semua' ? daftarTugas : daftarTugas.filter((t) => t.status === filterAktif);

  if (tugasTerfilter.length === 0) {
    elTaskList.innerHTML = `
      <div class="empty-state">
        <p>Tidak ada tugas dengan status <strong>"${filterAktif}"</strong>.</p>
      </div>
    `;
    return;
  }

  elTaskList.innerHTML = tugasTerfilter
    .map((tugas) => {
      const infoDeadline = formatDeadline(tugas.deadline);
      const sudahSelesai: boolean = tugas.status === 'Selesai';
      const kelasStatus: string = sudahSelesai ? 'status-done' : 'status-pending';
      const kelasMendesak: string = !sudahSelesai && infoDeadline.mendesak ? 'deadline-urgent' : '';
      const labelToggle: string = sudahSelesai ? '↩ Tandai Belum' : '✓ Tandai Selesai';

      return `
        <article class="task-card ${sudahSelesai ? 'task-completed' : ''}" data-id="${tugas.id}">
          <div class="task-main">
            <div class="task-badges">
              <span class="badge badge-course">${escapeHtml(tugas.mataKuliah)}</span>
              <span class="badge ${kelasStatus}">${tugas.status}</span>
            </div>
            <h3 class="task-title">${escapeHtml(tugas.judul)}</h3>
            <p class="task-deadline ${kelasMendesak}">
              <span>📅 Deadline: <strong>${infoDeadline.tanggalFormatted}</strong></span>
              <span class="deadline-note">(${sudahSelesai ? 'Tuntas' : infoDeadline.keterangan})</span>
            </p>
          </div>
          <div class="task-actions">
            <button type="button" class="btn btn-sm btn-toggle" data-action="toggle" data-id="${tugas.id}">
              ${labelToggle}
            </button>
            <button type="button" class="btn btn-sm btn-edit" data-action="edit" data-id="${tugas.id}">
              Edit
            </button>
            <button type="button" class="btn btn-sm btn-delete" data-action="delete" data-id="${tugas.id}">
              Hapus
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

// Merender halaman "Tentang Proyek" (satu halaman tanpa router) dengan bahasa mahasiswa
function renderTentangProyek(): void {
  if (!elAboutContent) return;

  elAboutContent.innerHTML = `
    <div class="about-wrapper">
      <div class="about-hero">
        <h2>Tentang Proyek &amp; Rangkuman Materi Kuliah</h2>
        <p>
          Halaman ini merangkum konsep inti yang dipelajari dan diterapkan langsung pada proyek
          <strong>${escapeHtml(namaAplikasi)} (v${escapeHtml(versiAplikasi)})</strong> untuk Tugas 6
          Pengembangan Aplikasi Web: Git, npm, Semantic Versioning, TypeScript, Vite, dan Environment Variables.
        </p>
      </div>

      <div class="about-grid">
        <!-- 1. Git & GitHub -->
        <article class="card doc-card">
          <h3>1. Git &amp; GitHub</h3>
          <p>Git adalah sistem pengontrol versi lokal untuk mencatat riwayat kode, sedangkan GitHub adalah platform cloud untuk kolaborasi repository Git.</p>
          <ul class="doc-list">
            <li><strong>Commit</strong>: Menyimpan potret (*snapshot*) perubahan kode ke riwayat Git di komputer lokal.</li>
            <li><strong>Branch</strong>: Cabang kerja terpisah (misal <code>feature/add-task</code>) agar kita bisa ngoding fitur baru tanpa merusak kode stabil di <code>main</code>.</li>
            <li><strong>Merge</strong>: Menggabungkan hasil kerja dari satu branch kembali ke branch utama (<code>main</code>).</li>
            <li><strong>Conflict</strong>: Bentrokan saat menggabungkan dua branch yang mengubah baris kode yang sama pada file yang sama.</li>
            <li><strong>Pull / Push</strong>: <code>git push</code> mengirim commit lokal ke server remote (GitHub), sedangkan <code>git pull</code> menarik pembaruan dari remote ke komputer kita.</li>
            <li><strong>Pull Request (PR)</strong>: Permintaan resmi di GitHub untuk menggabungkan branch fitur ke branch utama agar kode bisa direview rekan setim terlebih dahulu.</li>
          </ul>
        </article>

        <!-- 2. npm (Node Package Manager) -->
        <article class="card doc-card">
          <h3>2. npm (Node Package Manager)</h3>
          <p>npm membantu kita mengelola paket library dan skrip otomatisasi di proyek JavaScript/TypeScript.</p>
          <ul class="doc-list">
            <li><strong>package.json</strong>: File manifest proyek yang mencatat nama aplikasi, daftar skrip, dan paket yang dibutuhkan.</li>
            <li><strong>npm scripts</strong>: Pintasan perintah terminal seperti <code>npm run dev</code>, <code>npm run build</code>, <code>npm run preview</code>, dan <code>npm run typecheck</code>.</li>
            <li><strong>dependencies vs devDependencies</strong>: <code>dependencies</code> (contoh: <code>dayjs</code>) dibutuhkan saat aplikasi berjalan di browser pengguna, sedangkan <code>devDependencies</code> (contoh: <code>typescript</code>, <code>vite</code>) hanya dibutuhkan saat proses pengembangan dan build.</li>
            <li><strong>package-lock.json</strong>: Mengunci versi eksak seluruh pohon dependensi agar setiap mahasiswa/developer yang menginstal proyek mendapat versi paket yang 100% identik.</li>
            <li><strong>npm ci</strong>: Perintah instalasi bersih khusus server CI/CD atau tim yang membaca langsung <code>package-lock.json</code> tanpa mengubahnya.</li>
            <li><strong>node_modules tidak di-commit</strong>: Folder ini berisi ribuan file berukuran besar dan bisa dibuat ulang kapan saja dengan <code>npm install</code>.</li>
          </ul>
        </article>

        <!-- 3. Semantic Versioning -->
        <article class="card doc-card">
          <h3>3. Semantic Versioning (SemVer)</h3>
          <p>Format penomoran versi standar <code>MAJOR.MINOR.PATCH</code> (contoh: <code>1.4.2</code>):</p>
          <ul class="doc-list">
            <li><strong>MAJOR</strong> (angka ke-1): Naik jika ada perubahan besar yang tidak kompatibel (*breaking changes*).</li>
            <li><strong>MINOR</strong> (angka ke-2): Naik jika ada penambahan fitur baru yang masih kompatibel ke belakang.</li>
            <li><strong>PATCH</strong> (angka ke-3): Naik jika hanya ada perbaikan bug (*bugfix*) atau keamanan.</li>
            <li><strong>Simbol Caret (<code>^1.11.23</code>)</strong>: Mengizinkan update otomatis untuk versi <code>MINOR</code> dan <code>PATCH</code> selama angka <code>MAJOR</code> tetap <code>1</code> (<code>&gt;=1.11.23 &lt;2.0.0</code>).</li>
            <li><strong>Simbol Tilde (<code>~5.6.2</code>)</strong>: Lebih ketat, hanya mengizinkan update pada level <code>PATCH</code> (<code>&gt;=5.6.2 &lt;5.7.0</code>).</li>
            <li><strong>Versi Tepat (<code>1.0.0</code>)</strong>: Tanpa simbol di depan, wajib menginstal persis versi tersebut.</li>
            <li><strong>Catatan Khusus Versi <code>0.x</code></strong>: Pada tahap pengembangan awal (<code>0.y.z</code>), API dianggap belum stabil. Perubahan pada angka kedua (<code>MINOR</code>) dapat berisi *breaking changes*, sehingga <code>^0.2.3</code> hanya mengizinkan update patch (<code>&lt;0.3.0</code>).</li>
          </ul>
        </article>

        <!-- 4. TypeScript (5 Konsep di Proyek Ini) -->
        <article class="card doc-card">
          <h3>4. TypeScript (5 Konsep pada Kode Ini)</h3>
          <p>TypeScript menambahkan *static typing* di atas JavaScript sehingga bug salah ketik atau salah tipe data tertangkap sebelum kode dijalankan:</p>
          <ul class="doc-list">
            <li><strong>Primitive Types</strong>: Penggunaan tipe dasar <code>string</code>, <code>number</code>, dan <code>boolean</code> pada variabel aplikasi dan ringkasan statistik.</li>
            <li><strong>Array (<code>Task[]</code>)</strong>: Menyatakan bahwa <code>daftarTugas</code> wajib berupa kumpulan objek bertipe <code>Task</code>.</li>
            <li><strong>Interface (<code>Task</code>)</strong>: Kontrak bentuk objek tugas yang mewajibkan properti <code>id</code>, <code>judul</code>, <code>mataKuliah</code>, <code>deadline</code>, dan <code>status</code>.</li>
            <li><strong>Type Alias + Union Type</strong>: <code>type Status = 'Belum Selesai' | 'Selesai'</code> membatasi nilai status agar tidak bisa diisi string sembarangan.</li>
            <li><strong>Generics Sederhana</strong>: Fungsi <code>cariById&lt;T extends { id: number }&gt;(data: T[], id: number): T | undefined</code> di <code>src/utils.ts</code> yang fleksibel namun tetap *type-safe*.</li>
          </ul>
        </article>

        <!-- 5. Vite -->
        <article class="card doc-card">
          <h3>5. Cara Kerja Vite</h3>
          <p>Vite adalah build tool modern yang membuat pengalaman ngoding web jauh lebih cepat dibanding bundler generasi lama:</p>
          <ul class="doc-list">
            <li><strong>Dev Server Instan</strong>: Memanfaatkan *Native ES Modules* di browser dan memproses dependensi dengan <code>esbuild</code> (ditulis dengan bahasa Go) sehingga server menyala dalam hitungan milidetik.</li>
            <li><strong>HMR (Hot Module Replacement)</strong>: Saat kita mengedit file <code>.ts</code> atau <code>.css</code>, Vite langsung memperbarui bagian halaman yang berubah di browser tanpa me-reload seluruh halaman.</li>
            <li><strong>Build Produksi dengan Rollup</strong>: Saat menjalankan <code>npm run build</code>, Vite menggunakan <strong>Rollup</strong> untuk menggabungkan, melakukan *tree-shaking* (membuang kode tak terpakai), dan meminifikasi aset ke folder <code>dist/</code>.</li>
          </ul>
        </article>

        <!-- 6. Environment Variables -->
        <article class="card doc-card">
          <h3>6. Environment Variables di Vite</h3>
          <p>Digunakan untuk memisahkan konfigurasi aplikasi dari kode sumber dan dibaca melalui <code>import.meta.env</code>:</p>
          <ul class="doc-list">
            <li><strong>Hierarki Prioritas File</strong>:
              <ol style="padding-left: 1.2rem; margin-top: 0.25rem;">
                <li><code>.env</code>: Dimuat di semua kondisi (default).</li>
                <li><code>.env.local</code>: Dimuat di semua kondisi, menimpa <code>.env</code>, dan diabaikan oleh Git.</li>
                <li><code>.env.development</code> / <code>.env.production</code>: Hanya dimuat sesuai mode (<code>npm run dev</code> vs <code>npm run build</code>).</li>
                <li><code>.env.[mode].local</code>: Prioritas tertinggi untuk mode tertentu dan lokal.</li>
              </ol>
            </li>
            <li><strong>Aturan Prefix <code>VITE_*</code></strong>: Hanya variabel berawalan <code>VITE_</code> (seperti <code>VITE_APP_NAME</code>) yang diekspos ke kode frontend. Karena nilainya disisipkan ke bundel browser, variabel ini <strong>tidak boleh berisi secret/password</strong>.</li>
          </ul>
        </article>
      </div>

      <!-- 7. Tabel Peran Compiler, Transpiler, dan Bundler -->
      <article class="card doc-card">
        <h3>7. Tabel Peran Compiler, Transpiler, dan Bundler</h3>
        <div class="table-responsive">
          <table class="doc-table">
            <thead>
              <tr>
                <th>Kategori Alat</th>
                <th>Peran / Tugas Utama</th>
                <th>Contoh di Proyek Ini</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Compiler (Type Checker)</strong></td>
                <td>Menganalisis seluruh kode secara statis untuk memeriksa kecocokan tipe data, struktur <code>interface</code>, dan mendeteksi error sebelum aplikasi di-build.</td>
                <td><code>tsc</code> (TypeScript Compiler) melalui perintah <code>tsc --noEmit</code> dan <code>npm run typecheck</code>.</td>
              </tr>
              <tr>
                <td><strong>Transpiler</strong></td>
                <td>Menerjemahkan sintaks TypeScript (<code>.ts</code>) atau JavaScript modern menjadi JavaScript standar yang langsung dipahami oleh browser dengan sangat cepat.</td>
                <td><code>esbuild</code> (dipakai otomatis di balik layar oleh Vite saat menjalankan <code>npm run dev</code>).</td>
              </tr>
              <tr>
                <td><strong>Bundler</strong></td>
                <td>Menggabungkan seluruh modul JavaScript, CSS, dan aset statis, melakukan optimasi (*minification*, *tree-shaking*, *code-splitting*) menjadi file produksi siap unggah.</td>
                <td><strong>Vite / Rollup</strong> (saat menjalankan <code>npm run build</code> menghasilkan folder <code>dist/</code>).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <!-- 8. Jawaban Singkat Pertanyaan Tugas -->
      <article class="card doc-card">
        <h3>8. Jawaban Singkat Pertanyaan Tugas</h3>
        <div class="faq-list">
          <div class="faq-item">
            <h4>1) Apa perbedaan antara <code>git commit</code> dan <code>git push</code>?</h4>
            <p>
              <code>git commit</code> hanya menyimpan rekaman perubahan ke dalam repository lokal di komputer kita sendiri (bisa dilakukan tanpa internet), sedangkan <code>git push</code> mengunggah commit-commit dari repository lokal tersebut ke repository remote seperti GitHub agar dapat diakses orang lain.
            </p>
          </div>

          <div class="faq-item">
            <h4>2) Kapan <em>merge conflict</em> terjadi dan bagaimana cara mengatasinya?</h4>
            <p>
              Merge conflict terjadi ketika Git menggabungkan dua branch yang sama-sama mengubah baris yang sama pada file yang sama (atau satu branch menghapus file yang sedang diedit branch lain). Cara mengatasinya: buka file yang konflik, tentukan kode mana yang ingin dipertahankan atau digabungkan, hapus penanda konflik (<code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>, <code>=======</code>, <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code>), lalu jalankan <code>git add</code> dan <code>git commit</code>.
            </p>
          </div>

          <div class="faq-item">
            <h4>3) Mengapa folder <code>node_modules</code> tidak ikut di-commit ke Git?</h4>
            <p>
              Karena ukuran <code>node_modules</code> sangat besar dengan ribuan file kecil yang akan membuat repository menjadi lambat dan membengkak, serta beberapa paket memiliki kode spesifik sistem operasi. Selama ada <code>package.json</code> dan <code>package-lock.json</code>, siapa pun cukup menjalankan <code>npm install</code> untuk membangun kembali isi <code>node_modules</code> secara identik.
            </p>
          </div>

          <div class="faq-item">
            <h4>4) Apa fungsi <code>interface</code> dan <code>generic</code> di TypeScript?</h4>
            <p>
              <code>interface</code> berfungsi sebagai kontrak/cetak biru yang mendefinisikan struktur properti beserta tipe datanya pada suatu objek (seperti <code>interface Task</code>). Sedangkan <code>generic</code> (<code>&lt;T&gt;</code>) memungkinkan kita membuat fungsi atau komponen yang dapat bekerja dengan berbagai tipe data secara fleksibel tanpa kehilangan keamanan pemeriksaan tipe (*type safety*), seperti pada fungsi <code>cariById&lt;T&gt;</code>.
            </p>
          </div>

          <div class="faq-item">
            <h4>5) Mengapa menyimpan kunci rahasia di <code>VITE_SECRET_KEY</code> tidak aman?</h4>
            <p>
              Di Vite, setiap variabel environment yang diawali dengan <code>VITE_</code> akan disalin dan ditanam langsung sebagai teks biasa ke dalam kode JavaScript hasil build yang dikirim ke browser pengguna. Siapa pun yang membuka <em>Inspect Element / DevTools (Sources/Network)</em> di browser dapat melihat nilai <code>VITE_SECRET_KEY</code> tersebut dengan bebas. Kunci rahasia hanya boleh disimpan di server backend.
            </p>
          </div>
        </div>
      </article>
    </div>
  `;
}

// Mereset mode edit pada formulir kembali ke mode tambah tugas
function resetModeEdit(): void {
  idSedangDiedit = null;
  elForm?.reset();
  if (elInputId) elInputId.value = '';
  if (elFormHeading) elFormHeading.textContent = 'Tambah Tugas Baru';
  if (elBtnSubmit) elBtnSubmit.textContent = 'Simpan Tugas';
  if (elBtnCancelEdit) elBtnCancelEdit.hidden = true;
  if (elFormError) elFormError.hidden = true;
}

// Memuat data tugas ke formulir untuk diedit menggunakan fungsi generic cariById<Task>
function mulaiEditTugas(id: number): void {
  const tugasDitemukan: Task | undefined = cariById(daftarTugas, id);
  if (!tugasDitemukan) return;

  idSedangDiedit = tugasDitemukan.id;
  if (elInputId) elInputId.value = String(tugasDitemukan.id);
  if (elInputJudul) elInputJudul.value = tugasDitemukan.judul;
  if (elInputMatkul) elInputMatkul.value = tugasDitemukan.mataKuliah;
  if (elInputDeadline) elInputDeadline.value = tugasDitemukan.deadline;

  if (elFormHeading) elFormHeading.textContent = 'Edit Tugas Kuliah';
  if (elBtnSubmit) elBtnSubmit.textContent = 'Simpan Perubahan';
  if (elBtnCancelEdit) elBtnCancelEdit.hidden = false;
  if (elFormError) elFormError.hidden = true;

  elInputJudul?.focus();
}

// Mengubah (toggle) status tugas antara 'Belum Selesai' dan 'Selesai'
function toggleStatusTugas(id: number): void {
  daftarTugas = daftarTugas.map((tugas) => {
    if (tugas.id !== id) return tugas;
    const statusBaru: Status = tugas.status === 'Selesai' ? 'Belum Selesai' : 'Selesai';
    return { ...tugas, status: statusBaru };
  });

  simpanTugasKeStorage(daftarTugas);
  renderRingkasan();
  renderDaftarTugas();
}

// Menghapus tugas berdasarkan id
function hapusTugas(id: number): void {
  daftarTugas = daftarTugas.filter((tugas) => tugas.id !== id);
  if (idSedangDiedit === id) {
    resetModeEdit();
  }
  simpanTugasKeStorage(daftarTugas);
  renderRingkasan();
  renderDaftarTugas();
}

// Menangani penambahan tugas baru maupun penyimpanan hasil edit tugas
function handleSubmitForm(event: SubmitEvent): void {
  event.preventDefault();
  if (!elInputJudul || !elInputMatkul || !elInputDeadline || !elFormError) return;

  const judul: string = elInputJudul.value.trim();
  const mataKuliah: string = elInputMatkul.value.trim();
  const deadline: string = elInputDeadline.value.trim();

  if (!judul || !mataKuliah || !deadline) {
    elFormError.textContent = 'Mohon lengkapi judul tugas, mata kuliah, dan tanggal deadline.';
    elFormError.hidden = false;
    return;
  }

  elFormError.hidden = true;

  if (idSedangDiedit !== null) {
    // Mode Edit: perbarui tugas yang sedang diedit
    daftarTugas = daftarTugas.map((tugas) =>
      tugas.id === idSedangDiedit ? { ...tugas, judul, mataKuliah, deadline } : tugas
    );
    resetModeEdit();
  } else {
    // Mode Tambah: buat objek tugas baru sesuai Interface Task
    const tugasBaru: Task = {
      id: Date.now(),
      judul,
      mataKuliah,
      deadline,
      status: 'Belum Selesai',
    };
    daftarTugas = [tugasBaru, ...daftarTugas];
    elForm?.reset();
  }

  simpanTugasKeStorage(daftarTugas);
  renderRingkasan();
  renderDaftarTugas();
}

// Navigasi pergantian tab antara Daftar Tugas dan Tentang Proyek (tanpa router)
function pindahTab(tab: 'tugas' | 'tentang'): void {
  if (!elViewTugas || !elViewTentang || !elTabBtnTugas || !elTabBtnTentang) return;

  const tampilkanTugas: boolean = tab === 'tugas';
  elViewTugas.hidden = !tampilkanTugas;
  elViewTentang.hidden = tampilkanTugas;
  elTabBtnTugas.classList.toggle('active', tampilkanTugas);
  elTabBtnTentang.classList.toggle('active', !tampilkanTugas);
}

// Event delegation untuk tombol aksi pada kartu tugas (toggle, edit, delete)
elTaskList?.addEventListener('click', (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  if (!target) return;

  const id: number = Number(target.dataset.id);
  const action: string | undefined = target.dataset.action;
  if (!id || !action) return;

  if (action === 'toggle') {
    toggleStatusTugas(id);
  } else if (action === 'edit') {
    mulaiEditTugas(id);
  } else if (action === 'delete') {
    hapusTugas(id);
  }
});

// Inisialisasi event listener form, batal edit, filter, dan navigasi tab
elForm?.addEventListener('submit', handleSubmitForm);
elBtnCancelEdit?.addEventListener('click', resetModeEdit);
elTabBtnTugas?.addEventListener('click', () => pindahTab('tugas'));
elTabBtnTentang?.addEventListener('click', () => pindahTab('tentang'));

document.querySelectorAll<HTMLButtonElement>('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const nilaiFilter = btn.dataset.filter as 'Semua' | Status | undefined;
    filterAktif = nilaiFilter || 'Semua';
    renderDaftarTugas();
  });
});

// Render awal aplikasi
renderRingkasan();
renderDaftarTugas();
renderTentangProyek();
