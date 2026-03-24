import React, { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import PaymentStep from './PaymentStep';

export default function ApplicationForm({ destination }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName:'', lastName:'', birthDate:'', role:'Student',
    bacDate:'', email:'', phone:'', yearOfStudy:'', courses:''
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  switch(step){
    case 1: // Confirmation
      return (
        <div style={{padding:'50px'}}>
          <h2>Confirm Your Information</h2>
          <input type="checkbox" required id="confirm"/>
          <label htmlFor="confirm">I confirm all information is correct and documents are certified</label>
          <br/><br/>
          <button onClick={nextStep} className="btn">Next</button>
        </div>
      );
    case 2: // Applicant Info
      return (
        <div style={{padding:'50px'}}>
          <h2>Applicant Information</h2>
          <input name="firstName" placeholder="First Name" onChange={handleChange} required/><br/>
          <input name="lastName" placeholder="Last Name" onChange={handleChange} required/><br/>
          <input type="date" name="birthDate" placeholder="Birth Date" onChange={handleChange} required/><br/>
          <input type="date" name="bacDate" placeholder="Date of BAC" onChange={handleChange} required/><br/>
          <input name="email" placeholder="Email" onChange={handleChange} required/><br/>
          <input name="phone" placeholder="Phone" onChange={handleChange} required/><br/>
          <select name="yearOfStudy" onChange={handleChange} required>
            <option value="">Select Year of Study</option>
            <option value="Bachelor">Bachelor</option>
            <option value="Master">Master</option>
          </select><br/>
          <textarea name="courses" placeholder="Courses you want to apply for" onChange={handleChange}/><br/>
          <button onClick={prevStep} className="btn">Back</button>
          <button onClick={nextStep} className="btn">Next</button>
        </div>
      );
    case 3: // Document Upload
      return <DocumentUpload formData={formData} destination={destination} nextStep={nextStep}/>;
    case 4: // Payment
      return <PaymentStep formData={formData} destination={destination}/>;
    default:
      return <h2>Application Completed</h2>;
  }
}
