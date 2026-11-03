import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/icons/Icons';
import api from '../../api/client';
import { useAuth } from '../../auth';

export default function OwnerLoginPage() {
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
      if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
        setError('This portal is strictly for verified Rental Shop Partners.');
        return;
      }

      setSession(user, token);
      navigate('/owner/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to sign in. Please verify your credentials or wait for admin approval.'
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

      <div className="auth-card-white">
        <div className="auth-card-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <BrandLogo subtitle="Rental Shop Partner Portal" />
          </Link>
          <h2 className="auth-card-title">Rental Shop Partner Login</h2>
          <p className="auth-card-subtitle">
            Sign in to manage your vehicle inventory, booking approvals, and customer doorstep orders
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fffbeb',
              color: '#92400e',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '18px',
              lineHeight: '1.5'
            }}
          >
            <strong>Status Notice:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-group-rn">
            <label className="form-label-rn">
              Business Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              className="form-input-rn"
              placeholder="Enter your registered business email"
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
              placeholder="Enter your partner password"
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
            {loading ? 'Verifying...' : 'Sign In to Shop Dashboard'}
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
          New rental shop?{' '}
          <Link
            to="/owner/register"
            style={{ color: 'var(--primary)', fontWeight: '600' }}
          >
            Submit Application to Admin
          </Link>
        </p>
      </div>
    </div>
  );
}
