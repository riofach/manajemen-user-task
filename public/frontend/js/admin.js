// Logika spesifik untuk halaman admin (manajemen User dan Log Aktivitas)

/**
 * Memuat daftar pengguna dari API.
 * Hanya dapat diakses oleh admin.
 */
async function loadUsers() {
    const userManagementView = document.getElementById('userManagementView');
    if (!userManagementView) {
        console.error('User management view element not found.');
        return;
    }

    showSpinner('userManagementView', 'Memuat data pengguna...');
    const authToken = getAuthToken();
    const currentUser = getUserData();

    if (!authToken) {
        showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'userManagementView');
        handleLogout();
        return;
    }

    // Hanya admin dan manager yang boleh mengakses manajemen pengguna
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
        showNotification('Akses ditolak. Hanya admin dan manager yang dapat melihat halaman ini.', 'error', 'userManagementView');
        userManagementView.innerHTML = '<p class="text-danger p-3">Akses Ditolak.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid. Silakan login kembali.', 'error', 'userManagementView');
            handleLogout();
            return;
        }

        if (response.status === 403) { // Forbidden
            showNotification('Anda tidak memiliki izin untuk mengakses data pengguna.', 'error', 'userManagementView');
            userManagementView.innerHTML = '<p class="text-danger p-3">Akses Ditolak (403).</p>';
            return;
        }

        const responseText = await response.text();

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error(`Respons server mengandung format JSON yang tidak valid: ${parseError.message}`);
        }

        if (!response.ok) {
            throw new Error(result?.message || `Gagal memuat pengguna: ${response.status}`);
        }

        if (result.status === 'success' && result.data) {
            const users = result.data.data ? result.data.data : result.data;
            renderUsers(users);
        } else {
            throw new Error(result.message || 'Format data pengguna tidak sesuai.');
        }

    } catch (error) {
        console.error('Error loading users:', error);
        showNotification(`Gagal memuat daftar pengguna: ${error.message}`, 'error', 'userManagementView');
        userManagementView.innerHTML = `<div class="alert alert-danger">
            <h4>Gagal memuat data pengguna</h4>
            <p>${error.message || 'Tidak dapat mengambil data pengguna saat ini.'}</p>
            <button class="btn btn-outline-danger" onclick="loadUsers()">Coba Lagi</button>
        </div>`;
    } finally {
        hideSpinner('userManagementView');
    }
}

/**
 * Merender daftar pengguna ke dalam DOM.
 * @param {Array<Object>} users - Array objek pengguna.
 */
