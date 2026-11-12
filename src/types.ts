// 1. Type alias + Union type: membatasi nilai status tugas hanya pada dua pilihan valid
export type Status = 'Belum Selesai' | 'Selesai';

// 2. Interface: mendefinisikan kontrak struktur objek untuk setiap tugas kuliah
export interface Task {
  // 3. Primitive types: number dan string untuk properti dasar tugas
  id: number;
  judul: string;
  mataKuliah: string;
  deadline: string;
  status: Status;
}

// Contoh penggunaan Primitive type boolean dan number pada ringkasan statistik tugas
export interface TaskSummary {
  totalTugas: number;       // Primitive type: number
  jumlahSelesai: number;    // Primitive type: number
  jumlahBelum: number;      // Primitive type: number
  semuaSelesai: boolean;    // Primitive type: boolean
}

// 4. Array type: mendefinisikan tipe kumpulan/daftar tugas sebagai Task[]
export type TaskList = Task[];
