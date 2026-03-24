const express = require('express');
const router = express.Router();
const supabase = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const { application_number } = req.query;
    
    if (!application_number) {
      return res.status(400).json({ error: 'Application number is required' });
    }
    
    const { data, error } = await supabase
      .from('applications')
      .select('application_number, first_name, last_name, birth_date, email, phone, year_of_study, destination, study_level, application_status, payment_status, created_at, payment_deadline')
      .eq('application_number', application_number)
      .single();
    
    if (error) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    return res.status(200).json({
      success: true,
      application: {
        application_number: data.application_number,
        full_name: `${data.first_name} ${data.last_name}`,
        birth_date: data.birth_date,
        email: data.email,
        phone: data.phone,
        year_of_study: data.year_of_study,
        destination: data.destination,
        study_level: data.study_level,
        status: data.application_status,
        payment_status: data.payment_status,
        submitted_date: data.created_at,
        payment_deadline: data.payment_deadline
      }
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
