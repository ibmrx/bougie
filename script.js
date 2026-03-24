// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://qpprzcckolmdyabnmgol.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA5MTYsImV4cCI6MjA4OTkzNjkxNn0.Pp9fTdklyomxmG6wsb8FBzyhLXaXEx983ofdaiPG_So'
};

// Email Configuration
const EMAIL_CONFIG = {
    apiKey: 're_UGbnfq94_KrG2rVQMhkbiGSkTGH9P62iR',
    fromEmail: 'benlassousmohamedreda@gmail.com'
};

// Payment Details
const PAYMENT_DETAILS = {
    ccp: 'CCP: 40253214 Clé 56',
    baridimob: 'Baridimob: 00799999004025321435'
};

// Initialize Supabase
let supabase = null;

// Application State
let currentDestination = null;

// Wait for Supabase to load
function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase initialized');
        return true;
    } else {
        console.error('Supabase not loaded yet');
        return false;
    }
}

// Main Application Object
const app = {
    // Show Home Page
    showHome() {
        console.log('Showing home page');
        const mainContainer = document.getElementById('app');
        if (!mainContainer) return;
        
        mainContainer.innerHTML = `
            <div class="hero">
                <h1>Your Journey to International Education Starts Here</h1>
                <p>Bougie Immigration - Your trusted partner for studying abroad in Italy and France</p>
            </div>
            <div class="destinations">
                <div class="destination-card" onclick="app.startApplication('italy')">
                    <div class="card-image" style="background-image: url('https://images.unsplash.com/photo-1533929736458-ca588d47c8be?w=400');"></div>
                    <div class="card-content">
                        <h2>Italy</h2>
                        <p>Study in the heart of European culture, art, and history. World-class universities and rich academic traditions.</p>
                        <button class="btn-start">Start Application</button>
                    </div>
                </div>
                <div class="destination-card" onclick="app.startApplication('france')">
                    <div class="card-image" style="background-image: url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400');"></div>
                    <div class="card-content">
                        <h2>Campus France</h2>
                        <p>Experience French excellence in education. TCF language test required for all applicants.</p>
                        <button class="btn-start">Start Application</button>
                    </div>
                </div>
            </div>
        `;
    },

    // Start Application
    startApplication(destination) {
        console.log('Starting application for:', destination);
        currentDestination = destination;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Application Confirmation</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="alert alert-warning">
                    <strong>Important Notice:</strong>
                    <p>${destination === 'italy' ? 'All documents must be certified by the Ministry of Education and Foreign Affairs.' : 'Documents must be translated to French. TCF test is mandatory.'}</p>
                    <p>Submission is final and cannot be undone.</p>
                </div>
                <button class="btn-start" onclick="app.showApplicationForm()">Proceed to Application</button>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // Show Application Form
    showApplicationForm() {
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        
        const mainContainer = document.getElementById('app');
        if (!mainContainer) return;
        
        mainContainer.innerHTML = `
            <div class="hero">
                <h2>Application for ${currentDestination.toUpperCase()}</h2>
                <p>Please fill out all required information accurately</p>
            </div>
            <form id="applicationForm" class="form-container">
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" id="firstName" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" id="lastName" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Birth Date *</label>
                        <input type="date" id="birthDate" required>
                    </div>
                    <div class="form-group">
                        <label>BAC Completion Date *</label>
                        <input type="month" id="bacDate" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Phone Number *</label>
                        <input type="tel" id="phone" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" id="email" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Year of Studies *</label>
                    <select id="studyYear" onchange="app.updateDocumentsList()" required>
                        <option value="">Select...</option>
                        <option value="bachelor">Bachelor</option>
                        <option value="master">Master</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Selected Courses (write the courses you want to study) *</label>
                    <textarea id="courses" rows="4" placeholder="List your desired courses..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Required Documents</label>
                    <div id="documentsList"></div>
                </div>
                
                <div class="form-group">
                    <label>Payment Method</label>
                    <select id="paymentMethod">
                        <option value="ccp">${PAYMENT_DETAILS.ccp}</option>
                        <option value="baridimob">${PAYMENT_DETAILS.baridimob}</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Payment Option</label>
                    <select id="paymentOption" onchange="app.toggleReceiptUpload()">
                        <option value="now">Pay Now</option>
                        <option value="later">Pay Later (Contact Agency)</option>
                    </select>
                </div>
                
                <div id="receiptUpload" style="display: none;">
                    <div class="form-group">
                        <label>Upload Payment Receipt (PDF or JPG, max 5MB)</label>
                        <div class="file-upload">
                            <label class="file-upload-label">
                                Click to upload receipt
                                <input type="file" id="receipt" accept=".pdf,.jpg,.jpeg">
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="agreeTerms" required>
                        I agree to the <a href="#" onclick="app.showPrivacyPolicy(); return false;">Privacy Policy and Contract</a>
                    </label>
                </div>
                
                <div class="form-group">
                    <label>Digital Signature (Type your full name) *</label>
                    <input type="text" id="signature" placeholder="Type your full name as digital signature" required>
                </div>
                
                <button type="submit" class="btn-start">Submit Application</button>
            </form>
        `;
        
        this.updateDocumentsList();
        const form = document.getElementById('applicationForm');
        if (form) {
            form.onsubmit = (e) => this.submitApplication(e);
        }
    },

    // Toggle Receipt Upload
    toggleReceiptUpload() {
        const option = document.getElementById('paymentOption');
        const receiptDiv = document.getElementById('receiptUpload');
        if (option && receiptDiv) {
            receiptDiv.style.display = option.value === 'now' ? 'block' : 'none';
        }
    },

    // Update Documents List
    updateDocumentsList() {
        const studyYear = document.getElementById('studyYear')?.value;
        const isItaly = currentDestination === 'italy';
        const isMaster = studyYear === 'master';
        
        let docs = [
            'Passport',
            'ID Photo',
            'CV',
            'BAC Certificate'
        ];
        
        if (isItaly) {
            docs.push('BAC Certificate (certified original)');
            docs.push('BAC Certificate (certified translated)');
            docs.push('BAC Transcript (certified original)');
            docs.push('BAC Transcript (certified translated)');
        } else {
            docs.push('BAC Certificate (translated to French)');
            docs.push('BAC Transcript (translated to French)');
        }
        
        if (isMaster) {
            docs.push('Bachelor Certificate');
            docs.push('Bachelor Transcript (3 years)');
            if (isItaly) {
                docs.push('Bachelor Certificate (certified original)');
                docs.push('Bachelor Certificate (certified translated)');
                docs.push('Bachelor Transcript (certified original and translated)');
            }
        }
        
        docs.push('English Proof (IELTS or English test score)');
        
        if (currentDestination === 'france') {
            docs.push('TCF Test Score (Mandatory)');
        }
        
        const docsList = document.getElementById('documentsList');
        if (docsList) {
            docsList.innerHTML = `
                <div class="documents-list">
                    <ul>
                        ${docs.map(doc => `<li>${doc}</li>`).join('')}
                    </ul>
                    <small>All documents must be uploaded as PDF or JPG, max 5MB each</small>
                    <div class="file-upload mt-2">
                        <label class="file-upload-label">
                            Click to upload documents
                            <input type="file" id="documents" multiple accept=".pdf,.jpg,.jpeg">
                        </label>
                    </div>
                </div>
            `;
        }
    },

    // Submit Application
    async submitApplication(e) {
        e.preventDefault();
        
        if (!supabase) {
            if (!initSupabase()) {
                alert('Error: Database connection not available. Please refresh the page.');
                return;
            }
        }
        
        const applicationData = {
            destination: currentDestination,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            birthDate: document.getElementById('birthDate').value,
            bacDate: document.getElementById('bacDate').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            studyYear: document.getElementById('studyYear').value,
            courses: document.getElementById('courses').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            paymentOption: document.getElementById('paymentOption').value,
            signature: document.getElementById('signature').value,
            status: 'pending',
            applicationNumber: this.generateApplicationNumber(),
            createdAt: new Date().toISOString()
        };
        
        const submitBtn = document.querySelector('.btn-start');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        try {
            const { data, error } = await supabase
                .from('applications')
                .insert([applicationData])
                .select();
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            const docsFiles = document.getElementById('documents').files;
            const receiptFile = document.getElementById('receipt')?.files[0];
            
            if (docsFiles.length > 0) {
                const zip = new JSZip();
                for (let file of docsFiles) {
                    if (file.size <= 5 * 1024 * 1024) {
                        zip.file(file.name, file);
                    }
                }
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const fileName = `${applicationData.lastName}_${applicationData.firstName}_documents.zip`;
                await supabase.storage
                    .from('documents')
                    .upload(fileName, zipBlob);
            }
            
            if (receiptFile && applicationData.paymentOption === 'now' && receiptFile.size <= 5 * 1024 * 1024) {
                const receiptName = `${applicationData.lastName}_${applicationData.firstName}_receipt.${receiptFile.name.split('.').pop()}`;
                await supabase.storage
                    .from('receipts')
                    .upload(receiptName, receiptFile);
            }
            
            await this.sendEmail(applicationData);
            this.showSuccess(applicationData.applicationNumber);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting application: ' + error.message);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },

    // Generate Application Number
    generateApplicationNumber() {
        const prefix = currentDestination === 'italy' ? 'IT' : 'FR';
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${random}-${timestamp}`;
    },

    // Send Email
    async sendEmail(applicationData) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: `Bougie Immigration <${EMAIL_CONFIG.fromEmail}>`,
                    to: applicationData.email,
                    subject: `Your Bougie Immigration Application - ${applicationData.applicationNumber}`,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: #2c3e2f; color: white; padding: 20px; text-align: center; }
                                .content { padding: 20px; background: #f9f9f9; }
                                .footer { text-align: center; padding: 20px; color: #666; }
                                .app-number { font-size: 24px; font-weight: bold; color: #2c3e2f; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>Bougie Immigration</h1>
                                </div>
                                <div class="content">
                                    <h2>Thank you for applying!</h2>
                                    <p>Dear ${applicationData.firstName} ${applicationData.lastName},</p>
                                    <p>Your application has been successfully submitted for ${applicationData.destination.toUpperCase()}.</p>
                                    <p><strong>Application Number:</strong> <span class="app-number">${applicationData.applicationNumber}</span></p>
                                    <p><strong>Status:</strong> Pending Review</p>
                                    <p><strong>Important:</strong> You have 3 days to complete payment. If paying later, please contact us to arrange payment.</p>
                                    <p>You can track your application status using your application number on our website.</p>
                                </div>
                                <div class="footer">
                                    <p>Best regards,<br>Bougie Immigration Team</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                })
            });
            
            if (!response.ok) {
                console.error('Email send failed');
            }
        } catch (error) {
            console.error('Email error:', error);
        }
    },

    // Show Success Message
    showSuccess(appNumber) {
        const mainContainer = document.getElementById('app');
        if (!mainContainer) return;
        
        mainContainer.innerHTML = `
            <div class="hero">
                <div class="alert alert-success">
                    <h2>Application Submitted Successfully!</h2>
                    <p><strong>Application Number:</strong> ${appNumber}</p>
                    <p>Please save this number to track your application status.</p>
                    <p>You will receive a confirmation email shortly.</p>
                    <p>You have 3 days to complete payment. Use your application number to check status.</p>
                    <button class="btn-start" onclick="app.showHome()" style="margin-top: 1rem;">Back to Home</button>
                </div>
            </div>
        `;
    },

    // Track Application
    showTrack() {
        const mainContainer = document.getElementById('app');
        if (!mainContainer) return;
        
        mainContainer.innerHTML = `
            <div class="track-section">
                <h2 class="text-center">Track Your Application</h2>
                <form id="trackForm">
                    <div class="form-group">
                        <label>Application Number</label>
                        <input type="text" id="trackNumber" placeholder="Enter your application number (e.g., IT-ABC123-456789)" required>
                    </div>
                    <button type="submit" class="btn-start">Track Application</button>
                </form>
                <div id="trackResult" class="track-result" style="display: none;"></div>
            </div>
        `;
        
        const form = document.getElementById('trackForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                
                if (!supabase) {
                    if (!initSupabase()) {
                        alert('Database connection error');
                        return;
                    }
                }
                
                const appNumber = document.getElementById('trackNumber').value.toUpperCase();
                const resultDiv = document.getElementById('trackResult');
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';
                
                const { data, error } = await supabase
                    .from('applications')
                    .select('*')
                    .eq('applicationNumber', appNumber)
                    .single();
                
                if (error || !data) {
                    resultDiv.innerHTML = '<div class="alert alert-error">Application not found. Please check your application number.</div>';
                } else {
                    resultDiv.innerHTML = `
                        <div class="alert alert-success">
                            <h3>Application Details</h3>
                            <p><strong>Full Name:</strong> ${data.firstName} ${data.lastName}</p>
                            <p><strong>Birth Date:</strong> ${new Date(data.birthDate).toLocaleDateString()}</p>
                            <p><strong>Email:</strong> ${data.email}</p>
                            <p><strong>Destination:</strong> ${data.destination.toUpperCase()}</p>
                            <p><strong>Status:</strong> <span class="status-badge status-${data.status}">${data.status.toUpperCase()}</span></p>
                            <p><strong>Application Date:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
                        </div>
                    `;
                }
            };
        }
    },

    // Admin Login
    showAdminLogin() {
        const mainContainer = document.getElementById('app');
        if (!mainContainer) return;
        
        mainContainer.innerHTML = `
            <div class="admin-login">
                <h2 class="text-center">Admin Login</h2>
                <form id="adminLoginForm">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="adminUser" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="adminPass" required>
                    </div>
                    <button type="submit" class="btn-start">Login</button>
                </form>
            </div>
        `;
        
        const form = document.getElementById('adminLoginForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const user = document.getElementById('adminUser').value;
                const pass = document.getElementById('adminPass').value;
                
                if (user === 'admin' && pass === 'password123') {
                    this.showAdminDashboard();
                } else {
                    alert('Invalid credentials');
                }
            };
        }
    },

    // Show Admin Dashboard
    async showAdminDashboard() {
        const mainContainer = document.getElementById('app');
        if (!mainContainer) return;
        
        if (!supabase) {
            if (!initSupabase()) {
                mainContainer.innerHTML = '<div class="alert alert-error">Database connection error</div>';
                return;
            }
        }
        
        mainContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading applications...</p></div>';
        
        const { data: applications, error } = await supabase
            .from('applications')
            .select('*')
            .order('createdAt', { ascending: false });
        
        if (error) {
            mainContainer.innerHTML = '<div class="alert alert-error">Error loading applications: ' + error.message + '</div>';
            return;
        }
        
        if (!applications || applications.length === 0) {
            mainContainer.innerHTML = '<div class="alert alert-info">No applications found.</div>';
            return;
        }
        
        mainContainer.innerHTML = `
            <div class="applications-list">
                <div class="applications-header">
                    <h2>Admin Dashboard</h2>
                    <button class="btn-primary btn" onclick="app.downloadAllApplications()">Download All Applications (ZIP)</button>
                </div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Application #</th>
                                <th>Full Name</th>
                                <th>BAC Year</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Destination</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${applications.map(app => `
                                <tr>
                                    <td><strong>${app.applicationNumber}</strong></td>
                                    <td>${app.firstName} ${app.lastName}</td>
                                    <td>${app.bacDate}</td>
                                    <td>${app.phone}</td>
                                    <td>${app.email}</td>
                                    <td>${app.destination.toUpperCase()}</td>
                                    <td><span class="status-badge status-${app.status}">${app.status}</span></td>
                                    <td>
                                        <button class="btn-approve" onclick="app.updateStatus('${app.id}', 'approved')">Approve</button>
                                        <button class="btn-reject" onclick="app.updateStatus('${app.id}', 'rejected')">Reject</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Update Application Status
    async updateStatus(id, status) {
        if (!supabase) {
            if (!initSupabase()) {
                alert('Database connection error');
                return;
            }
        }
        
        const { error } = await supabase
            .from('applications')
            .update({ status: status })
            .eq('id', id);
        
        if (!error) {
            const { data: app } = await supabase
                .from('applications')
                .select('*')
                .eq('id', id)
                .single();
            
            if (app) {
                try {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: `Bougie Immigration <${EMAIL_CONFIG.fromEmail}>`,
                            to: app.email,
                            subject: `Application ${status.toUpperCase()} - ${app.applicationNumber}`,
                            html: `
                                <h1>Application Status Update</h1>
                                <p>Dear ${app.firstName} ${app.lastName},</p>
                                <p>Your application (${app.applicationNumber}) has been ${status}.</p>
                                <p>${status === 'approved' ? 'Congratulations! Our team will contact you shortly with next steps.' : 'We regret to inform you that your application was not approved at this time.'}</p>
                                <p>You can track your application on our website.</p>
                            `
                        })
                    });
                } catch (emailError) {
                    console.error('Email error:', emailError);
                }
            }
            
            this.showAdminDashboard();
        } else {
            alert('Error updating status: ' + error.message);
        }
    },

    // Download All Applications
    async downloadAllApplications() {
        if (!supabase) {
            if (!initSupabase()) {
                alert('Database connection error');
                return;
            }
        }
        
        const { data: applications, error } = await supabase
            .from('applications')
            .select('*');
        
        if (error) {
            alert('Error downloading applications: ' + error.message);
            return;
        }
        
        const zip = new JSZip();
        const dataStr = JSON.stringify(applications, null, 2);
        zip.file('applications.json', dataStr);
        zip.file('applications.csv', this.convertToCSV(applications));
        
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bougie_applications.zip';
        a.click();
        URL.revokeObjectURL(url);
    },

    // Convert to CSV
    convertToCSV(data) {
        const headers = ['applicationNumber', 'firstName', 'lastName', 'email', 'phone', 'destination', 'status', 'createdAt'];
        const rows = data.map(row => headers.map(header => row[header] || '').join(','));
        return [headers.join(','), ...rows].join('\n');
    },

    // Show Privacy Policy
    showPrivacyPolicy() {
        alert(`CONTRACT TERMS:

OBJET DU CONTRAT :
Le bureau Bougie Immigration s'engage à accompagner l'étudiant dans :
- La recherche de trois (03) universités en Italie
- La préparation et la soumission de la demande d'admission auprès de ces universités
- La recherche d'opportunités de bourses d'études

PRIX TOTAL DU SERVICE : 35 000 DA
Ce montant est à régler intégralement et à l'avance.
Les frais d'admission exigés par les universités sont à la charge exclusive de l'étudiant.
Aucun remboursement ne sera effectué, que ce soit en cas d'annulation par l'étudiant ou en cas de refus d'admission par les universités.`);
    }
};

// Initialize Supabase and make app global
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    initSupabase();
    window.app = app;
    app.showHome();
});

// Make app globally available
window.app = app;
