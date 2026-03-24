/**
 * Bougie Immigration - Admin Dashboard
 * Manages application reviews, approvals, rejections, and exports
 * Uses localStorage for data storage with Supabase file URLs
 */

// Admin state
let adminState = {
    isAuthenticated: false,
    currentUser: null,
    applications: [],
    filteredApplications: [],
    currentFilters: {
        status: 'all',
        destination: 'all',
        search: ''
    },
    selectedApplication: null
};

// DOM Elements cache
let elements = {};

/**
 * Initialize admin dashboard
 */
async function initAdminDashboard() {
    cacheElements();
    if (!checkAuthentication()) return;
    setupEventListeners();
    await loadApplications();
    updateStatistics();
    renderApplicationsTable();
}

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
    elements = {
        totalCount: document.getElementById('totalCount'),
        pendingCount: document.getElementById('pendingCount'),
        approvedCount: document.getElementById('approvedCount'),
        rejectedCount: document.getElementById('rejectedCount'),
        statusFilter: document.getElementById('statusFilter'),
        destinationFilter: document.getElementById('destinationFilter'),
        searchInput: document.getElementById('searchInput'),
        downloadAllBtn: document.getElementById('downloadAllBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        applicationsTableBody: document.getElementById('applicationsTableBody'),
        loadingState: document.getElementById('loadingState'),
        tableContent: document.getElementById('tableContent'),
        emptyState: document.getElementById('emptyState'),
        detailModal: document.getElementById('detailModal'),
        modalBody: document.getElementById('modalBody'),
        modalApproveBtn: document.getElementById('modalApproveBtn'),
        modalRejectBtn: document.getElementById('modalRejectBtn'),
        adminName: document.getElementById('adminName')
    };
}

/**
 * Check if admin is authenticated
 * @returns {boolean} Authentication status
 */
function checkAuthentication() {
    const isLoggedIn = sessionStorage.getItem('admin_logged_in');
    const adminUsername = sessionStorage.getItem('admin_username');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    
    adminState.isAuthenticated = true;
    adminState.currentUser = adminUsername || 'Admin';
    
    if (elements.adminName) {
        elements.adminName.textContent = `Welcome, ${adminState.currentUser}`;
    }
    
    return true;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (elements.statusFilter) {
        elements.statusFilter.addEventListener('change', (e) => {
            adminState.currentFilters.status = e.target.value;
            filterApplications();
        });
    }
    
    if (elements.destinationFilter) {
        elements.destinationFilter.addEventListener('change', (e) => {
            adminState.currentFilters.destination = e.target.value;
            filterApplications();
        });
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce((e) => {
            adminState.currentFilters.search = e.target.value.toLowerCase();
            filterApplications();
        }, 300));
    }
    
    if (elements.downloadAllBtn) {
        elements.downloadAllBtn.addEventListener('click', downloadAllApplications);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === elements.detailModal) {
            closeModal();
        }
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && elements.detailModal && elements.detailModal.style.display === 'flex') {
            closeModal();
        }
    });
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Load applications from localStorage
 */
