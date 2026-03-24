import React from 'react';

export default function PaymentStep({ formData, destination }) {

  const handleSubmit = () => {
    alert('Application submitted successfully! Your application number will be sent via email.');
    // Here we would call backend API to save application and send email
  };

  return (
    <div style={{padding:'50px'}}>
      <h2>Payment Information</h2>
      <p>Total service cost: <b>35 000 DA</b></p>
      <p>You can pay via:</p>
      <ul>
        <li>CCP: 40253214 Clé 56</li>
        <li>Baridimob: 00799999004025321435</li>
      </ul>
      <p>Upload your payment receipt in the previous step if paid.</p>
      <p>
        By submitting, you agree to the <b>Privacy Policy & Contract</b>.
      </p>
      <button onClick={handleSubmit} className="btn">Submit Application</button>
    </div>
  );
}
