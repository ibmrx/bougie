// AdminPanel.jsx - Using Supabase Auth
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert('Logged in!');
  };

  return (
    <div style={{ padding: '50px' }}>
      <h2>Admin Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />
      <button onClick={handleLogin} className="btn">Login</button>
    </div>
  );
}

export default function AdminPanel() {
  const [session, setSession] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && session.user.user_metadata?.role === 'admin') {
      fetchApplications();
    }
  }, [session]);

  const fetchApplications = async () => {
    const { data, error } = await supabase.from('applications').select('*');
    if (error) console.log(error);
    else setApplications(data);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('applications')
      .update({ application_status: status })
      .eq('id', id);

    if (error) alert(error.message);
    else {
      alert(`Application ${status}`);
      fetchApplications();
      // TODO: Call Resend API to send status email
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!session) return <AdminLogin />;

  if (session.user.user_metadata?.role !== 'admin') {
    return <div style={{ padding: '50px' }}>Access Denied</div>;
  }

  return (
    <div style={{ padding: '50px' }}>
      <h2>Admin Panel</h2>
      <button onClick={handleLogout} style={{ marginBottom: '20px' }}>Logout</button>
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
                <button onClick={() => updateStatus(app.id, 'Accepted')}>Accept</button>
                <button onClick={() => updateStatus(app.id, 'Rejected')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
