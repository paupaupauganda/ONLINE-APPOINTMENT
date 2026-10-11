const STORAGE_USERS = 'dflcmci_users';
const STORAGE_APPT = 'dflcmci_appointments';

function initStorage() {
    if (!localStorage.getItem(STORAGE_USERS)) {
        localStorage.setItem(STORAGE_USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_APPT)) {
        localStorage.setItem(STORAGE_APPT, JSON.stringify([]));
    }
}

const getUsers = () => JSON.parse(localStorage.getItem(STORAGE_USERS));
const saveUsers = users => localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
const getAppts = () => JSON.parse(localStorage.getItem(STORAGE_APPT));
const saveAppts = appts => localStorage.setItem(STORAGE_APPT, JSON.stringify(appts));

// ❌ TINANGGAL NA ANG LIMITASYON — PWEDE NA ANG MARAMING ADMIN ✅
function hasAdmin() {
    return false; // Laging nakikita ang Admin Register
}

let currentUser = null;

const pages = document.querySelectorAll('.page');
const notifContainer = document.getElementById('notifContainer');

const studentRegisterForm = document.getElementById('studentRegisterForm');
const adminRegisterForm = document.getElementById('adminRegisterForm');
const loginForm = document.getElementById('loginForm');
const resetForm = document.getElementById('resetForm');
const bookingForm = document.getElementById('bookingForm');

const authLinks = document.getElementById('authLinks');
const userLinks = document.getElementById('userLinks');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

// === NAVIGATION ===
document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-target]');
    if (target) {
        e.preventDefault();
        showPage(target.getAttribute('data-target'));
    }
});

function showPage(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    // Admin Register laging nakikita ✅
    const adminLink = document.getElementById('adminRegisterLink');
    const heroAdminBtn = document.getElementById('heroAdminBtn');
    const loginAdminLink = document.getElementById('loginAdminLink');
    
    if (adminLink) adminLink.style.display = 'inline';
    if (heroAdminBtn) heroAdminBtn.style.display = 'inline-block';
    if (loginAdminLink) loginAdminLink.style.display = 'inline';

    if (pageId === 'adminRegisterPage') {
        updateAdminRegisterUI();
    }

    if (!currentUser) {
        authLinks.style.display = 'flex';
        userLinks.style.display = 'none';
    } else {
        authLinks.style.display = 'none';
        userLinks.style.display = 'flex';
        userName.textContent = currentUser.name;
    }

    if (pageId === 'studentPage') renderStudentAppts();
    if (pageId === 'adminPage') renderAdminAppts();

    navLinks.classList.remove('open');
}

function updateAdminRegisterUI() {
    const notice = document.getElementById('adminSetupNotice');
    const btn = document.getElementById('adminRegBtn');
    const formInputs = document.querySelectorAll('#adminRegisterForm input');
    
    // ✅ Laging bukas at pwede mag-register
    notice.innerHTML = 'ℹ️ <strong>Administrator Registration</strong><br>Multiple Admin accounts are allowed. Each Admin has full access to manage appointments.';
    notice.style.background = '#E8F5E9';
    notice.style.borderColor = '#0D5D2B';
    notice.style.color = '#0D5D2B';
    btn.disabled = false;
    btn.textContent = 'Create Administrator Account';
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    formInputs.forEach(inp => inp.disabled = false);
}

