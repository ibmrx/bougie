const { v4: uuidv4 } = require('uuid');

class Helpers {
  generateApplicationNumber() {
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8).toUpperCase();
    return `APP-${timestamp}-${uniqueId}`;
  }
  
  calculatePaymentDeadline() {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);
    return deadline.toISOString();
  }
  
  validateRequiredDocuments(destination, studyLevel, uploadedDocuments) {
    const requiredDocuments = {
      Italy: {
        Bachelor: [
          'passport', 'id_photo', 'cv', 'bac_certificate_original',
          'bac_certificate_translated', 'bac_transcript_original',
          'bac_transcript_translated', 'english_proof'
        ],
        Master: [
          'passport', 'id_photo', 'cv', 'bac_certificate_original',
          'bac_certificate_translated', 'bac_transcript_original',
          'bac_transcript_translated', 'bachelor_certificate_original',
          'bachelor_certificate_translated', 'bachelor_transcript_original',
          'bachelor_transcript_translated', 'english_proof'
        ]
      },
      'Campus France': {
        Bachelor: [
          'passport', 'id_photo', 'cv', 'bac_certificate',
          'bac_transcript', 'tcf_test'
        ],
        Master: [
          'passport', 'id_photo', 'cv', 'bac_certificate',
          'bac_transcript', 'bachelor_certificate', 
          'bachelor_transcript', 'tcf_test'
        ]
      }
    };
    
    const required = requiredDocuments[destination][studyLevel];
    const uploadedTypes = uploadedDocuments.map(doc => doc.documentType);
    
    const missing = required.filter(doc => !uploadedTypes.includes(doc));
    
    return {
      isValid: missing.length === 0,
      missingDocuments: missing
    };
  }
  
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }
}

module.exports = new Helpers();
