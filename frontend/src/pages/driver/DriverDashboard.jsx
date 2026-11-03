import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import api from '../../api/client';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { CarIcon, MapPinIcon, ClockIcon } from '../../components/icons/Icons';

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/driver/trips/my');
      setTrips(res.data);
    } catch (err) {
      setError('Unable to load assigned driver trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadTrips();
  }, [user]);

  const handleTripStatus = async (tripId, status) => {
    try {
      await api.patch(`/driver/trips/${tripId}`, { status });
      setSuccess(`Trip marked as ${status}.`);
      loadTrips();
    } catch (err) {
      setError('Failed to update trip status.');
    }
  };

  return (
    <div className="dashboard-layout">
      <Header />

      <main className="dashboard-main site-container">
        <div className="driver-desk-header">
          <div>
            <span className="eyebrow light">PROFESSIONAL CHAUFFEUR DESK</span>
            <h1>Chauffeur Trip Assignments</h1>
            <p>View your scheduled customer trips, pickup locations, and trip logs</p>
          </div>
        </div>

        {error && <p className="form-error-banner">{error}</p>}
        {success && <p className="form-success-banner">{success}</p>}

        <section className="dashboard-section">
          <div className="section-title-row">
            <h3>Assigned Trips ({trips.length})</h3>
          </div>

          {trips.length > 0 ? (
            <div className="tasks-grid">
              {trips.map((t) => (
                <div key={t.id} className="task-card">
                  <div className="task-card-head">
                    <span className="task-type-badge">CHAUFFEUR TRIP</span>
                    <span className={`status-badge-pill ${t.status.toLowerCase()}`}>{t.status}</span>
                  </div>

                  <h4>{t.make} {t.model} ({t.registration_number})</h4>

                  <div className="task-customer-details">
                    <div><strong>Customer:</strong> {t.customer_name}</div>
                    <div><strong>Phone:</strong> {t.customer_phone}</div>
                    <div><MapPinIcon className="w-3.5 h-3.5 inline text-muted" /> <strong>Pickup:</strong> {t.pickup_address}</div>
                    <div><MapPinIcon className="w-3.5 h-3.5 inline text-muted" /> <strong>Destination:</strong> {t.destination_address}</div>
                    <div><ClockIcon className="w-3.5 h-3.5 inline text-muted" /> <strong>Scheduled:</strong> {new Date(t.start_at).toLocaleString()}</div>
                  </div>

                  <div className="task-actions-row">
                    {t.status === 'ASSIGNED' && (
                      <button
                        className="btn-status-transit"
                        onClick={() => handleTripStatus(t.id, 'STARTED')}
                      >
                        Start Trip
                      </button>
                    )}
                    {t.status === 'STARTED' && (
                      <button
                        className="btn-confirm-handover"
                        onClick={() => handleTripStatus(t.id, 'COMPLETED')}
                      >
                        Complete Trip
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-records-text">No chauffeur trips assigned to you at this moment.</p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
