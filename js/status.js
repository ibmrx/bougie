/**
 * Bougie Immigration - Application Status Lookup
 * Connects to Supabase database to fetch real application data
 */

// Supabase configuration
const SUPABASE_URL = 'https://qpprzcckolmdyabnmgol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA5MTYsImV4cCI6MjA4OTkzNjkxNn0.Pp9fTdklyomxmG6wsb8FBzyhLXaXEx983ofdaiPG_So';

let supabase = null;
let currentApplication = null;
let isLoading = false;

// DOM Elements
const elements = {
    applicationNumber: null,
    searchBtn: null,
    loading: null,
    errorMessage: null,
    errorText: null,
    resultContainer: null,
    statusBadge: null,
    statusText: null,
    fullName: null,
    birthDate: null,
    email: null,
    phone: null,
    destination: null,
    applyingDegree: null,
    bacDate: null,
    appNumber: null,
    timelineItems: null
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
 * Initialize status lookup page
 */
function initStatusLookup() {
    cacheElements();
    setupEventListeners();
    initSupabase();
    
    // Check if there's an application number in URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const appNumber = urlParams.get('app');
    if (appNumber && elements.applicationNumber) {
        elements.applicationNumber.value = appNumber;
        searchApplication();
    }
}

/**
 * Cache DOM elements
 */
function cacheElements() {
    elements.applicationNumber = document.getElementById('applicationNumber');
    elements.searchBtn = document.getElementById('searchBtn');
    elements.loading = document.getElementById('loading');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.errorText = document.getElementById('errorText');
    elements.resultContainer = document.getElementById('resultContainer');
    elements.statusBadge = document.getElementById('statusBadge');
    elements.statusText = document.getElementById('statusText');
    elements.fullName = document.getElementById('fullName');
    elements.birthDate = document.getElementById('birthDate');
    elements.email = document.getElementById('email');
    elements.phone = document.getElementById('phone');
    elements.destination = document.getElementById('destination');
    elements.applyingDegree = document.getElementById('applyingDegree');
    elements.bacDate = document.getElementById('bacDate');
    elements.appNumber = document.getElementById('appNumber');
    elements.timelineItems = document.getElementById('timelineItems');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', searchApplication);
    }
    
    if (elements.applicationNumber) {
        elements.applicationNumber.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchApplication();
            }
        });
        
        // Auto uppercase
        elements.applicationNumber.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

/**
 * Search for application by number
 */