function renderUsers(users) {
    const userManagementView = document.getElementById('userManagementView');
    if (!userManagementView) return;

    hideSpinner('userManagementView');

    const currentUser = getUserData();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isManager = currentUser && currentUser.role === 'manager';

    if (!users || users.length === 0) {
        userManagementView.innerHTML = `
            <div class="alert alert-info">
                <p class="text-center mb-3">Belum ada pengguna yang terdaftar.</p>
                ${isAdmin ? `
                <div class="text-center">
                    <button class="btn btn-primary" id="addUserButtonEmpty">
                        <i class="bi bi-person-plus-fill"></i> Tambah Pengguna Baru
                    </button>
                </div>
                ` : ''}
            </div>`;

        if (isAdmin) {
            const addUserButtonEmpty = document.getElementById('addUserButtonEmpty');
            if (addUserButtonEmpty) {
                addUserButtonEmpty.addEventListener('click', () => {
                    showAddUserForm();
                });
            }
        }
        return;
    }

    let usersHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Manajemen Pengguna</h3>
            ${isAdmin ? `
            <button class="btn btn-success" id="addUserButton"> 
                <i class="bi bi-person-plus-fill"></i> Tambah Pengguna
            </button>
            ` : ''}
        </div>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead class="table-light">
                    <tr>
                        <th width="5%">No</th>
                        <th width="25%">Nama</th>
                        <th width="25%">Email</th>
                        <th width="10%">Role</th>
                        <th width="10%">Status</th>
                        <th width="25%">Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;

    users.forEach((user, index) => {
        const userId = user.id || 'unknown';
        const name = user.name || 'Tanpa Nama';
        const email = user.email || '-';
        const role = user.role || 'staff';
        const status = user.status !== undefined ? (user.status ? 'Aktif' : 'Nonaktif') : 'Tidak diketahui';

        let roleBadgeClass = 'badge bg-secondary';
        if (role === 'admin') {
            roleBadgeClass = 'badge bg-danger';
        } else if (role === 'manager') {
            roleBadgeClass = 'badge bg-primary';
        } else if (role === 'staff') {
            roleBadgeClass = 'badge bg-info text-dark';
        }

        let statusBadgeClass = user.status ? 'badge bg-success' : 'badge bg-danger';

        let actionButtons = '';

        if (isAdmin) {
            const isSelf = currentUser.id === userId;
            actionButtons = `
                <button class="btn btn-sm btn-outline-primary me-1 edit-user-btn" data-user-id="${userId}">
                    <i class="bi bi-pencil-square"></i> Edit
                </button>
                ${!isSelf ? `
                <button class="btn btn-sm btn-outline-danger me-1 delete-user-btn" data-user-id="${userId}">
                    <i class="bi bi-trash"></i> Hapus
                </button>
                <button class="btn btn-sm btn-outline-${user.status ? 'warning' : 'success'} toggle-status-btn" data-user-id="${userId}" data-status="${user.status ? '1' : '0'}">
                    <i class="bi bi-${user.status ? 'x-circle' : 'check-circle'}"></i> ${user.status ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                ` : ''}
            `;
        } else if (isManager) {
            if (role === 'staff') {
                actionButtons = `
                    <button class="btn btn-sm btn-outline-primary me-1 edit-user-btn" data-user-id="${userId}">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-${user.status ? 'warning' : 'success'} toggle-status-btn" data-user-id="${userId}" data-status="${user.status ? '1' : '0'}">
                        <i class="bi bi-${user.status ? 'x-circle' : 'check-circle'}"></i> ${user.status ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                `;
            } else if (currentUser.id === userId) {
                actionButtons = `
                    <button class="btn btn-sm btn-outline-primary me-1 edit-user-btn" data-user-id="${userId}">
                        <i class="bi bi-pencil-square"></i> Edit
                    </button>
                `;
            } else {
                actionButtons = `<span class="text-muted">Tidak ada akses</span>`;
            }
        }

        usersHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${name}</td>
                <td>${email}</td>
                <td><span class="${roleBadgeClass}">${role}</span></td>
                <td><span class="${statusBadgeClass}">${status}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });

    usersHtml += `
                </tbody>
            </table>
        </div>
    `;
    userManagementView.innerHTML = usersHtml;

    if (isAdmin) {
        const addUserButton = document.getElementById('addUserButton');
        if (addUserButton) {
            addUserButton.addEventListener('click', () => {
                showAddUserForm();
            });
        }
    }

    const userTable = userManagementView.querySelector('table tbody');
    if (userTable) {
        userTable.addEventListener('click', async (event) => {
            const target = event.target.closest('button');
            if (!target) return;

            const userId = target.getAttribute('data-user-id');
            if (!userId) return;

            if (target.classList.contains('edit-user-btn')) {
                await showEditUserForm(userId);
            } else if (target.classList.contains('delete-user-btn')) {
                if (confirm(`Anda yakin ingin menghapus pengguna ini?`)) {
                    await deleteUser(userId);
                }
            } else if (target.classList.contains('toggle-status-btn')) {
                const currentStatus = target.getAttribute('data-status') === '1';
                await toggleUserStatus(userId, !currentStatus);
            }
        });
    }
}

/**
 * Menampilkan form untuk menambahkan pengguna baru
 */
function showAddUserForm() {
    showUserFormModal('Tambah Pengguna Baru', null, handleCreateUser, loadUsers);
}

/**
 * Menampilkan form untuk mengedit pengguna
 * @param {string} userId - ID pengguna yang akan diedit
 */
async function showEditUserForm(userId) {
    try {
        showSpinner('userManagementView', 'Memuat data pengguna...');
        const authToken = getAuthToken();
        const currentUser = getUserData();

        if (!authToken) {
            showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'userManagementView');
            handleLogout();
            return;
        }

        const isAdmin = currentUser && currentUser.role === 'admin';
        const isManager = currentUser && currentUser.role === 'manager';
        const isSelf = currentUser && currentUser.id === userId;

        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.', 'error', 'userManagementView');
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
            throw new Error(result?.message || `Gagal memuat detail pengguna: ${response.status}`);
        }

        const userData = result.data;
        if (!userData) {
            throw new Error('Data pengguna tidak ditemukan');
        }

        if (isManager && !isAdmin && !isSelf && userData.role !== 'staff') {
            showNotification('Anda hanya dapat mengedit pengguna dengan role staff atau diri Anda sendiri.', 'error', 'userManagementView');
            hideSpinner('userManagementView');
            return;
        }

        const updateCallback = (formData) => {
            if (isManager && !isAdmin && userData.role === 'staff') {
                if (formData.role !== 'staff') {
                    formData.role = 'staff';
                }
            }

            handleUpdateUser(formData);
        };

        showUserFormModal('Edit Pengguna', userData, updateCallback, loadUsers);

    } catch (error) {
        console.error('Error loading user details:', error);
        showNotification(`Gagal memuat detail pengguna: ${error.message}`, 'error', 'userManagementView');
    } finally {
        hideSpinner('userManagementView');
    }
}

