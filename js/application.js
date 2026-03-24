/**
 * Bougie Immigration - Application Form Handler
 * Manages multi-step application forms for Italy and Campus France
 * Handles form validation, document uploads, and submission
 */

// Application state
let currentStep = 1;
let totalSteps = 5;
let uploadedDocuments = {};
let paymentStatus = null;
let selectedPaymentMethod = null;
let applicationData = {};

// Document requirements based on destination and study level
const DOCUMENT_REQUIREMENTS = {
    italy: {
        bachelor: [
            { id: 'passport', name: 'Passport', required: true },
            { id: 'photo', name: 'ID Photo', required: true },
            { id: 'cv', name: 'CV', required: true },
            { id: 'bacCertOriginal', name: 'BAC Certificate (certified original)', required: true },
            { id: 'bacCertTranslated', name: 'BAC Certificate (certified translated)', required: true },
            { id: 'bacTranscriptOriginal', name: 'BAC Transcript (certified original)', required: true },
            { id: 'bacTranscriptTranslated', name: 'BAC Transcript (certified translated)', required: true },
            { id: 'englishProof', name: 'English Proof (IELTS/TOEFL)', required: true }
        ],
        master: [
            { id: 'passport', name: 'Passport', required: true },
            { id: 'photo', name: 'ID Photo', required: true },
            { id: 'cv', name: 'CV', required: true },
            { id: 'bacCertOriginal', name: 'BAC Certificate (certified original)', required: true },
            { id: 'bacCertTranslated', name: 'BAC Certificate (certified translated)', required: true },
            { id: 'bacTranscriptOriginal', name: 'BAC Transcript (certified original)', required: true },
            { id: 'bacTranscriptTranslated', name: 'BAC Transcript (certified translated)', required: true },
            { id: 'bachelorCertOriginal', name: 'Bachelor Certificate (certified original)', required: true },
            { id: 'bachelorCertTranslated', name: 'Bachelor Certificate (certified translated)', required: true },
            { id: 'bachelorTranscript', name: 'Bachelor Transcript (3 years, certified original & translated)', required: true },
            { id: 'englishProof', name: 'English Proof (IELTS/TOEFL)', required: true }
        ]
    },
    campus: {
        bachelor: [
            { id: 'passport', name: 'Passport (French translation)', required: true },
            { id: 'photo', name: 'ID Photo', required: true },
            { id: 'cv', name: 'CV (French)', required: true },
            { id: 'bacCert', name: 'BAC Certificate (French translation)', required: true },
            { id: 'bacTranscript', name: 'BAC Transcript (French translation)', required: true },
            { id: 'tcfResults', name: 'TCF Test Results', required: true }
        ],
        master: [
            { id: 'passport', name: 'Passport (French translation)', required: true },
            { id: 'photo', name: 'ID Photo', required: true },
            { id: 'cv', name: 'CV (French)', required: true },
            { id: 'bacCert', name: 'BAC Certificate (French translation)', required: true },
            { id: 'bacTranscript', name: 'BAC Transcript (French translation)', required: true },
            { id: 'bachelorCert', name: 'Bachelor Certificate (French translation)', required: true },
            { id: 'bachelorTranscript', name: 'Bachelor Transcript (3 years, French translation)', required: true },
            { id: 'tcfResults', name: 'TCF Test Results', required: true }
        ]
    }
};

// File validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg'];

/**
 * Initialize application form
 * @param {string} destination - 'italy' or 'campus'
 */
function initApplicationForm(destination) {
    applicationData.destination = destination;
    applicationData.documentRequirements = DOCUMENT_REQUIREMENTS[destination];
    
    // Setup step navigation
    setupStepNavigation();
    
    // Setup form field listeners
    setupFormListeners();
    
    // Setup document upload handlers
    setupDocumentUploads();
    
    // Setup payment handlers
    setupPaymentHandlers();
    
    // Setup signature canvas
    initSignatureCanvas();
    
    // Load destination-specific content
    loadDestinationContent(destination);
}

/**
 * Setup step navigation between form sections
 */
function setupStepNavigation() {
    const nextButtons = document.querySelectorAll('.nextBtn');
    const prevButtons = document.querySelectorAll('.prevBtn');
    
    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateCurrentStep()) {
                saveCurrentStepData();
                currentStep++;
                updateStepDisplay();
            }
        });
    });
    
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            updateStepDisplay();
        });
    });
}

