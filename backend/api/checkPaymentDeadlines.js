const supabase = require('../config/database');
const emailService = require('../services/emailService');

async function checkPaymentDeadlines() {
  try {
    const now = new Date().toISOString();
    
    // Find applications with expired payment deadlines
    const { data: expiredApplications, error } = await supabase
      .from('applications')
      .select('*')
      .eq('payment_status', 'pending')
      .lt('payment_deadline', now)
      .eq('application_status', 'pending');
    
    if (error) throw error;
    
    for (const application of expiredApplications) {
      // Update application status to refused
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          application_status: 'refused',
          payment_status: 'expired',
          updated_at: now
        })
        .eq('id', application.id);
      
      if (updateError) {
        console.error(`Failed to update application ${application.application_number}:`, updateError);
        continue;
      }
      
      // Send notification email
      await emailService.sendStatusUpdateEmail(
        application,
        'rejected',
        'Payment deadline expired. Your application has been automatically cancelled.'
      );
      
      console.log(`Application ${application.application_number} expired and cancelled`);
    }
    
    console.log(`Checked payment deadlines: ${expiredApplications.length} applications expired`);
    
  } catch (error) {
    console.error('Payment deadline check error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  checkPaymentDeadlines()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { checkPaymentDeadlines };
