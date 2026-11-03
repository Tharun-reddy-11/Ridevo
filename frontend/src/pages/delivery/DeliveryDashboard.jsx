import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import api from '../../api/client';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { ShieldCheckIcon, ClockIcon, KeyIcon, CheckCircleIcon, MapPinIcon } from '../../components/icons/Icons';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected task state for handover modal
  const [activeTask, setActiveTask] = useState(null);
  const [licenceNumber, setLicenceNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuel, setFuel] = useState('90');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/delivery/tasks/my');
      setTasks(res.data);
    } catch (err) {
      setError('Unable to load assigned delivery jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadTasks();
  }, [user]);

  const handleStatusChange = async (taskId, newStatus) => {
    setError('');
    try {
      await api.patch(`/delivery/tasks/${taskId}/status`, { status: newStatus });
      loadTasks();
    } catch (err) {
      setError('Could not update task status.');
    }
  };

  const handleVerifyLicence = async (taskId) => {
    if (!licenceNumber.trim()) {
      setError('Enter the customer physical licence number.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/delivery/tasks/${taskId}/verify-licence`, { licenceNumber });
      setSuccess('Physical driving licence verified successfully.');
      loadTasks();
      if (activeTask) setActiveTask({ ...activeTask, licence_verified: true, licence_number: licenceNumber });
    } catch (err) {
      setError(err.response?.data?.message || 'Licence verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteHandover = async (taskId) => {
    if (!otp.trim()) {
      setError('Customer handover OTP is required.');
      return;
    }
    if (!odometer) {
      setError('Enter current odometer reading.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/delivery/tasks/${taskId}/handover`, {
        otp: otp.trim(),
        odometerReading: Number(odometer),
        fuelPercent: Number(fuel),
        inspectionNotes: notes
      });
      setSuccess('Handover completed! Vehicle released to customer.');
      setActiveTask(null);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Handover failed. Verify OTP with customer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnInspection = async (taskId) => {
    if (!odometer) {
      setError('Enter return odometer reading.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/delivery/tasks/${taskId}/return-inspection`, {
        odometerReading: Number(odometer),
        fuelPercent: Number(fuel),
        inspectionNotes: notes,
        customerDelay: false
      });
      setSuccess('Return inspection completed! Final invoice settled.');
      setActiveTask(null);
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Return inspection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Header />

      <main className="dashboard-main site-container">
        <div className="delivery-desk-header">
          <div>
            <span className="eyebrow light">OPERATIONS & FIELD DISPATCH</span>
            <h1>Delivery & Handover Desk</h1>
            <p>Verify driving licences on-site, collect customer OTP, and complete vehicle handovers</p>
          </div>
        </div>

        {error && <p className="form-error-banner">{error}</p>}
        {success && <p className="form-success-banner">{success}</p>}

        <section className="dashboard-section">
          <div className="section-title-row">
            <h3>Assigned Jobs ({tasks.length})</h3>
          </div>

          {tasks.length > 0 ? (
            <div className="tasks-grid">
              {tasks.map((t) => (
                <div key={t.id} className={`task-card ${t.status.toLowerCase()}`}>
                  <div className="task-card-head">
                    <span className="task-type-badge">{t.task_type}</span>
                    <span className={`status-badge-pill ${t.status.toLowerCase()}`}>{t.status}</span>
                  </div>

                  <h4>{t.make} {t.model} ({t.registration_number})</h4>

                  <div className="task-customer-details">
                    <div><strong>Customer:</strong> {t.customer_name}</div>
                    <div><strong>Phone:</strong> {t.customer_phone}</div>
                    <div><MapPinIcon className="w-3.5 h-3.5 inline text-muted" /> <strong>Address:</strong> {t.delivery_address}</div>
                    <div><ClockIcon className="w-3.5 h-3.5 inline text-muted" /> <strong>Scheduled:</strong> {new Date(t.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>

                  <div className="task-actions-row">
                    {t.status === 'ASSIGNED' && (
                      <button
                        className="btn-status-transit"
                        onClick={() => handleStatusChange(t.id, 'IN_TRANSIT')}
                      >
                        Start Transit
                      </button>
                    )}
                    {t.status === 'IN_TRANSIT' && (
                      <button
                        className="btn-status-arrived"
                        onClick={() => handleStatusChange(t.id, 'ARRIVED')}
                      >
                        Mark Arrived
                      </button>
                    )}
                    {['ARRIVED', 'IN_TRANSIT', 'ASSIGNED'].includes(t.status) && (
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setActiveTask(t);
                          setLicenceNumber(t.licence_number || '');
                          setOdometer('');
                          setNotes('');
                        }}
                      >
                        {t.task_type === 'DELIVERY' ? 'Conduct Handover Checklist' : 'Conduct Return Inspection'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-records-text">No assigned delivery or collection jobs currently pending.</p>
          )}
        </section>

        {/* Handover & Inspection Drawer/Modal */}
        {activeTask && (
          <div className="modal-backdrop" onClick={() => setActiveTask(null)}>
            <div className="handover-checklist-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <span className="modal-eyebrow">FIELD VERIFICATION CHECKLIST</span>
                  <h2>{activeTask.task_type === 'DELIVERY' ? 'Vehicle Handover' : 'Return Collection'}</h2>
                  <p>{activeTask.make} {activeTask.model} ({activeTask.registration_number})</p>
                </div>
                <button className="btn-modal-close" onClick={() => setActiveTask(null)}>×</button>
              </div>

              {activeTask.task_type === 'DELIVERY' ? (
                <div className="checklist-steps">
                  {/* Step 1: Licence Verification */}
                  <div className={`checklist-step-box ${activeTask.licence_verified ? 'done' : ''}`}>
                    <div className="step-num-badge">1</div>
                    <div className="step-content-wrap">
                      <strong>Physical Driving Licence Verification</strong>
                      <p>Inspect the customer's physical driving licence to confirm validity and vehicle class.</p>
                      {!activeTask.licence_verified ? (
                        <div className="licence-input-row">
                          <input
                            value={licenceNumber}
                            onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())}
                            placeholder="Enter DL Number (e.g. AP0320210001234)"
                          />
                          <button
                            type="button"
                            className="btn-verify-dl"
                            onClick={() => handleVerifyLicence(activeTask.id)}
                            disabled={actionLoading}
                          >
                            Mark Verified
                          </button>
                        </div>
                      ) : (
                        <div className="verified-tag">✓ Verified: {activeTask.licence_number}</div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: OTP & Meter Log */}
                  <div className="checklist-step-box">
                    <div className="step-num-badge">2</div>
                    <div className="step-content-wrap">
                      <strong>Customer 6-Digit Handover OTP & Vehicle Log</strong>
                      <div className="field-grid-handover">
                        <div className="input-group">
                          <label>Customer Handover OTP</label>
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="6-digit OTP"
                          />
                        </div>

                        <div className="input-group">
                          <label>Current Odometer (km)</label>
                          <input
                            type="number"
                            value={odometer}
                            onChange={(e) => setOdometer(e.target.value)}
                            placeholder="e.g. 14200"
                          />
                        </div>

                        <div className="input-group">
                          <label>Fuel Level (%)</label>
                          <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
                            <option value="100">100% (Full)</option>
                            <option value="90">90%</option>
                            <option value="75">75% (3/4 Tank)</option>
                            <option value="50">50% (Half Tank)</option>
                            <option value="25">25% (1/4 Tank)</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group mt-3">
                        <label>Inspection Notes (Scratches / Walkaround notes)</label>
                        <input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Vehicle clean, no visible scratches."
                        />
                      </div>

                      <button
                        className="btn-confirm-handover mt-4"
                        onClick={() => handleCompleteHandover(activeTask.id)}
                        disabled={actionLoading || !activeTask.licence_verified}
                      >
                        {actionLoading ? 'Verifying...' : 'Complete Handover & Release Vehicle →'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Return Inspection */
                <div className="checklist-steps">
                  <div className="checklist-step-box">
                    <div className="step-num-badge">1</div>
                    <div className="step-content-wrap">
                      <strong>Return Vehicle Inspection & Odometer Log</strong>
                      <div className="field-grid-handover">
                        <div className="input-group">
                          <label>Return Odometer (km)</label>
                          <input
                            type="number"
                            value={odometer}
                            onChange={(e) => setOdometer(e.target.value)}
                            placeholder="e.g. 14350"
                          />
                        </div>

                        <div className="input-group">
                          <label>Return Fuel Level (%)</label>
                          <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
                            <option value="100">100% (Full)</option>
                            <option value="90">90%</option>
                            <option value="75">75% (3/4 Tank)</option>
                            <option value="50">50% (Half Tank)</option>
                            <option value="25">25% (1/4 Tank)</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group mt-3">
                        <label>Return Condition Notes</label>
                        <input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Vehicle returned in good condition."
                        />
                      </div>

                      <button
                        className="btn-confirm-handover mt-4"
                        onClick={() => handleReturnInspection(activeTask.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Finalizing...' : 'Finalize Return Inspection →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
