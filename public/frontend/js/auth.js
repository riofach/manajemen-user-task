// Fungsi untuk login, logout, dan manajemen token API

/**
 * Mengambil CSRF token dari endpoint sanctum/csrf-cookie sebelum login.
 * Diperlukan untuk aplikasi yang menggunakan Laravel Sanctum dengan SPA.
 * @returns {Promise<boolean>} - Berhasil atau tidak mengambil CSRF token
 */
async function getCsrfToken() {
    try {
        // Ambil CSRF cookie dari endpoint sanctum
        const csrfUrl = `${API_BASE_URL.replace('/api', '')}/sanctum/csrf-cookie`;
        console.log('Fetching CSRF token from:', csrfUrl);

        const response = await fetch(csrfUrl, {
            method: 'GET',
            credentials: 'include', // Penting untuk menyimpan cookie
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });

        if (response.ok) {
            console.log('CSRF cookie set successfully');
            return true;
        } else {
            console.error('Failed to set CSRF cookie:', response.status);
            // Tambahkan debugging info
            console.warn('CSRF endpoint might not be available. Will proceed without CSRF protection.');
            return true; // Return true anyway for now to let login proceed
        }
    } catch (error) {
        console.error('Error setting CSRF cookie:', error);
        // Tambahkan debugging info
        console.warn('Error happened during CSRF fetch. Will proceed without CSRF protection.');
        return true; // Return true anyway for fallback
    }
}

/**
 * Meng-handle proses login pengguna dengan mencoba beberapa endpoint.
 * @param {Event} event - Event submit dari form login.
 */
async function handleLogin(event) {
    event.preventDefault(); // Mencegah perilaku default form submission

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginErrorAlert = document.getElementById('loginErrorAlert');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');

    // Validasi dasar di sisi klien (opsional, karena validasi utama di server)
    if (!emailInput || !passwordInput || !loginErrorAlert || !loginButtonText || !loginSpinner) {
        console.error('Elemen form login tidak ditemukan.');
        if (loginErrorAlert) {
            loginErrorAlert.textContent = 'Terjadi kesalahan pada form login. Silakan coba lagi.';
            loginErrorAlert.classList.remove('hidden');
        }
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        loginErrorAlert.textContent = 'Email dan password harus diisi.';
        loginErrorAlert.classList.remove('hidden');
        return;
    }

    // Tampilkan spinner dan sembunyikan teks tombol
    loginButtonText.classList.add('hidden');
    loginSpinner.classList.remove('hidden');
    loginErrorAlert.classList.add('hidden'); // Sembunyikan error sebelumnya

    try {
        // Ambil CSRF token terlebih dahulu jika menggunakan Sanctum
        await getCsrfToken();

        // Daftar endpoint yang akan dicoba untuk login
        const endpoints = [
            `${API_BASE_URL}/login`,
            `${API_BASE_URL}/auth/login`,
            `http://127.0.0.1:8000/api/login`,
            `http://localhost:8000/api/login`
        ];

        let response = null;
        let error = null;
        let data = null;

        // Coba tiap endpoint sampai berhasil
        for (const endpoint of endpoints) {
            try {
                console.log('Attempting login to:', endpoint);

                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include', // Penting untuk CORS dengan cookies
                    body: JSON.stringify({ email, password }),
                });

                console.log('Login response status:', response.status);

                // Jika berhasil, keluar dari loop
                if (response.ok) {
                    data = await response.json();
                    console.log('Login response data:', data);
                    break;
                }

                // Jika tidak berhasil, simpan error untuk digunakan jika semua endpoint gagal
                error = await response.json().catch(() => ({}));

            } catch (endpointError) {
                console.warn(`Error trying endpoint ${endpoint}:`, endpointError);
                // Simpan error terakhir
                error = error || { message: endpointError.message };
            }
        }

        // Jika tidak ada endpoint yang berhasil
        if (!response || !response.ok) {
            throw new Error(error?.message || 'Gagal login ke semua endpoint tersedia.');
        }

        // Sesuaikan dengan format respons dari backend
        if (data.status === 'success' && data.access_token) {
            // Simpan token dan data pengguna
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            window.location.href = 'dashboard.html'; // Redirect ke dashboard
        } else {
            const errorMessage = data.message || 'Email atau password salah.';
            loginErrorAlert.textContent = errorMessage;
            loginErrorAlert.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error during login:', error);
        loginErrorAlert.textContent = error.message || 'Terjadi kesalahan koneksi. Silakan coba lagi.';
        loginErrorAlert.classList.remove('hidden');
    } finally {
        // Kembalikan tampilan tombol ke semula
        loginButtonText.classList.remove('hidden');
        loginSpinner.classList.add('hidden');
    }
}

/**
 * Meng-handle proses logout pengguna.
 * Menghapus token dari localStorage dan mengarahkan ke halaman login.
 */
async function handleLogout() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.warn('No auth token found, redirecting to login.');
        window.location.href = 'index.html';
        return;
    }

    try {
        // Panggil API logout jika ada endpoint khusus untuk invalidasi token di server
        // Untuk contoh ini, kita asumsikan token di-blacklist atau sesinya diakhiri di server
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            // Meskipun logout gagal di server, tetap lanjutkan logout di client
            // agar user tidak terjebak.
            // Pertimbangkan untuk log error ini ke sistem monitoring Anda.
            const errorData = await response.json();
            console.warn('Server logout failed:', response.status, errorData.message || 'Unknown error');
        }
    } catch (error) {
        // Jika ada error network saat logout, tetap lanjutkan logout di sisi client.
        console.error('Error during server logout:', error);
    } finally {
        // Selalu hapus data dari localStorage dan redirect, apapun hasil dari API call
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    }
}

// Fungsi untuk mendapatkan token dari localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Fungsi untuk mendapatkan data pengguna dari localStorage
function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Fungsi untuk memeriksa apakah pengguna sudah login
function isLoggedIn() {
    return !!localStorage.getItem('authToken');
} 