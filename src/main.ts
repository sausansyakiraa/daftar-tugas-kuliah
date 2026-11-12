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

// Inisialisasi event listener form, batal edit, dan filter
elForm?.addEventListener('submit', handleSubmitForm);
elBtnCancelEdit?.addEventListener('click', resetModeEdit);

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
