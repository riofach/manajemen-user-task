// Fungsi-fungsi bantuan untuk UI (notifikasi, modal, dll.) 

/**
 * Menampilkan notifikasi sederhana (alert) di bagian atas halaman atau area tertentu.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {string} type - Jenis notifikasi ('success', 'error', 'warning', 'info'). Default: 'info'.
 * @param {string} [targetElementId=null] - ID elemen tempat notifikasi akan dimasukkan. Jika null, dibuat elemen baru.
 * @param {number} [duration=5000] - Durasi tampilan notifikasi dalam milidetik. 0 untuk permanen.
 */
function showNotification(message, type = 'info', targetElementId = null, duration = 5000) {
    // Hapus notifikasi lama jika ada
    const existingNotification = document.getElementById('dynamicNotification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.id = 'dynamicNotification';
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    let container;
    if (targetElementId && document.getElementById(targetElementId)) {
        container = document.getElementById(targetElementId);
        // Tambahkan style agar notifikasi selalu di atas dalam container relatifnya jika perlu
        alertDiv.style.position = 'sticky';
        alertDiv.style.top = '10px';
        alertDiv.style.zIndex = '1050'; // Pastikan di atas elemen lain
        container.prepend(alertDiv);
    } else {
        // Jika tidak ada target spesifik, tampilkan di atas body (bisa diatur lebih baik)
        // Untuk contoh ini, kita buat container di atas body
        container = document.body;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translateX(-50%)';
        alertDiv.style.zIndex = '1050';
        container.prepend(alertDiv);
    }

    if (duration > 0) {
        setTimeout(() => {
            // Gunakan Bootstrap API untuk menutup alert jika memungkinkan, atau remove manual
            const bsAlert = bootstrap.Alert.getInstance(alertDiv);
            if (bsAlert) {
                bsAlert.close();
            } else {
                alertDiv.remove();
            }
        }, duration);
    }
}

/**
 * Menampilkan spinner loading pada elemen tertentu.
 * @param {string} elementId - ID elemen tempat spinner akan ditampilkan.
 * @param {string} [spinnerText='Loading...'] - Teks yang akan ditampilkan bersama spinner (opsional).
 */
function showSpinner(elementId, spinnerText = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        // Hapus spinner lama jika ada
        const oldSpinner = element.querySelector('.loading-spinner-container');
        if (oldSpinner) oldSpinner.remove();

        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'loading-spinner-container text-center p-3';
        spinnerContainer.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">${spinnerText}</span>
            </div>
            ${spinnerText ? `<p class="mt-2">${spinnerText}</p>` : ''}
        `;
        element.innerHTML = ''; // Kosongkan elemen sebelum menambahkan spinner
        element.appendChild(spinnerContainer);
    }
}

/**
 * Menyembunyikan (menghapus) spinner loading dari elemen tertentu.
 * Biasanya dipanggil setelah konten selesai dimuat ke dalam elemen tersebut.
 * @param {string} elementId - ID elemen yang berisi spinner.
 */
function hideSpinner(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const spinner = element.querySelector('.loading-spinner-container');
        if (spinner) {
            spinner.remove();
        }
    }
}

/**
 * Helper untuk membuat elemen Tombol Aksi (misal Edit, Delete) untuk tabel.
 * @param {string} label - Teks pada tombol.
 * @param {string} btnClass - Kelas Bootstrap untuk tombol (e.g., 'btn-primary', 'btn-sm').
 * @param {string} iconClass - Kelas ikon Bootstrap (e.g., 'bi-pencil-fill').
 * @param {function} onClickAction - Fungsi yang akan dipanggil saat tombol diklik.
 * @returns {HTMLButtonElement} - Elemen tombol yang sudah dibuat.
 */
function createActionButton(label, btnClass, iconClass, onClickAction) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${btnClass} me-1`;
    button.innerHTML = `<i class="${iconClass}"></i> ${label}`;
    button.addEventListener('click', onClickAction);
    return button;
}

/**
 * Membuat dan menampilkan modal untuk form tambah/edit tugas
 * @param {string} title - Judul modal (Tambah/Edit Tugas)
 * @param {Object} taskData - Data tugas untuk edit (null jika tambah baru)
 * @param {Function} submitCallback - Fungsi yang dipanggil saat form disubmit
 * @param {Function} [onCloseCallback=null] - Fungsi yang dipanggil setelah modal ditutup (batal/X/submit)
 */
function showTaskFormModal(title, taskData = null, submitCallback, onCloseCallback = null) {
    // Hapus modal lama jika ada
    const existingModal = document.getElementById('taskFormModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Buat elemen modal
    const modalDiv = document.createElement('div');
    modalDiv.id = 'taskFormModal';
    modalDiv.className = 'modal fade';
    modalDiv.setAttribute('tabindex', '-1');
    modalDiv.setAttribute('role', 'dialog');
    modalDiv.setAttribute('aria-labelledby', 'taskFormModalLabel');

    // Tentukan nilai default untuk form
    const taskId = taskData?.id || '';
    const taskTitle = taskData?.title || '';
    const taskDescription = taskData?.description || '';
    const taskStatus = taskData?.status || 'pending';
    const taskDueDate = taskData?.due_date || '';

    // Format due date untuk input type date (YYYY-MM-DD)
    let formattedDueDate = '';
    if (taskDueDate) {
        try {
            const dueDate = new Date(taskDueDate);
            formattedDueDate = dueDate.toISOString().split('T')[0];
        } catch (e) {
            console.error('Error formatting due date:', e);
        }
    }

    // Buat HTML untuk modal
    modalDiv.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="taskFormModalLabel">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="taskForm">
                        <input type="hidden" id="taskId" value="${taskId}">
                        
                        <div class="mb-3">
                            <label for="taskTitle" class="form-label">Judul Tugas</label>
                            <input type="text" class="form-control" id="taskTitle" value="${taskTitle}" required>
                            <div class="invalid-feedback">Judul tugas harus diisi.</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="taskDescription" class="form-label">Deskripsi</label>
                            <textarea class="form-control" id="taskDescription" rows="3">${taskDescription}</textarea>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="taskStatus" class="form-label">Status</label>
                                <select class="form-select" id="taskStatus">
                                    <option value="pending" ${taskStatus === 'pending' ? 'selected' : ''}>Menunggu</option>
                                    <option value="in_progress" ${taskStatus === 'in_progress' ? 'selected' : ''}>Dalam Proses</option>
                                    <option value="done" ${taskStatus === 'done' ? 'selected' : ''}>Selesai</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="taskDueDate" class="form-label">Tenggat Waktu</label>
                                <input type="date" class="form-control" id="taskDueDate" value="${formattedDueDate}">
                            </div>
                        </div>
                        
                        <div class="mb-3" id="assignedToContainer">
                            <!-- Dropdown untuk assigned_to akan diisi secara dinamis jika user adalah admin/manager -->
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="button" class="btn btn-primary" id="saveTaskButton">Simpan</button>
                </div>
            </div>
        </div>
    `;

    // Tambahkan modal ke body
    document.body.appendChild(modalDiv);

    // Inisialisasi modal Bootstrap
    const modalElement = document.getElementById('taskFormModal');
    const modal = new bootstrap.Modal(modalElement);

    // Event listener untuk tombol simpan
    const saveButton = document.getElementById('saveTaskButton');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            // Validasi form
            const form = document.getElementById('taskForm');
            if (!form.checkValidity()) {
                // Tampilkan pesan error
                form.classList.add('was-validated');
                return;
            }

            // Ambil nilai form
            const formData = {
                id: document.getElementById('taskId').value,
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDescription').value,
                status: document.getElementById('taskStatus').value,
                due_date: document.getElementById('taskDueDate').value || null
            };

            // Tambahkan assigned_to_id jika ada
            const assignedToSelect = document.getElementById('assignedToSelect');
            if (assignedToSelect) {
                formData.assigned_to_id = assignedToSelect.value || null;
            }

            // Panggil callback dengan data form
            submitCallback(formData);

            // Tutup modal
            modal.hide();
        });
    }

    // Tambahkan event listener untuk menangani penutupan modal
    modalElement.addEventListener('hidden.bs.modal', function () {
        modalElement.remove();
        if (typeof onCloseCallback === 'function') onCloseCallback();
    });

    // Tampilkan modal
    modal.show();

    // Jika user adalah admin, load daftar user untuk assigned_to
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && (userData.role === 'admin' || userData.role === 'manager')) {
        loadUsersForAssignment(taskData?.assigned_to_id);
    }
}

/**
 * Memuat daftar pengguna untuk dropdown assigned_to
 * @param {string} selectedUserId - ID pengguna yang dipilih (untuk edit)
 */
async function loadUsersForAssignment(selectedUserId = null) {
    const assignedToContainer = document.getElementById('assignedToContainer');
    if (!assignedToContainer) return;

    const authToken = getAuthToken();
    if (!authToken) return;

    try {
        assignedToContainer.innerHTML = `
            <label for="assignedToSelect" class="form-label">Ditugaskan Kepada</label>
            <select class="form-select" id="assignedToSelect">
                <option value="">-- Pilih Pengguna --</option>
                <option value="loading" disabled>Memuat daftar pengguna...</option>
            </select>
        `;

        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Gagal memuat daftar pengguna');
        }

        const result = await response.json();
        if (result.status === 'success' && result.data) {
            const users = Array.isArray(result.data) ? result.data :
                (result.data.data ? result.data.data : []);

            const assignedToSelect = document.getElementById('assignedToSelect');
            if (assignedToSelect) {
                // Hapus option loading
                assignedToSelect.innerHTML = `<option value="">-- Pilih Pengguna --</option>`;

                // Tambahkan option untuk setiap user
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = `${user.name} (${user.email})`;
                    if (selectedUserId && user.id === selectedUserId) {
                        option.selected = true;
                    }
                    assignedToSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading users:', error);
        assignedToContainer.innerHTML = `
            <div class="alert alert-warning">
                Tidak dapat memuat daftar pengguna. Tugas akan ditugaskan kepada Anda.
            </div>
        `;
    }
}

/**
 * Membuat dan menampilkan modal untuk form tambah/edit pengguna
 * @param {string} title - Judul modal (Tambah/Edit Pengguna)
 * @param {Object} userData - Data pengguna untuk edit (null jika tambah baru)
 * @param {Function} submitCallback - Fungsi yang dipanggil saat form disubmit
 * @param {Function} [onCloseCallback=null] - Fungsi yang dipanggil setelah modal ditutup (batal/X/submit)
 */
function showUserFormModal(title, userData = null, submitCallback, onCloseCallback = null) {
    // Hapus modal lama jika ada
    const existingModal = document.getElementById('userFormModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Buat elemen modal
    const modalDiv = document.createElement('div');
    modalDiv.id = 'userFormModal';
    modalDiv.className = 'modal fade';
    modalDiv.setAttribute('tabindex', '-1');
    modalDiv.setAttribute('role', 'dialog');
    modalDiv.setAttribute('aria-labelledby', 'userFormModalLabel');

    // Tentukan nilai default untuk form
    const userId = userData?.id || '';
    const userName = userData?.name || '';
    const userEmail = userData?.email || '';
    const userRole = userData?.role || 'staff';
    const userStatus = userData?.status !== undefined ? userData.status : true;

    // Dapatkan data pengguna yang sedang login
    const currentUser = getUserData();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isManager = currentUser && currentUser.role === 'manager';
    const isSelf = currentUser && currentUser.id === userId;

    // Tentukan opsi role yang tersedia berdasarkan role pengguna yang login
    let roleOptions = '';
    if (isAdmin) {
        // Admin dapat mengubah role menjadi apa saja
        roleOptions = `
            <option value="admin" ${userRole === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="manager" ${userRole === 'manager' ? 'selected' : ''}>Manager</option>
            <option value="staff" ${userRole === 'staff' ? 'selected' : ''}>Staff</option>
        `;
    } else if (isManager) {
        if (isSelf) {
            // Manager tidak dapat mengubah rolenya sendiri
            roleOptions = `<option value="manager" selected disabled>Manager</option>`;
        } else if (userRole === 'staff') {
            // Manager hanya dapat melihat role staff untuk pengguna staff
            roleOptions = `<option value="staff" selected>Staff</option>`;
        } else {
            // Untuk kasus lain (seharusnya tidak terjadi), tampilkan role saat ini saja
            roleOptions = `<option value="${userRole}" selected disabled>${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</option>`;
        }
    } else {
        // Staff tidak seharusnya mengakses halaman ini
        roleOptions = `<option value="${userRole}" selected disabled>${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</option>`;
    }

    // Buat HTML untuk modal
    modalDiv.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="userFormModalLabel">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="userForm">
                        <input type="hidden" id="userId" value="${userId}">
                        
                        <div class="mb-3">
                            <label for="userName" class="form-label">Nama Pengguna</label>
                            <input type="text" class="form-control" id="userName" value="${userName}" required>
                            <div class="invalid-feedback">Nama pengguna harus diisi.</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="userEmail" class="form-label">Email</label>
                            <input type="email" class="form-control" id="userEmail" value="${userEmail}" required>
                            <div class="invalid-feedback">Email harus diisi dengan format yang benar.</div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="userRole" class="form-label">Role</label>
                                <select class="form-select" id="userRole" ${!isAdmin ? 'disabled' : ''}>
                                    ${roleOptions}
                                </select>
                                ${!isAdmin ? '<div class="form-text text-muted">Hanya admin yang dapat mengubah role.</div>' : ''}
                            </div>
                            <div class="col-md-6">
                                <label for="userStatus" class="form-label">Status</label>
                                <select class="form-select" id="userStatus" ${(!isAdmin && !isManager) || (isManager && !isSelf && userRole !== 'staff') ? 'disabled' : ''}>
                                    <option value="1" ${userStatus ? 'selected' : ''}>Aktif</option>
                                    <option value="0" ${!userStatus ? 'selected' : ''}>Nonaktif</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="userPassword" class="form-label">Password ${userData ? '(Kosongkan jika tidak ingin mengubah)' : ''}</label>
                            <input type="password" class="form-control" id="userPassword" ${!userData ? 'required' : ''}>
                            <div class="invalid-feedback">Password harus diisi.</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="userPasswordConfirmation" class="form-label">Konfirmasi Password</label>
                            <input type="password" class="form-control" id="userPasswordConfirmation" ${!userData ? 'required' : ''}>
                            <div class="invalid-feedback">Konfirmasi password harus sama dengan password.</div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="button" class="btn btn-primary" id="saveUserButton">Simpan</button>
                </div>
            </div>
        </div>
    `;

    // Tambahkan modal ke body
    document.body.appendChild(modalDiv);

    // Inisialisasi modal Bootstrap
    const modalElement = document.getElementById('userFormModal');
    const modal = new bootstrap.Modal(modalElement);

    // Event listener untuk tombol simpan
    const saveButton = document.getElementById('saveUserButton');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            // Validasi form
            const form = document.getElementById('userForm');
            if (!form.checkValidity()) {
                // Tampilkan pesan error
                form.classList.add('was-validated');
                return;
            }

            // Validasi password confirmation
            const password = document.getElementById('userPassword').value;
            const passwordConfirmation = document.getElementById('userPasswordConfirmation').value;

            if (password && password !== passwordConfirmation) {
                const passwordConfirmationInput = document.getElementById('userPasswordConfirmation');
                passwordConfirmationInput.classList.add('is-invalid');
                return;
            }

            // Ambil nilai form
            const formData = {
                id: document.getElementById('userId').value,
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                role: document.getElementById('userRole').value,
                status: document.getElementById('userStatus').value === '1',
                password: document.getElementById('userPassword').value || undefined,
                password_confirmation: document.getElementById('userPasswordConfirmation').value || undefined
            };

            // Panggil callback dengan data form
            submitCallback(formData);

            // Tutup modal
            modal.hide();
        });
    }

    // Tambahkan event listener untuk menangani penutupan modal
    modalElement.addEventListener('hidden.bs.modal', function () {
        modalElement.remove();
        if (typeof onCloseCallback === 'function') onCloseCallback();
    });

    // Tampilkan modal
    modal.show();
}

/**
 * Mengatur class active pada sidebar sesuai tab yang dipilih
 * @param {string} tabId - ID elemen sidebar yang akan diaktifkan
 */
function setActiveSidebarTab(tabId) {
    const sidebarTabs = [
        'navTasks',
        'navUserManagement',
        'navActivityLogs'
    ];
    sidebarTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === tabId) {
                el.classList.add('active');
                el.setAttribute('aria-current', 'page');
            } else {
                el.classList.remove('active');
                el.removeAttribute('aria-current');
            }
        }
    });
}

/**
 * Menampilkan view utama dan mengatur tab sidebar active
 * @param {string} viewId - ID konten utama yang akan ditampilkan
 */
function showView(viewId) {
    const views = [
        'dashboardView',
        'taskManagementView',
        'userManagementView',
        'activityLogsView'
    ];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === viewId) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });
    // Atur tab sidebar active
    if (viewId === 'taskManagementView') {
        setActiveSidebarTab('navTasks');
        if (typeof loadTasks === 'function') loadTasks();
    } else if (viewId === 'userManagementView') {
        setActiveSidebarTab('navUserManagement');
        if (typeof loadUsers === 'function') loadUsers();
    } else if (viewId === 'activityLogsView') {
        setActiveSidebarTab('navActivityLogs');
        if (typeof loadActivityLogs === 'function') loadActivityLogs();
    } else {
        setActiveSidebarTab(null);
    }
}

// Fungsi lain yang mungkin berguna:
// - createModal(title, bodyContent, footerButtons)
// - updateTable(tableId, data, columnsConfig)
// - formatDate(dateString)
// - etc. 