/**
 * Validate current step before proceeding
 * @returns {boolean} Validation result
 */
function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            return validateConfirmationStep();
        case 2:
            return validatePersonalInfoStep();
        case 3:
            return validateDocumentStep();
        case 4:
            return validatePaymentStep();
        case 5:
            return validateSignatureStep();
        default:
            return true;
    }
}

/**
 * Validate confirmation step
 */
function validateConfirmationStep() {
    const confirmCertified = document.getElementById('confirmCertified');
    const confirmFinal = document.getElementById('confirmFinal');
    
    if (applicationData.destination === 'campus') {
        const confirmTcf = document.getElementById('confirmTcf');
        if (!confirmTcf || !confirmTcf.checked) {
            showError('Please confirm that you have taken or will take the TCF language test.');
            return false;
        }
    }
    
    if (!confirmCertified || !confirmCertified.checked) {
        showError('Please confirm that all information is correct and documents are properly prepared.');
        return false;
    }
    
    if (!confirmFinal || !confirmFinal.checked) {
        showError('Please confirm that you understand this submission is final.');
        return false;
    }
    
    return true;
}

/**
 * Validate personal information step
 */
function validatePersonalInfoStep() {
    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const birthDate = document.getElementById('birthDate')?.value;
    const bacDate = document.getElementById('bacDate')?.value;
    const phone = document.getElementById('phone')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const yearOfStudies = document.getElementById('yearOfStudies')?.value;
    const courses = document.getElementById('courses')?.value.trim();
    
    if (!firstName) {
        showError('Please enter your first name.');
        return false;
    }
    
    if (!lastName) {
        showError('Please enter your last name.');
        return false;
    }
    
    if (!birthDate) {
        showError('Please enter your birth date.');
        return false;
    }
    
    if (!bacDate) {
        showError('Please enter your BAC completion date.');
        return false;
    }
    
    if (!phone) {
        showError('Please enter your phone number.');
        return false;
    }
    
    if (!validatePhoneNumber(phone)) {
        showError('Please enter a valid phone number.');
        return false;
    }
    
    if (!email) {
        showError('Please enter your email address.');
        return false;
    }
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address.');
        return false;
    }
    
    if (!yearOfStudies) {
        showError('Please select your year of studies.');
        return false;
    }
    
    if (!courses) {
        showError('Please list your selected courses.');
        return false;
    }
    
    if (applicationData.destination === 'campus') {
        const tcfStatus = document.getElementById('tcfStatus')?.value;
        if (!tcfStatus) {
            showError('Please provide your TCF test status.');
            return false;
        }
        applicationData.tcfStatus = tcfStatus;
    }
    
    // Save data
    applicationData.firstName = firstName;
    applicationData.lastName = lastName;
    applicationData.birthDate = birthDate;
    applicationData.bacDate = bacDate;
    applicationData.phone = phone;
    applicationData.email = email;
    applicationData.yearOfStudies = yearOfStudies;
    applicationData.courses = courses;
    
    return true;
}

/**
 * Validate document upload step
 */
function validateDocumentStep() {
    const yearOfStudies = applicationData.yearOfStudies || document.getElementById('yearOfStudies')?.value;
    const docList = applicationData.documentRequirements[yearOfStudies === 'Master' ? 'master' : 'bachelor'];
    
    const missingDocs = [];
    
    for (const doc of docList) {
        if (doc.required && !uploadedDocuments[doc.id]) {
            missingDocs.push(doc.name);
        }
    }
    
    if (missingDocs.length > 0) {
        showError(`Please upload the following required documents:\n${missingDocs.join('\n')}`);
        return false;
    }
    
    applicationData.documents = uploadedDocuments;
    return true;
}

/**
 * Validate payment step
 */
function validatePaymentStep() {
    if (!selectedPaymentMethod) {
        showError('Please select a payment method.');
        return false;
    }
    
    if (paymentStatus === 'paid_pending') {
        const receiptInput = document.getElementById('receiptFile');
        if (!receiptInput || !receiptInput.files || receiptInput.files.length === 0) {
            showError('Please upload your payment receipt.');
            return false;
        }
        
        const receiptFile = receiptInput.files[0];
        if (!validateFile(receiptFile)) {
            return false;
        }
        
        applicationData.receiptFile = receiptFile;
    }
    
    applicationData.paymentMethod = selectedPaymentMethod;
    applicationData.paymentStatus = paymentStatus;
    
    return true;
}

