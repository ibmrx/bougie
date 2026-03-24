import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Initialize Supabase service client (use service key)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper to send email via Resend
async function sendConfirmationEmail(to, applicationNumber) {
  const htmlContent = `
    <h2>Your Application is Submitted</h2>
    <p>Dear applicant,</p>
    <p>Your application has been successfully submitted to Bougie Immigration.</p>
    <p><b>Application Number:</b> ${applicationNumber}</p>
    <p>Keep this number to check your application status.</p>
    <p>Thank you!</p>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Bougie Immigration <benlassousmohamedreda@gmail.com>',
      to: [to],
      subject: 'Bougie Immigration Application Confirmation',
      html: htmlContent
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { first_name, last_name, birth_date, role, bac_date, email, phone, year_of_study, courses, destination, documents } = req.body;

    if (!first_name || !last_name || !email || !documents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique application number
    const applicationNumber = `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Upload documents to Supabase Storage
    const uploadedUrls = {};
    for (const [filename, fileBase64] of Object.entries(documents)) {
      const fileBuffer = Buffer.from(fileBase64, 'base64');
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(`${first_name}_${last_name}/${filename}`, fileBuffer, {
          upsert: true
        });
      if (error) throw error;
      uploadedUrls[filename] = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${data.path}`;
    }

    // Insert application into Supabase table
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        first_name,
        last_name,
        birth_date,
        role,
        bac_date,
        email,
        phone,
        year_of_study,
        courses,
        destination,
        documents_urls: uploadedUrls,
        payment_status: 'Pending',
        application_status: 'Pending',
        application_number: applicationNumber
      }]);

    if (error) throw error;

    // Send confirmation email
    await sendConfirmationEmail(email, applicationNumber);

    return res.status(200).json({ message: 'Application submitted', applicationNumber });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