async function searchApplication() {
    const appNumber = elements.applicationNumber?.value.trim().toUpperCase();
    
    if (!appNumber) {
        showError('Please enter an application number.');
        return;
    }
    
    if (isLoading) return;
    isLoading = true;
    
    showLoading(true);
    hideResult();
    hideError();
    
    try {
        const client = initSupabase();
        if (!client) {
            throw new Error('Database connection failed');
        }
        
        const { data, error } = await client
            .from('applications')
            .select('*')
            .eq('application_number', appNumber)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                showError(`Application number "${appNumber}" not found. Please check and try again.`);
            } else {
                throw error;
            }
        } else if (data) {
            displayApplication(data);
            currentApplication = data;
        } else {
            showError(`Application number "${appNumber}" not found. Please check and try again.`);
        }
        
    } catch (error) {
        console.error('Error searching application:', error);
        showError('Unable to connect to the database. Please try again later or contact support.');
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

/**
 * Display application information
 * @param {Object} application - Application data from database
 */
function displayApplication(application) {
    // Set status badge
    const statusClass = getStatusClass(application.application_status);
    const statusIcon = getStatusIcon(application.application_status);
    const statusText = getStatusText(application.application_status);
    
    if (elements.statusBadge) {
        elements.statusBadge.className = `status-badge ${statusClass}`;
        elements.statusBadge.innerHTML = `<i class="fas ${statusIcon}"></i><span>${statusText}</span>`;
    }
    
    // Set personal information
    if (elements.fullName) {
        elements.fullName.textContent = `${application.first_name || ''} ${application.last_name || ''}`.trim() || 'Not provided';
    }
    if (elements.birthDate) elements.birthDate.textContent = formatDate(application.birth_date);
    if (elements.email) elements.email.textContent = application.email || 'Not provided';
    if (elements.phone) elements.phone.textContent = application.phone || 'Not provided';
    if (elements.destination) elements.destination.textContent = getDestinationDisplay(application.destination);
    if (elements.applyingDegree) elements.applyingDegree.textContent = application.year_of_study || 'Not specified';
    if (elements.bacDate) elements.bacDate.textContent = formatMonthYear(application.bac_date);
    if (elements.appNumber) elements.appNumber.textContent = application.application_number;
    
    // Build and display timeline
    buildTimeline(application);
    
    // Show result container with animation
    if (elements.resultContainer) {
        elements.resultContainer.classList.add('show');
    }
}

/**
 * Build timeline for application
 * @param {Object} application - Application data
 */
function buildTimeline(application) {
    if (!elements.timelineItems) return;
    
    const timelineItems = [];
    
    // Submission
    timelineItems.push({
        title: 'Application Submitted',
        date: application.created_at || application.submitted_at,
        icon: 'fa-file-alt',
        description: `Your application was successfully submitted on ${formatDate(application.created_at || application.submitted_at)}`
    });
    
    // Payment status
    if (application.payment_status === 'paid') {
        timelineItems.push({
            title: 'Payment Received',
            date: application.payment_date || application.updated_at,
            icon: 'fa-credit-card',
            description: 'Payment has been verified and received.'
        });
    } else if (application.payment_status === 'pending') {
        const deadlineText = application.payment_deadline ? formatDate(application.payment_deadline) : 'within 3 days';
        timelineItems.push({
            title: 'Payment Pending',
            date: application.payment_deadline,
            icon: 'fa-clock',
            description: `Payment required within 3 days of submission. Deadline: ${deadlineText}`
        });
    }
    
    // Decision
    if (application.application_status === 'approved') {
        timelineItems.push({
            title: 'Application Approved',
            date: application.decision_date,
            icon: 'fa-check-circle',
            description: 'Congratulations! Your application has been approved.'
        });
        timelineItems.push({
            title: 'Next Steps',
            date: null,
            icon: 'fa-arrow-right',
            description: 'Visa application process will begin. You will receive further instructions via email.'
        });
    } else if (application.application_status === 'rejected') {
        timelineItems.push({
            title: 'Application Rejected',
            date: application.decision_date,
            icon: 'fa-times-circle',
            description: 'We regret to inform you that your application was not approved.'
        });
        if (application.admin_notes) {
            timelineItems.push({
                title: 'Reason for Decision',
                date: null,
                icon: 'fa-info-circle',
                description: application.admin_notes
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
    elements.timelineItems.innerHTML = '';
    
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
        elements.timelineItems.appendChild(timelineDiv);
    });
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
 * Get destination display name
 * @param {string} destination - Destination code
 * @returns {string} Display name
 */
function getDestinationDisplay(destination) {
    if (destination === 'italy') return 'Italy';
    if (destination === 'campus_france') return 'Campus France';
    return destination || 'Not specified';
}

/**
 * Format date for display
 * @param {string} dateString - Date string
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
    if (elements.loading) {
        elements.loading.classList.toggle('show', show);
    }
}

/**
 * Hide result container
 */
function hideResult() {
    if (elements.resultContainer) {
        elements.resultContainer.classList.remove('show');
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    if (elements.errorMessage && elements.errorText) {
        elements.errorText.textContent = message;
        elements.errorMessage.classList.add('show');
    }
    if (elements.resultContainer) {
        elements.resultContainer.classList.remove('show');
    }
}

/**
 * Hide error message
 */
function hideError() {
    if (elements.errorMessage) {
        elements.errorMessage.classList.remove('show');
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initStatusLookup);
