/**
 * Bougie Immigration - Application Status Lookup
 * Allows users to check their application status using application number
 */

// Status lookup state
let statusState = {
    currentApplication: null,
    isLoading: false,
    lastSearch: null
};

// DOM Elements cache
let statusElements = {};

/**
 * Initialize status lookup page
 */
function initStatusLookup() {
    cacheElements();
    setupEventListeners();
    
    // Check if there's an application number in URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const appNumber = urlParams.get('app');
    if (appNumber) {
        document.getElementById('applicationNumber').value = appNumber;
        searchApplication();
    }
}

/**
 * Cache DOM elements
 */
function cacheElements() {
    statusElements = {
        applicationNumber: document.getElementById('applicationNumber'),
        searchBtn: document.getElementById('searchBtn'),
        loading: document.getElementById('loading'),
        errorMessage: document.getElementById('errorMessage'),
        errorText: document.getElementById('errorText'),
        resultContainer: document.getElementById('resultContainer'),
        statusBadge: document.getElementById('statusBadge'),
        statusText: document.getElementById('statusText'),
        fullName: document.getElementById('fullName'),
        birthDate: document.getElementById('birthDate'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        destination: document.getElementById('destination'),
        yearOfStudies: document.getElementById('yearOfStudies'),
        bacDate: document.getElementById('bacDate'),
        appNumber: document.getElementById('appNumber'),
        timelineItems: document.getElementById('timelineItems')
    };
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (statusElements.searchBtn) {
        statusElements.searchBtn.addEventListener('click', searchApplication);
    }
    
    if (statusElements.applicationNumber) {
        statusElements.applicationNumber.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchApplication();
            }
        });
        
        // Auto uppercase
        statusElements.applicationNumber.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

/**
 * Search for application by number
 */
async function searchApplication() {
    const appNumber = statusElements.applicationNumber?.value.trim().toUpperCase();
    
    if (!appNumber) {
        showError('Please enter an application number.');
        return;
    }
    
    if (statusState.isLoading) return;
    
    statusState.lastSearch = appNumber;
    statusState.isLoading = true;
    
    // Show loading, hide previous results
    showLoading(true);
    hideResult();
    hideError();
    
    try {
        // In production, this would fetch from Supabase
        // const supabase = window.SupabaseClient?.getClient();
        // let application = null;
        // if (supabase) {
        //     const { data, error } = await supabase
        //         .from('applications')
        //         .select('*')
        //         .eq('application_number', appNumber)
        //         .single();
        //     if (!error) application = data;
        // }
        
        // Demo data for now
        const application = getDemoApplication(appNumber);
        
        if (application) {
            displayApplication(application);
            statusState.currentApplication = application;
        } else {
            showError(`Application number "${appNumber}" not found. Please check and try again.`);
        }
        
    } catch (error) {
        console.error('Error searching application:', error);
        showError('An error occurred while searching. Please try again later.');
    } finally {
        statusState.isLoading = false;
        showLoading(false);
    }
}

/**
 * Get demo application data
 * @param {string} appNumber - Application number
 * @returns {Object|null} Application data or null if not found
 */
