/**
 * Bougie Immigration - Supabase Client
 * Complete database operations, file storage, and email integration
 */

// Supabase configuration
const SUPABASE_CONFIG = {
    url: 'https://qpprzcckolmdyabnmgol.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA5MTYsImV4cCI6MjA4OTkzNjkxNn0.Pp9fTdklyomxmG6wsb8FBzyhLXaXEx983ofdaiPG_So',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM2MDkxNiwiZXhwIjoyMDg5OTM2OTE2fQ.I5TtYG29lrawkES9F2RiPr6PReaEsbPyPaocZ4IDCNk',
    storageBucket: 'documents'
};

let supabaseClient = null;

/**
 * Initialize Supabase client
 */
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase client initialized');
    }
    
    return supabaseClient;
}

/**
 * Get Supabase client instance
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

/**
 * Generate unique application number
 * Format: DEST-YEAR-RANDOM (e.g., IT-2024-A3B5C7)
 */
function generateApplicationNumber(destination) {
    const prefix = destination === 'italy' ? 'IT' : 'CF';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
}

/**
 * Upload a file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} applicationNumber - Application number for folder
 * @param {string} documentType - Type of document
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadFile(file, applicationNumber, documentType) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error(`File size exceeds 5MB limit. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
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
        console.error('Upload error:', error);
        throw new Error(`Failed to upload document: ${error.message}`);
    }
    
    const { data: urlData } = supabase.storage
        .from(SUPABASE_CONFIG.storageBucket)
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}

/**
 * Upload all documents for an application
 * @param {Object} documents - Object with document files
 * @param {string} applicationNumber - Application number
 * @returns {Promise<Object>} URLs of uploaded documents
 */
async function uploadAllDocuments(documents, applicationNumber) {
    const documentUrls = {};
    const uploadPromises = [];
    
    for (const [docType, file] of Object.entries(documents)) {
        if (file && file instanceof File) {
            uploadPromises.push(
                uploadFile(file, applicationNumber, docType)
                    .then(url => { documentUrls[docType] = url; })
                    .catch(error => { console.error(`Failed to upload ${docType}:`, error); documentUrls[docType] = null; })
            );
        }
    }
    
    await Promise.all(uploadPromises);
    return documentUrls;
}

/**
 * Create a new application in the database
 * @param {Object} applicationData - Application form data
 * @returns {Promise<Object>} Created application
 */
async function createApplication(applicationData) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');
    
    const applicationNumber = generateApplicationNumber(applicationData.destination);
    const paymentDeadline = new Date();
    paymentDeadline.setDate(paymentDeadline.getDate() + 3);
    
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
        documents_urls: applicationData.documentUrls || {},
        payment_status: applicationData.paymentStatus || 'pending',
        application_status: 'pending',
        submitted_at: new Date().toISOString(),
        payment_deadline: paymentDeadline.toISOString(),
        created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('applications')
        .insert([newApplication])
        .select()
        .single();
    
    if (error) {
        console.error('Create application error:', error);
        throw new Error(`Failed to create application: ${error.message}`);
    }
    
    return data;
}

/**
 * Get application by number
 * @param {string} applicationNumber - Application number
 * @returns {Promise<Object>} Application data
 */
async function getApplicationByNumber(applicationNumber) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('application_number', applicationNumber)
        .single();
    
    if (error) {
        if (error.code === 'PGRST116') {
            return null; // Not found
        }
        throw error;
    }
    
    return data;
}

/**
 * Get all applications (admin only)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of applications
 */
async function getAllApplications(filters = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');
    
    let query = supabase.from('applications').select('*');
    
    if (filters.status && filters.status !== 'all') {
        query = query.eq('application_status', filters.status);
    }
    
    if (filters.destination && filters.destination !== 'all') {
        query = query.eq('destination', filters.destination);
    }
    
    if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,application_number.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
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
    if (!supabase) throw new Error('Supabase not initialized');
    
    const updateData = {
        application_status: status,
        updated_at: new Date().toISOString()
    };
    
    if (notes) {
        updateData.admin_notes = notes;
    }
    
    if (status === 'approved' || status === 'rejected') {
        updateData.decision_date = new Date().toISOString();
    }
    
    const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Update payment status
 * @param {string} applicationId - Application ID
 * @param {string} paymentStatus - Payment status
 * @param {string} receiptUrl - Receipt URL
 * @returns {Promise<Object>} Updated application
 */
async function updatePaymentStatus(applicationId, paymentStatus, receiptUrl = null) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');
    
    const updateData = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
    };
    
    if (receiptUrl) {
        updateData.payment_receipt_url = receiptUrl;
    }
    
    const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Verify admin credentials
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise<Object>} Admin user data or null
 */
