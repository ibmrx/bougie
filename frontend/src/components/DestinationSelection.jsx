import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DestinationSelection() {
  const navigate = useNavigate();

  return (
    <div style={{padding:'50px'}}>
      <h2>Select Your Destination</h2>
      <div style={{display:'flex', gap:'20px'}}>
        <button onClick={() => navigate('/apply/italy')} className="btn">Italy</button>
        <button onClick={() => navigate('/apply/campus-france')} className="btn">Campus France</button>
      </div>
    </div>
  );
}
