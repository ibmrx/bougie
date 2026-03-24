import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ApplicationStatus() {
  const [appNumber, setAppNumber] = useState('');
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    if (!appNumber) {
      setError('Please enter your application number.');
      return;
    }

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('application_number', appNumber)
      .single();

    if (error) {
      setError('Application not found.');
      setApplication(null);
    } else {
      setApplication(data);
      setError('');
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Check Your Application Status</h2>
      <input
        type="text"
        placeholder="Enter your application number"
        value={appNumber}
        onChange={(e) => setAppNumber(e.target.value)}
        style={{ padding: '10px', width: '250px', marginRight: '10px' }}
      />
      <button onClick={checkStatus} className="btn">Check Status</button>

      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

      {application && (
        <div style={{ marginTop: '30px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', display: 'inline-block', textAlign: 'left' }}>
          <p><b>Full Name:</b> {application.first_name} {application.last_name}</p>
          <p><b>Birth Date:</b> {application.birth_date}</p>
          <p><b>Email:</b> {application.email}</p>
          <p><b>Phone:</b> {application.phone}</p>
          <p><b>Year of Study:</b> {application.year_of_study}</p>
          <p><b>Destination:</b> {application.destination}</p>
          <p><b>Application Status:</b> {application.application_status}</p>
        </div>
      )}
    </div>
  );
}