function getDemoApplication(appNumber) {
    const demoApplications = {
        'IT-2024-A3B5C7': {
            fullName: 'Ahmed Benali',
            firstName: 'Ahmed',
            lastName: 'Benali',
            birthDate: '1998-05-15',
            email: 'ahmed.benali@example.com',
            phone: '+213 55 12 34 567',
            destination: 'Italy',
            yearOfStudies: 'Master',
            bacDate: '2016-06',
            applicationNumber: 'IT-2024-A3B5C7',
            status: 'approved',
            statusText: 'Approved',
            submittedDate: '2024-01-15',
            decisionDate: '2024-02-10',
            paymentStatus: 'paid',
            notes: 'Application approved. Visa appointment scheduled for March 2024.'
        },
        'IT-2024-D9E2F1': {
            fullName: 'Fatima Zohra',
            firstName: 'Fatima',
            lastName: 'Zohra',
            birthDate: '2000-03-22',
            email: 'fatima.zohra@example.com',
            phone: '+213 77 98 76 543',
            destination: 'Italy',
            yearOfStudies: 'Bachelor',
            bacDate: '2018-06',
            applicationNumber: 'IT-2024-D9E2F1',
            status: 'pending',
            statusText: 'Under Review',
            submittedDate: '2024-02-20',
            decisionDate: null,
            paymentStatus: 'pending',
            notes: 'Application received. Awaiting document verification.'
        },
        'CF-2024-G4H6I8': {
            fullName: 'Karim Mansouri',
            firstName: 'Karim',
            lastName: 'Mansouri',
            birthDate: '1999-11-10',
            email: 'karim.mansouri@example.com',
            phone: '+213 66 45 67 890',
            destination: 'Campus France',
            yearOfStudies: 'Master',
            bacDate: '2017-06',
            applicationNumber: 'CF-2024-G4H6I8',
            status: 'rejected',
            statusText: 'Rejected',
            submittedDate: '2024-01-05',
            decisionDate: '2024-01-28',
            paymentStatus: 'paid',
            notes: 'TCF score below minimum requirement. Please retake the test and submit new scores.'
        },
        'IT-2024-H7J9K1': {
            fullName: 'Sofia Benyahia',
            firstName: 'Sofia',
            lastName: 'Benyahia',
            birthDate: '2001-08-14',
            email: 'sofia.benyahia@example.com',
            phone: '+213 55 98 76 543',
            destination: 'Italy',
            yearOfStudies: 'Bachelor',
            bacDate: '2019-06',
            applicationNumber: 'IT-2024-H7J9K1',
            status: 'pending',
            statusText: 'Under Review',
            submittedDate: '2024-02-25',
            decisionDate: null,
            paymentStatus: 'pending',
            notes: 'Payment pending. 3 days remaining to complete payment.'
        },
        'CF-2024-L2M4N6': {
            fullName: 'Yacine Boudiaf',
            firstName: 'Yacine',
            lastName: 'Boudiaf',
            birthDate: '1997-02-28',
            email: 'yacine.boudiaf@example.com',
            phone: '+213 77 12 34 567',
            destination: 'Campus France',
            yearOfStudies: 'Master',
            bacDate: '2015-06',
            applicationNumber: 'CF-2024-L2M4N6',
            status: 'approved',
            statusText: 'Approved',
            submittedDate: '2024-01-20',
            decisionDate: '2024-02-15',
            paymentStatus: 'paid',
            notes: 'Application approved. Visa application process will begin shortly.'
        }
    };
    
    return demoApplications[appNumber] || null;
}

/**
 * Display application information
 * @param {Object} application - Application data
 */
function displayApplication(application) {
    // Set status badge
    const statusClass = getStatusClass(application.status);
    const statusIcon = getStatusIcon(application.status);
    const statusText = getStatusText(application.status);
    
    if (statusElements.statusBadge) {
        statusElements.statusBadge.className = `status-badge ${statusClass}`;
        statusElements.statusBadge.innerHTML = `<i class="fas ${statusIcon}"></i><span>${statusText}</span>`;
    }
    
    // Set personal information
    if (statusElements.fullName) statusElements.fullName.textContent = application.fullName;
    if (statusElements.birthDate) statusElements.birthDate.textContent = formatDate(application.birthDate);
    if (statusElements.email) statusElements.email.textContent = application.email;
    if (statusElements.phone) statusElements.phone.textContent = application.phone;
    if (statusElements.destination) statusElements.destination.textContent = application.destination;
    if (statusElements.yearOfStudies) statusElements.yearOfStudies.textContent = application.yearOfStudies;
    if (statusElements.bacDate) statusElements.bacDate.textContent = formatMonthYear(application.bacDate);
    if (statusElements.appNumber) statusElements.appNumber.textContent = application.applicationNumber;
    
    // Build and display timeline
    buildTimeline(application);
    
    // Show result container with animation
    if (statusElements.resultContainer) {
        statusElements.resultContainer.classList.add('show');
    }
}

/**
 * Build timeline for application
 * @param {Object} application - Application data
 */
