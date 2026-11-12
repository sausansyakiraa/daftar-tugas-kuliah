import './style.css';

// Membaca variabel environment menggunakan import.meta.env
const namaAplikasi: string = import.meta.env.VITE_APP_NAME || 'Daftar Tugas Kuliah';
const versiAplikasi: string = import.meta.env.VITE_APP_VERSION || '1.0.0';

const appElement = document.querySelector<HTMLDivElement>('#app');
if (appElement) {
  appElement.innerHTML = `
    <header>
      <h1>${namaAplikasi} <span>v${versiAplikasi}</span></h1>
    </header>
  `;
}

