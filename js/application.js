/**
 * Bougie Immigration - Application Form Handler
 * Manages multi-step application forms for Italy and Campus France
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

// ==================== SUPABASE CLIENT ====================
const SUPABASE_URL = 'https://qpprzcckolmdyabnmgol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHJ6Y2Nrb2xtZHlhYm5tZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA5MTYsImV4cCI6MjA4OTkzNjkxNn0.Pp9fTdklyomxmG6wsb8FBzyhLXaXEx983ofdaiPG_So';

let supabase = null;

function initSupabase() {
    if (typeof supabaseJs !== 'undefined') {
        supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    console.log('Supabase initialized:', supabase ? 'Yes' : 'No');
    return supabase;
}

// Document requirements
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function initApplicationForm(destination) {
    applicationData.destination = destination;
    applicationData.documentRequirements = DOCUMENT_REQUIREMENTS[destination];
    
    setupStepNavigation();
    setupFormListeners();
    setupDocumentUploads();
    setupPaymentHandlers();
    initSignatureCanvas();
    setupPrivacyPolicyModal();
    loadDestinationContent(destination);

    createUploadSection('bachelorDocs', DOCUMENT_REQUIREMENTS[destination].bachelor);
    validateStep1();

    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!validateStep1()) return;
            currentStep = 2;
            updateStepDisplay();
        });
    }
}

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

function validateStep1() {
    const confirmCertified = document.getElementById('confirmCertified');
    const confirmFinal = document.getElementById('confirmFinal');
    const startBtn = document.getElementById('startBtn');
    
    let isValid = true;
    if (confirmCertified && confirmFinal) {
        isValid = confirmCertified.checked && confirmFinal.checked;
        if (applicationData.destination === 'campus') {
            const confirmTcf = document.getElementById('confirmTcf');
            if (confirmTcf) isValid = isValid && confirmTcf.checked;
        }
    }
    
    if (startBtn) startBtn.disabled = !isValid;
    return isValid;
}

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
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(emailField.value.trim())) {
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
        }
    }
    
    if (!isValid) {
        showError('Please fill all required fields.');
        if (firstInvalid) firstInvalid.focus();
    }
    return isValid;
}

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
    }
    return true;
}

function validateStep5() {
    const privacyChecked = document.getElementById('privacyPolicy');
    if (!privacyChecked || !privacyChecked.checked) {
        showError('Please read and agree to the Privacy Policy and Contract.');
        return false;
    }
    if (!signatureData) {
        showError('Please provide your digital signature.');
        return false;
    }
    return true;
}

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

function updateStepDisplay() {
    const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
    steps.forEach((id, index) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (index + 1 === currentStep) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupFormListeners() {
    const degreeSelect = document.getElementById('degree');
    if (degreeSelect) {
        degreeSelect.addEventListener('change', updateDocumentRequirements);
    }
    
    const privacyPolicy = document.getElementById('privacyPolicy');
    const submitBtn = document.getElementById('submitBtn');
    if (privacyPolicy && submitBtn) {
        privacyPolicy.addEventListener('change', (e) => {
            submitBtn.disabled = !e.target.checked;
        });
    }
}

function updateDocumentRequirements() {
    const degree = document.getElementById('degree')?.value;
    const bachelorDiv = document.getElementById('bachelorDocs');
    const masterDiv = document.getElementById('masterDocs');
    
    if (degree === 'Master') {
        if (bachelorDiv) bachelorDiv.classList.add('hidden');
        if (masterDiv) {
            masterDiv.classList.remove('hidden');
            createUploadSection('masterDocs', applicationData.documentRequirements.master);
        }
    } else {
        if (masterDiv) masterDiv.classList.add('hidden');
        if (bachelorDiv) {
            bachelorDiv.classList.remove('hidden');
            createUploadSection('bachelorDocs', applicationData.documentRequirements.bachelor);
        }
    }
}

function setupDocumentUploads() {
    attachUploadHandlers();
}

function handleFileChange(e) {
    const input = e.target;
    const docId = input.getAttribute('data-id');
    const file = input.files[0];
    if (!file) return;
    
    if (!validateFile(file)) {
        input.value = '';
        return;
    }
    
    selectedFiles[docId] = file;
    const upload = input.closest('.file-upload');
    const fileList = upload.nextElementSibling;
    
    if (fileList && fileList.classList.contains('file-list')) {
        fileList.innerHTML = `<div class="file-item"><span><i class="fas fa-file"></i> ${file.name.substring(0, 30)}</span><button type="button" onclick="removeDocument('${docId}', this)"><i class="fas fa-trash"></i></button></div>`;
    }
    
    upload.innerHTML = `<i class="fas fa-check-circle"></i><p>File ready: ${file.name.substring(0, 25)}</p><input type="file" data-id="${docId}" accept=".pdf,.jpg,.jpeg,.png" style="display:none">`;
    const newInput = upload.querySelector('input');
    newInput.addEventListener('change', handleFileChange);
}

function attachUploadHandlers() {
    document.querySelectorAll('.file-upload').forEach(upload => {
        const input = upload.querySelector('input[type="file"]');
        const docId = upload.getAttribute('data-id');
        
        if (input && !input.hasAttribute('data-attached')) {
            input.setAttribute('data-attached', 'true');
            input.setAttribute('data-id', docId);
            
            upload.addEventListener('click', (e) => {
                if (e.target !== input) input.click();
            });
            
            input.addEventListener('change', handleFileChange);
        }
    });
}

window.removeDocument = function(docId, button) {
    delete selectedFiles[docId];
    button.closest('.file-item').remove();
    const upload = document.querySelector(`.file-upload[data-id="${docId}"]`);
    if (upload) {
        upload.innerHTML = `<i class="fas fa-cloud-upload-alt"></i><p>Click to upload</p><input type="file" data-id="${docId}" accept=".pdf,.jpg,.jpeg,.png" style="display:none">`;
        const newInput = upload.querySelector('input');
        newInput.addEventListener('change', handleFileChange);
    }
};

function validateFile(file) {
    if (file.size > MAX_FILE_SIZE) {
        showError(`File "${file.name}" exceeds 5MB limit.`);
        return false;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showError(`File "${file.name}" is not allowed.`);
        return false;
    }
    return true;
}

function setupPaymentHandlers() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const payNowBtn = document.getElementById('payNowBtn');
    const payLaterBtn = document.getElementById('payLaterBtn');
    const receiptUpload = document.getElementById('receiptUpload');
    
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
        });
    }
    
    if (payLaterBtn) {
        payLaterBtn.addEventListener('click', () => {
            paymentStatus = 'pending';
            if (receiptUpload) receiptUpload.classList.add('hidden');
        });
    }
    
    const receiptArea = document.getElementById('receiptArea');
    const receiptFile = document.getElementById('receiptFile');
    if (receiptArea && receiptFile) {
        receiptArea.addEventListener('click', () => receiptFile.click());
        receiptFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && validateFile(file)) {
                receiptArea.innerHTML = '<i class="fas fa-check-circle"></i><p>Receipt uploaded</p>';
                applicationData.receiptFile = file;
            }
        });
    }
}

function loadDestinationContent(destination) {
    const title = document.getElementById('destinationTitle');
    if (title) title.innerText = destination === 'italy' ? 'Italy Application' : 'Campus France Application';
}

async function uploadToSupabaseStorage(appNumber) {
    if (!supabase) return {};
    const results = {};
    for (const [docId, file] of Object.entries(selectedFiles)) {
        const fileName = `${appNumber}/${docId}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('documents').upload(fileName, file);
        if (!error) {
            const { data } = supabase.storage.from('documents').getPublicUrl(fileName);
            results[docId] = data.publicUrl;
        }
    }
    return results;
}

async function submitApplication() {
    if (!validateStep5()) return;
    
    const appNumber = (applicationData.destination === 'italy' ? 'IT' : 'CF') + '-' + Date.now().toString().slice(-6);
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';
    
    try {
        const docs = await uploadToSupabaseStorage(appNumber);
        const application = {
            ...applicationData,
            application_number: appNumber,
            documents: docs,
            signature: signatureData,
            created_at: new Date().toISOString()
        };
        
        console.log('Final Application:', application);
        alert(`Success! Your application number is ${appNumber}`);
        window.location.reload();
    } catch (error) {
        console.error(error);
        showError('Submission failed.');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit Application';
    }
}

function showError(message) {
    alert(message);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    const dest = document.body.getAttribute('data-destination') || 'italy';
    initApplicationForm(dest);
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', submitApplication);
});
