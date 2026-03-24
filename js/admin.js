/**
 * Bougie Immigration - Admin Dashboard
 * Manages application reviews, approvals, rejections, and exports
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
    checkAuthentication();
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
        statsGrid: document.getElementById('statsGrid'),
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
 */
function checkAuthentication() {
    const isLoggedIn = sessionStorage.getItem('admin_logged_in');
    const adminUsername = sessionStorage.getItem('admin_username');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    
    adminState.isAuthenticated = true;
    adminState.currentUser = adminUsername || 'Admin';
    
    if (elements.adminName) {
        elements.adminName.textContent = `Welcome, ${adminState.currentUser}`;
    }
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
 * Load applications from storage/database
 */
async function loadApplications() {
    showLoading(true);
    
    try {
        // In production, this would fetch from Supabase
        // const supabase = window.SupabaseClient?.getClient();
        // if (supabase) {
        //     const { data, error } = await supabase
        //         .from('applications')
        //         .select('*')
        //         .order('submitted_at', { ascending: false });
        //     if (!error) adminState.applications = data;
        // }
        
        // Demo data for now
        adminState.applications = getDemoApplications();
        adminState.filteredApplications = [...adminState.applications];
        
    } catch (error) {
        console.error('Error loading applications:', error);
        showNotification('Failed to load applications. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Get demo applications data
 * @returns {Array} Demo applications
 */
function getDemoApplications() {
    return [
        {
            id: '1',
            applicationNumber: 'IT-2024-A3B5C7',
            firstName: 'Ahmed',
            lastName: 'Benali',
            fullName: 'Ahmed Benali',
            bacDate: '2016-06',
            phone: '+213 55 12 34 567',
            email: 'ahmed.benali@example.com',
            destination: 'Italy',
            status: 'approved',
            yearOfStudies: 'Master',
            birthDate: '1998-05-15',
            courses: 'Computer Science, Data Science',
            paymentStatus: 'paid',
            submittedDate: '2024-01-15',
            documents: {
                passport: 'passport_ahmed.pdf',
                photo: 'photo_ahmed.jpg',
                cv: 'cv_ahmed.pdf',
                bacCertOriginal: 'bac_cert_ahmed.pdf',
                bacCertTranslated: 'bac_cert_ahmed_trans.pdf',
                bacTranscriptOriginal: 'bac_trans_ahmed.pdf',
                bacTranscriptTranslated: 'bac_trans_ahmed_trans.pdf',
                bachelorCertOriginal: 'bachelor_cert_ahmed.pdf',
                bachelorCertTranslated: 'bachelor_cert_ahmed_trans.pdf',
                bachelorTranscript: 'bachelor_trans_ahmed.pdf',
                englishProof: 'ielts_ahmed.pdf'
            }
        },
        {
            id: '2',
            applicationNumber: 'IT-2024-D9E2F1',
            firstName: 'Fatima',
            lastName: 'Zohra',
            fullName: 'Fatima Zohra',
            bacDate: '2018-06',
            phone: '+213 77 98 76 543',
            email: 'fatima.zohra@example.com',
            destination: 'Italy',
            status: 'pending',
            yearOfStudies: 'Bachelor',
            birthDate: '2000-03-22',
            courses: 'Economics, Business Management',
            paymentStatus: 'pending',
            submittedDate: '2024-02-20',
            documents: {
                passport: 'passport_fatima.pdf',
                photo: 'photo_fatima.jpg',
                cv: 'cv_fatima.pdf',
                bacCertOriginal: 'bac_cert_fatima.pdf',
                bacCertTranslated: 'bac_cert_fatima_trans.pdf',
                bacTranscriptOriginal: 'bac_trans_fatima.pdf',
                bacTranscriptTranslated: 'bac_trans_fatima_trans.pdf',
                englishProof: 'toefl_fatima.pdf'
            }
        },
        {
            id: '3',
            applicationNumber: 'CF-2024-G4H6I8',
            firstName: 'Karim',
            lastName: 'Mansouri',
            fullName: 'Karim Mansouri',
            bacDate: '2017-06',
            phone: '+213 66 45 67 890',
            email: 'karim.mansouri@example.com',
            destination: 'Campus France',
            status: 'rejected',
            yearOfStudies: 'Master',
            birthDate: '1999-11-10',
            courses: 'French Literature, Linguistics',
            paymentStatus: 'paid',
            submittedDate: '2024-01-05',
            documents: {
                passport: 'passport_karim.pdf',
                photo: 'photo_karim.jpg',
                cv: 'cv_karim.pdf',
                bacCert: 'bac_cert_karim_fr.pdf',
                bacTranscript: 'bac_trans_karim_fr.pdf',
                bachelorCert: 'bachelor_cert_karim_fr.pdf',
                bachelorTranscript: 'bachelor_trans_karim_fr.pdf',
                tcfResults: 'tcf_karim.pdf'
            }
        },
        {
            id: '4',
            applicationNumber: 'IT-2024-H7J9K1',
            firstName: 'Sofia',
            lastName: 'Benyahia',
            fullName: 'Sofia Benyahia',
            bacDate: '2019-06',
            phone: '+213 55 98 76 543',
            email: 'sofia.benyahia@example.com',
            destination: 'Italy',
            status: 'pending',
            yearOfStudies: 'Bachelor',
            birthDate: '2001-08-14',
            courses: 'Architecture, Design',
            paymentStatus: 'pending',
            submittedDate: '2024-02-25',
            documents: {
                passport: 'passport_sofia.pdf',
                photo: 'photo_sofia.jpg',
                cv: 'cv_sofia.pdf',
                bacCertOriginal: 'bac_cert_sofia.pdf',
                bacCertTranslated: 'bac_cert_sofia_trans.pdf',
                bacTranscriptOriginal: 'bac_trans_sofia.pdf',
                bacTranscriptTranslated: 'bac_trans_sofia_trans.pdf',
                englishProof: 'ielts_sofia.pdf'
            }
        },
        {
            id: '5',
            applicationNumber: 'CF-2024-L2M4N6',
            firstName: 'Yacine',
            lastName: 'Boudiaf',
            fullName: 'Yacine Boudiaf',
            bacDate: '2015-06',
            phone: '+213 77 12 34 567',
            email: 'yacine.boudiaf@example.com',
            destination: 'Campus France',
            status: 'approved',
            yearOfStudies: 'Master',
            birthDate: '1997-02-28',
            courses: 'Engineering, Mechanical',
            paymentStatus: 'paid',
            submittedDate: '2024-01-20',
            documents: {
                passport: 'passport_yacine.pdf',
                photo: 'photo_yacine.jpg',
                cv: 'cv_yacine.pdf',
                bacCert: 'bac_cert_yacine_fr.pdf',
                bacTranscript: 'bac_trans_yacine_fr.pdf',
                bachelorCert: 'bachelor_cert_yacine_fr.pdf',
                bachelorTranscript: 'bachelor_trans_yacine_fr.pdf',
                tcfResults: 'tcf_yacine.pdf'
            }
        }
    ];
}

/**
 * Filter applications based on current filters
 */
function filterApplications() {
    const { status, destination, search } = adminState.currentFilters;
    
    adminState.filteredApplications = adminState.applications.filter(app => {
        const matchesStatus = status === 'all' || app.status === status;
        const matchesDestination = destination === 'all' || app.destination === destination;
        const matchesSearch = search === '' || 
            app.fullName.toLowerCase().includes(search) || 
            app.email.toLowerCase().includes(search) ||
            app.applicationNumber.toLowerCase().includes(search);
        
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
    const pending = adminState.filteredApplications.filter(app => app.status === 'pending').length;
    const approved = adminState.filteredApplications.filter(app => app.status === 'approved').length;
    const rejected = adminState.filteredApplications.filter(app => app.status === 'rejected').length;
    
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
            <td><code style="font-size: 0.8rem;">${escapeHtml(app.applicationNumber)}</code></td>
            <td><strong>${escapeHtml(app.fullName)}</strong></td>
            <td>${escapeHtml(app.bacDate)}</td>
            <td>${escapeHtml(app.phone)}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(app.email)}</td>
            <td>${escapeHtml(app.destination)}</td>
            <td>
                ${getStatusBadge(app.status)}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewApplication('${app.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${app.status === 'pending' ? `
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
    
    elements.modalBody.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Application Number</div>
            <div class="detail-value"><code>${escapeHtml(app.applicationNumber)}</code></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Full Name</div>
            <div class="detail-value">${escapeHtml(app.fullName)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Birth Date</div>
            <div class="detail-value">${escapeHtml(app.birthDate)}</div>
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
            <div class="detail-label">BAC Completion</div>
            <div class="detail-value">${escapeHtml(app.bacDate)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Year of Studies</div>
            <div class="detail-value">${escapeHtml(app.yearOfStudies)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Destination</div>
            <div class="detail-value">${escapeHtml(app.destination)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Courses</div>
            <div class="detail-value">${escapeHtml(app.courses)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Payment Status</div>
            <div class="detail-value">
                <span class="badge ${app.paymentStatus === 'paid' ? 'badge-approved' : 'badge-pending'}">
                    ${app.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Submitted Date</div>
            <div class="detail-value">${formatDate(app.submittedDate)}</div>
        </div>
        <div class="documents-list">
            <div class="detail-label" style="margin-bottom: 0.5rem;">Uploaded Documents</div>
            ${Object.entries(app.documents).map(([key, value]) => `
                <div class="doc-item">
                    <span><i class="fas fa-file-pdf"></i> ${formatDocumentName(key)}</span>
                    <span style="font-size: 0.75rem; color: #6b6a66;">${escapeHtml(value)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Update modal buttons based on status
    if (elements.modalApproveBtn && elements.modalRejectBtn) {
        if (app.status === 'pending') {
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
    
    const confirmResult = confirm(`Are you sure you want to approve application ${app.applicationNumber}?\n\nAn email notification will be sent to ${app.email}`);
    
    if (!confirmResult) return;
    
    try {
        // Update application status
        app.status = 'approved';
        app.decisionDate = new Date().toISOString();
        
        // In production, this would call Supabase
        // await window.SupabaseClient?.updateApplicationStatus(applicationId, 'approved');
        
        // Send email notification
        await sendStatusEmail(app, 'approved');
        
        showNotification(`Application ${app.applicationNumber} has been approved. An email has been sent to ${app.email}`, 'success');
        
        // Refresh display
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
        // Update application status
        app.status = 'rejected';
        app.rejectionReason = reason;
        app.decisionDate = new Date().toISOString();
        
        // In production, this would call Supabase
        // await window.SupabaseClient?.updateApplicationStatus(applicationId, 'rejected', reason);
        
        // Send email notification
        await sendStatusEmail(app, 'rejected', reason);
        
        showNotification(`Application ${app.applicationNumber} has been rejected. An email has been sent to ${app.email}`, 'warning');
        
        // Refresh display
        filterApplications();
        closeModal();
        
    } catch (error) {
        console.error('Error rejecting application:', error);
        showNotification('Failed to reject application. Please try again.', 'error');
    }
}

/**
 * Send status update email
 * @param {Object} application - Application data
 * @param {string} status - New status
 * @param {string} reason - Rejection reason (optional)
 */
async function sendStatusEmail(application, status, reason = null) {
    // In production, this would call Resend API
    console.log(`Sending ${status} email to ${application.email}`);
    console.log(`Application: ${application.applicationNumber}`);
    if (reason) console.log(`Reason: ${reason}`);
    
    // Simulate email sending
    return new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Download all applications as ZIP
 */
async function downloadAllApplications() {
    showNotification('Preparing download...', 'info');
    
    try {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            showNotification('Download feature requires JSZip library. Please ensure it is loaded.', 'error');
            return;
        }
        
        const zip = new JSZip();
        const appsFolder = zip.folder(`bougie_applications_${new Date().toISOString().split('T')[0]}`);
        
        // Add applications data as JSON
        const dataStr = JSON.stringify(adminState.applications, null, 2);
        appsFolder.file('applications_data.json', dataStr);
        
        // Create CSV export
        const csvRows = [
            ['Application Number', 'Full Name', 'Email', 'Phone', 'BAC Year', 'Destination', 'Status', 'Payment Status', 'Submitted Date']
        ];
        
        adminState.applications.forEach(app => {
            csvRows.push([
                app.applicationNumber,
                app.fullName,
                app.email,
                app.phone,
                app.bacDate,
                app.destination,
                app.status,
                app.paymentStatus,
                app.submittedDate
            ]);
        });
        
        const csvStr = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        appsFolder.file('applications_export.csv', csvStr);
        
        // Create HTML summary report
        const htmlSummary = generateSummaryReport(adminState.applications);
        appsFolder.file('summary_report.html', htmlSummary);
        
        // Generate and download ZIP
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(content);
        link.href = url;
        link.download = `bougie_applications_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Download completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error creating ZIP:', error);
        showNotification('Failed to create download. Please try again.', 'error');
    }
}

/**
 * Generate HTML summary report
 * @param {Array} applications - List of applications
 * @returns {string} HTML report
 */
function generateSummaryReport(applications) {
    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        italy: applications.filter(a => a.destination === 'Italy').length,
        campusFrance: applications.filter(a => a.destination === 'Campus France').length
    };
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Applications Report - Bougie Immigration</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f4eddb; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; }
                h1 { color: #2c2b28; border-bottom: 2px solid #9b8e6e; padding-bottom: 10px; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 20px 0; }
                .stat-card { background: #f4eddb; padding: 15px; border-radius: 12px; text-align: center; }
                .stat-value { font-size: 28px; font-weight: bold; color: #2c2b28; }
                .stat-label { color: #6b6a66; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #dcdad5; }
                .status-pending { color: #f39c12; }
                .status-approved { color: #27ae60; }
                .status-rejected { color: #e74c3c; }
                .footer { margin-top: 30px; text-align: center; color: #6b6a66; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Bougie Immigration - Applications Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Total Applications</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.pending}</div>
                        <div class="stat-label">Pending</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.approved}</div>
                        <div class="stat-label">Approved</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.rejected}</div>
                        <div class="stat-label">Rejected</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.italy}</div>
                        <div class="stat-label">Italy</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.campusFrance}</div>
                        <div class="stat-label">Campus France</div>
                    </div>
                </div>
                
                <h2>Application Details</h2>
                <table>
                    <thead>
                        <tr><th>Application #</th><th>Full Name</th><th>Email</th><th>Destination</th><th>Status</th><th>Submitted Date</th></tr>
                    </thead>
                    <tbody>
                        ${applications.map(app => `
                            <tr>
                                <td>${app.applicationNumber}</td>
                                <td>${app.fullName}</td>
                                <td>${app.email}</td>
                                <td>${app.destination}</td>
                                <td class="status-${app.status}">${app.status.toUpperCase()}</td>
                                <td>${app.submittedDate}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Bougie Immigration - Professional Study Immigration Services</p>
                </div>
            </div>
        </body>
        </html>
    `;
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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Style the notification
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
    
    // Add close button functionality
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
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Get notification icon based on type
 * @param {string} type - Notification type
 * @returns {string} Icon class
 */
function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

/**
 * Format date for display
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

// Export functions for global access
window.viewApplication = viewApplication;
window.approveApplication = approveApplication;
window.rejectApplication = rejectApplication;
window.closeModal = closeModal;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAdminDashboard);
