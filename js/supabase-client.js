/**
 * Bougie Immigration - Supabase Client Configuration
 * Database: PostgreSQL via Supabase
 * Storage: Document uploads (applications, receipts)
 * 
 * Configuration:
 * - API URL: https://qpprzcckolmdyabnmgol.supabase.co
 * - Anon Key: Provided for client-side operations
 * - Service Role Key: For admin operations (use only on server-side in production)
 */

// Supabase configuration
const SUPABASE_CONFIG = {
    url: 'https://qpprzcckolmdyabnmgol.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA5MTYsImV4cCI6MjA4OTkzNjkxNn0.Pp9fTdklyomxmG6wsb8FBzyhLXaXEx983ofdaiPG_So',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM2MDkxNiwiZXhwIjoyMDg5OTM2OTE2fQ.I5TtYG29lrawkES9F2RiPr6PReaEsbPyPaocZ4IDCNk',
    storageBucket: 'documents'
};

// Initialize Supabase client
let supabaseClient = null;

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client instance
 */
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Please include the Supabase JS library.');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase client initialized successfully');
    }
    
    return supabaseClient;
}

/**
 * Get Supabase client instance
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

/**
 * Database table names
 */
const TABLES = {
    APPLICATIONS: 'applications',
    USERS: 'users',
    ADMIN_SESSIONS: 'admin_sessions',
    DOCUMENTS: 'documents'
};

/**
 * Application status enum
 */
const APPLICATION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PAYMENT_PENDING: 'payment_pending',
    PAYMENT_VERIFIED: 'payment_verified',
    DOCUMENTS_REQUIRED: 'documents_required'
};

/**
 * Destination types
 */
const DESTINATIONS = {
    ITALY: 'italy',
    CAMPUS_FRANCE: 'campus_france'
};

/**
 * Study levels
 */
const STUDY_LEVELS = {
    BACHELOR: 'Bachelor',
    MASTER: 'Master'
};

/**
 * Generate unique application number
 * Format: DEST-YEAR-RANDOM (e.g., IT-2024-A3B5C7)
 * @param {string} destination - Italy or Campus France
 * @returns {string} Unique application number
 */
function generateApplicationNumber(destination) {
    const prefix = destination === DESTINATIONS.ITALY ? 'IT' : 'CF';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
}

/**
 * Create a new application in the database
 * @param {Object} applicationData - Application form data
 * @returns {Promise<Object>} Created application record
 */
async function createApplication(applicationData) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    const applicationNumber = generateApplicationNumber(applicationData.destination);
    
    const newApplication = {
        application_number: applicationNumber,
        first_name: applicationData.firstName,
        last_name: applicationData.lastName,
        birth_date: applicationData.birthDate,
        role: applicationData.role || 'Student',
        bac_date: applicationData.bacDate,
        email: applicationData.email,
        phone: applicationData.phone,
        year_of_study: applicationData.yearOfStudies,
        courses: applicationData.courses,
        destination: applicationData.destination,
        documents_urls: applicationData.documentsUrls || {},
        payment_status: applicationData.paymentStatus || 'pending',
        application_status: APPLICATION_STATUS.PENDING,
        submitted_at: new Date().toISOString(),
        payment_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { data, error } = await supabase
        .from(TABLES.APPLICATIONS)
        .insert([newApplication])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating application:', error);
        throw new Error(`Failed to create application: ${error.message}`);
    }
    
    return data;
}

/**
 * Get application by application number
 * @param {string} applicationNumber - Unique application number
 * @returns {Promise<Object>} Application record
 */
async function getApplicationByNumber(applicationNumber) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase
        .from(TABLES.APPLICATIONS)
        .select('*')
        .eq('application_number', applicationNumber)
        .single();
    
    if (error) {
        console.error('Error fetching application:', error);
        return null;
    }
    
    return data;
}

/**
 * Get all applications (admin only)
 * @param {Object} filters - Optional filters (status, destination, search)
 * @returns {Promise<Array>} List of applications
 */
async function getAllApplications(filters = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    let query = supabase.from(TABLES.APPLICATIONS).select('*');
    
    if (filters.status && filters.status !== 'all') {
        query = query.eq('application_status', filters.status);
    }
    
    if (filters.destination && filters.destination !== 'all') {
        query = query.eq('destination', filters.destination);
    }
    
    if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,application_number.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('submitted_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching applications:', error);
        throw new Error(`Failed to fetch applications: ${error.message}`);
    }
    
    return data;
}

/**
 * Update application status
 * @param {string} applicationId - Application ID
 * @param {string} status - New status
 * @param {string} notes - Optional admin notes
 * @returns {Promise<Object>} Updated application
 */
async function updateApplicationStatus(applicationId, status, notes = null) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    const updateData = {
        application_status: status,
        updated_at: new Date().toISOString()
    };
    
    if (notes) {
        updateData.admin_notes = notes;
    }
    
    if (status === APPLICATION_STATUS.APPROVED || status === APPLICATION_STATUS.REJECTED) {
        updateData.decision_date = new Date().toISOString();
    }
    
    const { data, error } = await supabase
        .from(TABLES.APPLICATIONS)
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating application status:', error);
        throw new Error(`Failed to update application: ${error.message}`);
    }
    
    return data;
}

