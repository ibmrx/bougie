/**
 * Bougie Immigration - Application Form Handler
 * Manages multi-step application forms with Supabase integration
 */

// Global state
let currentStep = 1;
let totalSteps = 5;
let uploadedDocuments = {};
let paymentStatus = null;
let selectedPaymentMethod = null;
let applicationData = {};
let signatureData = null;
let canvas, ctx, drawing = false;
let isSubmitting = false;

// File validation
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg'];

/**
 * Initialize application form
 * @param {string} destination - 'italy' or 'campus'
 */
function initApplicationForm(destination) {
    applicationData.destination = destination;
    
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
    
    // Setup privacy policy modal
    setupPrivacyPolicyModal();
    
    // Load destination-specific content
    loadDestinationContent(destination);
    
    // Initial validation for step 1
    validateStep1();
}

/**
 * Setup privacy policy modal
 */
function setupPrivacyPolicyModal() {
    const viewContract = document.getElementById('viewContract');
    const contractModal = document.getElementById('contractModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const acceptContractBtn = document.getElementById('acceptContractBtn');
    
    if (viewContract && contractModal) {
        viewContract.addEventListener('click', (e) => {
            e.preventDefault();
            contractModal.style.display = 'flex';
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            contractModal.style.display = 'none';
        });
    }
    
    if (acceptContractBtn) {
        acceptContractBtn.addEventListener('click', () => {
            contractModal.style.display = 'none';
        });
    }
    
    if (contractModal) {
        contractModal.addEventListener('click', (e) => {
            if (e.target === contractModal) {
                contractModal.style.display = 'none';
            }
        });
    }
}

/**
 * Initialize signature canvas
 */
function initSignatureCanvas() {
    canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        const container = canvas.parentElement;
        const width = container.clientWidth - 32;
        canvas.width = width;
        canvas.height = 150;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#2c2b28';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        if (signatureData) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = signatureData;
        }
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
        if (drawing) {
            drawing = false;
            signatureData = canvas.toDataURL();
        }
    }
    
    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
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
    
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);
    
    const clearBtn = document.getElementById('clearSignature');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            signatureData = null;
        });
    }
}

/**
 * Setup step navigation
 */
function setupStepNavigation() {
    const nextButtons = document.querySelectorAll('.nextBtn');
    const prevButtons = document.querySelectorAll('.prevBtn');
    
    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateCurrentStep()) {
                saveCurrentStepData();
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateStepDisplay();
                }
            }
        });
    });
    
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepDisplay();
            }
        });
    });
}

/**
 * Validate current step
 */
function validateCurrentStep() {
    switch(currentStep) {
        case 1: return validateStep1();
        case 2: return validateStep2();
        case 3: return validateStep3();
        case 4: return validateStep4();
        case 5: return validateStep5();
        default: return true;
    }
}

/**
 * Validate step 1 - Confirmation
 */
function validateStep1() {
    const confirmCertified = document.getElementById('confirmCertified');
    const confirmFinal = document.getElementById('confirmFinal');
    const startBtn = document.getElementById('startApplicationBtn');
    
    let isValid = true;
    
    if (confirmCertified && confirmFinal) {
        isValid = confirmCertified.checked && confirmFinal.checked;
        
        if (applicationData.destination === 'campus') {
            const confirmTcf = document.getElementById('confirmTcf');
            if (confirmTcf) {
                isValid = isValid && confirmTcf.checked;
            }
        }
    }
    
    if (startBtn) {
        startBtn.disabled = !isValid;
    }
    
    return isValid;
}

/**
 * Validate step 2 - Personal Information
 */
