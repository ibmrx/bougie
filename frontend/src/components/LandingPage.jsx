import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page" style={{backgroundColor:'#f4eddb', color:'#333'}}>
      <header>
        <img src="https://uploads.onecompiler.io/437muad7y/44hafv45b/blogo.jpg" alt="Bougie Immigration Logo" width={200}/>
        <h1>Bougie Immigration</h1>
        <p>Professional Immigration Services to Italy & Campus France</p>
      </header>
      <button onClick={() => navigate('/destinations')} className="btn">Start Your Application</button>
    </div>
  );
}
