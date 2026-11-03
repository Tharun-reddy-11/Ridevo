import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo, Icon } from '../../components/icons/Icons';
import api from '../../api/client';
import { useAuth } from '../../auth';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'add' | 'bookings'
  const [fleet, setFleet] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add Vehicle Form State
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    vehicleType: 'CAR',
    registrationNumber: '',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    seats: 5,
    hourlyRate: 250,
    dailyRate: 2400,
    securityDeposit: 2000,
    city: user?.city || 'Bangalore',
    imageUrl: '',
    description: 'Clean, sanitized, verified vehicle ready for doorstep delivery.',
    deliverySupported: true,
    driverSupported: true
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [postingVehicle, setPostingVehicle] = useState(false);

  // File upload handler - converts local file to high-res optimized data URL
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size is too large. Please select an image under 15MB.');
      return;
    }

    setErrorMsg('');
    setImageFileName(file.name);

    // Read and optimize image with HTML5 canvas for fast load & instant MySQL persistence
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 850;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setImagePreview(optimizedDataUrl);
        setVehicleForm((prev) => ({ ...prev, imageUrl: optimizedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadOwnerData = async () => {
    try {
      setLoading(true);
      const [fRes, bRes] = await Promise.all([
        api.get('/vehicles/mine'),
        api.get('/bookings/owner-dashboard')
      ]);
      setFleet(fRes.data || []);
      setBookings(bRes.data || []);
    } catch (err) {
      console.error('Error fetching owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  const handlePostVehicle = async (e) => {
    e.preventDefault();

    if (!vehicleForm.imageUrl) {
      setErrorMsg('Please select and upload a vehicle photo from your files.');
      return;
    }

    setPostingVehicle(true);
    setErrorMsg('');

    try {
      await api.post('/vehicles', {
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        vehicleType: vehicleForm.vehicleType,
        registrationNumber: vehicleForm.registrationNumber.trim().toUpperCase(),
        transmission: vehicleForm.transmission,
        fuelType: vehicleForm.fuelType,
        seats: Number(vehicleForm.seats),
        hourlyRate: Number(vehicleForm.hourlyRate),
        dailyRate: Number(vehicleForm.dailyRate),
        securityDeposit: Number(vehicleForm.securityDeposit),
        city: vehicleForm.city.trim(),
        imageUrl: vehicleForm.imageUrl,
        description: vehicleForm.description.trim(),
        deliverySupported: vehicleForm.deliverySupported,
        driverSupported: vehicleForm.driverSupported
      });

      setActionSuccess(
        `Vehicle "${vehicleForm.make} ${vehicleForm.model}" posted successfully! It is now live in MySQL and instantly visible to customers.`
      );
      setPostingVehicle(false);
      setImagePreview(null);
      setImageFileName('');
      setVehicleForm({
        make: '',
        model: '',
        vehicleType: 'CAR',
        registrationNumber: '',
        transmission: 'AUTOMATIC',
        fuelType: 'PETROL',
        seats: 5,
        hourlyRate: 250,
        dailyRate: 2400,
        securityDeposit: 2000,
        city: user?.city || 'Bangalore',
        imageUrl: '',
        description: 'Clean, sanitized, verified vehicle ready for doorstep delivery.',
        deliverySupported: true,
        driverSupported: true
      });
      setActiveTab('inventory');
      loadOwnerData();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        'Error posting vehicle. Please check backend connection.'
      );
      setPostingVehicle(false);
    }
  };

  const handleDecision = async (bookingId, decision) => {
    try {
      await api.patch(`/bookings/${bookingId}/decision`, {
        status: decision,
        note:
          decision === 'APPROVED'
            ? 'Accepted by rental shop. Vehicle being prepared for doorstep delivery.'
            : 'Vehicle unavailable at this time.'
      });
      setActionSuccess(`Booking has been ${decision}!`);
      setTimeout(() => setActionSuccess(''), 5000);
      loadOwnerData();
    } catch (err) {
      alert('Error updating booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (vehicleId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
      await api.patch(`/vehicles/${vehicleId}/availability`, {
        status: newStatus
      });
      loadOwnerData();
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'REQUESTED');

  return (
    <div className="dash-layout">
      {/* ── OWNER SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <BrandLogo subtitle="Rental Shop Hub" />
        </div>

        <nav className="dash-sidebar-nav">
          <button
            className={`dash-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Icon name="car" size={18} />
            <span>My Fleet Inventory</span>
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
              {fleet.length}
            </span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <Icon name="plus" size={18} />
            <span>Post New Vehicle</span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Icon name="calendar" size={18} />
            <span>Booking Requests</span>
            {pendingBookings.length > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}
              >
                {pendingBookings.length}
              </span>
            )}
          </button>
        </nav>

        <div className="dash-sidebar-footer">
          <button
            className="btn-logout"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <Icon name="logout" size={18} color="#ef4444" />
            <span>Exit Partner Portal</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN OWNER DASHBOARD ── */}
      <main className="dash-main">
        <header className="dash-topbar">
          <h2 className="dash-greeting">Rental Shop Partner Dashboard</h2>
          <div className="dash-user-profile">
            <div className="dash-avatar" style={{ background: '#2563eb' }}>
              {(user?.fullName || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="dash-user-name">{user?.fullName || 'Verified Rental Shop'}</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                APPROVED VENDOR
              </div>
            </div>
          </div>
        </header>

        <div className="dash-content">
          {actionSuccess && (
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
              ✓ {actionSuccess}
            </div>
          )}

          {/* ── TAB: MY FLEET INVENTORY ── */}
          {activeTab === 'inventory' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800' }}>
                    My Fleet Inventory ({fleet.length} Vehicles)
                  </h3>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '4px' }}>
                    These vehicles are live in MySQL and appear in customer discovery searches.
                  </p>
                </div>
                <button
                  className="btn-getstarted"
                  onClick={() => setActiveTab('add')}
                >
                  <Icon name="plus" size={16} /> Post New Vehicle
                </button>
              </div>

              {fleet.length === 0 ? (
                <div
                  style={{
                    background: 'var(--white)',
                    borderRadius: '16px',
                    padding: '60px 20px',
                    textAlign: 'center',
                    border: '1px solid var(--gray-lighter)'
                  }}
                >
                  <Icon name="car" size={48} color="var(--gray-light)" />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginTop: '16px' }}>
                    No vehicles posted yet
                  </h4>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '6px' }}>
                    Upload your first vehicle from files to start receiving customer doorstep bookings.
                  </p>
                  <button
                    className="btn-dash-hero"
                    style={{ margin: '20px auto 0' }}
                    onClick={() => setActiveTab('add')}
                  >
                    + Post First Vehicle
                  </button>
                </div>
              ) : (
                <div className="vehicles-catalog-grid">
                  {fleet.map((v) => (
                    <div className="catalog-card" key={v.id}>
                      <div className="catalog-card-image">
                        <img
                          src={v.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80'}
                          alt={v.model}
                        />
                        <span
                          className="catalog-card-badge"
                          style={{
                            background: v.status === 'AVAILABLE' ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {v.status}
                        </span>
                      </div>

                      <div className="catalog-card-body">
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--gray-mid)', marginBottom: '4px' }}>
                          Plate: {v.registration_number} · {v.city}
                        </div>

                        <h4 className="catalog-card-title">
                          {v.make} {v.model}
                        </h4>

                        <div className="catalog-specs-row">
                          <div className="catalog-spec-item">
                            <Icon name="fuel" size={14} />
                            <span>{v.fuel_type}</span>
                          </div>
                          <div className="catalog-spec-item">
                            <Icon name="transmission" size={14} />
                            <span>{v.transmission}</span>
                          </div>
                          <div className="catalog-spec-item">
                            <Icon name="user" size={14} />
                            <span>{v.seats} Seats</span>
                          </div>
                        </div>

                        <div className="catalog-card-footer">
                          <div className="catalog-price-wrap">
                            <span className="catalog-hourly-price">
                              ₹{v.hourly_rate} / hr
                            </span>
                            <span className="catalog-daily-price">
                              ₹{v.daily_rate} / day
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleStatus(v.id, v.status)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '9999px',
                              background: v.status === 'AVAILABLE' ? '#fee2e2' : '#dcfce7',
                              color: v.status === 'AVAILABLE' ? '#b91c1c' : '#15803d',
                              fontWeight: '600',
                              fontSize: '0.78rem',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {v.status === 'AVAILABLE' ? 'Set Maintenance' : 'Set Available'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: POST NEW VEHICLE (File Upload from Local Machine) ── */}
          {activeTab === 'add' && (
            <div style={{ maxWidth: '820px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800' }}>
                  Post Vehicle To Marketplace
                </h3>
                <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Provide complete vehicle specifications, upload a photo from your files, and set your hourly rate.
                </p>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '14px 18px',
                    background: '#fef2f2',
                    color: '#991b1b',
                    borderLeft: '4px solid #ef4444',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              <form
                onSubmit={handlePostVehicle}
                style={{
                  background: 'var(--white)',
                  borderRadius: '24px',
                  padding: '36px',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--gray-lighter)'
                }}
              >
                <div className="form-row-2">
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Brand / Make <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-rn"
                      placeholder="Enter brand (e.g. Hyundai, Honda, Toyota)"
                      value={vehicleForm.make}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Model & Variant <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-rn"
                      placeholder="Enter model name (e.g. Creta SX, Swift VXi)"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Vehicle Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-input-rn"
                      value={vehicleForm.vehicleType}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                    >
                      <option value="CAR">Sedan / Hatchback</option>
                      <option value="SUV">SUV / MUV</option>
                      <option value="BIKE">Motorcycle / Bike</option>
                      <option value="SCOOTER">Scooter / Commuter</option>
                      <option value="LUXURY">Luxury Premium</option>
                      <option value="BUS">Tempo / Minibus</option>
                    </select>
                  </div>

                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Registration Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-rn"
                      placeholder="e.g. KA 01 CE 3006"
                      value={vehicleForm.registrationNumber}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Location City <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-rn"
                      placeholder="Enter city"
                      value={vehicleForm.city}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, city: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Hourly Rate (₹ / hr) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="10"
                      className="form-input-rn"
                      value={vehicleForm.hourlyRate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, hourlyRate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Daily Rate (₹ / day) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="100"
                      className="form-input-rn"
                      value={vehicleForm.dailyRate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, dailyRate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Security Deposit (₹) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-input-rn"
                      value={vehicleForm.securityDeposit}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, securityDeposit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Transmission <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-input-rn"
                      value={vehicleForm.transmission}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, transmission: e.target.value })}
                    >
                      <option value="AUTOMATIC">Automatic</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Fuel Type <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-input-rn"
                      value={vehicleForm.fuelType}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                    >
                      <option value="PETROL">Petrol</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="ELECTRIC">Electric (EV)</option>
                      <option value="CNG">CNG</option>
                    </select>
                  </div>
                  <div className="form-group-rn">
                    <label className="form-label-rn">
                      Seating Capacity <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="form-input-rn"
                      value={vehicleForm.seats}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, seats: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* ── UPLOAD VEHICLE PHOTO FROM LOCAL FILES ── */}
                <div className="form-group-rn" style={{ margin: '16px 0 20px' }}>
                  <label className="form-label-rn">
                    Upload Vehicle Image From Files <span style={{ color: '#ef4444' }}>*</span>
                  </label>

                  <div
                    style={{
                      border: '2px dashed #93c5fd',
                      borderRadius: '16px',
                      background: '#f8fafc',
                      padding: '24px',
                      textAlign: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="file"
                      id="vehicle-file-input"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%'
                      }}
                    />

                    {imagePreview ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={imagePreview}
                          alt="Vehicle Preview"
                          style={{
                            maxWidth: '320px',
                            maxHeight: '200px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: '700' }}>
                            ✓ Selected: {imageFileName || 'Vehicle photo attached'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--primary)',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                          >
                            Change Photo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '20px 0' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px'
                          }}
                        >
                          <Icon name="car" size={24} color="var(--primary)" />
                        </div>
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--dark)' }}>
                          Click to browse vehicle image from your computer / files
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray-mid)', marginTop: '4px', marginBottom: '12px' }}>
                          Supports JPG, PNG, WEBP, JPEG up to 15MB
                        </p>
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'var(--primary)',
                            color: 'var(--white)',
                            padding: '8px 22px',
                            borderRadius: '9999px',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                          }}
                        >
                          📁 Choose Vehicle Image File
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group-rn">
                  <label className="form-label-rn">Description & Key Features</label>
                  <textarea
                    className="form-input-rn"
                    rows="3"
                    value={vehicleForm.description}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '24px', margin: '16px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={vehicleForm.deliverySupported}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, deliverySupported: e.target.checked })}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    Guaranteed Doorstep Delivery Supported
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={vehicleForm.driverSupported}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, driverSupported: e.target.checked })}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    Chauffeur (Driver) Service Available
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-submit-rn"
                  disabled={postingVehicle}
                >
                  {postingVehicle ? 'Publishing Vehicle to Marketplace...' : 'Post Vehicle to Marketplace'}
                </button>
              </form>
            </div>
          )}

          {/* ── TAB: BOOKING REQUESTS ── */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800' }}>
                  Customer Booking Requests ({bookings.length})
                </h3>
                <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Review incoming doorstep orders and confirm vehicle availability.
                </p>
              </div>

              {bookings.length === 0 ? (
                <div
                  style={{
                    background: 'var(--white)',
                    borderRadius: '16px',
                    padding: '60px 20px',
                    textAlign: 'center',
                    border: '1px solid var(--gray-lighter)'
                  }}
                >
                  <Icon name="calendar" size={48} color="var(--gray-light)" />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginTop: '16px' }}>
                    No bookings received yet
                  </h4>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '6px' }}>
                    When customers book your vehicles, their orders will appear here for your confirmation.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        background: 'var(--white)',
                        borderRadius: '20px',
                        padding: '24px',
                        border: '1px solid var(--gray-lighter)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: '800' }}>
                            {b.make} {b.model}
                          </h4>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              background:
                                b.status === 'APPROVED' ? '#d1fae5' :
                                b.status === 'ACTIVE' ? '#dbeafe' :
                                b.status === 'REQUESTED' ? '#fef3c7' : '#f1f5f9',
                              color:
                                b.status === 'APPROVED' ? '#065f46' :
                                b.status === 'ACTIVE' ? '#1e40af' :
                                b.status === 'REQUESTED' ? '#92400e' : '#475569'
                            }}
                          >
                            {b.status}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.88rem', color: 'var(--gray-mid)', marginTop: '4px' }}>
                          Customer: <strong>{b.customer_name}</strong> · Mode: {b.rental_mode}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--dark-2)', marginTop: '2px' }}>
                          Delivery Spot: <strong>{b.delivery_address}</strong>
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                          ₹{b.quoted_total}
                        </div>

                        {b.status === 'REQUESTED' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button
                              onClick={() => handleDecision(b.id, 'REJECTED')}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '9999px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleDecision(b.id, 'APPROVED')}
                              style={{
                                padding: '6px 16px',
                                borderRadius: '9999px',
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: '700',
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Accept Order
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
