import dayjs from 'dayjs';
import type { Task, TaskSummary } from './types';

// Contoh Primitive type string untuk kunci penyimpanan localStorage
const STORAGE_KEY: string = 'paw_tugas6_daftar_tugas';

// 5. Generics sederhana: fungsi pencari item berdasarkan id untuk tipe objek apa pun yang memiliki properti id: number
export function cariById<T extends { id: number }>(data: T[], id: number): T | undefined {
  return data.find((item) => item.id === id);
}

// Memuat daftar tugas (Array: Task[]) dari localStorage
export function muatTugasDariStorage(): Task[] {
  const dataMentah: string | null = localStorage.getItem(STORAGE_KEY);
  if (!dataMentah) {
    return [];
  }

  try {
    const parsedData = JSON.parse(dataMentah) as Task[];
    return Array.isArray(parsedData) ? parsedData : [];
  } catch {
    return [];
  }
}

// Menyimpan daftar tugas (Array: Task[]) ke localStorage
export function simpanTugasKeStorage(daftarTugas: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(daftarTugas));
}

// Menghitung ringkasan jumlah tugas selesai dengan contoh primitive types (number, boolean)
export function hitungRingkasanTugas(daftarTugas: Task[]): TaskSummary {
  const totalTugas: number = daftarTugas.length;
  const jumlahSelesai: number = daftarTugas.filter((t) => t.status === 'Selesai').length;
  const jumlahBelum: number = totalTugas - jumlahSelesai;
  const semuaSelesai: boolean = totalTugas > 0 && jumlahSelesai === totalTugas;

  return {
    totalTugas,
    jumlahSelesai,
    jumlahBelum,
    semuaSelesai,
  };
}

// Memformat tanggal deadline menggunakan package dayjs beserta keterangan sisa hari
export function formatDeadline(deadline: string): { tanggalFormatted: string; keterangan: string; mendesak: boolean } {
  const tanggalTarget = dayjs(deadline).startOf('day');
  if (!tanggalTarget.isValid()) {
    return {
      tanggalFormatted: deadline,
      keterangan: 'Tanggal tidak valid',
      mendesak: false,
    };
  }

  const hariIni = dayjs().startOf('day');
  const selisihHari: number = tanggalTarget.diff(hariIni, 'day');
  const tanggalFormatted: string = tanggalTarget.format('DD MMM YYYY');

  if (selisihHari < 0) {
    return {
      tanggalFormatted,
      keterangan: `Terlambat ${Math.abs(selisihHari)} hari`,
      mendesak: true,
    };
  }

  if (selisihHari === 0) {
    return {
      tanggalFormatted,
      keterangan: 'Hari ini!',
      mendesak: true,
    };
  }

  if (selisihHari <= 3) {
    return {
      tanggalFormatted,
      keterangan: `${selisihHari} hari lagi`,
      mendesak: true,
    };
  }

  return {
    tanggalFormatted,
    keterangan: `${selisihHari} hari lagi`,
    mendesak: false,
  };
}

// Escape karakter HTML untuk mencegah XSS saat merender input pengguna
export function escapeHtml(teks: string): string {
  return teks
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
