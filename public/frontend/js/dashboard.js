// Logika spesifik untuk halaman dashboard (manajemen Task) 

/**
 * Inisialisasi data dan event listener untuk dashboard.
 * Biasanya dipanggil setelah DOM dimuat dan pengguna terotentikasi.
 */
function initializeDashboard() {
    // Panggil fungsi untuk memuat data awal, misalnya daftar tugas
    loadTasks();

    // Tambahkan event listener untuk elemen UI dashboard jika ada
    // Contoh: tombol tambah tugas, filter, dll.
    const addTaskButton = document.getElementById('addTaskButton'); // Asumsi ada tombol ini
    if (addTaskButton) {
        addTaskButton.addEventListener('click', () => {
            // Logika untuk menampilkan form tambah tugas
            showAddTaskForm();
        });
    }
}

/**
 * Menampilkan form untuk menambahkan tugas baru
 */
function showAddTaskForm() {
    showTaskFormModal('Tambah Tugas Baru', null, handleCreateTask, loadTasks);
}

/**
 * Menampilkan form untuk mengedit tugas
 * @param {string} taskId - ID tugas yang akan diedit
 */
async function showEditTaskForm(taskId) {
    try {
        showSpinner('taskManagementView', 'Memuat data tugas...');
        const authToken = getAuthToken();
        if (!authToken) {
            showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'taskManagementView');
            handleLogout();
            return;
        }

        // Ambil detail tugas dari API
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.', 'error', 'taskManagementView');
            handleLogout();
            return;
        }

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (error) {
            throw new Error('Format respons tidak valid');
        }

        if (!response.ok) {
            throw new Error(result?.message || `Gagal memuat detail tugas: ${response.status}`);
        }

        // Ambil data tugas dari respons
        const taskData = result.data;
        if (!taskData) {
            throw new Error('Data tugas tidak ditemukan');
        }

        // Tampilkan modal edit dengan data tugas
        showTaskFormModal('Edit Tugas', taskData, handleUpdateTask, loadTasks);

    } catch (error) {
        showNotification(`Gagal memuat detail tugas: ${error.message}`, 'error', 'taskManagementView');
    } finally {
        hideSpinner('taskManagementView');
    }
}

/**
 * Menangani pembuatan tugas baru
 * @param {Object} formData - Data tugas dari form
 */
async function handleCreateTask(formData) {
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'taskManagementView');
        handleLogout();
        return;
    }

    try {
        showSpinner('taskManagementView', 'Menyimpan tugas baru...');

        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.', 'error', 'taskManagementView');
            handleLogout();
            return;
        }

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (error) {
            throw new Error('Format respons tidak valid');
        }

        if (!response.ok) {
            throw new Error(result?.message || `Gagal membuat tugas: ${response.status}`);
        }

        showNotification(result.message || 'Tugas berhasil dibuat', 'success', 'taskManagementView');
        loadTasks(); // Muat ulang daftar tugas

    } catch (error) {
        showNotification(`Gagal membuat tugas: ${error.message}`, 'error', 'taskManagementView');
    } finally {
        hideSpinner('taskManagementView');
    }
}

/**
 * Menangani pembaruan tugas
 * @param {Object} formData - Data tugas dari form
 */
async function handleUpdateTask(formData) {
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'taskManagementView');
        handleLogout();
        return;
    }

    try {
        showSpinner('taskManagementView', 'Memperbarui tugas...');

        const taskId = formData.id;
        if (!taskId) {
            throw new Error('ID tugas tidak valid');
        }

        // Hapus ID dari data yang akan dikirim
        const { id, ...updateData } = formData;

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updateData)
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.', 'error', 'taskManagementView');
            handleLogout();
            return;
        }

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (error) {
            throw new Error('Format respons tidak valid');
        }

        if (!response.ok) {
            throw new Error(result?.message || `Gagal memperbarui tugas: ${response.status}`);
        }

        showNotification(result.message || 'Tugas berhasil diperbarui', 'success', 'taskManagementView');
        loadTasks(); // Muat ulang daftar tugas

    } catch (error) {
        showNotification(`Gagal memperbarui tugas: ${error.message}`, 'error', 'taskManagementView');
    } finally {
        hideSpinner('taskManagementView');
    }
}

/**
 * Memuat daftar tugas dari API.
 */