async function loadApplications() {
    showLoading(true);
    
    try {
        const stored = localStorage.getItem('bougie_applications');
        if (stored) {
            adminState.applications = JSON.parse(stored);
        } else {
            adminState.applications = [];
        }
        adminState.filteredApplications = [...adminState.applications];
        
    } catch (error) {
        console.error('Error loading applications:', error);
        showNotification('Failed to load applications. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Save applications to localStorage
 */
function saveApplications() {
    localStorage.setItem('bougie_applications', JSON.stringify(adminState.applications));
}

/**
 * Filter applications based on current filters
 */
function filterApplications() {
    const { status, destination, search } = adminState.currentFilters;
    
    adminState.filteredApplications = adminState.applications.filter(app => {
        const matchesStatus = status === 'all' || app.application_status === status;
        const matchesDestination = destination === 'all' || app.destination === destination;
        const matchesSearch = search === '' || 
            `${app.first_name} ${app.last_name}`.toLowerCase().includes(search) || 
            (app.email || '').toLowerCase().includes(search) ||
            (app.application_number || '').toLowerCase().includes(search);
        
        return matchesStatus && matchesDestination && matchesSearch;
    });
    
    renderApplicationsTable();
    updateStatistics();
}

/**
 * Update statistics display
 */
function updateStatistics() {
    const total = adminState.filteredApplications.length;
    const pending = adminState.filteredApplications.filter(app => app.application_status === 'pending').length;
    const approved = adminState.filteredApplications.filter(app => app.application_status === 'approved').length;
    const rejected = adminState.filteredApplications.filter(app => app.application_status === 'rejected').length;
    
    if (elements.totalCount) elements.totalCount.textContent = total;
    if (elements.pendingCount) elements.pendingCount.textContent = pending;
    if (elements.approvedCount) elements.approvedCount.textContent = approved;
    if (elements.rejectedCount) elements.rejectedCount.textContent = rejected;
}

/**
 * Render applications table
 */
function renderApplicationsTable() {
    if (!elements.applicationsTableBody) return;
    
    if (adminState.filteredApplications.length === 0) {
        if (elements.tableContent) elements.tableContent.style.display = 'block';
        if (elements.emptyState) elements.emptyState.style.display = 'block';
        elements.applicationsTableBody.innerHTML = '';
        return;
    }
    
    if (elements.tableContent) elements.tableContent.style.display = 'block';
    if (elements.emptyState) elements.emptyState.style.display = 'none';
    
    elements.applicationsTableBody.innerHTML = adminState.filteredApplications.map(app => `
        <tr>
            <td><code style="font-size: 0.8rem;">${escapeHtml(app.application_number || 'N/A')}</code></td>
            <td><strong>${escapeHtml(app.first_name || '')} ${escapeHtml(app.last_name || '')}</strong></td>
            <td>${formatMonthYear(app.bac_date)}</td>
            <td>${escapeHtml(app.phone || 'N/A')}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(app.email || 'N/A')}</td>
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
 * Get status badge HTML
 * @param {string} status - Application status
 * @returns {string} Badge HTML
 */
function getStatusBadge(status) {
    const statusConfig = {
        pending: { icon: 'fa-clock', class: 'status-pending', text: 'Pending' },
        approved: { icon: 'fa-check-circle', class: 'status-approved', text: 'Approved' },
        rejected: { icon: 'fa-times-circle', class: 'status-rejected', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return `<span class="status-badge ${config.class}">
        <i class="fas ${config.icon}"></i>
        ${config.text}
    </span>`;
}

/**
 * View application details
 * @param {string} applicationId - Application ID
 */
function viewApplication(applicationId) {
    const app = adminState.applications.find(a => a.id === applicationId);
    if (!app) return;
    
    adminState.selectedApplication = app;
    
    if (!elements.modalBody) return;
    
    // Build documents list HTML
    let documentsHtml = '';
    if (app.documents && Object.keys(app.documents).length > 0) {
        documentsHtml = '<div class="documents-list"><div class="detail-label" style="margin-bottom: 0.5rem;">Uploaded Documents</div>';
        for (const [docType, docUrl] of Object.entries(app.documents)) {
            if (typeof docUrl === 'string' && docUrl.startsWith('http')) {
                const fileExt = docUrl.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
                documentsHtml += `
                    <div class="doc-item" style="background: #f4eddb; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                            <span><i class="fas fa-file"></i> ${formatDocumentName(docType)}</span>
                            <div>
                                <a href="${docUrl}" target="_blank" class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
                                    <i class="fas fa-external-link-alt"></i> View
                                </a>
                                <a href="${docUrl}" download class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
                                    <i class="fas fa-download"></i> Download
                                </a>
                            </div>
                        </div>
                        ${isImage ? `<img src="${docUrl}" style="max-width: 100%; max-height: 150px; margin-top: 0.5rem; border-radius: 8px;" />` : ''}
                    </div>
                `;
            } else if (docUrl && typeof docUrl === 'object' && docUrl.webViewLink) {
                documentsHtml += `
                    <div class="doc-item" style="background: #f4eddb; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="fab fa-google-drive"></i> ${formatDocumentName(docType)}</span>
                            <a href="${docUrl.webViewLink}" target="_blank" class="btn btn-secondary" style="padding: 0.25rem 0.75rem;">
                                <i class="fas fa-external-link-alt"></i> View in Drive
                            </a>
                        </div>
                    </div>
                `;
            }
        }
        documentsHtml += '</div>';
    }
    
    elements.modalBody.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Application Number</div>
            <div class="detail-value"><code>${escapeHtml(app.application_number)}</code></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Full Name</div>
            <div class="detail-value">${escapeHtml(app.first_name)} ${escapeHtml(app.last_name)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Birth Date</div>
            <div class="detail-value">${formatDate(app.birth_date)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Email</div>
            <div class="detail-value">${escapeHtml(app.email)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Phone</div>
            <div class="detail-value">${escapeHtml(app.phone)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Baccalaureate</div>
            <div class="detail-value">${formatMonthYear(app.bac_date)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Applying Degree</div>
            <div class="detail-value">${escapeHtml(app.year_of_study)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Destination</div>
            <div class="detail-value">${getDestinationDisplay(app.destination)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Courses</div>
            <div class="detail-value">${escapeHtml(app.courses)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Payment Status</div>
            <div class="detail-value">
                <span class="status-badge ${app.payment_status === 'paid' ? 'status-approved' : 'status-pending'}">
                    ${app.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Submitted Date</div>
            <div class="detail-value">${formatDate(app.created_at)}</div>
        </div>
        ${app.tcf_status ? `
        <div class="detail-row">
            <div class="detail-label">TCF Status</div>
            <div class="detail-value">${escapeHtml(app.tcf_status)}</div>
        </div>
        ` : ''}
        ${app.admin_notes ? `
        <div class="detail-row">
            <div class="detail-label">Admin Notes</div>
            <div class="detail-value">${escapeHtml(app.admin_notes)}</div>
        </div>
        ` : ''}
        ${documentsHtml}
    `;
    
    // Update modal buttons based on status
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
 * @param {string} applicationId - Application ID
 */
async function approveApplication(applicationId) {
    const app = adminState.applications.find(a => a.id === applicationId);
    if (!app) return;
    
    const confirmResult = confirm(`Approve application ${app.application_number}?\n\nAn email notification will be sent to ${app.email}`);
    
    if (!confirmResult) return;
    
    try {
        app.application_status = 'approved';
        app.decision_date = new Date().toISOString();
        app.updated_at = new Date().toISOString();
        saveApplications();
        
        await sendStatusEmail(app, 'approved');
        
        showNotification(`Application ${app.application_number} has been approved. Email sent to ${app.email}`, 'success');
        filterApplications();
        closeModal();
        
    } catch (error) {
        console.error('Error approving application:', error);
        showNotification('Failed to approve application. Please try again.', 'error');
    }
}

/**
 * Reject application
 * @param {string} applicationId - Application ID
 */
async function rejectApplication(applicationId) {
    const app = adminState.applications.find(a => a.id === applicationId);
    if (!app) return;
    
    const reason = prompt('Please provide a reason for rejection (this will be included in the email to the applicant):');
    
    if (reason === null) return;
    
    if (!reason.trim()) {
        showNotification('Please provide a reason for rejection.', 'error');
        return;
    }
    
    try {
        app.application_status = 'rejected';
        app.rejection_reason = reason;
        app.admin_notes = reason;
        app.decision_date = new Date().toISOString();
        app.updated_at = new Date().toISOString();
        saveApplications();
        
        await sendStatusEmail(app, 'rejected', reason);
        
        showNotification(`Application ${app.application_number} has been rejected. Email sent to ${app.email}`, 'warning');
        filterApplications();
        closeModal();
        
    } catch (error) {
        console.error('Error rejecting application:', error);
        showNotification('Failed to reject application. Please try again.', 'error');
    }
}

/**
 * Send status update email via Resend
 * @param {Object} application - Application data
 * @param {string} status - New status
 * @param {string} reason - Rejection reason (optional)
 */
async function sendStatusEmail(application, status, reason = null) {
    const RESEND_API_KEY = 're_UGbnfq94_KrG2rVQMhkbiGSkTGH9P62iR';
    const destinationName = application.destination === 'italy' ? 'Italy' : 'Campus France';
    
    let subject, html;
    
    if (status === 'approved') {
        subject = 'Application Approved - Bougie Immigration';
        html = `
            <!DOCTYPE html><html><body style="font-family:Arial;padding:20px">
            <h2>Application Approved!</h2>
            <p>Dear ${application.first_name} ${application.last_name},</p>
            <p>Congratulations! Your application has been approved.</p>
            <p><strong>Application Number:</strong> ${application.application_number}</p>
            <p><strong>Destination:</strong> ${destinationName}</p>
            <p>Our team will contact you shortly with next steps.</p>
            <p>Thank you,<br>Bougie Immigration Team</p>
            </body></html>
        `;
    } else {
        subject = 'Application Status Update - Bougie Immigration';
        html = `
            <!DOCTYPE html><html><body style="font-family:Arial;padding:20px">
            <h2>Application Status Update</h2>
            <p>Dear ${application.first_name} ${application.last_name},</p>
            <p>After careful review, we regret to inform you that your application was not approved at this time.</p>
            <p><strong>Application Number:</strong> ${application.application_number}</p>
            <p><strong>Destination:</strong> ${destinationName}</p>
            <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
            <p>Thank you,<br>Bougie Immigration Team</p>
            </body></html>
        `;
    }
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Bougie Immigration <onboarding@resend.dev>',
                to: [application.email],
                subject: subject,
                html: html
            })
        });
        const result = await response.json();
        console.log('Email sent:', result);
        return result;
    } catch (error) {
        console.error('Email error:', error);
        throw error;
    }
}

