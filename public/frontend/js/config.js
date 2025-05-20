// File Konfigurasi Aplikasi Frontend

// URL dasar untuk API backend
// Perubahan untuk memastikan URL API benar, dengan menambahkan opsi fallback langsung
const API_BASE_URL = (() => {
    // Coba gunakan URL dinamis dari lokasi saat ini
    const dynamicUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/api';

    // Fallback URL jika ada masalah
    const fallbackUrl = 'http://127.0.0.1:8000/api';

    // Log untuk debugging
    console.log('Dynamic API URL:', dynamicUrl);

    // Kembalikan URL yang sesuai
    return dynamicUrl;
})();

// Pengujian koneksi API saat pemuatan (hanya di development)
(async function testApiEndpoint() {
    try {
        console.log('Testing API connection to:', API_BASE_URL + '/status');
        const response = await fetch(API_BASE_URL + '/status', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            console.log('API connection successful!');
        } else {
            console.warn('API connection failed with status:', response.status);
        }
    } catch (error) {
        console.error('API connection test error:', error);
    }
})();

// Ekspor sebagai variabel global
console.log('API Base URL:', API_BASE_URL); // Logging untuk debugging

// Konfigurasi lain yang mungkin dibutuhkan di masa mendatang
// Misalnya, kunci API publik, pengaturan timeout, dll.

// Ambil URL API dari environment jika tersedia, atau gunakan default dari lokasi saat ini
// const API_BASE_URL = process.env.API_URL || defaultApiUrl;