async function verifyAdminCredentials(username, password) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
        .from('admin_users')
        .select('id, username, role')
        .eq('username', username)
        .eq('is_active', true)
        .single();
    
    if (error || !data) {
        return null;
    }
    
    // In production, use proper password hashing with bcrypt
    // For now, direct comparison (development only)
    const { data: authCheck, error: authError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', username)
        .eq('password_hash', password)
        .single();
    
    if (authError || !authCheck) {
        return null;
    }
    
    return data;
}

/**
 * Get application statistics
 * @returns {Promise<Object>} Statistics
 */
async function getApplicationStatistics() {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
        .from('applications')
        .select('application_status, destination');
    
    if (error) throw error;
    
    const stats = {
        total: data.length,
        pending: data.filter(app => app.application_status === 'pending').length,
        approved: data.filter(app => app.application_status === 'approved').length,
        rejected: data.filter(app => app.application_status === 'rejected').length,
        italy: data.filter(app => app.destination === 'italy').length,
        campusFrance: data.filter(app => app.destination === 'campus_france').length
    };
    
    return stats;
}

/**
 * Send email via Resend (via Supabase Edge Function)
 * @param {Object} emailData - Email data
 * @returns {Promise<boolean>} Success status
 */
async function sendEmail(emailData) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('Supabase not initialized');
        return false;
    }
    
    try {
        // Call Supabase Edge Function to send email
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                type: emailData.type
            }
        });
        
        if (error) {
            console.error('Email sending error:', error);
            return false;
        }
        
        console.log('Email sent successfully:', data);
        return true;
        
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

/**
 * Send application confirmation email
 * @param {Object} application - Application data
 * @returns {Promise<boolean>} Success status
 */
async function sendConfirmationEmail(application) {
    const subject = `Application Confirmation - Bougie Immigration (${application.application_number})`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Application Confirmation</title></head>
        <body style="font-family: Arial, sans-serif; background: #f4eddb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px;">
                <h1 style="color: #2c2b28;">Bougie Immigration</h1>
                <h2>Application Received</h2>
                <p>Dear ${application.first_name} ${application.last_name},</p>
                <p>Thank you for submitting your application. Your application has been received and is being processed.</p>
                <p><strong>Application Number:</strong> ${application.application_number}</p>
                <p><strong>Destination:</strong> ${application.destination === 'italy' ? 'Italy' : 'Campus France'}</p>
                <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p>You have 3 days to complete your payment. If payment is not received within this period, your application will be automatically refused.</p>
                <p>You can check your application status at: <a href="https://bougie-immigration.com/status.html">https://bougie-immigration.com/status.html</a></p>
                <hr>
                <p style="color: #6b6a66; font-size: 12px;">Bougie Immigration - Professional Study Immigration Services</p>
            </div>
        </body>
        </html>
    `;
    
    return sendEmail({
        to: application.email,
        subject: subject,
        html: html,
        type: 'confirmation'
    });
}

/**
 * Send status update email (approval/rejection)
 * @param {Object} application - Application data
 * @param {string} status - New status
 * @param {string} reason - Rejection reason (if applicable)
 * @returns {Promise<boolean>} Success status
 */
async function sendStatusEmail(application, status, reason = null) {
    const isApproved = status === 'approved';
    const subject = isApproved 
        ? `Application Approved - Bougie Immigration (${application.application_number})`
        : `Application Status Update - Bougie Immigration (${application.application_number})`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Application Status Update</title></head>
        <body style="font-family: Arial, sans-serif; background: #f4eddb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px;">
                <h1 style="color: #2c2b28;">Bougie Immigration</h1>
                <h2>${isApproved ? 'Application Approved' : 'Application Status Update'}</h2>
                <p>Dear ${application.first_name} ${application.last_name},</p>
                <p>Your application (${application.application_number}) has been <strong>${status.toUpperCase()}</strong>.</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                ${isApproved ? '<p>Congratulations! Our team will contact you shortly with next steps for the visa application process.</p>' : '<p>If you have any questions about this decision, please contact our support team.</p>'}
                <p>You can check your application status at: <a href="https://bougie-immigration.com/status.html">https://bougie-immigration.com/status.html</a></p>
                <hr>
                <p style="color: #6b6a66; font-size: 12px;">Bougie Immigration - Professional Study Immigration Services</p>
            </div>
        </body>
        </html>
    `;
    
    return sendEmail({
        to: application.email,
        subject: subject,
        html: html,
        type: status
    });
}

// Export all functions
window.SupabaseClient = {
    init: initSupabase,
    getClient: getSupabaseClient,
    uploadFile,
    uploadAllDocuments,
    createApplication,
    getApplicationByNumber,
    getAllApplications,
    updateApplicationStatus,
    updatePaymentStatus,
    verifyAdminCredentials,
    getApplicationStatistics,
    sendEmail,
    sendConfirmationEmail,
    sendStatusEmail,
    generateApplicationNumber
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initSupabase());
} else {
    initSupabase();
}

console.log('Supabase client module loaded');
