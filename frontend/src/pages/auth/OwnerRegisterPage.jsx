import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo, Icon } from '../../components/icons/Icons';
import api from '../../api/client';

export default function OwnerRegisterPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    businessPhone: '',
    city: '',
    addressLine: '',
    gstNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [selectedTypes, setSelectedTypes] = useState(['Bikes & Scooters', 'Hatchbacks & Sedans']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const vehicleOptions = [
    'Bikes & Scooters',
    'Hatchbacks & Sedans',
    'SUVs & MUVs',
    'Luxury Cars',
    'Electric Vehicles (EV)',
    'Tempo Travellers & Buses'
  ];

  const handleCheckbox = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (selectedTypes.length === 0) {
      setError('Please select at least one vehicle category you provide.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register/owner', {
        businessName: formData.businessName,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.businessPhone,
        businessPhone: formData.businessPhone,
        city: formData.city,
        addressLine: formData.addressLine,
        gstNumber: formData.gstNumber || null,
        serviceRadiusKm: 25,
        vehicleTypes: selectedTypes.join(', '),
        password: formData.password
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div
        className="auth-bg-image"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1920&q=80')"
        }}
      />
      <div className="auth-bg-overlay-dark" />

      <div className="auth-card-white" style={{ maxWidth: '580px' }}>
        <div className="auth-card-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <BrandLogo subtitle="Rental Partner Network" />
          </Link>
          <h2 className="auth-card-title">Register Your Rental Shop</h2>
          <p className="auth-card-subtitle">
            List your fleet on RideNexa. Applications are reviewed and approved by Admin.
          </p>
        </div>

        {success ? (
          <div
            style={{
              padding: '28px',
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '16px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Icon name="check" size={28} color="#ffffff" />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.3rem',
                color: '#166534',
                marginBottom: '8px'
              }}
            >
              Application Submitted to Admin!
            </h3>
            <p
              style={{
                fontSize: '0.92rem',
                color: '#15803d',
                lineHeight: '1.6',
                marginBottom: '20px'
              }}
            >
              Your rental service <strong>{formData.businessName}</strong> has been registered. The RideNexa Admin team will verify your business details. Once approved, you can log in and upload your vehicles!
            </p>
            <Link to="/owner/login" className="btn-signin" style={{ display: 'inline-block' }}>
              Proceed to Rental Shop Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  color: '#991b1b',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  marginBottom: '18px'
                }}
              >
                {error}
              </div>
            )}

            <div className="form-row-2">
              <div className="form-group-rn">
                <label className="form-label-rn">
                  Rental Service Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  className="form-input-rn"
                  placeholder="Enter rental business name"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group-rn">
                <label className="form-label-rn">
                  Owner Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  className="form-input-rn"
                  placeholder="Enter owner full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group-rn">
                <label className="form-label-rn">
                  Business Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-input-rn"
                  placeholder="Enter official email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group-rn">
                <label className="form-label-rn">
                  Phone Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="businessPhone"
                  className="form-input-rn"
                  placeholder="Enter 10-digit phone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group-rn">
                <label className="form-label-rn">
                  City / Hub Location <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  className="form-input-rn"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group-rn">
                <label className="form-label-rn">GST / Trade Number (Optional)</label>
                <input
                  type="text"
                  name="gstNumber"
                  className="form-input-rn"
                  placeholder="Optional trade registration"
                  value={formData.gstNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group-rn">
              <label className="form-label-rn">
                Complete Shop Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="addressLine"
                className="form-input-rn"
                placeholder="Enter complete street address and landmark"
                value={formData.addressLine}
                onChange={handleChange}
                required
              />
            </div>

            {/* Vehicle Types Provided Checkboxes */}
            <div className="form-group-rn" style={{ marginBottom: '18px' }}>
              <label className="form-label-rn">
                Types of Vehicles Provided <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--gray-lighter)'
                }}
              >
                {vehicleOptions.map((opt) => (
                  <label
                    key={opt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      color: 'var(--dark-2)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(opt)}
                      onChange={() => handleCheckbox(opt)}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group-rn">
                <label className="form-label-rn">
                  Create Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-input-rn"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group-rn">
                <label className="form-label-rn">
                  Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input-rn"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit-rn"
              disabled={loading}
            >
              {loading ? 'Submitting to Admin...' : 'Submit Rental Application to Admin'}
            </button>
          </form>
        )}

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--gray-mid)',
            marginTop: '20px'
          }}
        >
          Already registered and approved?{' '}
          <Link
            to="/owner/login"
            style={{ color: 'var(--primary)', fontWeight: '600' }}
          >
            Rental Shop Login
          </Link>
        </p>
      </div>
    </div>
  );
}