/**
 * Validate signature step
 */
function validateSignatureStep() {
    const privacyChecked = document.getElementById('privacyPolicy')?.checked;
    if (!privacyChecked) {
        showError('Please read and agree to the Privacy Policy and Contract.');
        return false;
    }
    
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) {
        showError('Please provide your digital signature.');
        return false;
    }
    
    const isCanvasEmpty = isCanvasBlank(canvas);
    if (isCanvasEmpty) {
        showError('Please provide your digital signature by drawing in the signature area.');
        return false;
    }
    
    // Get signature as image data
    const signatureData = canvas.toDataURL();
    applicationData.signature = signatureData;
    
    return true;
}

/**
 * Check if canvas is blank
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {boolean} True if canvas is blank
 */
function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(
        context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
}

/**
 * Save current step data
 */
function saveCurrentStepData() {
    switch(currentStep) {
        case 2:
            savePersonalInfoData();
            break;
        case 3:
            // Documents already saved in upload handler
            break;
        case 4:
            // Payment data already saved in handlers
            break;
    }
}

/**
 * Save personal information to state
 */
function savePersonalInfoData() {
    applicationData.firstName = document.getElementById('firstName')?.value.trim();
    applicationData.lastName = document.getElementById('lastName')?.value.trim();
    applicationData.birthDate = document.getElementById('birthDate')?.value;
    applicationData.bacDate = document.getElementById('bacDate')?.value;
    applicationData.phone = document.getElementById('phone')?.value.trim();
    applicationData.email = document.getElementById('email')?.value.trim();
    applicationData.yearOfStudies = document.getElementById('yearOfStudies')?.value;
    applicationData.courses = document.getElementById('courses')?.value.trim();
}

/**
 * Update step display
 */
function updateStepDisplay() {
    for (let i = 1; i <= totalSteps; i++) {
        const stepElement = document.querySelector(`.step[data-step="${i}"]`);
        const formElement = document.getElementById(`step${i}`);
        
        if (i === currentStep) {
            if (stepElement) {
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
            }
            if (formElement) {
                formElement.classList.remove('hidden');
            }
        } else if (i < currentStep) {
            if (stepElement) {
                stepElement.classList.add('completed');
                stepElement.classList.remove('active');
            }
            if (formElement) {
                formElement.classList.add('hidden');
            }
        } else {
            if (stepElement) {
                stepElement.classList.remove('active', 'completed');
            }
            if (formElement) {
                formElement.classList.add('hidden');
            }
        }
    }
    
    // Scroll to top of form
    const container = document.querySelector('.container');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Setup form field listeners
 */
function setupFormListeners() {
    const yearOfStudies = document.getElementById('yearOfStudies');
    if (yearOfStudies) {
        yearOfStudies.addEventListener('change', () => {
            updateDocumentRequirements();
        });
    }
    
    // Real-time validation for email and phone
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            if (emailInput.value && !validateEmail(emailInput.value)) {
                showError('Please enter a valid email address.');
            }
        });
    }
    
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', () => {
            if (phoneInput.value && !validatePhoneNumber(phoneInput.value)) {
                showError('Please enter a valid phone number (e.g., +213 XX XX XX XX XX).');
            }
        });
    }
}

/**
 * Update document requirements based on study level
 */
function updateDocumentRequirements() {
    const yearOfStudies = document.getElementById('yearOfStudies')?.value;
    const masterDocsDiv = document.getElementById('masterDocs');
    
    if (yearOfStudies === 'Master') {
        if (masterDocsDiv) masterDocsDiv.classList.remove('hidden');
    } else {
        if (masterDocsDiv) masterDocsDiv.classList.add('hidden');
    }
}

/**
 * Setup document upload handlers
 */
function setupDocumentUploads() {
    document.querySelectorAll('.file-upload').forEach(upload => {
        const input = upload.querySelector('input[type="file"]');
        const docId = upload.getAttribute('data-doc') || generateDocId(upload);
        
        if (input) {
            upload.addEventListener('click', () => {
                input.click();
            });
            
            input.addEventListener('change', (e) => {
                handleFileUpload(e, docId, upload);
            });
        }
    });
}

/**
 * Handle file upload
 * @param {Event} event - File input change event
 * @param {string} docId - Document identifier
 * @param {HTMLElement} uploadElement - Upload container element
 */
