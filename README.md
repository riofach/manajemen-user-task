# Proyek Manajemen User Task (Laravel & Vanilla JS)

Proyek ini adalah implementasi sistem RESTful API untuk manajemen User & Task dengan fitur role-based access control, business logic, dan batch data processing. Backend dibangun menggunakan Laravel (v10+) dan frontend menggunakan Vanilla JS, HTML, & Bootstrap.

Dokumen acuan utama: `Tes Evaluasi Kemampuan Fullstack Developer-20250519035749.md`

## Fitur Utama yang Telah Diimplementasikan

-   **Autentikasi Pengguna:**
    -   Login pengguna dengan email dan password (menggunakan Laravel Sanctum).
    -   Logout pengguna (penghapusan token).
    -   Token API (Bearer Token) untuk akses ke endpoint yang dilindungi.
-   **Manajemen Pengguna (User Management):**
    -   Melihat daftar semua pengguna (GET `/users`) - Akses: Admin, Manager.
    -   Membuat pengguna baru (POST `/users`) - Akses: Admin.
    -   Melihat detail satu pengguna (GET `/users/{user}`) - Akses: Admin, Manager.
-   **Manajemen Tugas (Task Management):**
    -   Melihat daftar tugas (GET `/tasks`) dengan filter berdasarkan peran pengguna.
    -   Membuat tugas baru (POST `/tasks`) dengan validasi penugasan (Manager ke Staff, Staff ke diri sendiri).
    -   Melihat detail satu tugas (GET `/tasks/{task}`).
    -   Memperbarui tugas (PUT `/tasks/{task}`).
    -   Menghapus tugas (DELETE `/tasks/{task}`) - Akses: Admin atau pembuat tugas.
-   **Manajemen Log Aktivitas:**
    -   Melihat daftar semua log aktivitas (GET `/logs`) - Akses: Admin.
-   **Proses Batch (Scheduler):**
    -   Command `tasks:check-overdue` untuk memeriksa tugas yang melewati batas waktu dan mencatatnya ke Activity Log (dijalankan setiap hari pukul 01:00).
-   **Middleware:**
    -   `auth:sanctum`: Melindungi route yang memerlukan autentikasi.
    -   `user.status` (Custom): Memastikan hanya pengguna dengan status `aktif` yang dapat mengakses route terproteksi setelah login.
    -   `LogRequest` (Custom): Mencatat setiap detail permintaan API ke `storage/logs/api_activity.log`.
-   **Otorisasi (Policies):**
    -   `UserPolicy` untuk mengatur hak akses pada operasi User.
    -   `TaskPolicy` untuk mengatur hak akses pada operasi Task.
    -   `ActivityLogPolicy` untuk mengatur hak akses pada operasi Activity Log.
-   **Struktur Data Dasar:**
    -   Model dan Migrasi untuk `User`, `Task`, dan `ActivityLog` (dengan UUID).
-   **Seeder Data Awal:**
    -   `UserSeeder` untuk membuat pengguna admin, manager, dan staff dengan status berbeda.
-   **Frontend dengan Vanilla JS:**
    -   Halaman Login (penanganan autentikasi dengan API)
    -   Dashboard (menampilkan tugas sesuai peran pengguna)
    -   Halaman Manajemen User (khusus admin)
    -   Halaman Log Aktivitas (khusus admin)

## Prasyarat

-   PHP >= 8.1
-   Composer
-   Node.js & NPM (Opsional, jika ingin mengelola aset frontend lebih lanjut)
-   Web Server (misalnya Nginx, Apache, atau `php artisan serve` untuk development)
-   Database (MySQL direkomendasikan)
-   Untuk scheduler: Konfigurasi cron job atau jalankan `php artisan schedule:work` di development.

## Langkah Instalasi & Setup

1.  **Clone Repository:**

    ```bash
    git clone [URL_REPOSITORY_ANDA]
    cd nama-direktori-proyek
    ```

2.  **Install Dependencies PHP:**

    ```bash
    composer install
    ```

3.  **Buat File Environment:**
    Salin `.env.example` menjadi `.env`.

    ```bash
    cp .env.example .env
    ```

4.  **Generate Application Key:**

    ```bash
    php artisan key:generate
    ```

