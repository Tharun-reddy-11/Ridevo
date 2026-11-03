import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo, Icon } from '../../components/icons/Icons';
import api from '../../api/client';
import { useAuth } from '../../auth';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [formData, setFormData] = useState({
    email: 'btharunreddy26@gmail.com',
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
      if (user.role !== 'ADMIN') {
        setError('Unauthorized access. Admin credentials required.');
        return;
      }

      setSession(user, token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Admin authentication failed. Please verify credentials.'
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
            "url('https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1920&q=80')"
        }}
      />
      <div className="auth-bg-overlay-dark" />

      <div className="auth-card-white">
        <div className="auth-card-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <BrandLogo subtitle="System Administration" />
          </Link>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: '#fef3c7',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#b45309',
              margin: '14px 0 6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            <Icon name="shield" size={14} color="#b45309" /> RideNexa Control Center
          </div>
          <h2 className="auth-card-title">Admin Management Portal</h2>
          <p className="auth-card-subtitle">
            Restricted access for reviewing rental owner applications and platform operations
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

        <form onSubmit={handleSubmit}>
          <div className="form-group-rn">
            <label className="form-label-rn">
              Admin Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              className="form-input-rn"
              placeholder="Enter admin email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group-rn">
            <label className="form-label-rn">
              Admin Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              name="password"
              className="form-input-rn"
              placeholder="Enter admin password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit-rn"
            disabled={loading}
            style={{ background: '#0f172a' }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.82rem',
            color: 'var(--gray-mid)',
            marginTop: '24px'
          }}
        >
          Protected System · Authorized Administration Personnel Only
        </p>
      </div>
    </div>
  );
}