function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notif ${type}`;
    notif.innerHTML = message;
    notifContainer.appendChild(notif);
    setTimeout(() => notif.remove(), 4500);
}

// === SEARCH ===
function getSearchTerm() {
    const searchInput = document.getElementById('adminSearch');
    return searchInput ? searchInput.value.trim().toLowerCase() : '';
}

function matchesSearch(appt, term) {
    if (!term) return true;
    return (
        appt.studentId.toLowerCase().includes(term) ||
        appt.studentName.toLowerCase().includes(term) ||
        appt.purpose.toLowerCase().includes(term)
    );
}

window.clearSearch = function() {
    const searchInput = document.getElementById('adminSearch');
    if (searchInput) searchInput.value = '';
    renderAdminAppts();
    showNotification('🔍 Search cleared — showing all records', 'info');
};

// === STUDENT REGISTRATION ===
studentRegisterForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const studentId = document.getElementById('regId').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const contact = document.getElementById('regContact').value.trim();
    const password = document.getElementById('regPass').value;
    const confirmPass = document.getElementById('regConfirmPass').value;

    if (password !== confirmPass) {
        showNotification('❌ Passwords do not match!', 'warning');
        return;
    }
    if (password.length < 6) {
        showNotification('❌ Password must be at least 6 characters', 'warning');
        return;
    }

    const users = getUsers();
    if (users.find(u => u.id === studentId || u.email === email)) {
        showNotification('❌ ID or Email already registered!', 'warning');
        return;
    }

    users.push({
        id: studentId,
        password,
        role: 'student',
        name,
        email,
        contact
    });

    saveUsers(users);
    showNotification('✅ Student account created successfully! You may now login.', 'success');
    studentRegisterForm.reset();
    showPage('loginPage');
});

// === ADMIN REGISTRATION — WALANG LIMITASYON ✅ ===
adminRegisterForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('adminRegName').value.trim();
    const adminId = document.getElementById('adminRegId').value.trim();
    const email = document.getElementById('adminRegEmail').value.trim();
    const position = document.getElementById('adminRegPosition').value.trim();
    const contact = document.getElementById('adminRegContact').value.trim();
    const password = document.getElementById('adminRegPass').value;
    const confirmPass = document.getElementById('adminRegConfirmPass').value;

    if (password !== confirmPass) {
        showNotification('❌ Passwords do not match!', 'warning');
        return;
    }
    if (password.length < 8) {
        showNotification('❌ Admin password must be at least 8 characters', 'warning');
        return;
    }

    const users = getUsers();
    if (users.find(u => (u.id === adminId || u.email === email) && u.role === 'admin')) {
        showNotification('❌ This Admin ID or Email is already registered!', 'warning');
        return;
    }

    users.push({
        id: adminId,
        password,
        role: 'admin',
        name,
        email,
        contact,
        position
    });

    saveUsers(users);
    showNotification('✅🔐 Administrator account created successfully!', 'success');
    adminRegisterForm.reset();
    showPage('loginPage');
});

// === RESET PASSWORD — BOTH ADMIN & STUDENT ===
resetForm.addEventListener('submit', e => {
    e.preventDefault();

    const identifier = document.getElementById('resetIdentifier').value.trim();
    const role = document.getElementById('resetRole').value;
    const newPassword = document.getElementById('newPass').value;
    const confirmNewPass = document.getElementById('confirmNewPass').value;

    if (!role) {
        showNotification('❌ Please select your account type!', 'warning');
        return;
    }
    if (newPassword !== confirmNewPass) {
        showNotification('❌ New passwords do not match!', 'warning');
        return;
    }
    if (role === 'admin' && newPassword.length < 8) {
        showNotification('❌ Admin password must be at least 8 characters', 'warning');
        return;
    }
    if (role === 'student' && newPassword.length < 6) {
        showNotification('❌ Password must be at least 6 characters', 'warning');
        return;
    }

    const users = getUsers();
    const userIndex = users.findIndex(u =>
        (u.id === identifier || u.email === identifier) && u.role === role
    );

    if (userIndex === -1) {
        showNotification('❌ Account not found! Check your ID/Email and Account Type.', 'warning');
        return;
    }

    users[userIndex].password = newPassword;
    saveUsers(users);

    showNotification('✅ Password updated successfully! Login with your new password.', 'success');
    resetForm.reset();
    showPage('loginPage');
});

// === LOGIN ===
loginForm.addEventListener('submit', e => {
    e.preventDefault();

    const userInput = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const role = document.getElementById('loginRole').value;

    if (!role) {
        showNotification('⚠️ Please select your Account Role!', 'warning');
        return;
    }

    const users = getUsers();
    const found = users.find(u =>
        (u.id === userInput || u.email === userInput) &&
        u.password === password &&
        u.role === role
    );

    if (!found) {
        showNotification('❌ Invalid credentials. Check your ID/Email, Password, and Role.', 'warning');
        return;
    }

    currentUser = found;
    showNotification(`✅ Welcome, ${found.name}!`, 'success');
    loginForm.reset();

    if (role === 'student') {
        showPage('studentPage');
    } else {
        showPage('adminPage');
    }
});

// === LOGOUT ===
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    showNotification('Logged out successfully.', 'info');
    showPage('homePage');
});

// === BOOK APPOINTMENT ===
bookingForm.addEventListener('submit', e => {
    e.preventDefault();

    if (!currentUser || currentUser.role !== 'student') {
        showNotification('⚠️ Please login as student first.', 'warning');
        showPage('loginPage');
        return;
    }

    const purpose = document.getElementById('apptPurpose').value;
    const date = document.getElementById('apptDate').value;
    const time = document.getElementById('apptTime').value;
    const notes = document.getElementById('apptNotes').value.trim();

    const appts = getAppts();
    const duplicate = appts.find(a =>
        a.date === date && a.time === time && a.status !== 'rejected' && a.status !== 'completed'
    );

    if (duplicate) {
        showNotification('⚠️ This time slot is already booked. Choose another date/time.', 'warning');
        return;
    }

    const newAppt = {
        id: Date.now(),
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        studentContact: currentUser.contact,
        purpose,
        date,
        time,
        notes,
        status: 'pending',
        submittedAt: new Date().toLocaleString()
    };

    appts.unshift(newAppt);
    saveAppts(appts);
    showNotification('✅ Request submitted! Wait for admin approval.', 'success');
    bookingForm.reset();
    renderStudentAppts();
});

// === RENDER STUDENT ===
function renderStudentAppts() {
    const myAppts = getAppts().filter(a => a.studentId === currentUser.id);
    const container = document.getElementById('studentAppts');
    if (!container) return;

    container.innerHTML = myAppts.length
        ? myAppts.map(appt => `
            <div class="appt-card ${appt.status}">
                <h4>${appt.purpose}</h4>
                <p><strong>Date:</strong> ${appt.date} | <strong>Time:</strong> ${appt.time}</p>
                ${appt.notes ? `<p><strong>Details:</strong> ${appt.notes}</p>` : ''}
                <p><strong>Submitted:</strong> ${appt.submittedAt}</p>
                ${appt.completedAt ? `<p><strong>Completed:</strong> ${appt.completedAt}</p>` : ''}
                ${appt.rejectReason ? `<p style="color:var(--rejected);"><strong>Reason:</strong> ${appt.rejectReason}</p>` : ''}
                <span class="appt-status status-${appt.status}">
                    ${appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                </span>
                ${appt.status === 'pending' ? `
                    <div class="action-buttons">
                        <button class="btn danger small" onclick="cancelAppt(${appt.id})">Cancel Request</button>
                    </div>` : ''}
            </div>
        `).join('')
        : '<p class="empty-msg">No appointment requests yet. Book your first appointment above!</p>';
}

// === RENDER ADMIN ===
function renderAdminAppts() {
    const all = getAppts();
    const searchTerm = getSearchTerm();

    const pending = all.filter(a => a.status === 'pending' && matchesSearch(a, searchTerm));
    const approved = all.filter(a => a.status === 'approved' && matchesSearch(a, searchTerm));
    const completed = all.filter(a => a.status === 'completed' && matchesSearch(a, searchTerm));
    const rejected = all.filter(a => a.status === 'rejected' && matchesSearch(a, searchTerm));

    const pendingCountEl = document.getElementById('pendingCount');
    const approvedCountEl = document.getElementById('approvedCount');
    const completedCountEl = document.getElementById('completedCount');
    const rejectedCountEl = document.getElementById('rejectedCount');

    if (pendingCountEl) pendingCountEl.textContent = `(${pending.length})`;
    if (approvedCountEl) approvedCountEl.textContent = `(${approved.length})`;
    if (completedCountEl) completedCountEl.textContent = `(${completed.length})`;
    if (rejectedCountEl) rejectedCountEl.textContent = `(${rejected.length})`;

    const infoEl = document.getElementById('searchInfo');
    if (infoEl) {
        if (searchTerm) {
            const totalFound = pending.length + approved.length + completed.length + rejected.length;
            infoEl.textContent = `🔍 Showing ${totalFound} result(s) for: "${searchTerm}"`;
            infoEl.style.color = 'var(--dfl-green)';
        } else {
            infoEl.textContent = 'Search across all sections below';
            infoEl.style.color = 'var(--text-light)';
        }
    }

    const pendingContainer = document.getElementById('pendingAppts');
    const approvedContainer = document.getElementById('approvedAppts');
    const completedContainer = document.getElementById('completedAppts');
    const rejectedContainer = document.getElementById('rejectedAppts');

    if (pendingContainer) pendingContainer.innerHTML = renderList(pending, 'pending');
    if (approvedContainer) approvedContainer.innerHTML = renderList(approved, 'approved');
    if (completedContainer) completedContainer.innerHTML = renderList(completed);
    if (rejectedContainer) rejectedContainer.innerHTML = renderList(rejected);
}

function renderList(list, type = '') {
    const searchTerm = getSearchTerm();
    return list.length
        ? list.map(appt => `
            <div class="appt-card ${appt.status}${searchTerm ? ' search-match' : ''}">
                <h4>${appt.studentName} — ${appt.purpose}</h4>
                <p><strong>Student ID:</strong> ${appt.studentId}</p>
                <p><strong>Date:</strong> ${appt.date} | <strong>Time:</strong> ${appt.time}</p>
                <p><strong>Contact:</strong> ${appt.studentContact}</p>
                ${appt.notes ? `<p><strong>Notes:</strong> ${appt.notes}</p>` : ''}
                ${appt.rejectReason ? `<p style="color:var(--rejected);"><strong>Reason:</strong> ${appt.rejectReason}</p>` : ''}
                ${appt.completedAt ? `<p style="color:var(--completed);"><strong>Completed:</strong> ${appt.completedAt}</p>` : ''}
                <span class="appt-status status-${appt.status}">
                    ${appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                </span>
                ${type === 'pending' ? `
                    <div class="action-buttons">
                        <button class="btn success small" onclick="approveAppt(${appt.id})">✅ Approve</button>
                        <button class="btn danger small" onclick="rejectAppt(${appt.id})">❌ Reject</button>
                    </div>` : ''}
                ${type === 'approved' ? `
                    <div class="action-buttons">
                        <button class="btn completed small" onclick="markComplete(${appt.id})">✅✅ Mark as Completed</button>
                    </div>` : ''}
            </div>
        `).join('')
        : `<p class="empty-msg">${searchTerm ? 'No matching records found.' : 'No records yet.'}</p>`;
}

// === ACTIONS ===
window.cancelAppt = function(id) {
    if (!confirm('Cancel this appointment request?')) return;
    const updated = getAppts().filter(a => a.id !== id);
    saveAppts(updated);
    showNotification('🗑️ Request cancelled.', 'info');
    renderStudentAppts();
};

window.approveAppt = function(id) {
    const appts = getAppts();
    const idx = appts.findIndex(a => a.id === id);
    if (idx === -1) return;

    appts[idx].status = 'approved';
    saveAppts(appts);
    showNotification(`✅ Approved — ${appts[idx].studentName} | ${appts[idx].purpose}`, 'success');
    renderAdminAppts();
};

window.rejectAppt = function(id) {
    const reason = prompt('Enter reason for rejection (optional):');
    if (reason === null) return;

    const appts = getAppts();
    const idx = appts.findIndex(a => a.id === id);
    if (idx === -1) return;

    appts[idx].status = 'rejected';
    appts[idx].rejectReason = reason || 'No specific reason provided.';
    saveAppts(appts);
    showNotification(`❌ Rejected — ${appts[idx].studentName}`, 'info');
    renderAdminAppts();
};

window.markComplete = function(id) {
    if (!confirm('Mark this transaction as COMPLETED? Student has been assisted.')) return;

    const appts = getAppts();
    const idx = appts.findIndex(a => a.id === id);
    if (idx === -1) return;

    appts[idx].status = 'completed';
    appts[idx].completedAt = new Date().toLocaleString();
    saveAppts(appts);
    showNotification(`✅✅ Completed — ${appts[idx].studentName} has been assisted.`, 'success');
    renderAdminAppts();
};

// === MENU ===
if (menuToggle) {
    menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// === SET MIN DATE ===
const dateInput = document.getElementById('apptDate');
if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
}

// === INITIALIZE ===
initStorage();
showPage('homePage');