5.  **Konfigurasi Database di `.env`:**
    Sesuaikan variabel berikut dengan konfigurasi database lokal Anda:

    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=manajemen_user_task
    DB_USERNAME=root
    DB_PASSWORD=
    ```

    Pastikan Anda telah membuat database dengan nama yang sesuai (misalnya `manajemen_user_task`).

6.  **Konfigurasi Frontend dan Sanctum:**
    Tambahkan konfigurasi berikut ke `.env`:

    ```env
    SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,localhost:8000
    SESSION_DOMAIN=localhost
    FRONTEND_URL=http://localhost:8000
    ```

    Ini memastikan Sanctum dapat memverifikasi permintaan dari domain frontend Anda.

7.  **Jalankan Migrasi Database:**
    Ini akan membuat semua tabel yang diperlukan dan mengisi dengan data awal.

    ```bash
    php artisan migrate:fresh --seed
    ```

8.  **Jalankan Development Server (Laravel):**

    ```bash
    php artisan serve
    ```

    Aplikasi sekarang dapat diakses melalui `http://localhost:8000`.

    Laravel sudah dikonfigurasi untuk langsung mengarahkan ke halaman frontend ketika Anda mengakses URL root.

9.  **Untuk Scheduler:** Jalankan `php artisan schedule:work` di terminal terpisah atau konfigurasikan cron job.

## Mengakses Aplikasi

1. **Akses Frontend:**
   Buka browser dan akses `http://localhost:8000`. Anda akan langsung diarahkan ke halaman login frontend.

2. **Akun Default:**

    - Admin: `admin@example.com` / `password`
    - Manager: `manager@example.com` / `password`
    - Staff: `staff@example.com` / `password`

3. **Alur Aplikasi:**
    - Setelah login, pengguna akan diarahkan ke dashboard yang menampilkan tugas sesuai peran.
    - Admin dapat melihat dan mengelola semua pengguna serta melihat log aktivitas.
    - Manager dapat membuat tugas baru dan menetapkannya ke staff.
    - Staff hanya dapat melihat dan mengelola tugas miliknya sendiri.

## Struktur Frontend

Frontend diimplementasikan dengan pendekatan Vanilla JS (tanpa framework) dan terletak di direktori `public/frontend/`. Struktur kunci meliputi:

```
public/frontend/
├── css/
│   └── style.css               # Stylesheet utama
├── js/
│   ├── config.js               # Konfigurasi API URL
│   ├── auth.js                 # Fungsi autentikasi (login/logout)
│   ├── ui.js                   # Helper UI (notifikasi, spinner)
│   ├── dashboard.js            # Logika manajemen tugas
│   └── admin.js                # Logika khusus admin (manajemen user, log)
├── partials/
│   └── navbar.html             # Komponen navbar yang dapat digunakan kembali
├── index.html                  # Halaman login
└── dashboard.html              # Layout dashboard utama
```

## Integrasi Frontend-Backend

Frontend Vanilla JS terhubung dengan backend Laravel API melalui konfigurasi di `js/config.js`. Semua permintaan API dilakukan menggunakan `fetch()` API dan token otentikasi disimpan di `localStorage`. Fitur utama meliputi:

-   **Autentikasi:** Login/logout dengan token JWT dari Laravel Sanctum
-   **Manajemen Sesi:** Menyimpan dan memvalidasi token, menangani kedaluwarsa token
-   **Role-based UI:** Menampilkan atau menyembunyikan elemen UI berdasarkan peran pengguna
-   **Caching Data:** Menyimpan data pengguna untuk mengurangi permintaan API yang tidak perlu

## Endpoint API Saat Ini

Semua endpoint API diakses melalui prefix `/api` (misalnya `http://localhost:8000/api/...`).

