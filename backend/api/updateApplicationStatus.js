const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { adminAuth } = require('../middleware/auth');
const { validateStatusUpdate } = require('../middleware/validation');
const emailService = require('../services/emailService');

router.post('/update-status', adminAuth, validateStatusUpdate, async (req, res) => {
  try {
    const { application_number, status, admin_notes } = req.body;
    
    // Update application status
    const { data, error } = await supabase
      .from('applications')
      .update({
        application_status: status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString(),
        ...(status === 'rejected' && { payment_status: 'cancelled' })
      })
      .eq('application_number', application_number)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const application = data[0];
    
    // Send status update email
    await emailService.sendStatusUpdateEmail(application, status, admin_notes);
    
    return res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      application: {
        number: application.application_number,
        status: application.application_status,
        updated_at: application.updated_at
      }
    });
    
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/applications', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('application_status', status);
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      data: data.map(app => ({
        id: app.id,
        application_number: app.application_number,
        full_name: `${app.first_name} ${app.last_name}`,
        email: app.email,
        phone: app.phone,
        bac_date: app.bac_date,
        year_of_study: app.year_of_study,
        destination: app.destination,
        study_level: app.study_level,
        application_status: app.application_status,
        payment_status: app.payment_status,
        created_at: app.created_at,
        payment_deadline: app.payment_deadline
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Fetch applications error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