async function loadTasks() {
    const taskManagementView = document.getElementById('taskManagementView');
    if (!taskManagementView) {
        return;
    }

    showSpinner('taskManagementView', 'Memuat tugas...');
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'taskManagementView');
        handleLogout(); // Logout jika tidak ada token
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.', 'error', 'taskManagementView');
            handleLogout();
            return;
        }

        // Baca response text terlebih dahulu untuk memeriksa validitas JSON
        const responseText = await response.text();

        let result;
        try {
            // Parse manual setelah kita memiliki teks respons
            result = JSON.parse(responseText);
        } catch (parseError) {
            // Coba bersihkan teks respons dari karakter yang bermasalah
            let cleanedText = responseText.replace(/[\x00-\x1F\x7F]/g, '');
            try {
                result = JSON.parse(cleanedText);
            } catch (secondParseError) {
                throw new Error(`Respons server mengandung format JSON yang tidak valid: ${parseError.message}`);
            }
        }

        if (!response.ok) {
            throw new Error(result?.message || `Gagal memuat tugas: ${response.status}`);
        }

        // Cek struktur data yang diterima
        if (result.status === 'success' && result.data) {
            // Cek jika ada data.data (struktur pagination Laravel)
            const tasks = result.data.data ? result.data.data : result.data;
            renderTasks(tasks);
        } else {
            throw new Error(result.message || 'Format data tugas tidak sesuai.');
        }

    } catch (error) {
        showNotification(`Gagal memuat daftar tugas: ${error.message}`, 'error', 'taskManagementView');
        taskManagementView.innerHTML = `<div class="alert alert-danger">
            <h4>Gagal memuat tugas</h4>
            <p>${error.message || 'Tidak dapat mengambil data tugas saat ini.'}</p>
            <button class="btn btn-outline-danger" onclick="loadTasks()">Coba Lagi</button>
        </div>`;
    }
}

/**
 * Merender daftar tugas ke dalam DOM.
 * @param {Array<Object>} tasks - Array objek tugas yang akan dirender.
 */