function validateStep2() {
    const fields = ['firstName', 'lastName', 'birthDate', 'bacDate', 'applyingDegree', 'phone', 'email', 'courses'];
    let isValid = true;
    let firstInvalid = null;
    
    for (const fieldId of fields) {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            isValid = false;
            if (!firstInvalid) firstInvalid = field;
            field.classList.add('input-error');
        } else if (field) {
            field.classList.remove('input-error');
        }
    }
    
    const emailField = document.getElementById('email');
    if (emailField && emailField.value.trim()) {
        const email = emailField.value.trim();
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) {
            isValid = false;
            emailField.classList.add('input-error');
            showError('Please enter a valid email address.');
            return false;
        }
    }
    
    const phoneField = document.getElementById('phone');
    if (phoneField && phoneField.value.trim()) {
        const phone = phoneField.value.trim();
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(phone)) {
            isValid = false;
            phoneField.classList.add('input-error');
            showError('Please enter a valid phone number.');
            return false;
        }
    }
    
    if (applicationData.destination === 'campus') {
        const tcfStatus = document.getElementById('tcfStatus');
        if (tcfStatus && !tcfStatus.value) {
            isValid = false;
            tcfStatus.classList.add('input-error');
            showError('Please select your TCF test status.');
            return false;
        } else if (tcfStatus) {
            tcfStatus.classList.remove('input-error');
        }
    }
    
    if (!isValid) {
        showError('Please fill all required fields.');
        if (firstInvalid) firstInvalid.focus();
    }
    
    return isValid;
}

/**
 * Validate step 3 - Documents
 */
function validateStep3() {
    const degree = document.getElementById('applyingDegree')?.value;
    const missingDocs = [];
    
    // Check all uploaded documents based on requirements
    for (const [docId, file] of Object.entries(uploadedDocuments)) {
        if (!file) {
            missingDocs.push(docId);
        }
    }
    
    if (missingDocs.length > 0) {
        showError(`Please upload all required documents.`);
        return false;
    }
    
    return true;
}

/**
 * Validate step 4 - Payment
 */
function validateStep4() {
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
        if (receiptFile.size > MAX_FILE_SIZE) {
            showError('Receipt file exceeds 5MB limit.');
            return false;
        }
        
        if (!ALLOWED_FILE_TYPES.includes(receiptFile.type)) {
            showError('Receipt must be PDF or JPG format.');
            return false;
        }
        
        applicationData.receiptFile = receiptFile;
    }
    
    return true;
}

/**
 * Validate step 5 - Signature
 */
function validateStep5() {
    const privacyChecked = document.getElementById('privacyPolicy');
    if (!privacyChecked || !privacyChecked.checked) {
        showError('Please read and agree to the Privacy Policy and Contract.');
        return false;
    }
    
    if (!signatureData) {
        showError('Please provide your digital signature by drawing in the signature area.');
        return false;
    }
    
    return true;
}

/**
 * Save current step data
 */
function saveCurrentStepData() {
    if (currentStep === 2) {
        applicationData.firstName = document.getElementById('firstName')?.value.trim();
        applicationData.lastName = document.getElementById('lastName')?.value.trim();
        applicationData.birthDate = document.getElementById('birthDate')?.value;
        applicationData.bacDate = document.getElementById('bacDate')?.value;
        applicationData.phone = document.getElementById('phone')?.value.trim();
        applicationData.email = document.getElementById('email')?.value.trim();
        applicationData.yearOfStudies = document.getElementById('applyingDegree')?.value;
        applicationData.courses = document.getElementById('courses')?.value.trim();
        
        if (applicationData.destination === 'campus') {
            applicationData.tcfStatus = document.getElementById('tcfStatus')?.value;
        }
    }
}

/**
 * Update step display
 */