function buildTimeline(application) {
    if (!statusElements.timelineItems) return;
    
    const timelineItems = [];
    
    // Submission
    timelineItems.push({
        title: 'Application Submitted',
        date: application.submittedDate,
        icon: 'fa-file-alt',
        description: `Your application was successfully submitted on ${formatDate(application.submittedDate)}`
    });
    
    // Payment verification
    if (application.paymentStatus === 'paid') {
        timelineItems.push({
            title: 'Payment Received',
            date: application.submittedDate ? addDays(application.submittedDate, 1) : null,
            icon: 'fa-credit-card',
            description: 'Payment has been verified and received.'
        });
    } else if (application.paymentStatus === 'pending') {
        const deadline = application.submittedDate ? addDays(application.submittedDate, 3) : null;
        timelineItems.push({
            title: 'Payment Pending',
            date: deadline,
            icon: 'fa-clock',
            description: `Payment required within 3 days of submission. Deadline: ${deadline ? formatDate(deadline) : 'N/A'}`
        });
    }
    
    // Document verification (if applicable)
    if (application.status !== 'pending') {
        timelineItems.push({
            title: 'Document Verification',
            date: application.decisionDate ? addDays(application.decisionDate, -5) : null,
            icon: 'fa-file-alt',
            description: 'Documents have been reviewed by our team.'
        });
    }
    
    // Decision
    if (application.status === 'approved') {
        timelineItems.push({
            title: 'Application Approved',
            date: application.decisionDate,
            icon: 'fa-check-circle',
            description: 'Congratulations! Your application has been approved.'
        });
        
        timelineItems.push({
            title: 'Next Steps',
            date: null,
            icon: 'fa-arrow-right',
            description: 'Visa application process will begin. You will receive further instructions via email.'
        });
        
    } else if (application.status === 'rejected') {
        timelineItems.push({
            title: 'Application Rejected',
            date: application.decisionDate,
            icon: 'fa-times-circle',
            description: 'We regret to inform you that your application was not approved.'
        });
        
        if (application.notes) {
            timelineItems.push({
                title: 'Reason for Rejection',
                date: null,
                icon: 'fa-info-circle',
                description: application.notes
            });
        }
        
    } else {
        timelineItems.push({
            title: 'Under Review',
            date: new Date().toISOString(),
            icon: 'fa-search',
            description: 'Your application is currently being reviewed by our team. We will notify you once a decision is made.'
        });
    }
    
    // Render timeline
    statusElements.timelineItems.innerHTML = '';
    
    timelineItems.forEach((item, index) => {
        const timelineDiv = document.createElement('div');
        timelineDiv.className = 'timeline-item';
        timelineDiv.style.animationDelay = `${index * 0.1}s`;
        timelineDiv.innerHTML = `
            <div class="timeline-icon">
                <i class="fas ${item.icon}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-title">${escapeHtml(item.title)}</div>
                ${item.date ? `<div class="timeline-date">${formatDate(item.date)}</div>` : ''}
                <div class="timeline-description">${escapeHtml(item.description)}</div>
            </div>
        `;
        statusElements.timelineItems.appendChild(timelineDiv);
    });
    
    // Add additional notes if available and not already shown
    if (application.notes && application.status !== 'rejected') {
        const notesDiv = document.createElement('div');
        notesDiv.className = 'timeline-item';
        notesDiv.style.backgroundColor = '#fef5e7';
        notesDiv.innerHTML = `
            <div class="timeline-icon">
                <i class="fas fa-sticky-note"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-title">Additional Information</div>
                <div class="timeline-description">${escapeHtml(application.notes)}</div>
            </div>
        `;
        statusElements.timelineItems.appendChild(notesDiv);
    }
}

/**
 * Add days to a date string
 * @param {string} dateString - Date string
 * @param {number} days - Days to add
 * @returns {string} New date string
 */
function addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Get status badge class
 * @param {string} status - Application status
 * @returns {string} CSS class
 */
function getStatusClass(status) {
    switch(status) {
        case 'approved': return 'approved';
        case 'rejected': return 'rejected';
        default: return 'pending';
    }
}

/**
 * Get status icon
 * @param {string} status - Application status
 * @returns {string} Font Awesome icon class
 */
function getStatusIcon(status) {
    switch(status) {
        case 'approved': return 'fa-check-circle';
        case 'rejected': return 'fa-times-circle';
        default: return 'fa-clock';
    }
}

/**
 * Get status text
 * @param {string} status - Application status
 * @returns {string} Display text
 */
function getStatusText(status) {
    switch(status) {
        case 'approved': return 'Approved';
        case 'rejected': return 'Rejected';
        default: return 'Pending Review';
    }
}

/**
 * Format date for display
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'Not available';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
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
    if (!dateString) return 'Not available';
    
    try {
        const [year, month] = dateString.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    } catch (e) {
        return dateString;
    }
}

/**
 * Show loading spinner
 * @param {boolean} show - Show/hide loading
 */
function showLoading(show) {
    if (statusElements.loading) {
        statusElements.loading.classList.toggle('show', show);
    }
}

/**
 * Hide result container
 */
function hideResult() {
    if (statusElements.resultContainer) {
        statusElements.resultContainer.classList.remove('show');
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    if (statusElements.errorMessage && statusElements.errorText) {
        statusElements.errorText.textContent = message;
        statusElements.errorMessage.classList.add('show');
    }
}

/**
 * Hide error message
 */
function hideError() {
    if (statusElements.errorMessage) {
        statusElements.errorMessage.classList.remove('show');
    }
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
 * Share application status (optional feature)
 * @param {string} appNumber - Application number
 */
function shareStatus(appNumber) {
    const url = `${window.location.origin}${window.location.pathname}?app=${appNumber}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Application Status - Bougie Immigration',
            text: `Check my application status for Bougie Immigration. Application: ${appNumber}`,
            url: url
        }).catch(console.error);
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard!');
        }).catch(() => {
            alert(`Share this link: ${url}`);
        });
    }
}

/**
 * Show notification (optional feature)
 * @param {string} message - Notification message
 */
function showNotification(message) {
    // Simple alert for now, could be enhanced
    console.log(message);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initStatusLookup);
