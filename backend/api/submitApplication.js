const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/database');
const { validateApplication } = require('../middleware/validation');
const emailService = require('../services/emailService');
const storageService = require('../services/storageService');
const helpers = require('../utils/helpers');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

router.post('/', upload.any(), validateApplication, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      birth_date,
      email,
      phone,
      bac_date,
      year_of_study,
      courses,
      destination,
      study_level,
      digital_signature,
      privacy_policy_accepted,
      contract_accepted,
      payment_method
    } = req.body;

    // Parse courses if it's a string
    let parsedCourses = courses;
    if (typeof courses === 'string') {
      parsedCourses = courses.split(',').map(c => c.trim());
    }

    // Process uploaded files
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }

    // Map uploaded files to document types
    const documentTypes = [
      'passport', 'id_photo', 'cv', 'bac_certificate_original',
      'bac_certificate_translated', 'bac_transcript_original',
      'bac_transcript_translated'
    ];
    
    if (study_level === 'Master') {
      documentTypes.push(
        'bachelor_certificate_original',
        'bachelor_certificate_translated',
        'bachelor_transcript_original',
        'bachelor_transcript_translated'
      );
    }
    
    if (destination === 'Campus France') {
      documentTypes.push('tcf_test');
    } else if (destination === 'Italy') {
      documentTypes.push('english_proof');
    }

    // Validate document count
    if (files.length !== documentTypes.length) {
      return res.status(400).json({ 
        error: `Expected ${documentTypes.length} documents, received ${files.length}`,
        required: documentTypes
      });
    }

    // Generate application number and payment deadline
    const applicationNumber = helpers.generateApplicationNumber();
    const paymentDeadline = helpers.calculatePaymentDeadline();

    // Upload all documents
    const uploadedDocuments = await storageService.uploadMultipleDocuments(
      files,
      applicationNumber,
      documentTypes
    );

    // Validate all required documents are present
    const validation = helpers.validateRequiredDocuments(
      destination,
      study_level,
      uploadedDocuments
    );

    if (!validation.isValid) {
      // Clean up uploaded documents
      await storageService.deleteDocuments(applicationNumber);
      return res.status(400).json({
        error: 'Missing required documents',
        missing: validation.missingDocuments
      });
    }

    // Create documents URL mapping
    const documentsUrls = {};
    uploadedDocuments.forEach(doc => {
      documentsUrls[doc.documentType] = doc.url;
    });

    // Insert application into database
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        application_number: applicationNumber,
        first_name: helpers.sanitizeInput(first_name),
        last_name: helpers.sanitizeInput(last_name),
        birth_date,
        email: email.toLowerCase(),
        phone,
        bac_date,
        year_of_study,
        courses: parsedCourses,
        destination,
        study_level,
        documents_urls: documentsUrls,
        digital_signature,
        privacy_policy_accepted: privacy_policy_accepted === 'true',
        contract_accepted: contract_accepted === 'true',
        payment_method: payment_method || null,
        payment_status: payment_method === 'now' ? 'pending_receipt' : 'pending',
        payment_deadline: paymentDeadline,
        application_status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // Send confirmation email
    await emailService.sendConfirmationEmail({
      ...data[0],
      first_name: helpers.sanitizeInput(first_name),
      last_name: helpers.sanitizeInput(last_name)
    });

    return res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      applicationNumber: applicationNumber,
      paymentDeadline: paymentDeadline,
      documents: uploadedDocuments.map(doc => doc.documentType)
    });

  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
