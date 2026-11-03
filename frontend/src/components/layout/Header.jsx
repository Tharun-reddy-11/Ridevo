import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { getPlatformHealth } from '../../api/client';
import { CarIcon, UserIcon } from '../icons/Icons';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    getPlatformHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'OWNER': return '/owner';
      case 'DELIVERY': return '/delivery';
      case 'DRIVER': return '/driver';
      default: return '/customer/dashboard';
    }
  };

  const getRoleLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'ADMIN': return 'Admin Room';
      case 'OWNER': return 'Owner Console';
      case 'DELIVERY': return 'Delivery Partner';
      case 'DRIVER': return 'Chauffeur Desk';
      default: return 'Customer Portal';
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand-logo">
          <div className="brand-icon">
            <CarIcon className="w-5 h-5 text-white" />
          </div>
          <span className="brand-name">ride<span className="text-cyan">nexa</span></span>
        </Link>

        <div className="header-center">
          <Link to="/vehicles" className="nav-item">Find a Ride</Link>
          <a href="/#how-it-works" className="nav-item">How It Works</a>
          <a href="/#doorstep-usp" className="nav-item">Doorstep Delivery</a>
          <Link to="/owner/register" className="nav-item partner-badge">List Your Fleet</Link>
        </div>

        <div className="header-right">
          <div className={`status-pill ${online ? 'online' : 'offline'}`} title="Real-time backend API connection">
            <span className="status-dot"></span>
            <span>{online ? 'Platform Online' : 'Connecting...'}</span>
          </div>

          {user ? (
            <div className="user-menu">
              <Link to={getDashboardPath()} className="profile-pill">
                <div className="avatar-circle">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="profile-info">
                  <span className="profile-name">{user.fullName?.split(' ')[0]}</span>
                  <span className="profile-role">{getRoleLabel()}</span>
                </div>
              </Link>
              <button
                className="btn-logout"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-secondary">Log In</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
