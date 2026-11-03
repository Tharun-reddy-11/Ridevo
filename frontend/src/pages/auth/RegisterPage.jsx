import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo, Icon } from '../../components/icons/Icons';
import api from '../../api/client';
import { useAuth } from '../../auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register/customer', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        password: formData.password
      });

      if (response.data && response.data.token) {
        setSession(response.data.user, response.data.token);
        navigate('/customer/dashboard');
      } else {
        navigate('/login');
      }
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
      {/* Background vehicle group image with dark overlay */}
      <div
        className="auth-bg-image"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80')"
        }}
      />
      <div className="auth-bg-overlay-dark" />

      <div className="auth-card-white">
        <div className="auth-card-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <BrandLogo subtitle="Rent. Ride. Return." />
          </Link>
          <h2 className="auth-card-title">Create Your Account</h2>
          <p className="auth-card-subtitle">
            Join RideNexa to discover nearby vehicles and doorstep delivery
          </p>
        </div>

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

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-group-rn">
            <label className="form-label-rn">
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="fullName"
              className="form-input-rn"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Form Row with minmax(0, 1fr) to prevent overflow */}
          <div className="form-row-2">
            <div className="form-group-rn">
              <label className="form-label-rn">
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-input-rn"
                placeholder="Enter your email address"
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
                name="phone"
                className="form-input-rn"
                placeholder="Enter 10-digit mobile number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group-rn">
            <label className="form-label-rn">
              City / Location <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="city"
              className="form-input-rn"
              placeholder="Enter your city name"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group-rn">
              <label className="form-label-rn">
                Password <span style={{ color: '#ef4444' }}>*</span>
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
                placeholder="Re-enter your password"
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--gray-mid)',
            marginTop: '20px'
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--primary)', fontWeight: '600' }}
          >
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
