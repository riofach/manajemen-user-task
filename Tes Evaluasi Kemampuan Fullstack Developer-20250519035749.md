# Tes Evaluasi Kemampuan Fullstack Developer

Anda diminta membangun sistem RESTful API manajemen _User & Task_ yang mensimulasikan fitur dashboard admin internal dengan **role-based access control**, **business logic**, dan **batch data processing**.

Gunakan **Laravel** (v10+) dengan **Vanilla JS** untuk frontend.

**ON-SITE**

---

## ✅ **Fitur Backend (Laravel)**

### 📦 **Entitas**

#### 1\. **User**

-   `id`: UUID
-   `name`: string
-   `email`: string, unique
-   `password`: hashed
-   `role`: enum (`admin`, `manager`, `staff`)
-   `status`: boolean (active/inactive)

#### 2\. **Task**

-   `id`: UUID
-   `title`: string
-   `description`: text
-   `assigned_to`: UUID (relasi ke User)
-   `status`: enum (`pending`, `in_progress`, `done`)
-   `due_date`: date
-   `created_by`: UUID

#### 3\. **Activity Logs**

-   `id`: UUID
-   `user_id`: UUID
-   `action`: string (create_user, update_task, etc.)
-   `description`: text
-   `logged_at`: datetime

---

## 🔄 **Rules & Business Logic**

### ✅ Role Permissions:

| Role    | Can View Users | Manage Tasks  | Assign Tasks | View Logs |
| ------- | -------------- | ------------- | ------------ | --------- |
| admin   | ✅             | ✅            | ✅           | ✅        |
| manager | ✅             | ✅ (own team) | ✅ (staff)   | ❌        |
| staff   | ❌             | ✅ (self)     | ❌           | ❌        |

### ⛔ Business Constraints:

-   User dengan status `inactive` tidak bisa login.
-   `manager` hanya bisa assign task ke `staff`.
-   User hanya bisa melihat task yang dibuat/ditugaskan kepada dirinya.
-   Task overdue otomatis masuk ke log dengan deskripsi `Task overdue: {task_id}` via scheduler (`php artisan command`).

---

## 🔐 **Autentikasi & Middleware**

-   Gunakan Laravel **Sanctum**
-   Middleware:
    -   `auth:sanctum`
    -   `checkUserStatus` (blokir user inactive)
    -   `logRequest` (catat ke `logs/api_activity.log`)
-   Custom authorization policy (gunakan `Gate::define` atau Policy class)

---

## 🛠️ **Fitur Backend**

### API Routes:

-   `POST /login` → Login
-   `GET /users` → Hanya admin & manager
-   `POST /users` → Hanya admin
-   `GET /tasks` → Semua role, filter berdasar role
-   `POST /tasks` → Buat task, logic validasi assignment
-   `PUT /tasks/{id}` → Edit task
-   `DELETE /tasks/{id}` → Hanya admin/creator
-   `GET /logs` → Hanya admin

---

## 🧪 **Testing**

-   Buat:
    -   **Unit Test**: service logic (validasi role assignment, overdue logic, dsb.)
    -   **Feature Test**: autentikasi, otorisasi, CRUD task
-   Sertakan: `php artisan test --coverage`

---

## 🖥️ **Frontend (Vanilla JS + HTML + Bootstrap)**

Buat **dashboard sederhana**:

### 📋 Halaman:

-   **Login Page**
-   **Task Dashboard**:
    -   Tampilkan task yang relevan berdasarkan role
    -   Tampilkan status badge
    -   Tombol "Edit", "Delete" hanya untuk yang punya akses
    -   Validasi form (email, required, due date)
-   **Admin Page (jika role admin)**:
    -   Form buat user baru
    -   List user dan status aktif

AJAX menggunakan `fetch()` ke endpoint Laravel.

---

## 🧰 **Bonus (Opsional, Nilai Tambah)**

-   Laravel Scheduler: `php artisan command` untuk `task overdue checker`
-   Swagger dokumentasi otomatis
-   Export Task CSV (via API)

---

## 📁 Struktur Folder yang Wajib

```plain
arduino
SalinEdit
├── app/
│   ├── Http/
│   ├── Models/
│   ├── Policies/
│   ├── Services/
│   ├── Console/Commands/CheckOverdueTasks.php
├── routes/
│   └── api.php
├── resources/
│   └── views/
│       └── dashboard.html (optional)
├── tests/
│   ├── Feature/
│   └── Unit/
├── public/
│   └── frontend/
│       └── index.html
├── .env.example
├── README.md
└── docker-compose.yml (jika ada)
```

---

## 🕒 Deadline

**Selasa, 20 Mei 2025**

**Pukul 17:00 WIB**

---

## 📬 Cara Pengumpulan

-   Push ke GitHub / GitLab
-   Sertakan:
    -   README lengkap (setup, ERD, fitur)
    -   Screenshot login, CRUD task, dan hasil test
    -   `.env.example`
-   Kirim link ke WhatsApp: **0881 0240 02984** dan isi link [https://forms.clickup.com/3630598/f/3etg6-80436/7BL787WETZZQANV7XC](https://forms.clickup.com/3630598/f/3etg6-80436/7BL787WETZZQANV7XC)

---
