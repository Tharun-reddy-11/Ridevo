import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo, Icon } from '../../components/icons/Icons';
import api from '../../api/client';
import { useAuth } from '../../auth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'shops' | 'vehicles' | 'bookings' | 'users'
  const [applications, setApplications] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [fetchError, setFetchError] = useState('');

  const loadAdminData = useCallback(async () => {
    const token = localStorage.getItem('ridenexa_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      setFetchError('');

      const [appRes, vRes, bRes, uRes] = await Promise.all([
        api.get('/admin/owner-applications'),
        api.get('/admin/vehicles'),
        api.get('/admin/bookings'),
        api.get('/admin/users')
      ]);

      setApplications(appRes.data || []);
      setVehicles(vRes.data || []);
      setBookings(bRes.data || []);
      setUsersList(uRes.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setFetchError('Session expired or unauthorized. Please re-login to Admin.');
      } else {
        setFetchError(err.response?.data?.message || err.message || 'Error fetching admin records.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleApprove = async (appId) => {
    try {
      await api.patch(`/admin/owner-applications/${appId}`, {
        status: 'APPROVED',
        note: 'Verified and approved by RideNexa Administration'
      });
      setActionMessage('Rental shop partner has been APPROVED! They can now log in and add vehicles.');
      setTimeout(() => setActionMessage(''), 6000);
      loadAdminData();
    } catch (err) {
      alert('Error approving application: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (appId) => {
    const note = prompt('Please enter rejection reason:', 'Documents need verification');
    if (!note) return;

    try {
      await api.patch(`/admin/owner-applications/${appId}`, {
        status: 'REJECTED',
        note: note
      });
      setActionMessage('Rental shop application has been rejected.');
      setTimeout(() => setActionMessage(''), 6000);
      loadAdminData();
    } catch (err) {
      alert('Error rejecting application: ' + (err.response?.data?.message || err.message));
    }
  };

  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const approvedShops = applications.filter((a) => a.status === 'APPROVED');

  return (
    <div className="dash-layout">
      {/* ── ADMIN SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <BrandLogo subtitle="Admin Management" />
        </div>

        <nav className="dash-sidebar-nav">
          <button
            className={`dash-nav-item ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            <Icon name="verified" size={18} />
            <span>Rental Applications</span>
            {pendingApps.length > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '2px 9px',
                  borderRadius: '9999px'
                }}
              >
                {pendingApps.length}
              </span>
            )}
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'shops' ? 'active' : ''}`}
            onClick={() => setActiveTab('shops')}
          >
            <Icon name="key" size={18} />
            <span>Approved Shops</span>
            <span
              style={{
                marginLeft: 'auto',
                background: '#f1f5f9',
                color: 'var(--dark-3)',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}
            >
              {approvedShops.length}
            </span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            <Icon name="car" size={18} />
            <span>Fleet Inventory</span>
            <span
              style={{
                marginLeft: 'auto',
                background: '#f1f5f9',
                color: 'var(--dark-3)',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}
            >
              {vehicles.length}
            </span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Icon name="calendar" size={18} />
            <span>All Bookings</span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Icon name="user" size={18} />
            <span>Platform Users</span>
          </button>
        </nav>

        <div className="dash-sidebar-footer">
          <button
            className="btn-logout"
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
          >
            <Icon name="logout" size={18} color="#ef4444" />
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* ── ADMIN MAIN CONTENT ── */}
      <main className="dash-main">
        <header className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 className="dash-greeting">Platform Administration</h2>
            <button
              onClick={loadAdminData}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: '1.5px solid var(--gray-lighter)',
                background: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: '600',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Requests
            </button>
          </div>

          <div className="dash-user-profile">
            <div className="dash-avatar" style={{ background: '#0f172a' }}>
              A
            </div>
            <div>
              <div className="dash-user-name">{user?.fullName || 'Super Administrator'}</div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '700' }}>
                ADMIN ROLE
              </div>
            </div>
          </div>
        </header>

        <div className="dash-content">
          {fetchError && (
            <div
              style={{
                padding: '14px 20px',
                background: '#fef2f2',
                color: '#991b1b',
                borderLeft: '4px solid #ef4444',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>⚠️ {fetchError}</span>
              <button
                onClick={() => navigate('/admin/login')}
                style={{
                  padding: '6px 14px',
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign In Again
              </button>
            </div>
          )}

          {actionMessage && (
            <div
              style={{
                padding: '14px 20px',
                background: '#f0fdf4',
                color: '#166534',
                borderLeft: '4px solid #10b981',
                borderRadius: '12px',
                marginBottom: '24px',
                fontWeight: '600',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              ✓ {actionMessage}
            </div>
          )}

          {/* ── TAB: RENTAL APPLICATIONS (Admin verifies & accepts) ── */}
          {activeTab === 'applications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800' }}>
                    Rental Shop Verification Requests ({pendingApps.length} Pending)
                  </h3>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Rental shops can only log in and list vehicles after you accept and approve their registration.
                  </p>
                </div>
              </div>

              {pendingApps.length === 0 ? (
                <div
                  style={{
                    background: 'var(--white)',
                    borderRadius: '16px',
                    padding: '60px 20px',
                    textAlign: 'center',
                    border: '1px solid var(--gray-lighter)'
                  }}
                >
                  <Icon name="check" size={48} color="#10b981" />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginTop: '16px', color: '#065f46' }}>
                    All Rental Applications Reviewed!
                  </h4>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '6px' }}>
                    No pending partner requests awaiting audit. New rental shops registered from the footer will show up here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {pendingApps.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        background: 'var(--white)',
                        borderRadius: '20px',
                        padding: '28px',
                        border: '1.5px solid #fed7aa',
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: '800' }}>
                              {app.business_name}
                            </h4>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                              }}
                            >
                              PENDING VERIFICATION
                            </span>
                          </div>
                          <p style={{ color: 'var(--gray-mid)', fontSize: '0.88rem', marginTop: '4px' }}>
                            Owner: <strong>{app.full_name}</strong> · Email: {app.email} · Phone: {app.phone || app.business_phone}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleReject(app.id)}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '9999px',
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: '1.5px solid #fecaca',
                              fontWeight: '600',
                              fontSize: '0.88rem',
                              cursor: 'pointer'
                            }}
                          >
                            Reject Application
                          </button>

                          <button
                            onClick={() => handleApprove(app.id)}
                            style={{
                              padding: '10px 24px',
                              borderRadius: '9999px',
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: '700',
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(16,185,129,0.35)'
                            }}
                          >
                            ✓ Approve Shop & Activate
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '14px',
                          background: '#f8fafc',
                          padding: '14px',
                          borderRadius: '12px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div>
                          <span style={{ color: 'var(--gray-mid)' }}>City / Hub: </span>
                          <strong>{app.city}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--gray-mid)' }}>Vehicle Categories: </span>
                          <strong>{app.vehicle_types || 'Bikes, Cars'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--gray-mid)' }}>GST / Trade No: </span>
                          <strong>{app.gst_number || 'N/A'}</strong>
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                          <span style={{ color: 'var(--gray-mid)' }}>Shop Address: </span>
                          <strong>{app.address_line}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: APPROVED SHOPS ── */}
          {activeTab === 'shops' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800', marginBottom: '20px' }}>
                Active Verified Rental Partners ({approvedShops.length})
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {approvedShops.map((shop) => (
                  <div
                    key={shop.id}
                    style={{
                      background: 'var(--white)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid var(--gray-lighter)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '8px' }}>
                      <Icon name="verified" size={18} color="#059669" />
                      <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>VERIFIED PARTNER</span>
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: '800' }}>
                      {shop.business_name}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-mid)', marginTop: '4px' }}>
                      Owner: {shop.full_name} · {shop.city}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--dark-3)', marginTop: '8px' }}>
                      Address: {shop.address_line}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: FLEET INVENTORY ── */}
          {activeTab === 'vehicles' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800', marginBottom: '20px' }}>
                All Platform Listed Vehicles ({vehicles.length})
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      background: 'var(--white)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid var(--gray-lighter)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ height: '160px', background: '#0f172a' }}>
                      <img
                        src={v.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80'}
                        alt={v.model}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700' }}>
                        {v.business_name || 'Partner Shop'}
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: '700' }}>
                        {v.make} {v.model}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.88rem' }}>
                        <span>Rate: <strong>₹{v.hourly_rate}/hr</strong></span>
                        <span>Plate: <strong>{v.registration_number}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: ALL BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800', marginBottom: '20px' }}>
                All Platform Bookings ({bookings.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: 'var(--white)',
                      borderRadius: '14px',
                      padding: '18px 24px',
                      border: '1px solid var(--gray-lighter)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '700', fontSize: '1.05rem' }}>
                          {b.make} {b.model}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            background: '#eff6ff',
                            color: '#1d4ed8'
                          }}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-mid)', marginTop: '4px' }}>
                        Customer: <strong>{b.customer_name}</strong> · Shop: {b.business_name} · Delivery: {b.delivery_address}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>
                        ₹{b.quoted_total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: USERS ── */}
          {activeTab === 'users' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800', marginBottom: '20px' }}>
                Registered Platform Users ({usersList.length})
              </h3>

              <div
                style={{
                  background: 'var(--white)',
                  borderRadius: '16px',
                  border: '1px solid var(--gray-lighter)',
                  overflow: 'hidden'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--gray-lighter)' }}>
                      <th style={{ padding: '14px 20px' }}>Full Name</th>
                      <th style={{ padding: '14px 20px' }}>Email</th>
                      <th style={{ padding: '14px 20px' }}>Role</th>
                      <th style={{ padding: '14px 20px' }}>City</th>
                      <th style={{ padding: '14px 20px' }}>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: '600' }}>{u.full_name}</td>
                        <td style={{ padding: '14px 20px' }}>{u.email}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              background:
                                u.role === 'ADMIN' ? '#fef3c7' :
                                u.role === 'OWNER' ? '#ede9fe' : '#e0f2fe',
                              color:
                                u.role === 'ADMIN' ? '#92400e' :
                                u.role === 'OWNER' ? '#6b21a8' : '#0369a1'
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>{u.city}</td>
                        <td style={{ padding: '14px 20px' }}>{u.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
