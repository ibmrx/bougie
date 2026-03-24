const { body, validationResult } = require('express-validator');

const validateApplication = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('birth_date').isISO8601().withMessage('Invalid birth date'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('bac_date').isISO8601().withMessage('Invalid BAC date'),
  body('year_of_study').isIn(['Bachelor', 'Master']).withMessage('Invalid year of study'),
  body('destination').isIn(['Italy', 'Campus France']).withMessage('Invalid destination'),
  body('study_level').isIn(['Bachelor', 'Master']).withMessage('Invalid study level'),
  body('privacy_policy_accepted').isBoolean().equals('true').withMessage('Must accept privacy policy'),
  body('contract_accepted').isBoolean().equals('true').withMessage('Must accept contract'),
  body('digital_signature').notEmpty().withMessage('Digital signature required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateStatusUpdate = [
  body('application_number').notEmpty().withMessage('Application number required'),
  body('status').isIn(['accepted', 'rejected']).withMessage('Invalid status'),
  body('admin_notes').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateApplication, validateStatusUpdate };
