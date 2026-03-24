const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const supabase = require('../config/database');
const { adminAuth } = require('../middleware/auth');

router.get('/application/:application_number', adminAuth, async (req, res) => {
  try {
    const { application_number } = req.params;
    
    // Get application details
    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('application_number', application_number)
      .single();
    
    if (error || !application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=application_${application_number}.zip`);
    
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(res);
    
    // Create application info JSON
    const applicationInfo = {
      application_number: application.application_number,
      applicant: {
        first_name: application.first_name,
        last_name: application.last_name,
        birth_date: application.birth_date,
        email: application.email,
        phone: application.phone,
        bac_date: application.bac_date,
        year_of_study: application.year_of_study,
        courses: application.courses,
        destination: application.destination,
        study_level: application.study_level
      },
      submission_date: application.created_at,
      payment_status: application.payment_status,
      application_status: application.application_status,
      documents_urls: application.documents_urls
    };
    
    archive.append(JSON.stringify(applicationInfo, null, 2), { name: 'application_info.json' });
    
    // Download each document from Supabase
    for (const [docType, docUrl] of Object.entries(application.documents_urls)) {
      try {
        const response = await fetch(docUrl);
        const buffer = await response.buffer();
        archive.append(buffer, { name: `${docType}.pdf` });
      } catch (err) {
        console.error(`Failed to download ${docType}:`, err);
        archive.append(`Failed to download: ${err.message}`, { name: `${docType}_error.txt` });
      }
    }
    
    await archive.finalize();
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to create zip file' });
  }
});

module.exports = router;
