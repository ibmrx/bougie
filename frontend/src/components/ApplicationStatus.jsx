// frontend/src/components/ApplicationStatus.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function ApplicationStatus() {
  const [applicationNumber, setApplicationNumber] = useState('');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Check URL for application number parameter on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appNumber = urlParams.get('app');
    if (appNumber) {
      setApplicationNumber(appNumber);
      checkStatus(appNumber);
    }
  }, []);

  const checkStatus = async (number = applicationNumber) => {
    const appNumberToCheck = number || applicationNumber;
    
    if (!appNumberToCheck || appNumberToCheck.trim() === '') {
      setError('Please enter your application number');
      return;
    }

    setLoading(true);
    setError('');
    setSearchPerformed(true);

    try {
      const { data, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('application_number', appNumberToCheck.trim())
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Application not found. Please check your application number and try again.');
        } else {
          setError('Unable to fetch application status. Please try again later.');
        }
        setApplication(null);
      } else {
        setApplication(data);
        setError('');
      }
    } catch (err) {
      setError('An error occurred while checking your application status.');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkStatus();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'accepted':
      case 'approved':
        return '#2e7d32';
      case 'rejected':
      case 'refused':
        return '#c62828';
      case 'pending':
        return '#ed6c02';
      case 'in_review':
        return '#0288d1';
      default:
        return '#757575';
    }
  };

  const getStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case 'accepted':
      case 'approved':
        return 'Approved';
      case 'rejected':
      case 'refused':
        return 'Rejected';
      case 'pending':
        return 'Pending Review';
      case 'in_review':
        return 'In Review';
      default:
        return status || 'Unknown';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return '#2e7d32';
      case 'pending':
      case 'pending_receipt':
        return '#ed6c02';
      case 'failed':
      case 'expired':
        return '#c62828';
      default:
        return '#757575';
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'Payment Completed';
      case 'pending':
        return 'Awaiting Payment';
      case 'pending_receipt':
        return 'Payment Receipt Pending';
      case 'failed':
        return 'Payment Failed';
      case 'expired':
        return 'Payment Deadline Expired';
      default:
        return status || 'Not Specified';
    }
  };

  const isPaymentDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Application Status</h1>
        <p style={styles.subtitle}>
          Enter your application number to check the current status of your immigration application
        </p>

        {/* Search Section */}
        <div style={styles.searchSection}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              placeholder="Enter your application number (e.g., APP-1234567890-ABC)"
              value={applicationNumber}
              onChange={(e) => setApplicationNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
              disabled={loading}
            />
            <button 
              onClick={() => checkStatus()} 
              style={styles.button}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorMessage}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>Checking your application status...</p>
          </div>
        )}

        {/* Application Details */}
        {application && !loading && (
          <div style={styles.resultsSection}>
            <div style={styles.statusHeader}>
              <h2 style={styles.applicationNumber}>
                Application: {application.application_number}
              </h2>
              <div style={{
                ...styles.statusBadge,
                backgroundColor: getStatusColor(application.application_status),
                color: '#fff'
              }}>
                {getStatusLabel(application.application_status)}
              </div>
            </div>

            <div style={styles.divider}></div>

            {/* Personal Information */}
            <div style={styles.infoSection}>
              <h3 style={styles.sectionTitle}>Personal Information</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Full Name</span>
                  <span style={styles.infoValue}>
                    {application.first_name} {application.last_name}
                  </span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Date of Birth</span>
                  <span style={styles.infoValue}>{formatDate(application.birth_date)}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Email Address</span>
                  <span style={styles.infoValue}>{application.email}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Phone Number</span>
                  <span style={styles.infoValue}>{application.phone}</span>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div style={styles.infoSection}>
              <h3 style={styles.sectionTitle}>Academic Information</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Destination</span>
                  <span style={styles.infoValue}>{application.destination}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Study Level</span>
                  <span style={styles.infoValue}>{application.year_of_study}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>BAC Completion Date</span>
                  <span style={styles.infoValue}>{formatDate(application.bac_date)}</span>
                </div>
                {application.courses && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Selected Courses</span>
                    <span style={styles.infoValue}>
                      {Array.isArray(application.courses) 
                        ? application.courses.join(', ') 
                        : application.courses}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div style={styles.infoSection}>
              <h3 style={styles.sectionTitle}>Payment Status</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Payment Status</span>
                  <span style={{
                    ...styles.statusBadgeSmall,
                    backgroundColor: getPaymentStatusColor(application.payment_status),
                    color: '#fff'
                  }}>
                    {getPaymentStatusLabel(application.payment_status)}
                  </span>
                </div>
                {application.payment_deadline && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Payment Deadline</span>
                    <span style={{
                      ...styles.infoValue,
                      color: isPaymentDeadlinePassed(application.payment_deadline) ? '#c62828' : '#2e7d32'
                    }}>
                      {formatDate(application.payment_deadline)}
                      {isPaymentDeadlinePassed(application.payment_deadline) && ' (Expired)'}
                    </span>
                  </div>
                )}
                {application.payment_method && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Payment Method</span>
                    <span style={styles.infoValue}>
                      {application.payment_method === 'now' ? 'Paid with receipt' : 'Will pay later'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Application Timeline */}
            {application.created_at && (
              <div style={styles.infoSection}>
                <h3 style={styles.sectionTitle}>Application Timeline</h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Submitted On</span>
                    <span style={styles.infoValue}>{formatDate(application.created_at)}</span>
                  </div>
                  {application.updated_at && application.updated_at !== application.created_at && (
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Last Updated</span>
                      <span style={styles.infoValue}>{formatDate(application.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Important Notes */}
            <div style={styles.notesSection}>
              <h4 style={styles.notesTitle}>Important Information</h4>
              <ul style={styles.notesList}>
                {application.payment_status === 'pending' && (
                  <li>You have 3 days from application submission to complete payment.</li>
                )}
                {application.application_status === 'pending' && (
                  <li>Your application is being reviewed. You will receive an email notification once a decision is made.</li>
                )}
                {application.application_status === 'accepted' && (
                  <li>Congratulations! Your application has been accepted. Further instructions will be sent to your email.</li>
                )}
                {application.application_status === 'rejected' && (
                  <li>We regret to inform you that your application was not accepted. Please check your email for details.</li>
                )}
                <li>For any questions, please contact us at support@bougieimmigration.com</li>
              </ul>
            </div>
          </div>
        )}

        {/* No Results State */}
        {searchPerformed && !application && !loading && !error && (
          <div style={styles.noResults}>
            <p>No application found with the provided number.</p>
            <p style={styles.helpText}>
              Please check your application number and try again. If you believe this is an error, contact our support team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f4eddb',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    padding: '40px',
    '@media (maxWidth: 600px)': {
      padding: '20px'
    }
  },
  title: {
    fontSize: '32px',
    color: '#2c3e50',
    marginBottom: '12px',
    fontWeight: '600',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '32px',
    lineHeight: '1.5'
  },
  searchSection: {
    marginBottom: '32px'
  },
  inputGroup: {
    display: 'flex',
    gap: '12px',
    '@media (maxWidth: 600px)': {
      flexDirection: 'column'
    }
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit'
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#2c3e50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit'
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    border: '1px solid #ffcdd2',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '24px',
    color: '#c62828',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  errorIcon: {
    fontSize: '18px'
  },
  loadingState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  spinner: {
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #2c3e50',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  },
  resultsSection: {
    marginTop: '24px'
  },
  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  applicationNumber: {
    fontSize: '20px',
    color: '#2c3e50',
    fontWeight: '600',
    margin: 0
  },
  statusBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statusBadgeSmall: {
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block'
  },
  divider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '20px 0'
  },
  infoSection: {
    marginBottom: '28px'
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#2c3e50',
    marginBottom: '16px',
    fontWeight: '600',
    borderBottom: '2px solid #f4eddb',
    paddingBottom: '8px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500'
  },
  notesSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '24px',
    borderLeft: '4px solid #2c3e50'
  },
  notesTitle: {
    fontSize: '16px',
    color: '#2c3e50',
    marginBottom: '12px',
    fontWeight: '600'
  },
  notesList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  helpText: {
    fontSize: '14px',
    color: '#888',
    marginTop: '8px'
  }
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