/**
 * Mengganti status pengguna (aktif/nonaktif)
 * @param {string} userId - ID pengguna yang akan diubah statusnya
 * @param {boolean} newStatus - Status baru (true=aktif, false=nonaktif)
 */
async function toggleUserStatus(userId, newStatus) {
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'userManagementView');
        handleLogout();
        return;
    }

    try {
        showSpinner('userManagementView', `Mengubah status pengguna menjadi ${newStatus ? 'aktif' : 'nonaktif'}...`);

        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'X-HTTP-Method-Override': 'PATCH'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid. Silakan login kembali.', 'error', 'userManagementView');
            handleLogout();
            return;
        }

        const responseText = await response.text();

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error(`Respons server mengandung format JSON yang tidak valid: ${parseError.message}`);
        }

        if (!response.ok) {
            throw new Error(result?.message || `Gagal mengubah status pengguna: ${response.status}`);
        }

        showNotification(result.message || 'Status pengguna berhasil diperbarui.', 'success', 'userManagementView');
        loadUsers();

    } catch (error) {
        console.error('Error updating user status:', error);
        showNotification(`Gagal mengubah status pengguna: ${error.message}`, 'error', 'userManagementView');
    } finally {
        hideSpinner('userManagementView');
    }
}

/**
 * Menangani pembuatan pengguna baru
 * @param {Object} formData - Data pengguna dari form
 */
async function handleCreateUser(formData) {
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'userManagementView');
        handleLogout();
        return;
    }

    try {
        showSpinner('userManagementView', 'Menyimpan pengguna baru...');

        const dataToSend = { ...formData };
        if (dataToSend.password) {
            dataToSend.password_confirmation = dataToSend.password;
        }

        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(dataToSend)
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.', 'error', 'userManagementView');
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
            if (result?.errors) {
                const errorMessages = Object.values(result.errors).flat().join('\n');
                throw new Error(`Validasi gagal: ${errorMessages}`);
            }
            throw new Error(result?.message || `Gagal membuat pengguna: ${response.status}`);
        }

        showNotification(result.message || 'Pengguna berhasil dibuat', 'success', 'userManagementView');
        loadUsers();

    } catch (error) {
        console.error('Error creating user:', error);
        showNotification(`Gagal membuat pengguna: ${error.message}`, 'error', 'userManagementView');
    } finally {
        hideSpinner('userManagementView');
    }
}

/**
 * Menangani pembaruan pengguna
 * @param {Object} formData - Data pengguna dari form
 */
async function handleUpdateUser(formData) {
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'userManagementView');
        handleLogout();
        return;
    }

    try {
        showSpinner('userManagementView', 'Memperbarui pengguna...');

        const userId = formData.id;
        if (!userId) {
            throw new Error('ID pengguna tidak valid');
        }

        const { id, ...updateData } = formData;

        if (!updateData.password) {
            delete updateData.password;
        }

        if (updateData.password) {
            updateData.password_confirmation = updateData.password;
        }

        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'X-HTTP-Method-Override': 'PATCH'
            },
            body: JSON.stringify(updateData)
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.', 'error', 'userManagementView');
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
            throw new Error(result?.message || `Gagal memperbarui pengguna: ${response.status}`);
        }

        showNotification(result.message || 'Pengguna berhasil diperbarui', 'success', 'userManagementView');
        loadUsers();

    } catch (error) {
        console.error('Error updating user:', error);
        showNotification(`Gagal memperbarui pengguna: ${error.message}`, 'error', 'userManagementView');
    } finally {
        hideSpinner('userManagementView');
    }
}

/**
 * Menghapus pengguna berdasarkan ID.
 * @param {string} userId - ID pengguna yang akan dihapus.
 */
async function deleteUser(userId) {
    const authToken = getAuthToken();
    if (!authToken) {
        showNotification('Sesi berakhir. Login kembali.', 'error', 'userManagementView');
        handleLogout();
        return;
    }

    showSpinner('userManagementView', 'Menghapus pengguna...');

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid. Silakan login kembali.', 'error', 'userManagementView');
            handleLogout();
            return;
        }

        if (response.status === 403) {
            showNotification('Anda tidak diizinkan menghapus pengguna ini.', 'error', 'userManagementView');
            loadUsers();
            return;
        }

        const responseText = await response.text();

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error(`Respons server mengandung format JSON yang tidak valid: ${parseError.message}`);
        }

        if (!response.ok) {
            throw new Error(result?.message || `Error: ${response.status}`);
        }

        showNotification(result.message || 'Pengguna berhasil dihapus.', 'success', 'userManagementView');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification(`Gagal menghapus pengguna: ${error.message}`, 'error', 'userManagementView');
    } finally {
        hideSpinner('userManagementView');
    }
}

