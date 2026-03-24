import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function DocumentUpload({ formData, destination, nextStep }) {
  const [dossierFile, setDossierFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState('');

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const handleUpload = async () => {
    if (!dossierFile || !receiptFile) {
      setError('Please upload both files.');
      return;
    }

    try {
      const dossierName = `documents/${formData.firstName}_${formData.lastName}_dossier.zip`;
      const receiptName = `documents/${formData.firstName}_${formData.lastName}_payment receipt.pdf`;

      // Upload dossier
      let { error: dossierError } = await supabase.storage
        .from('documents')
        .upload(dossierName, dossierFile, { upsert: true });
      if (dossierError) throw dossierError;

      // Upload receipt
      let { error: receiptError } = await supabase.storage
        .from('documents')
        .upload(receiptName, receiptFile, { upsert: true });
      if (receiptError) throw receiptError;

      nextStep(); // Proceed to payment step
    } catch (err) {
      setError('Upload failed: ' + err.message);
    }
  };

  const validateFile = (file, type) => {
    if (!['application/pdf', 'image/jpeg', 'image/jpg', 'application/zip'].includes(file.type)) {
      setError(`${type} must be PDF, JPG, or ZIP`);
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError(`${type} exceeds 5MB`);
      return false;
    }
    setError('');
    return true;
  };

  return (
    <div style={{padding:'50px'}}>
      <h2>Upload Your Documents</h2>
      <div>
        <label>Dossier (zip)</label>
        <input type="file" onChange={(e) => {
          if (validateFile(e.target.files[0], 'Dossier')) setDossierFile(e.target.files[0]);
        }} required/>
      </div>
      <div>
        <label>Payment Receipt (pdf)</label>
        <input type="file" onChange={(e) => {
          if (validateFile(e.target.files[0], 'Payment Receipt')) setReceiptFile(e.target.files[0]);
        }} required/>
      </div>
      {error && <p style={{color:'red'}}>{error}</p>}
      <button onClick={handleUpload} className="btn">Upload & Next</button>
    </div>
  );
}
