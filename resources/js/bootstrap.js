import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Konfigurasi Axios untuk menggunakan cookie
window.axios.defaults.withCredentials = true;

// Jika menggunakan Laravel Sanctum untuk autentikasi sisi server
// Ini akan memastikan cookie CSRF dikonfigurasi sebelum login
// Komentar baris berikut jika frontend berjalan terpisah
import { createApp } from 'vue';
import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();
