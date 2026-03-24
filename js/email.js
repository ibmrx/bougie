/**
 * Bougie Immigration - Email Service
 * Handles all email communications via Resend API
 * 
 * API Key: re_UGbnfq94_KrG2rVQMhkbiGSkTGH9P62iR
 * From Email: Bougie Immigration <onboarding@resend.dev>
 */

// Resend API Configuration
const RESEND_CONFIG = {
    apiKey: 're_UGbnfq94_KrG2rVQMhkbiGSkTGH9P62iR',
    fromEmail: 'Bougie Immigration <onboarding@resend.dev>',
    baseUrl: 'https://api.resend.com/emails'
};

// Email template cache
let emailTemplates = {};

/**
 * Send email via Resend API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<Object>} API response
 */
async function sendEmail(to, subject, html) {
    if (!to || !subject || !html) {
        console.error('Missing email parameters:', { to, subject, html: !!html });
        throw new Error('Missing required email parameters');
    }
    
    try {
        const response = await fetch(RESEND_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: RESEND_CONFIG.fromEmail,
                to: [to],
                subject: subject,
                html: html
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            console.error('Resend API error:', result);
            throw new Error(result.message || 'Failed to send email');
        }
        
        console.log('Email sent successfully:', { to, subject, id: result.id });
        return result;
        
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

/**
 * Generate application confirmation email HTML
 * @param {Object} data - Application data
 * @returns {string} HTML content
 */
function generateConfirmationEmail(data) {
    const { 
        firstName, 
        lastName, 
        applicationNumber, 
        destination, 
        yearOfStudy,
        paymentDeadline,
        statusUrl = 'https://bougie-immigration.com/status.html'
    } = data;
    
    const destinationName = destination === 'italy' ? 'Italy' : 'Campus France';
    const deadlineDate = new Date(paymentDeadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4eddb; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background: #2c2b28; color: #f4eddb; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 10px 0 0; opacity: 0.8; }
                .content { padding: 30px; }
                .application-number { background: #f4eddb; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0; }
                .application-number strong { font-size: 20px; color: #2c2b28; font-family: monospace; }
                .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .info-table td { padding: 10px 0; border-bottom: 1px solid #ddd; }
                .info-table td:first-child { font-weight: bold; width: 40%; }
                .deadline-warning { background: #fef5e7; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; border-radius: 8px; }
                .button { display: inline-block; background: #2c2b28; color: #f4eddb; padding: 12px 24px; text-decoration: none; border-radius: 50px; margin: 20px 0; }
                .footer { background: #dcdad5; padding: 20px; text-align: center; font-size: 12px; color: #6b6a66; }
                .footer a { color: #2c2b28; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Bougie Immigration</h1>
                    <p>Application Confirmation</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
                    <p>Thank you for submitting your application to Bougie Immigration. We have successfully received your application and all accompanying documents.</p>
                    
                    <div class="application-number">
                        <p style="margin: 0 0 5px;">Your Application Number</p>
                        <strong>${escapeHtml(applicationNumber)}</strong>
                    </div>
                    
                    <table class="info-table">
                        <tr><td>Full Name:</td><td>${escapeHtml(firstName)} ${escapeHtml(lastName)}</td></tr>
                        <tr><td>Destination:</td><td>${destinationName}</td></tr>
                        <tr><td>Applying Degree:</td><td>${escapeHtml(yearOfStudy)}</td></tr>
                        <tr><td>Submission Date:</td><td>${new Date().toLocaleDateString()}</td></tr>
                        <tr><td>Application Status:</td><td>Pending Review</td></tr>
                    </table>
                    
                    <div class="deadline-warning">
                        <strong>⚠️ Payment Required Within 3 Days</strong>
                        <p style="margin: 10px 0 0;">Total Fee: <strong>35,000 DA</strong><br>Payment Deadline: <strong>${deadlineDate}</strong></p>
                    </div>
                    
                    <p><strong>Bank Account Details:</strong></p>
                    <ul>
                        <li>CCP: 40253214 Clé 56</li>
                        <li>Baridimob: 00799999004025321435</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="${statusUrl}" class="button">Check Application Status</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #6b6a66; margin-top: 20px;">Please keep this email for your records. You will need your application number to check your status.</p>
                </div>
                <div class="footer">
                    <p>Bougie Immigration - Professional Study Immigration Services</p>
                    <p>Phone: 07 70 61 41 98 | Instagram: @bougie_immigration06</p>
                    <p>&copy; ${new Date().getFullYear()} Bougie Immigration. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate application approval email HTML
 * @param {Object} data - Application data
 * @returns {string} HTML content
 */
function generateApprovalEmail(data) {
    const { 
        firstName, 
        lastName, 
        applicationNumber, 
        destination,
        yearOfStudy,
        statusUrl = 'https://bougie-immigration.com/status.html'
    } = data;
    
    const destinationName = destination === 'italy' ? 'Italy' : 'Campus France';
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Approved - Bougie Immigration</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4eddb; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background: #27ae60; color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 10px 0 0; opacity: 0.9; }
                .content { padding: 30px; }
                .status-badge { background: #e8f5e9; color: #27ae60; padding: 8px 16px; border-radius: 50px; display: inline-block; font-weight: bold; margin: 20px 0; }
                .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .info-table td { padding: 10px 0; border-bottom: 1px solid #ddd; }
                .info-table td:first-child { font-weight: bold; width: 40%; }
                .next-steps { background: #e8f0fe; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; margin: 20px 0; }
                .footer { background: #dcdad5; padding: 20px; text-align: center; font-size: 12px; color: #6b6a66; }
                .footer a { color: #2c2b28; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Application Approved!</h1>
                    <p>Congratulations on your admission</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
                    <p>We are delighted to inform you that your application has been <strong>approved</strong> by our review committee.</p>
                    
                    <div style="text-align: center;">
                        <div class="status-badge">✓ APPROVED</div>
                    </div>
                    
                    <table class="info-table">
                        <tr><td>Application Number:</td><td><strong>${escapeHtml(applicationNumber)}</strong></td></tr>
                        <tr><td>Destination:</td><td>${destinationName}</td></tr>
                        <tr><td>Applying Degree:</td><td>${escapeHtml(yearOfStudy)}</td></tr>
                    </table>
                    
                    <div class="next-steps">
                        <strong>📋 Next Steps</strong>
                        <ul style="margin: 10px 0 0 20px;">
                            <li>Visa application preparation - Our team will contact you within 3-5 business days</li>
                            <li>University registration instructions will be sent via email</li>
                            <li>Pre-departure orientation session will be scheduled</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${statusUrl}" class="button">Check Application Status</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #6b6a66; margin-top: 20px;">If you have any questions, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>Bougie Immigration - Professional Study Immigration Services</p>
                    <p>Phone: 07 70 61 41 98 | Instagram: @bougie_immigration06</p>
                    <p>&copy; ${new Date().getFullYear()} Bougie Immigration. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate application rejection email HTML
 * @param {Object} data - Application data with rejection reason
 * @returns {string} HTML content
 */
function generateRejectionEmail(data) {
    const { 
        firstName, 
        lastName, 
        applicationNumber, 
        destination,
        yearOfStudy,
        rejectionReason,
        statusUrl = 'https://bougie-immigration.com/status.html'
    } = data;
    
    const destinationName = destination === 'italy' ? 'Italy' : 'Campus France';
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Application Status Update - Bougie Immigration</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4eddb; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .header { background: #e74c3c; color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 10px 0 0; opacity: 0.9; }
                .content { padding: 30px; }
                .status-badge { background: #fee; color: #e74c3c; padding: 8px 16px; border-radius: 50px; display: inline-block; font-weight: bold; margin: 20px 0; }
                .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .info-table td { padding: 10px 0; border-bottom: 1px solid #ddd; }
                .info-table td:first-child { font-weight: bold; width: 40%; }
                .reason-box { background: #fee; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; border-radius: 8px; }
                .options-box { background: #e8f0fe; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; background: #2c2b28; color: #f4eddb; padding: 12px 24px; text-decoration: none; border-radius: 50px; margin: 20px 0; }
                .footer { background: #dcdad5; padding: 20px; text-align: center; font-size: 12px; color: #6b6a66; }
                .footer a { color: #2c2b28; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Application Status Update</h1>
                    <p>Important information regarding your application</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
                    <p>Thank you for submitting your application to Bougie Immigration. After careful review, we regret to inform you that we are unable to proceed with your application at this time.</p>
                    
                    <div style="text-align: center;">
                        <div class="status-badge">✗ NOT APPROVED</div>
                    </div>
                    
                    <table class="info-table">
                        <tr><td>Application Number:</td><td><strong>${escapeHtml(applicationNumber)}</strong></td></tr>
                        <tr><td>Destination:</td><td>${destinationName}</td></tr>
                        <tr><td>Applying Degree:</td><td>${escapeHtml(yearOfStudy)}</td></tr>
                    </table>
                    
                    <div class="reason-box">
                        <strong>Reason for Decision</strong>
                        <p style="margin: 10px 0 0;">${escapeHtml(rejectionReason)}</p>
                    </div>
                    
                    <div class="options-box">
                        <strong>What You Can Do Next</strong>
                        <ul style="margin: 10px 0 0 20px;">
                            <li>Review the requirements and submit a new application</li>
                            <li>Contact our support team for more detailed feedback</li>
                            <li>Explore alternative study destinations</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${statusUrl}" class="button">Check Application Status</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #6b6a66; margin-top: 20px;">If you have any questions, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>Bougie Immigration - Professional Study Immigration Services</p>
                    <p>Phone: 07 70 61 41 98 | Instagram: @bougie_immigration06</p>
                    <p>&copy; ${new Date().getFullYear()} Bougie Immigration. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Send application confirmation email
 * @param {Object} application - Application data
 * @returns {Promise<Object>} API response
 */
async function sendConfirmationEmail(application) {
    const html = generateConfirmationEmail({
        firstName: application.first_name,
        lastName: application.last_name,
        applicationNumber: application.application_number,
        destination: application.destination,
        yearOfStudy: application.year_of_study,
        paymentDeadline: application.payment_deadline,
        statusUrl: `${window.location.origin}/status.html`
    });
    
    return sendEmail(
        application.email,
        'Application Confirmation - Bougie Immigration',
        html
    );
}

/**
 * Send approval email
 * @param {Object} application - Application data
 * @returns {Promise<Object>} API response
 */
async function sendApprovalEmail(application) {
    const html = generateApprovalEmail({
        firstName: application.first_name,
        lastName: application.last_name,
        applicationNumber: application.application_number,
        destination: application.destination,
        yearOfStudy: application.year_of_study,
        statusUrl: `${window.location.origin}/status.html`
    });
    
    return sendEmail(
        application.email,
        'Application Approved - Bougie Immigration',
        html
    );
}

/**
 * Send rejection email
 * @param {Object} application - Application data
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} API response
 */
async function sendRejectionEmail(application, reason) {
    const html = generateRejectionEmail({
        firstName: application.first_name,
        lastName: application.last_name,
        applicationNumber: application.application_number,
        destination: application.destination,
        yearOfStudy: application.year_of_study,
        rejectionReason: reason,
        statusUrl: `${window.location.origin}/status.html`
    });
    
    return sendEmail(
        application.email,
        'Application Status Update - Bougie Immigration',
        html
    );
}

/**
 * Escape HTML special characters
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

// Export functions for global use
window.EmailService = {
    sendEmail,
    sendConfirmationEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    generateConfirmationEmail,
    generateApprovalEmail,
    generateRejectionEmail
};

console.log('Email service initialized with Resend API');
