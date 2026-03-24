// frontend/src/components/PaymentStep.jsx
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export default function PaymentStep({ formData, destination, onSubmit }) {
  const sigPadRef = useRef(null);
  const [signature, setSignature] = useState(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const clearSignature = () => {
    sigPadRef.current.clear();
    setSignature(null);
  };

  const handleSubmit = async () => {
    // Validate all requirements
    if (!privacyAccepted || !contractAccepted) {
      setError('You must accept the Privacy Policy and Contract');
      return;
    }

    if (!signature) {
      setError('Please provide your digital signature');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get signature as data URL
      const signatureDataURL = sigPadRef.current.toDataURL();
      
      // Prepare complete application data
      const applicationData = {
        ...formData,
        destination,
        payment_method: paymentMethod,
        digital_signature: signatureDataURL,
        privacy_policy_accepted: privacyAccepted,
        contract_accepted: contractAccepted,
        payment_status: paymentMethod === 'now' ? 'pending_receipt' : 'pending_later',
        // You'll need to add documents from DocumentUpload component
        // This should come from context or state management
      };

      // Call your submit API
      const response = await fetch('/api/submitApplication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      // Show success and redirect to status page
      alert(`Application submitted successfully!\nApplication Number: ${result.applicationNumber}\n\nYou have 3 days to complete payment.`);
      
      // Navigate to status page or show confirmation
      if (onSubmit) {
        onSubmit(result.applicationNumber);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Payment & Final Confirmation</h2>
      
      {/* Payment Information */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>Service Fee: 35,000 DA</h3>
        <p>Payment Methods:</p>
        <ul>
          <li><strong>CCP:</strong> 40253214 Clé 56</li>
          <li><strong>Baridimob:</strong> 00799999004025321435</li>
        </ul>
        
        <div style={{ marginTop: '20px' }}>
          <label>
            <input 
              type="radio" 
              value="now" 
              checked={paymentMethod === 'now'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            I will pay now and upload receipt
          </label>
          <br />
          <label>
            <input 
              type="radio" 
              value="later" 
              checked={paymentMethod === 'later'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            I will pay later (contact agency)
          </label>
        </div>
      </div>

      {/* Privacy Policy and Contract */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Legal Documents</h3>
        
        <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4>Privacy Policy</h4>
          <p style={{ fontSize: '14px', color: '#666', maxHeight: '150px', overflow: 'auto' }}>
            [Your privacy policy text here - This will be provided by the agency]
          </p>
          <label>
            <input 
              type="checkbox" 
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
            />
            I have read and accept the Privacy Policy
          </label>
        </div>

        <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4>Service Contract</h4>
          <p style={{ fontSize: '14px', color: '#666', maxHeight: '150px', overflow: 'auto' }}>
            [Your contract text here - This will be provided by the agency]
          </p>
          <label>
            <input 
              type="checkbox" 
              checked={contractAccepted}
              onChange={(e) => setContractAccepted(e.target.checked)}
            />
            I have read and accept the Contract Terms
          </label>
        </div>
      </div>

      {/* Digital Signature */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Digital Signature</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          Please sign below to confirm that all information provided is accurate and complete:
        </p>
        
        <div style={{ 
          border: '2px solid #ddd', 
          borderRadius: '8px', 
          padding: '10px',
          backgroundColor: '#fff'
        }}>
          <SignatureCanvas
            ref={sigPadRef}
            canvasProps={{
              width: 500,
              height: 200,
              style: { width: '100%', height: '200px', border: '1px solid #ccc' }
            }}
            onEnd={() => setSignature(sigPadRef.current.toDataURL())}
          />
        </div>
        
        <button 
          onClick={clearSignature} 
          style={{ marginTop: '10px', fontSize: '12px' }}
          className="btn"
        >
          Clear Signature
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button 
        onClick={handleSubmit} 
        className="btn" 
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '18px',
          backgroundColor: '#2c3e50',
          color: '#fff',
          cursor: isSubmitting ? 'not-allowed' : 'pointer'
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </div>
  );
}
