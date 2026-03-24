/**
 * Bougie Immigration - Admin Dashboard
 * Connects to Supabase database for application management
 */

// Supabase configuration
const SUPABASE_URL = 'https://qpprzcckolmdyabnmgol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA5MTYsImV4cCI6MjA4OTkzNjkxNn0.Pp9fTdklyomxmG6wsb8FBzyhLXaXEx983ofdaiPG_So';

let supabase = null;
let applications = [];
let filteredApplications = [];
let currentFilters = { status: 'all', destination: 'all', search: '' };
let currentModalApp = null;

// DOM Elements
const elements = {
    totalCount: null,
    pendingCount: null,
    approvedCount: null,
    rejectedCount: null,
    statusFilter: null,
    destinationFilter: null,
    searchInput: null,
    downloadAllBtn: null,
    logoutBtn: null,
    applicationsTableBody: null,
    loadingState: null,
    tableContent: null,
    emptyState: null,
    detailModal: null,
    modalBody: null,
    modalApproveBtn: null,
    modalRejectBtn: null,
    adminName: null
};

/**
 * Initialize Supabase client
 */
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof supabaseJs !== 'undefined') {
        supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library not loaded');
        return null;
    }
    return supabase;
}

/**
 * Cache DOM elements
 */
function cacheElements() {
    elements.totalCount = document.getElementById('totalCount');
    elements.pendingCount = document.getElementById('pendingCount');
    elements.approvedCount = document.getElementById('approvedCount');
    elements.rejectedCount = document.getElementById('rejectedCount');
    elements.statusFilter = document.getElementById('statusFilter');
    elements.destinationFilter = document.getElementById('destinationFilter');
    elements.searchInput = document.getElementById('searchInput');
    elements.downloadAllBtn = document.getElementById('downloadAllBtn');
    elements.logoutBtn = document.getElementById('logoutBtn');
    elements.applicationsTableBody = document.getElementById('applicationsTableBody');
    elements.loadingState = document.getElementById('loadingState');
    elements.tableContent = document.getElementById('tableContent');
    elements.emptyState = document.getElementById('emptyState');
    elements.detailModal = document.getElementById('detailModal');
    elements.modalBody = document.getElementById('modalBody');
    elements.modalApproveBtn = document.getElementById('modalApproveBtn');
    elements.modalRejectBtn = document.getElementById('modalRejectBtn');
    elements.adminName = document.getElementById('adminName');
}

/**
 * Check if admin is authenticated
 */
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('admin_logged_in');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    
    const adminUsername = sessionStorage.getItem('admin_username') || 'Admin';
    if (elements.adminName) {
        elements.adminName.textContent = `Welcome, ${adminUsername}`;
    }
    return true;
}

/**
 * Load applications from Supabase
 */