function updateStepDisplay() {
    const steps = [null, 'step1', 'step2', 'step3', 'step4', 'step5'];
    
    for (let i = 1; i <= totalSteps; i++) {
        const stepElement = document.querySelector(`.step[data-step="${i}"]`);
        const formElement = document.getElementById(steps[i]);
        
        if (i === currentStep) {
            if (stepElement) {
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
            }
            if (formElement) formElement.classList.remove('hidden');
        } else if (i < currentStep) {
            if (stepElement) {
                stepElement.classList.add('completed');
                stepElement.classList.remove('active');
            }
            if (formElement) formElement.classList.add('hidden');
        } else {
            if (stepElement) {
                stepElement.classList.remove('active', 'completed');
            }
            if (formElement) formElement.classList.add('hidden');
        }
    }
    
    const container = document.querySelector('.container');
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Setup form field listeners
 */
function setupFormListeners() {
    const applyingDegree = document.getElementById('applyingDegree');
    if (applyingDegree) {
        applyingDegree.addEventListener('change', () => {
            updateDocumentRequirements();
        });
    }
    
    const confirmCertified = document.getElementById('confirmCertified');
    const confirmFinal = document.getElementById('confirmFinal');
    const confirmTcf = document.getElementById('confirmTcf');
    
    if (confirmCertified) confirmCertified.addEventListener('change', validateStep1);
    if (confirmFinal) confirmFinal.addEventListener('change', validateStep1);
    if (confirmTcf) confirmTcf.addEventListener('change', validateStep1);
    
    const privacyPolicy = document.getElementById('privacyPolicy');
    const submitBtn = document.getElementById('submitApplication');
    if (privacyPolicy && submitBtn) {
        privacyPolicy.addEventListener('change', (e) => {
            submitBtn.disabled = !e.target.checked;
        });
    }
    
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('input-error');
        });
    });
}

/**
 * Update document requirements based on study level
 */
function updateDocumentRequirements() {
    const applyingDegree = document.getElementById('applyingDegree')?.value;
    const masterDocsDiv = document.getElementById('masterDocs');
    
    if (applyingDegree === 'Master') {
        if (masterDocsDiv) masterDocsDiv.classList.remove('hidden');
    } else {
        if (masterDocsDiv) masterDocsDiv.classList.add('hidden');
    }
}

/**
 * Setup document upload handlers
 */
function setupDocumentUploads() {
    attachUploadHandlers();
}

/**
 * Attach upload handlers to file upload elements
 */
function attachUploadHandlers() {
    document.querySelectorAll('.file-upload').forEach(upload => {
        const input = upload.querySelector('input[type="file"]');
        const docId = upload.getAttribute('data-id');
        
        if (input && !input.hasAttribute('data-handler-attached')) {
            input.setAttribute('data-handler-attached', 'true');
            
            upload.addEventListener('click', (e) => {
                if (e.target !== input) input.click();
            });
            
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (!validateFile(file)) {
                    input.value = '';
                    return;
                }
                
                uploadedDocuments[docId] = file;
                
                const fileList = upload.nextElementSibling;
                if (fileList && fileList.classList.contains('file-list')) {
                    fileList.innerHTML = `<div class="file-item"><span><i class="fas fa-file"></i> ${file.name.substring(0, 30)}</span><button onclick="window.removeDocument('${docId}', this)"><i class="fas fa-trash"></i></button></div>`;
                }
                
                upload.innerHTML = `<i class="fas fa-check-circle"></i><p>File uploaded: ${file.name.substring(0, 25)}</p><input type="file" accept=".pdf,.jpg,.jpeg" style="display:none">`;
                const newInput = upload.querySelector('input');
                if (newInput) {
                    newInput.setAttribute('data-id', docId);
                    newInput.addEventListener('change', arguments.callee);
                }
            });
        }
    });
}

/**
 * Remove uploaded document
 */