| Method | URI             | Controller#Action           | Deskripsi                                                  | Middleware Pelindung          |
| :----- | :-------------- | :-------------------------- | :--------------------------------------------------------- | :---------------------------- |
| POST   | `/login`        | AuthController@login        | Login pengguna.                                            | - (Publik)                    |
| POST   | `/logout`       | AuthController@logout       | Logout pengguna.                                           | `auth:sanctum`, `user.status` |
| GET    | `/user`         | (Closure)                   | Detail pengguna terautentikasi.                            | `auth:sanctum`, `user.status` |
| GET    | `/users`        | UserController@index        | Daftar semua pengguna (paginasi).                          | `auth:sanctum`, `user.status` |
| POST   | `/users`        | UserController@store        | Membuat pengguna baru.                                     | `auth:sanctum`, `user.status` |
| GET    | `/users/{user}` | UserController@show         | Detail satu pengguna.                                      | `auth:sanctum`, `user.status` |
| GET    | `/tasks`        | TaskController@index        | Daftar tugas (filter by role, paginasi).                   | `auth:sanctum`, `user.status` |
| POST   | `/tasks`        | TaskController@store        | Membuat tugas baru.                                        | `auth:sanctum`, `user.status` |
| GET    | `/tasks/{task}` | TaskController@show         | Detail satu tugas.                                         | `auth:sanctum`, `user.status` |
| PUT    | `/tasks/{task}` | TaskController@update       | Memperbarui tugas.                                         | `auth:sanctum`, `user.status` |
| DELETE | `/tasks/{task}` | TaskController@destroy      | Menghapus tugas.                                           | `auth:sanctum`, `user.status` |
| GET    | `/logs`         | ActivityLogController@index | Melihat daftar semua log aktivitas (paginasi, Admin only). | `auth:sanctum`, `user.status` |

**Catatan:** Semua request ke API akan dicatat di `storage/logs/api_activity.log` oleh middleware `LogRequest`.

## Struktur Folder Penting

```
manajemen-user-task/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── UserController.php
│   │   │   ├── TaskController.php
│   │   │   └── ActivityLogController.php
│   │   └── Middleware/
│   │       ├── CheckUserStatus.php
│   │       └── LogRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Task.php
│   │   └── ActivityLog.php
│   ├── Policies/
│   │   ├── UserPolicy.php
│   │   ├── TaskPolicy.php
│   │   └── ActivityLogPolicy.php
│   ├── Providers/
│   │   └── AuthServiceProvider.php
│   ├── Services/ (Akan dibuat)
│   └── Console/Commands/CheckOverdueTasks.php
├── config/
│   ├── sanctum.php
│   ├── cors.php
│   └── logging.php (dengan channel api_activity)
├── database/
│   ├── migrations/
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── UserSeeder.php
├── routes/
│   ├── api.php
│   └── web.php
├── storage/logs/
│   └── api_activity.log (Akan dibuat otomatis)
├── public/
│   └── frontend/
│       ├── index.html (Halaman login)
│       ├── dashboard.html (Dashboard utama)
│       ├── css/style.css (Stylesheet utama)
│       ├── js/ (File JavaScript untuk frontend)
│       └── partials/ (Komponen HTML yang dapat digunakan kembali)
├── .env.example
├── .env
├── README.md
└── ... (file Laravel lainnya)
```

## Panduan Pengembangan Lanjutan

### Frontend

Untuk mengembangkan lebih lanjut frontend:

1. Semua file frontend terletak di direktori `public/frontend/`
2. Sesuaikan URL API di `js/config.js` jika perlu (misalnya, jika menggunakan port berbeda)
3. Buat file JavaScript tambahan untuk fitur baru dan referensikan di file HTML

### Backend

Untuk mengembangkan lebih lanjut backend:

1. Tambahkan controller baru di `app/Http/Controllers/Api/`
2. Daftarkan route baru di `routes/api.php`
3. Tambahkan model baru di `app/Models/`
4. Buat migrasi untuk tabel baru: `php artisan make:migration create_nama_table`

## Kontribusi

Panduan kontribusi akan ditambahkan jika diperlukan.

## Pemecahan Masalah

### Masalah CORS

Jika terjadi masalah CORS saat mengakses API dari frontend:

1. Pastikan konfigurasi `SANCTUM_STATEFUL_DOMAINS` dan `SESSION_DOMAIN` benar di `.env`
2. Periksa konfigurasi `cors.php` untuk memastikan origin frontend diizinkan
3. Pastikan `HandleCors` middleware terdaftar di kernel

### Masalah Otentikasi

Jika token tidak valid atau logout tidak berfungsi:

1. Periksa apakah cookie sesi diatur dengan benar
2. Pastikan domain cookie sesuai dengan domain aplikasi
3. Hapus cache browser dan coba login ulang
