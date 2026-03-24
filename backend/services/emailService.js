const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  async sendConfirmationEmail(application) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Application Confirmation - Bougie Immigration</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .application-number { background: #e67e22; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 8px; }
          .deadline { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; border-top: 1px solid #ddd; margin-top: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #2c3e50; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bougie Immigration</h1>
            <p>Professional Immigration Services</p>
          </div>
          <div class="content">
            <h2>Application Confirmation</h2>
            <p>Dear ${application.first_name} ${application.last_name},</p>
            <p>Thank you for submitting your application to Bougie Immigration. Your application has been received and is being processed.</p>
            
            <div class="application-number">
              Application Number: ${application.application_number}
            </div>
            
            <div class="deadline">
              <strong>⚠️ Important:</strong> You have 3 days to complete your payment. After this period, your application will be automatically cancelled.
            </div>
            
            <div class="info-box">
              <h3>Application Details:</h3>
              <p><strong>Destination:</strong> ${application.destination}</p>
              <p><strong>Study Level:</strong> ${application.study_level}</p>
              <p><strong>Submission Date:</strong> ${new Date(application.created_at).toLocaleDateString()}</p>
              <p><strong>Payment Deadline:</strong> ${new Date(application.payment_deadline).toLocaleDateString()}</p>
            </div>
            
            <p><strong>Payment Methods:</strong></p>
            <ul>
              <li>CCP: 40253214 Clé 56</li>
              <li>Baridimob: 00799999004025321435</li>
            </ul>
            
            <p>You can check your application status at any time using your application number on our website.</p>
            
            <a href="${process.env.CORS_ORIGIN}/status" class="button">Check Application Status</a>
          </div>
          <div class="footer">
            <p>Bougie Immigration - Professional Immigration Services</p>
            <p>This is an automated message, please do not reply.</p>
            <p>Contact: support@bougieimmigration.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: 'Bougie Immigration <noreply@bougieimmigration.com>',
        to: [application.email],
        subject: `Application Confirmation - ${application.application_number}`,
        html: htmlContent
      });
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendStatusUpdateEmail(application, status, adminNotes = '') {
    const statusText = status === 'accepted' ? 'Accepted' : 'Rejected';
    const statusColor = status === 'accepted' ? '#28a745' : '#dc3545';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Application ${statusText} - Bougie Immigration</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 30px; text-align: center; }
          .status { background: ${statusColor}; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; border-radius: 8px; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bougie Immigration</h1>
          </div>
          <div class="content">
            <h2>Application Status Update</h2>
            <p>Dear ${application.first_name} ${application.last_name},</p>
            <div class="status">
              Your application has been ${statusText}
            </div>
            <p><strong>Application Number:</strong> ${application.application_number}</p>
            ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
            ${status === 'accepted' ? `
              <p>Congratulations! Your application has been accepted. You will receive further instructions via email within 2-3 business days.</p>
            ` : `
              <p>We regret to inform you that your application was not accepted at this time. Please contact us if you have any questions.</p>
            `}
            <p>Thank you for choosing Bougie Immigration.</p>
          </div>
          <div class="footer">
            <p>Bougie Immigration - Professional Immigration Services</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: 'Bougie Immigration <noreply@bougieimmigration.com>',
        to: [application.email],
        subject: `Application ${statusText} - ${application.application_number}`,
        html: htmlContent
      });
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