function handleFileUpload(event, docId, uploadElement) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!validateFile(file)) {
        event.target.value = '';
        return;
    }
    
    uploadedDocuments[docId] = file;
    
    // Update UI to show uploaded file
    const fileList = uploadElement.nextElementSibling;
    if (fileList && fileList.classList.contains('file-list')) {
        fileList.innerHTML = '';
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span><i class="fas fa-file"></i> ${file.name.substring(0, 30)}${file.name.length > 30 ? '...' : ''}</span>
            <button onclick="removeDocument('${docId}', this)"><i class="fas fa-trash"></i></button>
        `;
        fileList.appendChild(fileItem);
    }
    
    // Update upload area appearance
    uploadElement.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <p>File uploaded: ${file.name.substring(0, 30)}</p>
        <input type="file" accept=".pdf,.jpg,.jpeg" style="display: none;">
    `;
    
    // Re-attach event listener to new input
    const newInput = uploadElement.querySelector('input');
    if (newInput) {
        newInput.addEventListener('change', (e) => {
            handleFileUpload(e, docId, uploadElement);
        });
    }
}

/**
 * Remove uploaded document
 * @param {string} docId - Document identifier
 * @param {HTMLElement} buttonElement - Remove button element
 */
function removeDocument(docId, buttonElement) {
    delete uploadedDocuments[docId];
    const fileItem = buttonElement.closest('.file-item');
    if (fileItem) fileItem.remove();
    
    // Reset upload area
    const uploadElement = buttonElement.closest('.form-group')?.querySelector('.file-upload');
    if (uploadElement) {
        const originalHtml = uploadElement.getAttribute('data-original') || `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to upload document</p>
            <input type="file" accept=".pdf,.jpg,.jpeg" style="display: none;">
        `;
        uploadElement.innerHTML = originalHtml;
        const newInput = uploadElement.querySelector('input');
        if (newInput) {
            newInput.addEventListener('change', (e) => {
                handleFileUpload(e, docId, uploadElement);
            });
        }
    }
}

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {boolean} Validation result
 */
function validateFile(file) {
    if (file.size > MAX_FILE_SIZE) {
        showError(`File "${file.name}" exceeds 5MB limit.`);
        return false;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showError(`File "${file.name}" is not allowed. Please upload PDF or JPG files.`);
        return false;
    }
    
    return true;
}

/**
 * Generate document ID from upload element
 * @param {HTMLElement} uploadElement - Upload container
 * @returns {string} Document ID
 */
function generateDocId(uploadElement) {
    const label = uploadElement.closest('.form-group')?.querySelector('label')?.innerText;
    if (label) {
        return label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    return 'doc_' + Date.now();
}

/**
 * Setup payment handlers
 */
function setupPaymentHandlers() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const payNowBtn = document.getElementById('payNowBtn');
    const payLaterBtn = document.getElementById('payLaterBtn');
    const receiptUpload = document.getElementById('receiptUpload');
    const paymentNextBtn = document.getElementById('paymentNextBtn');
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedPaymentMethod = option.getAttribute('data-payment');
        });
    });
    
    if (payNowBtn) {
        payNowBtn.addEventListener('click', () => {
            paymentStatus = 'paid_pending';
            if (receiptUpload) receiptUpload.classList.remove('hidden');
            if (paymentNextBtn) paymentNextBtn.disabled = false;
        });
    }
    
    if (payLaterBtn) {
        payLaterBtn.addEventListener('click', () => {
            paymentStatus = 'pending';
            if (receiptUpload) receiptUpload.classList.add('hidden');
            if (paymentNextBtn) paymentNextBtn.disabled = false;
        });
    }
    
    const receiptUploadArea = document.getElementById('receiptUploadArea');
    const receiptFile = document.getElementById('receiptFile');
    
    if (receiptUploadArea && receiptFile) {
        receiptUploadArea.addEventListener('click', () => {
            receiptFile.click();
        });
        
        receiptFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && validateFile(file)) {
                receiptUploadArea.innerHTML = '<i class="fas fa-check-circle"></i><p>Receipt uploaded successfully</p>';
            }
        });
    }
}

/**
 * Initialize signature canvas
 */
function initSignatureCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    let ctx = canvas.getContext('2d');
    let drawing = false;
    
    function resizeCanvas() {
        const container = canvas.parentElement;
        const width = container.clientWidth - 32;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = width;
        canvas.height = 150;
        ctx.putImageData(imageData, 0, 0);
        ctx.strokeStyle = '#2c2b28';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }
    
    function startDrawing(e) {
        drawing = true;
        const pos = getCanvasCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
    
    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getCanvasCoordinates(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
    
    function stopDrawing() {
        drawing = false;
    }
    
    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    ctx.strokeStyle = '#2c2b28';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);
    
    const clearBtn = document.getElementById('clearSignature');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }
}

/**
 * Submit application form
 */
async function submitApplication() {
    if (!validateSignatureStep()) return;
    
    const submitBtn = document.getElementById('submitApplication');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }
    
    try {
        // Generate application number
        const appNumber = generateLocalApplicationNumber(applicationData.destination);
        
        // Prepare email content
        const emailHtml = generateApplicationEmail(applicationData, appNumber);
        
        // In production, send to Supabase and email via Resend
        console.log('Application Data:', applicationData);
        console.log('Application Number:', appNumber);
        console.log('Email Content:', emailHtml);
        
        // Show success message
        showSuccess(`Application submitted successfully!\n\nApplication Number: ${appNumber}\n\nA confirmation email has been sent to ${applicationData.email}\n\nYou have 3 days to complete payment, otherwise your application will be automatically refused.`);
        
        // Redirect to home after 5 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 5000);
        
    } catch (error) {
        console.error('Submission error:', error);
        showError('Failed to submit application. Please try again or contact support.');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Application';
        }
    }
}

/**
 * Generate local application number (demo)
 * @param {string} destination - Application destination
 * @returns {string} Application number
 */
function generateLocalApplicationNumber(destination) {
    const prefix = destination === 'italy' ? 'IT' : 'CF';
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
}

/**
 * Generate application confirmation email HTML
 * @param {Object} data - Application data
 * @param {string} appNumber - Application number
 * @returns {string} HTML email content
 */
function generateApplicationEmail(data, appNumber) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Application Confirmation - Bougie Immigration</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4eddb; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 30px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2c2b28;">Bougie Immigration</h1>
                    <p style="color: #6b6a66;">Application Confirmation</p>
                </div>
                <hr style="border-color: #dcdad5;">
                <p>Dear ${data.firstName} ${data.lastName},</p>
                <p>Thank you for submitting your application. Your application has been received and is being processed.</p>
                <p><strong>Application Number:</strong> ${appNumber}</p>
                <p><strong>Destination:</strong> ${data.destination === 'italy' ? 'Italy' : 'Campus France'}</p>
                <p><strong>Year of Studies:</strong> ${data.yearOfStudies}</p>
                <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Payment Status:</strong> ${data.paymentStatus === 'paid_pending' ? 'Receipt Uploaded - Pending Verification' : 'Pending Payment'}</p>
                <p>You have 3 days to complete your payment. If payment is not received within this period, your application will be automatically refused.</p>
                <p>You can check your application status at any time using your application number on our website.</p>
                <hr style="border-color: #dcdad5;">
                <p style="color: #6b6a66; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
                <p style="color: #6b6a66; font-size: 12px;">Bougie Immigration - Professional Study Immigration Services</p>
            </div>
        </body>
        </html>
    `;
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    alert(message);
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
    alert(message);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Valid email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Valid phone number
 */
function validatePhoneNumber(phone) {
    const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
    return re.test(phone);
}

/**
 * Load destination-specific content
 * @param {string} destination - 'italy' or 'campus'
 */
function loadDestinationContent(destination) {
    const titleElement = document.querySelector('.form-title');
    if (titleElement) {
        if (destination === 'italy') {
            titleElement.innerHTML = 'Italy Study Application <span class="language-badge">Certified Documents Required</span>';
        } else {
            titleElement.innerHTML = 'Campus France Application <span class="language-badge">French Translation Required</span>';
        }
    }
    
    // Update document requirements display
    updateDocumentRequirements();
}

// Export functions for use in HTML
window.ApplicationForm = {
    init: initApplicationForm,
    submit: submitApplication,
    removeDocument: removeDocument,
    validateFile: validateFile
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const destination = document.body.getAttribute('data-destination') || 
                        (window.location.pathname.includes('italy') ? 'italy' : 'campus');
    initApplicationForm(destination);
    
    const submitBtn = document.getElementById('submitApplication');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitApplication);
    }
});