function renderTasks(tasks) {
    const taskManagementView = document.getElementById('taskManagementView');
    if (!taskManagementView) return;

    // Hapus spinner sebelum render (jika belum hilang oleh innerHTML overwrite)
    hideSpinner('taskManagementView');

    if (!tasks || tasks.length === 0) {
        taskManagementView.innerHTML = `
            <div class="alert alert-info">
                <p class="text-center mb-3">Belum ada tugas yang ditambahkan.</p>
                <div class="text-center">
                    <button class="btn btn-primary" id="addTaskButtonEmpty">
                        <i class="bi bi-plus-circle-fill"></i> Tambah Tugas Baru
                    </button>
                </div>
            </div>`;

        // Tambahkan event listener untuk tombol tambah tugas kosong
        const addTaskButtonEmpty = document.getElementById('addTaskButtonEmpty');
        if (addTaskButtonEmpty) {
            addTaskButtonEmpty.addEventListener('click', () => {
                showAddTaskForm();
            });
        }
        return;
    }

    // Tambahkan tombol Export CSV untuk semua role
    let exportCsvBtnHtml = `<button class="btn btn-success ms-2" id="exportCsvButton"><i class="bi bi-file-earmark-spreadsheet"></i> Export CSV</button>`;
    let tasksHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Daftar Tugas</h3>
            <div>
                <button class="btn btn-primary" id="addTaskButtonRendered">
                    <i class="bi bi-plus-circle-fill"></i> Tambah Tugas
                </button>
                ${exportCsvBtnHtml}
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th width="5%">No</th>
                        <th width="20%">Judul</th>
                        <th width="25%">Deskripsi</th>
                        <th width="10%">Status</th>
                        <th width="10%">Tenggat Waktu</th>
                        <th width="15%">Pengguna</th>
                        <th width="15%">Aksi</th>
                    </tr>
                </thead>
                <tbody id="taskTableBody">
    `;

    tasks.forEach((task, index) => {
        // Pastikan ada ID untuk setiap baris
        const rowId = `task-row-${index}`;

        // Nomor urut (1-based)
        const rowNumber = index + 1;

        // Cek dan ambil data yang diperlukan dengan aman
        const taskId = task.id || 'unknown';
        const title = task.title || 'Tanpa Judul';
        const description = task.description || '';
        const status = task.status || 'pending';
        const dueDate = task.due_date || task.deadline || null;

        // Format tanggal tenggat waktu
        const deadline = dueDate ? new Date(dueDate).toLocaleDateString('id-ID') : '-';

        // Cari nama pengguna yang ditugaskan
        let userName = 'N/A';
        if (task.assigned_to && task.assigned_to.name) {
            userName = task.assigned_to.name;
        } else if (task.assignedTo && task.assignedTo.name) {
            userName = task.assignedTo.name;
        } else if (task.user && task.user.name) {
            userName = task.user.name;
        }

        // Tentukan kelas badge berdasarkan status
        let statusBadgeClass = 'badge bg-secondary';
        let statusText = status;

        if (status === 'completed' || status === 'done') {
            statusBadgeClass = 'badge bg-success';
            statusText = 'Selesai';
        } else if (status === 'pending') {
            statusBadgeClass = 'badge bg-warning text-dark';
            statusText = 'Menunggu';
        } else if (status === 'in_progress') {
            statusBadgeClass = 'badge bg-info text-dark';
            statusText = 'Dalam Proses';
        } else if (status === 'overdue') {
            statusBadgeClass = 'badge bg-danger';
            statusText = 'Terlambat';
        }

        // Truncate description jika terlalu panjang
        const truncatedDescription = description
            ? (description.length > 50 ? description.substring(0, 50) + '...' : description)
            : '-';

        tasksHtml += `
            <tr id="${rowId}" data-task-id="${taskId}">
                <td>${rowNumber}</td>
                <td>${title}</td>
                <td>${truncatedDescription}</td>
                <td><span class="${statusBadgeClass}">${statusText}</span></td>
                <td>${deadline}</td>
                <td>${userName}</td>
                <td class="task-actions" data-task-index="${index}">
                    <button class="btn btn-sm btn-outline-primary me-1 edit-task-btn" data-task-id="${taskId}">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger me-1 delete-task-btn" data-task-id="${taskId}">
                        <i class="bi bi-trash"></i> Hapus
                    </button>
                    ${status !== 'completed' && status !== 'done' ? `
                        <button class="btn btn-sm btn-outline-success complete-task-btn" data-task-id="${taskId}">
                            <i class="bi bi-check-circle"></i> Selesai
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    tasksHtml += `
                </tbody>
            </table>
        </div>
    `;

    taskManagementView.innerHTML = tasksHtml;

    // Tambahkan event listener untuk tombol "Tambah Tugas" yang baru dirender
    const addTaskButtonRendered = document.getElementById('addTaskButtonRendered');
    if (addTaskButtonRendered) {
        addTaskButtonRendered.addEventListener('click', () => {
            showAddTaskForm();
        });
    }

    // Tambahkan event listener untuk tombol aksi di setiap baris menggunakan event delegation
    const taskTableBody = document.getElementById('taskTableBody');
    if (taskTableBody) {
        taskTableBody.addEventListener('click', async (event) => {
            const target = event.target.closest('button');
            if (!target) return;

            const taskId = target.getAttribute('data-task-id');
            if (!taskId) return;

            if (target.classList.contains('edit-task-btn')) {
                await showEditTaskForm(taskId);
            } else if (target.classList.contains('delete-task-btn')) {
                if (confirm('Anda yakin ingin menghapus tugas ini?')) {
                    await deleteTask(taskId);
                }
            } else if (target.classList.contains('complete-task-btn')) {
                await updateTaskStatus(taskId, 'done');
            }
        });
    }

    // Setelah render, tambahkan event listener untuk tombol Export CSV
    const exportBtn = document.getElementById('exportCsvButton');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportCsv);
    }
}

/**
 * Menghapus tugas berdasarkan ID.
 * @param {number} taskId - ID tugas yang akan dihapus.
 */
async function deleteTask(taskId) {
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi Anda berakhir. Silakan login kembali.', 'error', 'taskManagementView');
        handleLogout();
        return;
    }

    showSpinner('taskManagementView', 'Menghapus tugas...');

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.status === 401) {
            showNotification('Sesi tidak valid. Login kembali.', 'error', 'taskManagementView');
            handleLogout();
            return;
        }

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (error) {
            throw new Error('Format respons tidak valid');
        }

        if (!response.ok || result.status !== 'success') {
            throw new Error(result.message || `Gagal menghapus tugas: ${response.status}`);
        }

        showNotification(result.message || 'Tugas berhasil dihapus.', 'success', 'taskManagementView');
        loadTasks(); // Muat ulang daftar tugas
    } catch (error) {
        showNotification(`Gagal menghapus tugas: ${error.message}`, 'error', 'taskManagementView');
    } finally {
        hideSpinner('taskManagementView');
    }
}

/**
 * Memperbarui status tugas.
 * @param {string} taskId - ID tugas yang akan diperbarui.
 * @param {string} newStatus - Status baru untuk tugas ('pending', 'in_progress', 'done').
 */
async function updateTaskStatus(taskId, newStatus) {
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi Anda berakhir. Silakan login kembali.', 'error', 'taskManagementView');
        handleLogout();
        return;
    }

    try {
        showSpinner('taskManagementView', `Memperbarui status tugas menjadi ${newStatus}...`);

        // Pastikan status valid
        const validStatus = ['pending', 'in_progress', 'done'];
        if (!validStatus.includes(newStatus)) {
            newStatus = 'done'; // Default ke done jika tidak valid
        }

        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.status === 401) {
            showNotification('Sesi tidak valid. Login kembali.', 'error', 'taskManagementView');
            handleLogout();
            return;
        }

        // Baca response text terlebih dahulu untuk memeriksa validitas JSON
        const responseText = await response.text();

        let result;
        try {
            // Parse manual setelah kita memiliki teks respons
            result = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(`Respons server mengandung format JSON yang tidak valid: ${parseError.message}`);
        }

        if (!response.ok) {
            throw new Error(result?.message || `Gagal memperbarui status tugas: ${response.status}`);
        }

        showNotification(result.message || 'Status tugas berhasil diperbarui.', 'success', 'taskManagementView');

        // Muat ulang daftar tugas
        loadTasks();

    } catch (error) {
        showNotification(`Gagal memperbarui status tugas: ${error.message}`, 'error', 'taskManagementView');
    }
}

// Fungsi lain yang mungkin dibutuhkan:
// - showTaskDetailModal(taskId)
// - handleCreateTask(formData)
// - handleUpdateTask(taskId, formData) 