async function loadApplications() {
    showLoading(true);
    
    try {
        const client = initSupabase();
        if (!client) {
            throw new Error('Database connection failed');
        }
        
        const { data, error } = await client
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        applications = data || [];
        applyFilters();
        
    } catch (error) {
        console.error('Error loading applications:', error);
        if (elements.emptyState) {
            elements.emptyState.innerHTML = '<i class="fas fa-exclamation-circle"></i><p>Error loading applications. Please refresh the page.</p><p style="font-size:12px; margin-top:10px;">' + error.message + '</p>';
            elements.emptyState.style.display = 'block';
        }
        showNotification('Failed to load applications. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Apply filters to applications
 */
function applyFilters() {
    filteredApplications = applications.filter(app => {
        const matchesStatus = currentFilters.status === 'all' || app.application_status === currentFilters.status;
        const matchesDestination = currentFilters.destination === 'all' || app.destination === currentFilters.destination;
        const search = currentFilters.search.toLowerCase();
        const fullName = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
        const matchesSearch = search === '' || 
            fullName.includes(search) ||
            (app.email || '').toLowerCase().includes(search) ||
            (app.application_number || '').toLowerCase().includes(search);
        return matchesStatus && matchesDestination && matchesSearch;
    });
    
    updateStats();
    renderTable();
}

/**
 * Update statistics display
 */
function updateStats() {
    const total = filteredApplications.length;
    const pending = filteredApplications.filter(a => a.application_status === 'pending').length;
    const approved = filteredApplications.filter(a => a.application_status === 'approved').length;
    const rejected = filteredApplications.filter(a => a.application_status === 'rejected').length;
    
    if (elements.totalCount) elements.totalCount.textContent = total;
    if (elements.pendingCount) elements.pendingCount.textContent = pending;
    if (elements.approvedCount) elements.approvedCount.textContent = approved;
    if (elements.rejectedCount) elements.rejectedCount.textContent = rejected;
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const config = {
        pending: { icon: 'fa-clock', class: 'status-pending', text: 'Pending' },
        approved: { icon: 'fa-check-circle', class: 'status-approved', text: 'Approved' },
        rejected: { icon: 'fa-times-circle', class: 'status-rejected', text: 'Rejected' }
    };
    const c = config[status] || config.pending;
    return `<span class="status-badge ${c.class}"><i class="fas ${c.icon}"></i> ${c.text}</span>`;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateString;
    }
}

/**
 * Format month/year for display
 */
function formatMonthYear(dateString) {
    if (!dateString) return 'N/A';
    try {
        const [year, month] = dateString.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(month) - 1]} ${year}`;
    } catch {
        return dateString;
    }
}

/**
 * Get destination display name
 */
function getDestinationDisplay(destination) {
    if (destination === 'italy') return 'Italy';
    if (destination === 'campus_france') return 'Campus France';
    return destination || 'Not specified';
}

/**
 * Render applications table
 */
function renderTable() {
    if (!elements.applicationsTableBody) return;
    
    if (filteredApplications.length === 0) {
        elements.applicationsTableBody.innerHTML = '';
        if (elements.emptyState) elements.emptyState.style.display = 'block';
        if (elements.tableContent) elements.tableContent.style.display = 'block';
        return;
    }
    
    if (elements.emptyState) elements.emptyState.style.display = 'none';
    
    elements.applicationsTableBody.innerHTML = filteredApplications.map(app => `
        <tr>
            <td><code style="font-size:0.8rem">${escapeHtml(app.application_number || 'N/A')}</code></td>
            <td><strong>${escapeHtml(app.first_name || '')} ${escapeHtml(app.last_name || '')}</strong></td>
            <td>${formatMonthYear(app.bac_date)}</td>
            <td>${escapeHtml(app.phone || 'N/A')}</td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis">${escapeHtml(app.email || 'N/A')}</td>
            <td>${getDestinationDisplay(app.destination)}</td>
            <td>${getStatusBadge(app.application_status)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewApplication('${app.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${app.application_status === 'pending' ? `
                        <button class="btn-icon btn-approve" onclick="approveApplication('${app.id}')" title="Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon btn-reject" onclick="rejectApplication('${app.id}')" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * View application details
 */
function viewApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    currentModalApp = app;
    
    if (!elements.modalBody) return;
    
    elements.modalBody.innerHTML = `
        <div class="detail-row"><div class="detail-label">Application Number</div><div class="detail-value"><code>${escapeHtml(app.application_number)}</code></div></div>
        <div class="detail-row"><div class="detail-label">Full Name</div><div class="detail-value">${escapeHtml(app.first_name)} ${escapeHtml(app.last_name)}</div></div>
        <div class="detail-row"><div class="detail-label">Birth Date</div><div class="detail-value">${formatDate(app.birth_date)}</div></div>
        <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(app.email)}</div></div>
        <div class="detail-row"><div class="detail-label">Phone</div><div class="detail-value">${escapeHtml(app.phone)}</div></div>
        <div class="detail-row"><div class="detail-label">Baccalaureate</div><div class="detail-value">${formatMonthYear(app.bac_date)}</div></div>
        <div class="detail-row"><div class="detail-label">Applying Degree</div><div class="detail-value">${escapeHtml(app.year_of_study)}</div></div>
        <div class="detail-row"><div class="detail-label">Destination</div><div class="detail-value">${getDestinationDisplay(app.destination)}</div></div>
        <div class="detail-row"><div class="detail-label">Courses</div><div class="detail-value">${escapeHtml(app.courses)}</div></div>
        <div class="detail-row"><div class="detail-label">Payment Status</div><div class="detail-value"><span class="status-badge ${app.payment_status === 'paid' ? 'status-approved' : 'status-pending'}">${app.payment_status === 'paid' ? 'Paid' : 'Pending'}</span></div></div>
        <div class="detail-row"><div class="detail-label">Submitted</div><div class="detail-value">${formatDate(app.created_at)}</div></div>
        ${app.documents_urls ? `<div class="detail-row"><div class="detail-label">Documents</div><div class="detail-value">${Object.keys(app.documents_urls).length} files uploaded</div></div>` : ''}
        ${app.admin_notes ? `<div class="detail-row"><div class="detail-label">Admin Notes</div><div class="detail-value">${escapeHtml(app.admin_notes)}</div></div>` : ''}
    `;
    
    if (elements.modalApproveBtn && elements.modalRejectBtn) {
        if (app.application_status === 'pending') {
            elements.modalApproveBtn.style.display = 'inline-flex';
            elements.modalRejectBtn.style.display = 'inline-flex';
            elements.modalApproveBtn.onclick = () => approveApplication(app.id);
            elements.modalRejectBtn.onclick = () => rejectApplication(app.id);
        } else {
            elements.modalApproveBtn.style.display = 'none';
            elements.modalRejectBtn.style.display = 'none';
        }
    }
    
    if (elements.detailModal) {
        elements.detailModal.style.display = 'flex';
    }
}

/**
 * Approve application
 */
async function approveApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    if (!confirm(`Approve application ${app.application_number}?\n\nAn email notification will be sent to ${app.email}.`)) return;
    
    try {
        const client = initSupabase();
        if (!client) throw new Error('Database connection failed');
        
        const { error } = await client
            .from('applications')
            .update({ 
                application_status: 'approved', 
                decision_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        
        // Send approval email
        if (window.SupabaseClient && window.SupabaseClient.sendStatusEmail) {
            await window.SupabaseClient.sendStatusEmail(app, 'approved');
        }
        
        showNotification(`Application ${app.application_number} approved. Email sent to ${app.email}`, 'success');
        await loadApplications();
        closeModal();
        
    } catch (error) {
        console.error('Error approving application:', error);
        showNotification('Failed to approve application. Please try again.', 'error');
    }
}

/**
 * Reject application
 */
async function rejectApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    const reason = prompt('Please provide a reason for rejection (this will be included in the email to the applicant):');
    if (reason === null) return;
    if (!reason.trim()) {
        showNotification('Please provide a reason for rejection.', 'error');
        return;
    }
    
    try {
        const client = initSupabase();
        if (!client) throw new Error('Database connection failed');
        
        const { error } = await client
            .from('applications')
            .update({ 
                application_status: 'rejected', 
                admin_notes: reason,
                decision_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        
        // Send rejection email
        if (window.SupabaseClient && window.SupabaseClient.sendStatusEmail) {
            await window.SupabaseClient.sendStatusEmail(app, 'rejected', reason);
        }
        
        showNotification(`Application ${app.application_number} rejected. Email sent to ${app.email}`, 'warning');
        await loadApplications();
        closeModal();
        
    } catch (error) {
        console.error('Error rejecting application:', error);
        showNotification('Failed to reject application. Please try again.', 'error');
    }
}

/**
 * Export applications as JSON
 */
async function exportData() {
    try {
        const dataStr = JSON.stringify(applications, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bougie_applications_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Export completed successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export data.', 'error');
    }
}

/**
 * Close modal
 */
function closeModal() {
    if (elements.detailModal) {
        elements.detailModal.style.display = 'none';
    }
    currentModalApp = null;
}

/**
 * Show/hide loading state
 */
function showLoading(show) {
    if (elements.loadingState) {
        elements.loadingState.style.display = show ? 'flex' : 'none';
    }
    if (elements.tableContent) {
        elements.tableContent.style.display = show ? 'none' : 'block';
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
        <button class="notification-close">&times;</button>
    `;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.onclick = () => notification.remove();
    
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 5000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Logout function
 */
function logout() {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_username');
    sessionStorage.removeItem('admin_role');
    sessionStorage.removeItem('admin_login_time');
    window.location.href = 'login.html';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (elements.statusFilter) {
        elements.statusFilter.addEventListener('change', (e) => {
            currentFilters.status = e.target.value;
            applyFilters();
        });
    }
    
    if (elements.destinationFilter) {
        elements.destinationFilter.addEventListener('change', (e) => {
            currentFilters.destination = e.target.value;
            applyFilters();
        });
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            applyFilters();
        });
    }
    
    if (elements.downloadAllBtn) {
        elements.downloadAllBtn.addEventListener('click', exportData);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === elements.detailModal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && elements.detailModal && elements.detailModal.style.display === 'flex') {
            closeModal();
        }
    });
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 10px;
        padding: 0 4px;
    }
    .notification-close:hover {
        opacity: 0.8;
    }
    .input-error {
        border-color: #e74c3c !important;
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.viewApplication = viewApplication;
window.approveApplication = approveApplication;
window.rejectApplication = rejectApplication;
window.closeModal = closeModal;

/**
 * Initialize admin dashboard
 */
async function initAdminDashboard() {
    cacheElements();
    if (!checkAuth()) return;
    setupEventListeners();
    initSupabase();
    await loadApplications();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAdminDashboard);