/**
 * Memuat log aktivitas dari API.
 * Hanya dapat diakses oleh admin.
 */
async function loadActivityLogs() {
    const activityLogsView = document.getElementById('activityLogsView');
    if (!activityLogsView) {
        console.error('Activity logs view element not found.');
        return;
    }

    showSpinner('activityLogsView', 'Memuat log aktivitas...');
    const authToken = getAuthToken();
    const currentUser = getUserData();

    if (!authToken || !currentUser || currentUser.role !== 'admin') {
        showNotification('Akses ditolak. Hanya admin yang dapat melihat log aktivitas.', 'error', 'activityLogsView');
        if (!authToken) handleLogout();
        else activityLogsView.innerHTML = '<p class="text-danger p-3">Akses Ditolak.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/logs`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.status === 401) {
            showNotification('Sesi Anda tidak valid. Silakan login kembali.', 'error', 'activityLogsView');
            handleLogout();
            return;
        }

        if (response.status === 403) {
            showNotification('Anda tidak diizinkan mengakses log.', 'error', 'activityLogsView');
            activityLogsView.innerHTML = '<p class="text-danger p-3">Akses Ditolak (403).</p>';
            return;
        }

        const responseText = await response.text();

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error(`Respons server mengandung format JSON yang tidak valid: ${parseError.message}`);
        }

        if (!response.ok) {
            throw new Error(result?.message || `Gagal memuat log: ${response.status}`);
        }

        if (result.status === 'success' && result.data) {
            const logs = result.data.data ? result.data.data : result.data;
            renderActivityLogs(logs);
        } else {
            throw new Error(result.message || 'Format data log tidak sesuai.');
        }

    } catch (error) {
        console.error('Error loading activity logs:', error);
        showNotification(`Gagal memuat log aktivitas: ${error.message}`, 'error', 'activityLogsView');
        activityLogsView.innerHTML = `<div class="alert alert-danger">
            <h4>Gagal memuat log aktivitas</h4>
            <p>${error.message || 'Tidak dapat mengambil data log saat ini.'}</p>
            <button class="btn btn-outline-danger" onclick="loadActivityLogs()">Coba Lagi</button>
        </div>`;
    } finally {
        hideSpinner('activityLogsView');
    }
}

/**
 * Merender log aktivitas ke dalam DOM.
 * @param {Array<Object>} logs - Array objek log.
 */
function renderActivityLogs(logs) {
    const activityLogsView = document.getElementById('activityLogsView');
    if (!activityLogsView) return;

    hideSpinner('activityLogsView');

    if (!logs || logs.length === 0) {
        activityLogsView.innerHTML = '<p class="text-center p-3">Tidak ada aktivitas yang tercatat.</p>';
        return;
    }

    let logsHtml = `
        <h3 class="mb-3">Log Aktivitas Sistem</h3>
        <div class="table-responsive">
            <table class="table table-sm table-striped table-bordered">
                <thead class="table-dark text-center">
                    <tr>
                        <th class="text-black">No</th>
                        <th class="text-black">Deskripsi</th>
                        <th class="text-black">Pengguna</th>
                        <th class="text-black">Waktu</th>
                    </tr>
                </thead>
                <tbody>
    `;

    logs.forEach((log, index) => {
        const createdAt = log.logged_at || log.created_at;
        const formattedDate = createdAt ? new Date(createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

        let userName = 'Sistem';
        if (log.user && log.user.name) {
            userName = log.user.name;
        } else if (log.causer && log.causer.name) {
            userName = log.causer.name;
        } else if (log.user_id || log.causer_id) {
            userName = `ID: ${log.user_id || log.causer_id}`;
        }

        logsHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${log.description || log.action || '-'}</td>
                <td>${userName}</td>
                <td>${formattedDate}</td>
            </tr>
        `;
    });

    logsHtml += `
                </tbody>
            </table>
        </div>
    `;
    activityLogsView.innerHTML = logsHtml;
}

function setupModalListeners() {
    const userFormModal = document.getElementById('userFormModal');
    if (userFormModal) {
        userFormModal.querySelector('.close').addEventListener('click', () => {
            closeModal('userFormModal');
            loadUsers();
        });
        userFormModal.querySelector('.btn-secondary').addEventListener('click', () => {
            closeModal('userFormModal');
            loadUsers();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupModalListeners();
});