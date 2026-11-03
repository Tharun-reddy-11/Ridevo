import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo, Icon } from '../../components/icons/Icons';
import api from '../../api/client';
import { useAuth } from '../../auth';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'browse' | 'bookings' | 'doorstep' | 'profile'
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    city: user?.city || '',
    profileImage: user?.profileImage || ''
  });
  const [profilePreview, setProfilePreview] = useState(user?.profileImage || null);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Update State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync profileForm when user loads or updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        city: user.city || '',
        profileImage: user.profileImage || ''
      });
      setProfilePreview(user.profileImage || null);
    }
  }, [user]);

  // Slider state (auto-changes every 5 seconds)
  const [currentSlide, setCurrentSlide] = useState(0);

  // Booking Modal State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingHours, setBookingHours] = useState(4);
  const [deliveryMethod, setDeliveryMethod] = useState('DOORSTEP_DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.city || 'My Address');
  const [rentalMode, setRentalMode] = useState('SELF_DRIVE');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // 4 Full width/height slides matching Learnova AI Image 2
  const slides = [
    {
      tag: 'DOORSTEP VEHICLE DELIVERY',
      title: 'Guaranteed Doorstep Delivery To Your Location',
      desc: 'Pick your favorite car or bike from verified nearby rental shops and receive it at your doorstep with live handover inspection.',
      cta: 'Browse Available Vehicles',
      tab: 'browse',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=80'
    },
    {
      tag: 'TRANSPARENT HOURLY PRICING',
      title: 'Pay Strictly For The Hours You Need',
      desc: 'Transparent dynamic rates, zero surge fees, and automated security deposit settlement directly to your account.',
      cta: 'Explore Hourly Fleet',
      tab: 'browse',
      image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1400&q=80'
    },
    {
      tag: 'VERIFIED FLEET MARKETPLACE',
      title: '1,200+ Verified Multi-Vendor Vehicles',
      desc: 'Every vehicle and rental partner undergoes strict admin document audit and mechanical fitness checks.',
      cta: 'View Certified Fleets',
      tab: 'browse',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1400&q=80'
    },
    {
      tag: 'CHAUFFEUR SERVICE',
      title: 'Professional Chauffeurs For Safe Travel',
      desc: 'Choose self-drive freedom or hire vetted professional drivers for city commuting, airport transfers, or outstation tours.',
      cta: 'Book Chauffeur Ride',
      tab: 'browse',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1400&q=80'
    }
  ];

  // Auto-slide every 5 seconds (Learnova AI feature)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, bRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/bookings/my-bookings')
      ]);
      setVehicles(vRes.data || []);
      setBookings(bRes.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBooking = (vehicle) => {
    setSelectedVehicle(vehicle);
    setBookingSuccess(false);
    setBookingError('');
    setBookingHours(4);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setSubmittingBooking(true);
    setBookingError('');

    try {
      const now = new Date();
      const end = new Date(now.getTime() + bookingHours * 60 * 60 * 1000);

      const pad = (n) => String(n).padStart(2, '0');
      const formatLocalIso = (d) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

      await api.post('/bookings', {
        vehicleId: selectedVehicle.id,
        startAt: formatLocalIso(now),
        endAt: formatLocalIso(end),
        deliveryMethod,
        returnMethod: deliveryMethod,
        rentalMode,
        pickupAddress: deliveryAddress,
        destinationAddress: deliveryAddress,
        deliveryAddress: deliveryAddress,
        driverRequired: rentalMode === 'CHAUFFEUR'
      });

      setBookingSuccess(true);
      loadData();
    } catch (err) {
      setBookingError(
        err.response?.data?.message ||
        'Booking request could not be processed. Please check vehicle availability.'
      );
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Profile Image Picker & Canvas Resizer (max 400x400, high quality, instant save)
  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfileError('Image file is too large. Please select a photo under 10MB.');
      return;
    }

    setProfileError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setProfilePreview(optimizedDataUrl);
        setProfileForm((prev) => ({ ...prev, profileImage: optimizedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setProfilePreview(null);
    setProfileForm((prev) => ({ ...prev, profileImage: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await api.put('/auth/profile', {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        city: profileForm.city.trim(),
        profileImage: profileForm.profileImage || ''
      });

      // Update auth state so top-right avatar and greeting update immediately
      updateUser(res.data);
      setProfileSuccess('Profile details and photo updated successfully! Changes saved.');
      setTimeout(() => setProfileSuccess(''), 5000);
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordSuccess('Password updated successfully! Next time you sign in, use your new password.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || err.message || 'Error updating password. Please verify your current password.'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // Filter vehicles by category
  const filteredVehicles = vehicles.filter((v) => {
    if (selectedCategory === 'ALL') return true;
    const type = (v.vehicle_type || '').toUpperCase();
    if (selectedCategory === 'BIKES') return type.includes('BIKE') || type.includes('SCOOTER');
    if (selectedCategory === 'CARS') return type.includes('SEDAN') || type.includes('HATCHBACK');
    if (selectedCategory === 'SUVS') return type.includes('SUV') || type.includes('MUV');
    if (selectedCategory === 'LUXURY') return type.includes('LUXURY');
    return true;
  });

  return (
    <div className="dash-layout">
      {/* ── LEFT SIDEBAR (Learnova AI Style) ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <BrandLogo subtitle="Rent. Ride. Return." />
        </div>

        <nav className="dash-sidebar-nav">
          <button
            className={`dash-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Icon name="dashboard" size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <Icon name="car" size={18} />
            <span>Browse Vehicles</span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Icon name="calendar" size={18} />
            <span>My Bookings</span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'doorstep' ? 'active' : ''}`}
            onClick={() => setActiveTab('doorstep')}
          >
            <Icon name="delivery" size={18} />
            <span>Doorstep Deliveries</span>
          </button>

          <button
            className={`dash-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Icon name="user" size={18} />
            <span>Profile & Settings</span>
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
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN DASHBOARD AREA ── */}
      <main className="dash-main">
        {/* Top Greeting Bar */}
        <header className="dash-topbar">
          <h2 className="dash-greeting">
            Good Afternoon, {user?.fullName || 'Tharun'}
          </h2>

          <div
            className="dash-user-profile"
            onClick={() => setActiveTab('profile')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            title="Manage Profile & Settings"
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user?.fullName || 'Profile'}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #2563eb',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                }}
              />
            ) : (
              <div className="dash-avatar">
                {(user?.fullName || 'T').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="dash-user-name">{user?.fullName || 'Tharun Reddy'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-mid)' }}>
                {user?.city || 'Verified Customer'}
              </div>
            </div>
          </div>
        </header>

        <div className="dash-content">
          {/* ── AUTO-SLIDING HERO BANNER (Only on Overview) ── */}
          {activeTab === 'overview' && (
            <>
              <div className="dash-hero-slider">
                {slides.map((s, index) => (
                  <div
                    key={index}
                    className={`dash-hero-slide ${index === currentSlide ? 'active' : ''}`}
                    style={{ backgroundImage: `url('${s.image}')` }}
                  >
                    <div className="dash-hero-overlay">
                      <span className="dash-hero-tag">{s.tag}</span>
                      <h3 className="dash-hero-title">{s.title}</h3>
                      <p className="dash-hero-desc">{s.desc}</p>
                      <button
                        className="btn-dash-hero"
                        onClick={() => setActiveTab(s.tab)}
                      >
                        {s.cta} <Icon name="arrow-right" size={16} color="#ffffff" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Slider Controls (Dots + Prev/Next Arrows) */}
                <div className="dash-slider-controls">
                  <div className="dash-slider-dots">
                    {slides.map((_, i) => (
                      <div
                        key={i}
                        className={`dash-dot ${i === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(i)}
                      />
                    ))}
                  </div>
                  <div className="dash-slider-arrows">
                    <button
                      className="dash-arrow-btn"
                      onClick={() =>
                        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
                      }
                    >
                      <Icon name="arrow-left" size={14} color="#ffffff" />
                    </button>
                    <button
                      className="dash-arrow-btn"
                      onClick={() =>
                        setCurrentSlide((prev) => (prev + 1) % slides.length)
                      }
                    >
                      <Icon name="arrow-right" size={14} color="#ffffff" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 4 STAT CARDS ROW (Learnova AI Style) ── */}
              <div className="dash-stats-grid">
                <div className="dash-stat-card">
                  <div className="dash-stat-icon-wrap" style={{ background: '#dbeafe' }}>
                    <Icon name="car" size={24} color="#2563eb" />
                  </div>
                  <div className="dash-stat-info">
                    <span className="dash-stat-value">
                      {bookings.filter((b) => b.status === 'ACTIVE' || b.status === 'REQUESTED').length}
                    </span>
                    <span className="dash-stat-label">Active Bookings</span>
                  </div>
                </div>

                <div className="dash-stat-card">
                  <div className="dash-stat-icon-wrap" style={{ background: '#d1fae5' }}>
                    <Icon name="verified" size={24} color="#059669" />
                  </div>
                  <div className="dash-stat-info">
                    <span className="dash-stat-value">
                      {bookings.filter((b) => b.status === 'COMPLETED').length}
                    </span>
                    <span className="dash-stat-label">Completed Trips</span>
                  </div>
                </div>

                <div className="dash-stat-card">
                  <div className="dash-stat-icon-wrap" style={{ background: '#fef3c7' }}>
                    <Icon name="clock" size={24} color="#d97706" />
                  </div>
                  <div className="dash-stat-info">
                    <span className="dash-stat-value">
                      {vehicles.length}
                    </span>
                    <span className="dash-stat-label">Available Vehicles</span>
                  </div>
                </div>

                <div className="dash-stat-card">
                  <div className="dash-stat-icon-wrap" style={{ background: '#ede9fe' }}>
                    <Icon name="delivery" size={24} color="#7c3aed" />
                  </div>
                  <div className="dash-stat-info">
                    <span className="dash-stat-value">100%</span>
                    <span className="dash-stat-label">Doorstep Delivery Rate</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAB: PROFILE & SETTINGS (User Profile, Photo Upload, Password Update) ── */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '840px', margin: '0 auto' }}>
              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Account Management
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: '800', marginTop: '2px' }}>
                  Profile & Security Settings
                </h3>
                <p style={{ color: 'var(--gray-mid)', fontSize: '0.92rem', marginTop: '4px' }}>
                  Manage your personal information, profile photo, and security password.
                </p>
              </div>

              {profileSuccess && (
                <div style={{ padding: '14px 18px', background: '#ecfdf5', color: '#065f46', borderLeft: '4px solid #10b981', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', fontWeight: '600' }}>
                  ✓ {profileSuccess}
                </div>
              )}

              {profileError && (
                <div style={{ padding: '14px 18px', background: '#fef2f2', color: '#991b1b', borderLeft: '4px solid #ef4444', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', fontWeight: '500' }}>
                  ⚠️ {profileError}
                </div>
              )}

              {/* Card 1: Profile Photo & Personal Details */}
              <div style={{ background: 'var(--white)', borderRadius: '24px', padding: '36px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-lighter)', marginBottom: '32px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>
                  Personal Information
                </h4>

                <form onSubmit={handleSaveProfile}>
                  {/* Photo Upload Section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '28px', borderBottom: '1px solid var(--gray-lighter)', marginBottom: '28px' }}>
                    <div style={{ position: 'relative' }}>
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          alt="Profile Preview"
                          style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid #2563eb',
                            boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            border: '2px dashed #93c5fd'
                          }}
                        >
                          {(profileForm.fullName || user?.fullName || 'T').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>
                        Profile Photo
                      </h5>
                      <p style={{ fontSize: '0.82rem', color: 'var(--gray-mid)', marginBottom: '12px' }}>
                        Upload a photo from your computer (JPG, PNG, WEBP). It will automatically update in your top-right profile avatar.
                      </p>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        style={{ display: 'none' }}
                      />

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn-getstarted"
                          onClick={() => fileInputRef.current?.click()}
                          style={{ padding: '7px 18px', fontSize: '0.85rem' }}
                        >
                          📁 Choose Photo From Files
                        </button>
                        {profilePreview && (
                          <button
                            type="button"
                            onClick={handleRemoveProfileImage}
                            style={{
                              padding: '7px 16px',
                              borderRadius: '9999px',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: 'none',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Fields Grid */}
                  <div className="form-row-2">
                    <div className="form-group-rn">
                      <label className="form-label-rn">
                        Full Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input-rn"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group-rn">
                      <label className="form-label-rn">
                        Email Address <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>(Verified)</span>
                      </label>
                      <input
                        type="email"
                        className="form-input-rn"
                        value={user?.email || ''}
                        disabled
                        style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div className="form-row-2" style={{ marginTop: '16px' }}>
                    <div className="form-group-rn">
                      <label className="form-label-rn">
                        Phone Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-input-rn"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group-rn">
                      <label className="form-label-rn">
                        City / Location <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input-rn"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn-submit-rn"
                      style={{ width: 'auto', padding: '12px 32px' }}
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Security & Password Update */}
              <div style={{ background: 'var(--white)', borderRadius: '24px', padding: '36px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-lighter)' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
                  Change Password
                </h4>
                <p style={{ color: 'var(--gray-mid)', fontSize: '0.88rem', marginBottom: '24px' }}>
                  Ensure your account uses a secure password with at least 8 characters.
                </p>

                {passwordSuccess && (
                  <div style={{ padding: '14px 18px', background: '#ecfdf5', color: '#065f46', borderLeft: '4px solid #10b981', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', fontWeight: '600' }}>
                    ✓ {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div style={{ padding: '14px 18px', background: '#fef2f2', color: '#991b1b', borderLeft: '4px solid #ef4444', borderRadius: '10px', marginBottom: '20px', fontSize: '0.92rem', fontWeight: '500' }}>
                    ⚠️ {passwordError}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword}>
                  <div className="form-group-rn" style={{ marginBottom: '16px' }}>
                    <label className="form-label-rn">
                      Current Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input-rn"
                      placeholder="Enter your current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group-rn">
                      <label className="form-label-rn">
                        New Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input-rn"
                        placeholder="At least 8 characters"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group-rn">
                      <label className="form-label-rn">
                        Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input-rn"
                        placeholder="Re-enter new password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 24px' }}>
                    <input
                      type="checkbox"
                      id="showPassCustomer"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="showPassCustomer" style={{ fontSize: '0.85rem', color: 'var(--dark)', cursor: 'pointer' }}>
                      Show Passwords
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn-submit-rn"
                      style={{ width: 'auto', padding: '12px 32px' }}
                      disabled={savingPassword}
                    >
                      {savingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB: DOORSTEP DELIVERIES ── */}
          {activeTab === 'doorstep' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '700' }}>
                  Doorstep Vehicle Deliveries
                </h3>
                <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Real-time status of your vehicle delivery orders and live handover inspections.
                </p>
              </div>

              {bookings.filter((b) => b.delivery_method === 'DOORSTEP_DELIVERY').length === 0 ? (
                <div
                  style={{
                    background: 'var(--white)',
                    borderRadius: '16px',
                    padding: '60px 20px',
                    textAlign: 'center',
                    border: '1px solid var(--gray-lighter)'
                  }}
                >
                  <Icon name="delivery" size={48} color="var(--gray-light)" />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginTop: '16px' }}>
                    No doorstep delivery orders yet
                  </h4>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '6px' }}>
                    Book any vehicle with guaranteed doorstep delivery to track handover progress here.
                  </p>
                  <button
                    className="btn-dash-hero"
                    style={{ margin: '20px auto 0' }}
                    onClick={() => setActiveTab('browse')}
                  >
                    Browse Vehicles For Delivery
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bookings
                    .filter((b) => b.delivery_method === 'DOORSTEP_DELIVERY')
                    .map((b) => (
                      <div
                        key={b.id}
                        style={{
                          background: 'var(--white)',
                          borderRadius: '16px',
                          padding: '24px',
                          border: '1px solid var(--gray-lighter)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
                              Booking ID #{b.id?.slice(0, 8)}
                            </span>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginTop: '2px' }}>
                              {b.make} {b.model}
                            </h4>
                          </div>
                          <span
                            style={{
                              padding: '6px 14px',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              background: b.status === 'APPROVED' ? '#dcfce7' : '#fef3c7',
                              color: b.status === 'APPROVED' ? '#15803d' : '#92400e'
                            }}
                          >
                            {b.status === 'APPROVED' ? 'Dispatched for Delivery' : b.status}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', fontSize: '0.88rem' }}>
                          <div>
                            <span style={{ color: 'var(--gray-mid)', display: 'block', fontSize: '0.78rem' }}>Delivery Address:</span>
                            <strong>{b.delivery_address || 'Customer Location'}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--gray-mid)', display: 'block', fontSize: '0.78rem' }}>Rental Mode:</span>
                            <strong>{b.rental_mode}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--gray-mid)', display: 'block', fontSize: '0.78rem' }}>Total Quoted:</span>
                            <strong style={{ color: 'var(--primary)' }}>₹{b.quoted_total}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: MY BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '700' }}>
                  My Bookings & Rental History
                </h3>
                <button
                  className="btn-signin"
                  onClick={() => setActiveTab('browse')}
                >
                  + Book Another Vehicle
                </button>
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
                  <Icon name="car" size={48} color="var(--gray-light)" />
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginTop: '16px' }}>
                    No bookings yet
                  </h4>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '6px' }}>
                    Your vehicle reservations, doorstep delivery tracking, and digital inspection logs will appear here.
                  </p>
                  <button
                    className="btn-dash-hero"
                    style={{ margin: '20px auto 0' }}
                    onClick={() => setActiveTab('browse')}
                  >
                    Explore Marketplace Fleet
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        background: 'var(--white)',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        border: '1px solid var(--gray-lighter)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: '700' }}>
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
                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-mid)', marginTop: '4px' }}>
                          Delivery to: <strong>{b.delivery_address || 'Customer Location'}</strong> · Mode: {b.rental_mode}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                          ₹{b.quoted_total}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-mid)' }}>
                          Total Quoted Amount
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: OVERVIEW OR BROWSE (VEHICLES CATALOG) ── */}
          {(activeTab === 'overview' || activeTab === 'browse') && (
            <div>
              {/* Category Filter Pills */}
              <div className="filter-pills-row">
                {['ALL', 'BIKES', 'CARS', 'SUVS', 'LUXURY'].map((cat) => (
                  <button
                    key={cat}
                    className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'ALL' ? 'All Vehicles' : cat}
                  </button>
                ))}
              </div>

              {/* Vehicles Catalog Grid */}
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: '700' }}>
                  Available Fleet from Verified Shops ({filteredVehicles.length})
                </h3>
              </div>

              {filteredVehicles.length === 0 ? (
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
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginTop: '16px' }}>
                    No approved vehicles listed yet
                  </h4>
                  <p style={{ color: 'var(--gray-mid)', fontSize: '0.9rem', marginTop: '6px' }}>
                    Rental shops must be registered and approved by Admin to list their fleet here.
                  </p>
                </div>
              ) : (
                <div className="vehicles-catalog-grid">
                  {filteredVehicles.map((v) => (
                    <div className="catalog-card" key={v.id}>
                      <div className="catalog-card-image">
                        <img
                          src={
                            v.image_url ||
                            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=700&q=80'
                          }
                          alt={`${v.make} ${v.model}`}
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=700&q=80';
                          }}
                        />
                        <span className="catalog-card-badge">{v.vehicle_type}</span>
                      </div>

                      <div className="catalog-card-body">
                        <div className="catalog-vendor-row">
                          <Icon name="verified" size={14} color="#2563eb" />
                          <span>{v.business_name || 'Verified Rental Partner'}</span>
                        </div>

                        <h4 className="catalog-card-title">
                          {v.make} {v.model}
                        </h4>

                        <div className="catalog-specs-row">
                          <div className="catalog-spec-item">
                            <Icon name="fuel" size={14} />
                            <span>{v.fuel_type || 'Petrol'}</span>
                          </div>
                          <div className="catalog-spec-item">
                            <Icon name="transmission" size={14} />
                            <span>{v.transmission || 'Manual'}</span>
                          </div>
                          <div className="catalog-spec-item">
                            <Icon name="user" size={14} />
                            <span>{v.seats || 4} Seats</span>
                          </div>
                        </div>

                        <div className="catalog-card-footer">
                          <div className="catalog-price-wrap">
                            <span className="catalog-hourly-price">
                              ₹{v.hourly_rate}
                              <small style={{ fontSize: '0.72rem', fontWeight: '500', color: 'var(--gray-mid)' }}>
                                {' '}/ hr
                              </small>
                            </span>
                            <span className="catalog-daily-price">
                              ₹{v.daily_rate} / full day
                            </span>
                          </div>

                          <button
                            className="btn-book-now"
                            onClick={() => handleOpenBooking(v)}
                          >
                            Book Vehicle
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── BOOKING MODAL ── */}
      {selectedVehicle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 18, 37, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--white)',
              borderRadius: '24px',
              padding: '36px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Doorstep Rental Reservation
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: '800', marginTop: '2px' }}>
                  {selectedVehicle.make} {selectedVehicle.model}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  border: 'none',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <Icon name="check" size={32} color="#ffffff" />
                </div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#065f46', marginBottom: '8px' }}>
                  Booking Request Sent!
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#047857', lineHeight: '1.6', marginBottom: '24px' }}>
                  Your request has been forwarded to <strong>{selectedVehicle.business_name}</strong>. The rental owner will confirm and arrange doorstep delivery.
                </p>
                <button
                  className="btn-submit-rn"
                  onClick={() => {
                    setSelectedVehicle(null);
                    setActiveTab('bookings');
                  }}
                >
                  View My Bookings
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking}>
                {bookingError && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#fef2f2',
                      color: '#991b1b',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      marginBottom: '16px'
                    }}
                  >
                    {bookingError}
                  </div>
                )}

                <div className="form-group-rn">
                  <label className="form-label-rn">Rental Duration (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={bookingHours}
                    onChange={(e) => setBookingHours(Number(e.target.value))}
                    className="form-input-rn"
                    required
                  />
                </div>

                <div className="form-group-rn">
                  <label className="form-label-rn">Driving Mode</label>
                  <select
                    value={rentalMode}
                    onChange={(e) => setRentalMode(e.target.value)}
                    className="form-input-rn"
                  >
                    <option value="SELF_DRIVE">Self-Drive (I will drive)</option>
                    <option value="CHAUFFEUR">Chauffeur-Driven (With Professional Driver)</option>
                  </select>
                </div>

                <div className="form-group-rn">
                  <label className="form-label-rn">Handover Option</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="form-input-rn"
                  >
                    <option value="DOORSTEP_DELIVERY">Guaranteed Doorstep Delivery</option>
                    <option value="SELF_PICKUP">Self Pickup at Rental Shop</option>
                  </select>
                </div>

                <div className="form-group-rn">
                  <label className="form-label-rn">Delivery Address / Hotel / Office</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="form-input-rn"
                    placeholder="Enter complete delivery street address"
                    required
                  />
                </div>

                {/* Price Summary Breakdown */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '16px',
                    margin: '20px 0',
                    border: '1px solid var(--gray-lighter)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '8px' }}>
                    <span>Rate (₹{selectedVehicle.hourly_rate} × {bookingHours} hrs):</span>
                    <strong>₹{selectedVehicle.hourly_rate * bookingHours}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '8px' }}>
                    <span>Doorstep Delivery Fee:</span>
                    <strong style={{ color: '#059669' }}>FREE</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.15rem',
                      fontWeight: '800',
                      borderTop: '1px solid var(--gray-lighter)',
                      paddingTop: '10px',
                      color: 'var(--primary)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    <span>Total Estimate:</span>
                    <span>₹{selectedVehicle.hourly_rate * bookingHours}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit-rn"
                  disabled={submittingBooking}
                >
                  {submittingBooking ? 'Submitting Reservation...' : 'Confirm & Request Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
