import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/icons/Icons';
import api from '../../api/client';
import { useAuth } from '../../auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const { user, token } = response.data;
      setSession(user, token);

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'OWNER') {
        navigate('/owner/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to sign in. Please check your credentials.'
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
            "url('https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&q=80')"
        }}
      />
      <div className="auth-bg-overlay-dark" />

      <div className="auth-card-white">
        <div className="auth-card-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <BrandLogo subtitle="Rent. Ride. Return." />
          </Link>
          <h2 className="auth-card-title">Welcome Back</h2>
          <p className="auth-card-subtitle">
            Sign in to manage your bookings, browse vehicles, and doorstep rides
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
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              name="password"
              className="form-input-rn"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit-rn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
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
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--primary)', fontWeight: '600' }}
          >
            Create Free Account
          </Link>
        </p>
      </div>
    </div>
  );
}