window.removeDocument = function(docId, button) {
    delete uploadedDocuments[docId];
    const fileItem = button.closest('.file-item');
    if (fileItem) fileItem.remove();
    
    const upload = document.querySelector(`.file-upload[data-id="${docId}"]`);
    if (upload) {
        const docName = upload.closest('.form-group')?.querySelector('label')?.innerText?.replace('*', '').trim() || 'document';
        upload.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><p>Click to upload ${docName}</p><input type="file" accept=".pdf,.jpg,.jpeg" style="display:none">`;
        const newInput = upload.querySelector('input');
        if (newInput) {
            newInput.setAttribute('data-id', docId);
            newInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && validateFile(file)) {
                    uploadedDocuments[docId] = file;
                    const fileList = upload.nextElementSibling;
                    if (fileList) fileList.innerHTML = `<div class="file-item"><span><i class="fas fa-file"></i> ${file.name.substring(0, 30)}</span><button onclick="window.removeDocument('${docId}', this)"><i class="fas fa-trash"></i></button></div>`;
                    upload.innerHTML = `<i class="fas fa-check-circle"></i><p>File uploaded</p><input type="file" accept=".pdf,.jpg,.jpeg" style="display:none">`;
                }
            });
        }
    }
};

/**
 * Validate file
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
        receiptUploadArea.addEventListener('click', () => receiptFile.click());
        
        receiptFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && validateFile(file)) {
                receiptUploadArea.innerHTML = '<i class="fas fa-check-circle"></i><p>Receipt uploaded successfully</p>';
                applicationData.receiptFile = file;
            }
        });
    }
}

/**
 * Load destination-specific content
 */
function loadDestinationContent(destination) {
    const bacLabel = document.querySelector('label[for="bacDate"]');
    if (bacLabel) {
        bacLabel.innerHTML = 'Baccalaureate Date of Completion <span class="required">*</span>';
    }
    
    const degreeLabel = document.querySelector('label[for="applyingDegree"]');
    if (degreeLabel) {
        degreeLabel.innerHTML = 'Applying Degree <span class="required">*</span>';
    }
}

/**
 * Submit application to Supabase
 */
async function submitApplication() {
    if (!validateStep5()) return;
    if (isSubmitting) return;
    
    isSubmitting = true;
    const submitBtn = document.getElementById('submitApplication');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }
    
    try {
        // Save all application data
        applicationData.paymentMethod = selectedPaymentMethod;
        applicationData.paymentStatus = paymentStatus;
        applicationData.signature = signatureData;
        
        // Upload documents to Supabase Storage
        const appNumber = window.SupabaseClient?.generateApplicationNumber(applicationData.destination);
        applicationData.applicationNumber = appNumber;
        
        showError('Submitting application and uploading documents...');
        
        // Upload all documents
        const documentUrls = {};
        for (const [docType, file] of Object.entries(uploadedDocuments)) {
            if (file && file instanceof File) {
                try {
                    const url = await window.SupabaseClient.uploadFile(file, appNumber, docType);
                    documentUrls[docType] = url;
                } catch (err) {
                    console.error(`Failed to upload ${docType}:`, err);
                }
            }
        }
        
        // Upload receipt if exists
        let receiptUrl = null;
        if (applicationData.receiptFile) {
            try {
                receiptUrl = await window.SupabaseClient.uploadFile(applicationData.receiptFile, appNumber, 'payment_receipt');
            } catch (err) {
                console.error('Failed to upload receipt:', err);
            }
        }
        
        applicationData.documentUrls = documentUrls;
        applicationData.receiptUrl = receiptUrl;
        
        // Create application in database
        const result = await window.SupabaseClient.createApplication(applicationData);
        
        if (result) {
            // Send confirmation email
            await window.SupabaseClient.sendConfirmationEmail(result);
            
            // Show success modal
            const successModal = document.getElementById('successModal');
            const successAppNumber = document.getElementById('successAppNumber');
            if (successModal && successAppNumber) {
                successAppNumber.innerHTML = `<strong>Application Number: ${result.application_number}</strong><br>A confirmation email has been sent to ${applicationData.email}`;
                successModal.style.display = 'flex';
            }
            
            const successOkBtn = document.getElementById('successOkBtn');
            if (successOkBtn) {
                successOkBtn.onclick = () => {
                    window.location.href = 'index.html';
                };
            }
        } else {
            throw new Error('Failed to create application');
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        showError('Failed to submit application: ' + error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Application';
        }
    } finally {
        isSubmitting = false;
    }
}

/**
 * Show error message
 */
function showError(message) {
    alert(message);
}

// Export for global access
window.initApplicationForm = initApplicationForm;
window.submitApplication = submitApplication;
window.removeDocument = window.removeDocument;

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
