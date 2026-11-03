import React from 'react';
import { Link } from 'react-router-dom';
import { CarIcon, ShieldCheckIcon, ClockIcon } from '../icons/Icons';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-col brand-col">
          <Link to="/" className="brand-logo footer-brand">
            <div className="brand-icon">
              <CarIcon className="w-5 h-5 text-white" />
            </div>
            <span className="brand-name">ride<span className="text-cyan">nexa</span></span>
          </Link>
          <p className="footer-tagline">
            Your Ride. Delivered. The next-generation multi-vendor vehicle rental marketplace connecting customers with verified local rental businesses.
          </p>
          <div className="trust-features">
            <div className="trust-item">
              <ShieldCheckIcon className="w-4 h-4 text-emerald" />
              <span>100% Verified Rental Owners</span>
            </div>
            <div className="trust-item">
              <ClockIcon className="w-4 h-4 text-cyan" />
              <span>15-Minute Grace Period on Returns</span>
            </div>
          </div>
        </div>

        <div className="footer-col">
          <h4>Explore Vehicles</h4>
          <ul>
            <li><Link to="/vehicles?type=CAR">Self-Drive Cars</Link></li>
            <li><Link to="/vehicles?type=SUV">Premium SUVs</Link></li>
            <li><Link to="/vehicles?type=SCOOTER">City Scooters & Activas</Link></li>
            <li><Link to="/vehicles?type=BIKE">Motorcycles</Link></li>
            <li><Link to="/vehicles?type=VAN">Vans & Travellers</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Portals & Workflows</h4>
          <ul>
            <li><Link to="/customer/dashboard">Customer Dashboard</Link></li>
            <li><Link to="/owner/register">Partner With Us (Register Shop)</Link></li>
            <li><Link to="/owner/dashboard">Rental Owner Console</Link></li>
            <li><Link to="/delivery/dashboard">Delivery Staff Desk</Link></li>
            <li><Link to="/driver/dashboard">Chauffeur Driver Portal</Link></li>
            <li><Link to="/admin/dashboard">Platform Admin</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Trust & Safety</h4>
          <ul>
            <li><a href="/#doorstep-usp">Doorstep Delivery Guarantee</a></li>
            <li><a href="/#how-it-works">Handover Licence Verification</a></li>
            <li><a href="/#pricing-policy">Transparent All-Inclusive Pricing</a></li>
            <li><a href="/#faq">Return Grace Period Policy</a></li>
            <li><Link to="/contact">24/7 Operations Support</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {new Date().getFullYear()} RideNexa Technologies Inc. Built for mobility, trust, and speed.</p>
          <div className="footer-links">
            <a href="#terms">Terms of Service</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#refund">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
