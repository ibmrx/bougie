/**
 * Bougie Immigration - Main JavaScript
 * Shared functionality across all pages
 * Handles navigation, notifications, modals, and common utilities
 */

// Global state
let BougieApp = {
    config: {
        companyName: 'Bougie Immigration',
        phoneNumber: '07 70 61 41 98',
        instagram: '@bougie_immigration06',
        email: 'benlassousmohamedreda@gmail.com',
        colors: {
            primary: '#2c2b28',
            secondary: '#dcdad5',
            accent: '#9b8e6e',
            background: '#f4eddb'
        }
    },
    notifications: [],
    modals: {},
    currentUser: null
};

/**
 * Initialize main application
 */
function initMain() {
    setupMobileNavigation();
    setupSmoothScroll();
    setupBackToTop();
    setupNotificationSystem();
    setupModalSystem();
    loadGoogleFonts();
    addFavicon();
    setupFormProtection();
    setupAnalytics();
    
    // Set current year in footer
    setCurrentYear();
    
    console.log('Bougie Immigration - Application initialized');
}

/**
 * Setup mobile navigation toggle
 */
function setupMobileNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            navToggle.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('show');
                navToggle.classList.remove('active');
            });
        });
    }
}

/**
 * Setup smooth scrolling for anchor links
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without jumping
                history.pushState(null, null, targetId);
            }
        });
    });
}

/**
 * Setup back to top button
 */
function setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Setup notification system
 */
function setupNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notificationContainer')) {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
            }
            
            .notification {
                background: white;
                border-radius: 12px;
                padding: 12px 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid;
            }
            
            .notification-success {
                border-left-color: #27ae60;
            }
            
            .notification-success i {
                color: #27ae60;
            }
            
            .notification-error {
                border-left-color: #e74c3c;
            }
            
            .notification-error i {
                color: #e74c3c;
            }
            
            .notification-warning {
                border-left-color: #f39c12;
            }
            
            .notification-warning i {
                color: #f39c12;
            }
            
            .notification-info {
                border-left-color: #3498db;
            }
            
            .notification-info i {
                color: #3498db;
            }
            
            .notification-content {
                flex: 1;
                font-size: 14px;
                color: #2c2b28;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #6b6a66;
                font-size: 16px;
                padding: 4px;
                transition: color 0.3s;
            }
            
            .notification-close:hover {
                color: #e74c3c;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .notification-removing {
                animation: slideOutRight 0.3s ease forwards;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Type: success, error, warning, info
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="notification-content">${escapeHtml(message)}</div>
        <button class="notification-close">&times;</button>
    `;
    
    container.appendChild(notification);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => removeNotification(notification));
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            removeNotification(notification);
        }
    }, duration);
    
    return notification;
}

/**
 * Remove notification with animation
 * @param {HTMLElement} notification - Notification element
 */
function removeNotification(notification) {
    notification.classList.add('notification-removing');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 300);
}

/**
 * Get icon for notification type
 * @param {string} type - Notification type
 * @returns {string} Font Awesome icon class
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
 * Setup modal system
 */
function setupModalSystem() {
    // Create modal overlay if it doesn't exist
    if (!document.getElementById('globalModal')) {
        const modalHTML = `
            <div id="globalModal" class="modal-overlay" style="display: none;">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3 id="modalTitle">Modal Title</h3>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body" id="modalBody">
                        Modal content goes here
                    </div>
                    <div class="modal-footer" id="modalFooter">
                        <button class="btn btn-secondary modal-cancel">Cancel</button>
                        <button class="btn btn-primary modal-confirm">Confirm</button>
                    </div>
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal-overlay.active {
                opacity: 1;
            }
            
            .modal-container {
                background-color: white;
                border-radius: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .modal-overlay.active .modal-container {
                transform: scale(1);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #dcdad5;
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: 1.25rem;
            }
            
            .modal-close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6b6a66;
                transition: color 0.3s;
            }
            
            .modal-close-btn:hover {
                color: #e74c3c;
            }
            
            .modal-body {
                padding: 1.5rem;
            }
            
            .modal-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid #dcdad5;
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
            }
        `;
        
        document.head.appendChild(style);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

/**
 * Show modal dialog
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.content - Modal content HTML
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {Function} options.onConfirm - Confirm callback
 * @param {Function} options.onCancel - Cancel callback
 */
function showModal(options) {
    const modal = document.getElementById('globalModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const footer = document.getElementById('modalFooter');
    const confirmBtn = footer.querySelector('.modal-confirm');
    const cancelBtn = footer.querySelector('.modal-cancel');
    const closeBtn = modal.querySelector('.modal-close-btn');
    
    if (!modal) return;
    
    // Set content
    title.textContent = options.title || 'Modal';
    body.innerHTML = options.content || '';
    
    // Set button texts
    if (options.confirmText) confirmBtn.textContent = options.confirmText;
    if (options.cancelText) cancelBtn.textContent = options.cancelText;
    
    // Show modal with animation
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Handle confirm
    const handleConfirm = () => {
        if (options.onConfirm) options.onConfirm();
        closeModal();
    };
    
    // Handle cancel/close
    const handleClose = () => {
        if (options.onCancel) options.onCancel();
        closeModal();
    };
    
    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = handleClose;
    closeBtn.onclick = handleClose;
    
    // Close on overlay click
    modal.onclick = (e) => {
        if (e.target === modal) handleClose();
    };
    
    // Store handlers for cleanup
    modal._handlers = { handleConfirm, handleClose };
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('globalModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        // Cleanup handlers
        if (modal._handlers) {
            const confirmBtn = modal.querySelector('.modal-confirm');
            const cancelBtn = modal.querySelector('.modal-cancel');
            const closeBtn = modal.querySelector('.modal-close-btn');
            if (confirmBtn) confirmBtn.onclick = null;
            if (cancelBtn) cancelBtn.onclick = null;
            if (closeBtn) closeBtn.onclick = null;
            modal.onclick = null;
            delete modal._handlers;
        }
    }, 300);
}

/**
 * Setup form protection (prevent double submission)
 */
function setupFormProtection() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('[type="submit"]');
            if (submitBtn && submitBtn.classList.contains('submitting')) {
                e.preventDefault();
                return;
            }
            
            if (submitBtn) {
                submitBtn.classList.add('submitting');
                submitBtn.disabled = true;
                
                // Re-enable after 3 seconds if form doesn't submit
                setTimeout(() => {
                    submitBtn.classList.remove('submitting');
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    });
}

/**
 * Load Google Fonts
 */
function loadGoogleFonts() {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

/**
 * Add favicon
 */
function addFavicon() {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/x-icon';
    favicon.href = 'https://uploads.onecompiler.io/437muad7y/44hafv45b/blogo.jpg';
    document.head.appendChild(favicon);
}

/**
 * Set current year in footer
 */
function setCurrentYear() {
    const yearElements = document.querySelectorAll('.current-year');
    const currentYear = new Date().getFullYear();
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });
}

/**
 * Setup basic analytics (page view tracking)
 */
function setupAnalytics() {
    // Track page views
    const pageData = {
        page: window.location.pathname,
        title: document.title,
        timestamp: new Date().toISOString(),
        referrer: document.referrer
    };
    
    console.log('Page view:', pageData);
    
    // In production, you would send this to an analytics service
    // For now, just store in session storage for debugging
    const views = JSON.parse(sessionStorage.getItem('page_views') || '[]');
    views.push(pageData);
    sessionStorage.setItem('page_views', JSON.stringify(views.slice(-10))); // Keep last 10
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Valid email
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Valid phone number
 */
function isValidPhone(phone) {
    const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
    return re.test(phone);
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type (short, long, etc.)
 * @returns {string} Formatted date
 */
function formatDate(date, format = 'long') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    if (format === 'short') {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
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
 * Debounce function for performance
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
 * Throttle function for performance
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success', 2000);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard', 'error', 2000);
        return false;
    }
}

/**
 * Get URL parameter
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value
 */
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Set URL parameter without reload
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
function setUrlParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

/**
 * Remove URL parameter
 * @param {string} name - Parameter name
 */
function removeUrlParameter(name) {
    const url = new URL(window.location);
    url.searchParams.delete(name);
    window.history.pushState({}, '', url);
}

// Export global functions
window.BougieApp = BougieApp;
window.showNotification = showNotification;
window.showModal = showModal;
window.closeModal = closeModal;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.formatPhoneNumber = formatPhoneNumber;
window.formatDate = formatDate;
window.escapeHtml = escapeHtml;
window.debounce = debounce;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.getUrlParameter = getUrlParameter;
window.setUrlParameter = setUrlParameter;
window.removeUrlParameter = removeUrlParameter;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initMain);