/**
 * Download all applications as JSON
 */
function downloadAllApplications() {
    try {
        const dataStr = JSON.stringify(adminState.applications, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bougie_applications_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Download completed successfully!', 'success');
    } catch (error) {
        console.error('Error downloading:', error);
        showNotification('Failed to download applications.', 'error');
    }
}

/**
 * Close modal
 */
function closeModal() {
    if (elements.detailModal) {
        elements.detailModal.style.display = 'none';
    }
    adminState.selectedApplication = null;
}

/**
 * Show/hide loading state
 * @param {boolean} show - Show loading
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
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
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
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 10px;
    `;
    closeBtn.onclick = () => notification.remove();
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

/**
 * Format month/year for display
 * @param {string} dateString - Month/year string (YYYY-MM)
 * @returns {string} Formatted month/year
 */
function formatMonthYear(dateString) {
    if (!dateString) return 'N/A';
    try {
        const [year, month] = dateString.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(month) - 1]} ${year}`;
    } catch (e) {
        return dateString;
    }
}

/**
 * Get destination display name
 * @param {string} destination - Destination code
 * @returns {string} Display name
 */
function getDestinationDisplay(destination) {
    if (destination === 'italy') return 'Italy';
    if (destination === 'campus_france') return 'Campus France';
    return destination || 'N/A';
}

/**
 * Format document name for display
 * @param {string} key - Document key
 * @returns {string} Formatted name
 */
function formatDocumentName(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
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
    sessionStorage.removeItem('admin_login_time');
    window.location.href = 'login.html';
}

// Add animation styles for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .notification-close:hover { opacity: 0.8; }
`;
document.head.appendChild(style);

// Export functions for global access
window.viewApplication = viewApplication;
window.approveApplication = approveApplication;
window.rejectApplication = rejectApplication;
window.closeModal = closeModal;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAdminDashboard);