/**
 * Update payment status
 * @param {string} applicationId - Application ID
 * @param {string} paymentStatus - Payment status
 * @param {string} receiptUrl - Uploaded receipt URL
 * @returns {Promise<Object>} Updated application
 */
async function updatePaymentStatus(applicationId, paymentStatus, receiptUrl = null) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    const updateData = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
    };
    
    if (receiptUrl) {
        updateData.payment_receipt_url = receiptUrl;
    }
    
    const { data, error } = await supabase
        .from(TABLES.APPLICATIONS)
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating payment status:', error);
        throw new Error(`Failed to update payment: ${error.message}`);
    }
    
    return data;
}

/**
 * Upload document to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} applicationNumber - Application number for folder
 * @param {string} documentType - Type of document (passport, cv, etc.)
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadDocument(file, applicationNumber, documentType) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error(`File size exceeds 5MB limit. Current file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF and JPG files are allowed.');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${applicationNumber}/${documentType}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
        .from(SUPABASE_CONFIG.storageBucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });
    
    if (error) {
        console.error('Error uploading document:', error);
        throw new Error(`Failed to upload document: ${error.message}`);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_CONFIG.storageBucket)
        .getPublicUrl(fileName);
    
    return publicUrlData.publicUrl;
}

/**
 * Upload payment receipt
 * @param {File} file - Receipt file
 * @param {string} applicationNumber - Application number
 * @returns {Promise<string>} Public URL of receipt
 */
async function uploadPaymentReceipt(file, applicationNumber) {
    return uploadDocument(file, applicationNumber, 'payment_receipt');
}

/**
 * Upload all documents for an application
 * @param {Object} documents - Object containing files for each document type
 * @param {string} applicationNumber - Application number
 * @returns {Promise<Object>} Object with URLs for each document
 */
async function uploadAllDocuments(documents, applicationNumber) {
    const uploadPromises = [];
    const documentUrls = {};
    
    for (const [docType, file] of Object.entries(documents)) {
        if (file && file instanceof File) {
            uploadPromises.push(
                uploadDocument(file, applicationNumber, docType)
                    .then(url => {
                        documentUrls[docType] = url;
                    })
                    .catch(error => {
                        console.error(`Failed to upload ${docType}:`, error);
                        documentUrls[docType] = null;
                    })
            );
        }
    }
    
    await Promise.all(uploadPromises);
    return documentUrls;
}

/**
 * Check if payment deadline has passed
 * @param {string} applicationId - Application ID
 * @returns {Promise<boolean>} True if deadline passed
 */
async function checkPaymentDeadline(applicationId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase
        .from(TABLES.APPLICATIONS)
        .select('payment_deadline, payment_status, application_status')
        .eq('id', applicationId)
        .single();
    
    if (error) {
        console.error('Error checking payment deadline:', error);
        return false;
    }
    
    const deadline = new Date(data.payment_deadline);
    const now = new Date();
    
    if (now > deadline && data.payment_status !== 'paid' && data.application_status === APPLICATION_STATUS.PENDING) {
        // Auto-reject if payment not received by deadline
        await updateApplicationStatus(applicationId, APPLICATION_STATUS.REJECTED, 'Payment deadline expired');
        return true;
    }
    
    return false;
}

/**
 * Get statistics for admin dashboard
 * @returns {Promise<Object>} Statistics object
 */
async function getApplicationStatistics() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase
        .from(TABLES.APPLICATIONS)
        .select('application_status, destination');
    
    if (error) {
        console.error('Error fetching statistics:', error);
        return {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            italy: 0,
            campusFrance: 0
        };
    }
    
    const stats = {
        total: data.length,
        pending: data.filter(app => app.application_status === APPLICATION_STATUS.PENDING).length,
        approved: data.filter(app => app.application_status === APPLICATION_STATUS.APPROVED).length,
        rejected: data.filter(app => app.application_status === APPLICATION_STATUS.REJECTED).length,
        italy: data.filter(app => app.destination === DESTINATIONS.ITALY).length,
        campusFrance: data.filter(app => app.destination === DESTINATIONS.CAMPUS_FRANCE).length
    };
    
    return stats;
}

/**
 * Delete application (admin only)
 * @param {string} applicationId - Application ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteApplication(applicationId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }
    
    const { error } = await supabase
        .from(TABLES.APPLICATIONS)
        .delete()
        .eq('id', applicationId);
    
    if (error) {
        console.error('Error deleting application:', error);
        return false;
    }
    
    return true;
}

/**
 * Verify admin credentials (simplified - in production use proper auth)
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<boolean>} Authentication result
 */
async function verifyAdminCredentials(username, password) {
    // In production, this should query a secure admin table with hashed passwords
    // For demo purposes, using hardcoded credentials
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'password123';
    
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * Export all functions for use in other scripts
 */
window.SupabaseClient = {
    init: initSupabase,
    getClient: getSupabaseClient,
    createApplication,
    getApplicationByNumber,
    getAllApplications,
    updateApplicationStatus,
    updatePaymentStatus,
    uploadDocument,
    uploadPaymentReceipt,
    uploadAllDocuments,
    checkPaymentDeadline,
    getApplicationStatistics,
    deleteApplication,
    verifyAdminCredentials,
    TABLES,
    APPLICATION_STATUS,
    DESTINATIONS,
    STUDY_LEVELS,
    generateApplicationNumber
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSupabase();
    });
} else {
    initSupabase();
}

console.log('Supabase client module loaded');
