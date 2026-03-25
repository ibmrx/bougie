/**
 * Bougie Immigration - Application Form Handler
 * Manages multi-step application forms for Italy and Campus France
 * Handles form validation, document uploads to Supabase, and submission
 */

// Global state
let currentStep = 1;
let totalSteps = 5;
let selectedFiles = {};
let paymentStatus = null;
let selectedPaymentMethod = null;
let applicationData = {};
let signatureData = null;
let canvas, ctx, drawing = false;
let uploadResults = {};

// ==================== SUPABASE STORAGE FUNCTIONS ====================
let supabaseClient = null;

function initSupabaseStorage() {
    if (supabase) {
        supabaseClient = supabase;
    } else if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase;
    }
    return supabaseClient;
}

async function uploadToSupabase(file, applicationNumber, docType) {
    if (!supabaseClient && !initSupabaseStorage()) {
        throw new Error('Supabase not initialized');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${applicationNumber}/${docType}_${Date.now()}.${fileExt}`;
    
    const { error } = await supabaseClient.storage
        .from('documents')
        .upload(fileName, file);
    
    if (error) throw error;
    
    const { data } = supabaseClient.storage
        .from('documents')
        .getPublicUrl(fileName);
    
    return data.publicUrl;
}

async function uploadMultipleDocuments(files, applicationNumber, onProgress) {
    if (!supabaseClient && !initSupabaseStorage()) {
        throw new Error('Supabase not initialized');
    }
    
    const results = {};
    let completed = 0;
    const total = files.length;
    
    for (const item of files) {
        try {
            const url = await uploadToSupabase(item.file, applicationNumber, item.documentType);
            results[item.documentType] = url;
            completed++;
            if (onProgress) onProgress(completed, total, item.documentType, { success: true, url });
        } catch (error) {
            results[item.documentType] = { error: error.message };
            completed++;
            if (onProgress) onProgress(completed, total, item.documentType, { success: false, error: error.message });
        }
    }
    
    return results;
}

window.SupabaseStorage = {
    init: initSupabaseStorage,
    upload: uploadToSupabase,
    uploadMultiple: uploadMultipleDocuments
};

// Document requirements based on destination and study level
const DOCUMENT_REQUIREMENTS = {
    italy: {
        bachelor: [
            { id: 'passport', name: 'Passport', required: true },
            { id: 'photo', name: 'ID Photo', required: true },
            { id: 'cv', name: 'CV', required: true },
            { id: 'bacCertOriginal', name: 'Baccalaureate Certificate (certified original)', required: true },
            { id: 'bacCertTranslated', name: 'Baccalaureate Certificate (certified translated)', required: true },
            { id: 'bacTranscriptOriginal', name: 'Baccalaureate Transcript (certified original)', required: true },
            { id: 'bacTranscriptTranslated', name: 'Baccalaureate Transcript (certified translated)', required: true },
            { id: 'englishProof', name: 'English Proof (IELTS/TOEFL)', required: true }
        ],
        master: [
            { id: 'passport', name: 'Passport', required: true },
            { id: 'photo', name: 'ID Photo', required: true },
            { id: 'cv', name: 'CV', required: true },
            { id: 'bacCertOriginal', name: 'Baccalaureate Certificate (certified original)', required: true },
            { id: 'bacCertTranslated', name: 'Baccalaureate Certificate (certified translated)', required: true },
            { id: 'bacTranscriptOriginal', name: 'Baccalaureate Transcript (certified original)', required: true },
            { id: 'bacTranscriptTranslated', name: 'Baccalaureate Transcript (certified translated)', required: true },
            { id: 'bachelorCertOriginal', name: 'Bachelor Certificate (certified original)', required: true },
            { id: 'bachelorCertTranslated', name: 'Bachelor Certificate (certified translated)', required: true },
            { id: 'bachelorTranscriptOriginal', name: 'Bachelor Transcript - 3 years (certified original)', required: true },
            { id: 'bachelorTranscriptTranslated', name: 'Bachelor Transcript - 3 years (certified translated)', required: true },
            { id: 'englishProof', name: 'English Proof (IELTS/TOEFL)', required: true }
        ]
    },
    campus: {
        bachelor: [
            { id: 'passport', name: 'Passport', required: true },
            { id: 'photo', name: 'ID Photo', required: true },
            { id: 'cv', name: 'CV (French)', required: true },
            { id: 'bacCertOriginal', name: 'Baccalaureate Certificate (original)', required: true },
            { id: 'bacCertTranslated', name: 'Baccalaureate Certificate (French translation)', required: true },
            { id: 'bacTranscriptOriginal', name: 'Baccalaureate Transcript (original)', required: true },
            { id: 'bacTranscriptTranslated', name: 'Baccalaureate Transcript (French translation)', required: true },
            { id: 'tcfResults', name: 'TCF Test Results', required: true }
        ],
        master: [
            { id: 'passport', name: 'Passport', required: true },
            { id: 'photo', name: 'ID Photo', required: true },
            { id: 'cv', name: 'CV (French)', required: true },
            { id: 'bacCertOriginal', name: 'Baccalaureate Certificate (original)', required: true },
            { id: 'bacCertTranslated', name: 'Baccalaureate Certificate (French translation)', required: true },
            { id: 'bacTranscriptOriginal', name: 'Baccalaureate Transcript (original)', required: true },
            { id: 'bacTranscriptTranslated', name: 'Baccalaureate Transcript (French translation)', required: true },
            { id: 'bachelorCertOriginal', name: 'Bachelor Certificate (original)', required: true },
            { id: 'bachelorCertTranslated', name: 'Bachelor Certificate (French translation)', required: true },
            { id: 'bachelorTranscriptOriginal', name: 'Bachelor Transcript - 3 years (original)', required: true },
            { id: 'bachelorTranscriptTranslated', name: 'Bachelor Transcript - 3 years (French translation)', required: true },
            { id: 'tcfResults', name: 'TCF Test Results', required: true }
        ]
    }
};

// File validation
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

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
    
    // Setup privacy policy modal
    setupPrivacyPolicyModal();
    
    // Load destination-specific content
    loadDestinationContent(destination);

    // Create initial document upload section for bachelor
    createUploadSection('bachelorDocs', DOCUMENT_REQUIREMENTS[destination].bachelor);
    
    // Initial validation for step 1
    validateStep1();

    // Start button handler
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (validateStep1()) {
                currentStep = 2;
                updateStepDisplay();
            }
        });
    }

        if (window.SupabaseStorage) {
        window.SupabaseStorage.init();
    }
    
} 
/**
 * Setup privacy policy modal
 */
function setupPrivacyPolicyModal() {
    const viewContract = document.getElementById('viewContract');
    const contractModal = document.getElementById('contractModal');
    const closeModalBtn = document.getElementById('closeContractBtn');
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
    
    // Close modal when clicking outside
    if (contractModal) {
        contractModal.addEventListener('click', (e) => {
            if (e.target === contractModal) {
                contractModal.style.display = 'none';
            }
        });
    }
}


function createUploadSection(containerId, docs) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    docs.forEach(doc => {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label>${doc.name} <span class="required">*</span></label>
            <div class="file-upload" data-id="${doc.id}">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to upload</p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none">
            </div>
            <div class="file-list" id="list-${doc.id}"></div>
        `;
        container.appendChild(div);
    });
    attachUploadHandlers();
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
        ctx.fillRect(0, 0, width, 150);
        ctx.strokeStyle = '#2c2b28';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        if (signatureData) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = signatureData;
        }
    }
    
    function getCoordinates(e) {
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
    
    function startDrawing(e) {
        drawing = true;
        const pos = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
    
    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getCoordinates(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
    
    function stopDrawing() {
        drawing = false;
        signatureData = canvas.toDataURL();
    }
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
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
    const startBtn = document.getElementById('startBtn');
    
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
    const fields = ['firstName', 'lastName', 'birthDate', 'bacDate', 'degree', 'phone', 'email', 'courses'];
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
    const degree = document.getElementById('degree')?.value;
    const docList = applicationData.documentRequirements[degree === 'Master' ? 'master' : 'bachelor'];
    const missingDocs = [];
    
    for (const doc of docList) {
        if (doc.required && !selectedFiles[doc.id]) {
            missingDocs.push(doc.name);
        }
    }
    
    if (missingDocs.length > 0) {
        showError(`Please upload the following required documents:\n${missingDocs.join('\n')}`);
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
            showError('Receipt must be PDF, JPG, or PNG format.');
            return false;
        }
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
        applicationData.yearOfStudies = document.getElementById('degree')?.value;
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
    const applyingDegree = document.getElementById('degree');
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
    const submitBtn = document.getElementById('submitBtn');
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
    const applyingDegree = document.getElementById('degree')?.value;
    const masterDocsDiv = document.getElementById('masterDocs');
    
    if (applyingDegree === 'Master') {
        if (masterDocsDiv) {
            masterDocsDiv.classList.remove('hidden');
            // Create the master document upload boxes
            const masterDocsList = applicationData.documentRequirements.master;
            createUploadSection('masterDocs', masterDocsList);
        }
    } else {
        if (masterDocsDiv) {
            masterDocsDiv.classList.add('hidden');
            // Recreate bachelor docs (in case user switches back)
            const bachelorDocsList = applicationData.documentRequirements.bachelor;
            createUploadSection('bachelorDocs', bachelorDocsList);
        }
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
        
        if (input && !input.hasAttribute('data-attached')) {
            input.setAttribute('data-attached', 'true');
            
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
                
                selectedFiles[docId] = file;
                
                const fileList = upload.nextElementSibling;
                if (fileList && fileList.classList.contains('file-list')) {
                    fileList.innerHTML = `<div class="file-item"><span><i class="fas fa-file"></i> ${file.name.substring(0, 30)}</span><button onclick="removeDocument('${docId}', this)"><i class="fas fa-trash"></i></button></div>`;
                }
                
                upload.innerHTML = `<i class="fas fa-check-circle"></i><p>File ready: ${file.name.substring(0, 25)}</p><input type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none">`;
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
    delete selectedFiles[docId];
    const fileItem = button.closest('.file-item');
    if (fileItem) fileItem.remove();
    
    const upload = document.querySelector(`.file-upload[data-id="${docId}"]`);
    if (upload) {
        const docName = upload.closest('.form-group')?.querySelector('label')?.innerText?.replace('*', '').trim() || 'document';
        upload.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><p>Click to upload ${docName}</p><input type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none">`;
        const newInput = upload.querySelector('input');
        if (newInput) {
            newInput.setAttribute('data-id', docId);
            newInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && validateFile(file)) {
                    selectedFiles[docId] = file;
                    const fileList = upload.nextElementSibling;
                    if (fileList) fileList.innerHTML = `<div class="file-item"><span><i class="fas fa-file"></i> ${file.name.substring(0, 30)}</span><button onclick="removeDocument('${docId}', this)"><i class="fas fa-trash"></i></button></div>`;
                    upload.innerHTML = `<i class="fas fa-check-circle"></i><p>File ready</p><input type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none">`;
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
        showError(`File "${file.name}" is not allowed. Please upload PDF, JPG, or PNG files.`);
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
    
    const receiptUploadArea = document.getElementById('receiptArea');
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
    
    const degreeLabel = document.querySelector('label[for="degree"]');
    if (degreeLabel) {
        degreeLabel.innerHTML = 'Applying Degree <span class="required">*</span>';
    }
}

/**
 * Upload files to Supabase Storage
 */
async function uploadToSupabaseStorage(applicationNumber) {
    const filesToUpload = [];
    
    for (const [docId, file] of Object.entries(selectedFiles)) {
        filesToUpload.push({
            file: file,
            documentType: docId
        });
    }
    
    const receiptFile = document.getElementById('receiptFile')?.files[0];
    if (receiptFile && paymentStatus === 'paid_pending') {
        filesToUpload.push({
            file: receiptFile,
            documentType: 'payment_receipt'
        });
    }
    
    if (filesToUpload.length === 0) return {};
    
    if (!window.SupabaseStorage) {
        throw new Error('Supabase Storage not available. Please check your connection.');
    }
    
    const results = await window.SupabaseStorage.uploadMultiple(
        filesToUpload,
        applicationNumber,
        (completed, total, docType, result) => {
            console.log(`Uploaded ${docType}: ${completed}/${total}`);
        }
    );
    
    return results;
}

/**
 * Send email via Resend
 */
async function sendEmail(to, subject, html) {
    const RESEND_API_KEY = 're_UGbnfq94_KrG2rVQMhkbiGSkTGH9P62iR';
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Bougie Immigration <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html
            })
        });
        const result = await response.json();
        console.log('Email sent:', result);
        return result;
    } catch (error) {
        console.error('Email error:', error);
        return null;
    }
}

/**
 * Submit application
 */
async function submitApplication() {
    if (!validateStep5()) return;
    
    const appNumber = (applicationData.destination === 'italy' ? 'IT' : 'CF') + 
        '-' + new Date().getFullYear() + '-' + 
        Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date();
    const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading documents...';
    
    try {
        const uploadResults = await uploadToSupabaseStorage(appNumber);
        
        const application = {
            id: Date.now().toString(),
            application_number: appNumber,
            first_name: document.getElementById('firstName')?.value || '',
            last_name: document.getElementById('lastName')?.value || '',
            birth_date: document.getElementById('birthDate')?.value || '',
            bac_date: document.getElementById('bacDate')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            year_of_study: document.getElementById('degree')?.value || '',
            courses: document.getElementById('courses')?.value || '',
            destination: applicationData.destination,
            application_status: 'pending',
            payment_status: paymentStatus || 'pending',
            payment_method: selectedPaymentMethod,
            documents: uploadResults,
            signature: signatureData,
            created_at: now.toISOString(),
            payment_deadline: deadline.toISOString()
        };
        
        if (applicationData.destination === 'campus') {
            application.tcf_status = document.getElementById('tcfStatus')?.value;
        }
        
        let applications = JSON.parse(localStorage.getItem('bougie_applications') || '[]');
        applications.push(application);
        localStorage.setItem('bougie_applications', JSON.stringify(applications));
        
        const destinationName = applicationData.destination === 'italy' ? 'Italy' : 'Campus France';
        const emailHtml = `
            <!DOCTYPE html><html><body style="font-family:Arial;padding:20px">
            <h2>Application Confirmation - ${destinationName}</h2>
            <p>Dear ${application.first_name} ${application.last_name},</p>
            <p>Your application has been submitted successfully.</p>
            <p><strong>Application Number:</strong> ${appNumber}</p>
            <p><strong>Destination:</strong> ${destinationName}</p>
            <p><strong>Payment Deadline:</strong> ${deadline.toLocaleDateString()}</p>
            <p>You have 3 days to complete payment.</p>
            <p>Thank you,<br>Bougie Immigration Team</p>
            </body></html>
        `;
        
        await sendEmail(application.email, `Application Confirmation - Bougie Immigration`, emailHtml);
        
        const successAppNumber = document.getElementById('successAppNumber');
        if (successAppNumber) {
            successAppNumber.innerHTML = `<strong>Application Number: ${appNumber}</strong>`;
        }
        
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        showError(`Failed to submit application: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Application';
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
window.removeDocument = removeDocument;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const destination = document.body.getAttribute('data-destination') || 
                        (window.location.pathname.includes('italy') ? 'italy' : 'campus');
    initApplicationForm(destination);
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitApplication);
    }
});
like this?
