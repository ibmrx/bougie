import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminPanel() {
  const [applications, setApplications] = useState([]);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if(authenticated) fetchApplications();
  }, [authenticated]);

  const login = () => {
    if(password === 'password123') setAuthenticated(true);
    else alert('Wrong password');
  };

  const fetchApplications = async () => {
    let { data, error } = await supabase.from('applications').select('*');
    if(error) console.log(error);
    else setApplications(data);
  };

  const updateStatus = async (id, status) => {
    await supabase.from('applications').update({application_status: status}).eq('id', id);
    alert(`Application ${status}`);
    fetchApplications();
    // Call Resend API to send status email
  };

  if(!authenticated) return (
    <div style={{padding:'50px'}}>
      <h2>Admin Login</h2>
      <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}/>
      <button onClick={login} className="btn">Login</button>
    </div>
  );

  return (
    <div style={{padding:'50px'}}>
      <h2>Admin Panel</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Year</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app.id}>
              <td>{app.first_name} {app.last_name}</td>
              <td>{app.email}</td>
              <td>{app.phone}</td>
              <td>{app.year_of_study}</td>
              <td>{app.application_status}</td>
              <td>
                <button onClick={()=>updateStatus(app.id, 'Accepted')}>Accept</button>
                <button onClick={()=>updateStatus(app.id, 'Rejected')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
