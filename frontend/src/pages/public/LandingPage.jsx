import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo, Icon } from '../../components/icons/Icons';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Features without the word "capabilities"
  const features = [
    {
      tag: 'FEATURE 01',
      title: 'Doorstep Vehicle Delivery',
      desc: 'Select any vehicle from nearby shops and have it delivered directly to your doorstep, hotel, or office with live digital handover inspection.',
      bg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'
    },
    {
      tag: 'FEATURE 02',
      title: 'Verified Fleet Marketplace',
      desc: 'Every rental vendor is rigorously verified by our admin team before listing, ensuring certified vehicle fitness and safe document handling.',
      bg: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'
    },
    {
      tag: 'FEATURE 03',
      title: 'Transparent Hourly Rates',
      desc: 'Pay strictly for the hours you rent. Transparent pricing algorithms calculate real-time rates with zero hidden surge fees.',
      bg: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80'
    },
    {
      tag: 'FEATURE 04',
      title: 'Self-Drive & Chauffeur Options',
      desc: 'Experience pure driving freedom on your own terms, or select an experienced, background-checked professional chauffeur.',
      bg: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80'
    },
    {
      tag: 'FEATURE 05',
      title: 'Diverse Category Fleet',
      desc: 'From city bikes, scooters, sedans, luxury SUVs, to tempo travellers and minibuses — every journey requirement is covered.',
      bg: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80'
    },
    {
      tag: 'FEATURE 06',
      title: 'Effortless Return Collection',
      desc: 'When your trip finishes, the rental vendor collects the vehicle from your chosen location with immediate security deposit settlement.',
      bg: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80'
    }
  ];

  // How it works workflow cards (for continuous right-to-left marquee)
  const workflowSteps = [
    {
      step: 'STEP 01',
      title: 'Search & Select Vehicle',
      desc: 'Explore available verified cars and bikes in your city with transparent hourly prices.',
      bg: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80'
    },
    {
      step: 'STEP 02',
      title: 'Pick Dates & Delivery Spot',
      desc: 'Choose your rental hours, self-drive or chauffeur, and enter your exact delivery location.',
      bg: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80'
    },
    {
      step: 'STEP 03',
      title: 'Owner Confirmation',
      desc: 'The verified local rental shop confirms the vehicle and prepares it for dispatch.',
      bg: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80'
    },
    {
      step: 'STEP 04',
      title: 'Doorstep Delivery',
      desc: 'The vehicle is delivered directly to your doorstep with digital condition inspection.',
      bg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
    },
    {
      step: 'STEP 05',
      title: 'Ride & Doorstep Return',
      desc: 'Enjoy your ride. The rental shop collects the vehicle from your location when done.',
      bg: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80'
    }
  ];

  return (
    <div>
      {/* ── 1. NAVBAR (Learnova AI Style with Custom Logo) ── */}
      <nav className={`rn-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="rn-navbar-inner">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <BrandLogo subtitle="Rent. Ride. Return." />
          </Link>

          <div className="rn-nav-links">
            <a href="#home" className="rn-nav-link">Home</a>
            <a href="#features" className="rn-nav-link">Features</a>
            <a href="#how-it-works" className="rn-nav-link">How It Works</a>
            <a href="#about" className="rn-nav-link">About Us</a>
          </div>

          <div className="rn-nav-actions">
            <Link to="/login" className="btn-signin">Sign In</Link>
            <Link to="/register" className="btn-getstarted">
              Get Started <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO SECTION (Clear Group of Vehicles, Auto Zoom In / Zoom Out, No White Wash) ── */}
      <section className="rn-hero" id="home">
        {/* Background with cars & bikes group image and continuous Ken Burns zoom animation */}
        <div
          className="rn-hero-bg"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&q=85')"
          }}
        />
        {/* Clear, rich dark overlay so the vehicles show vividly without white cover */}
        <div className="rn-hero-overlay" />

        <div className="rn-hero-content">
          <h1 className="rn-hero-title">
            Rent Smarter. <span className="blue-text">Ride Better.</span><br />
            <span className="gold-text">Deliver Anywhere.</span>
          </h1>

          <p className="rn-hero-subtitle">
            An intelligent multi-vendor vehicle rental marketplace that connects you with verified local rental shops, offers transparent hourly rates, and delivers your chosen ride directly to your doorstep.
          </p>

          <div className="rn-hero-buttons">
            <Link to="/register" className="btn-hero-primary">
              Get Started Free <Icon name="arrow-right" size={18} color="#ffffff" />
            </Link>
            <a href="#how-it-works" className="btn-hero-secondary">
              Explore How It Works
            </a>
          </div>

          {/* Bottom Hero Feature Pills */}
          <div className="rn-hero-badges">
            <div className="rn-badge-pill">
              <Icon name="verified" size={16} color="#38bdf8" />
              <span>Doorstep Vehicle Delivery</span>
            </div>
            <div className="rn-badge-pill">
              <Icon name="verified" size={16} color="#38bdf8" />
              <span>Verified Fleet Marketplace</span>
            </div>
            <div className="rn-badge-pill">
              <Icon name="verified" size={16} color="#38bdf8" />
              <span>Flexible Hourly Rates</span>
            </div>
            <div className="rn-badge-pill">
              <Icon name="verified" size={16} color="#38bdf8" />
              <span>Self-Drive & Chauffeur</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES SECTION (Word "Capabilities" Removed) ── */}
      <section className="rn-features-section" id="features">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="section-tag-blue">ENGINEERED FOR VEHICLE FREEDOM</span>
            <h2 className="section-heading-dark">Intelligent Features That Move With You</h2>
            <p className="section-desc-center">
              RideNexa replaces rigid rental contracts with an evidence-driven vehicle rental loop that pinpoints your location, matches verified vendors, and guarantees doorstep delivery.
            </p>
          </div>

          <div className="rn-features-grid">
            {features.map((item, index) => (
              <div className="rn-feature-card" key={index}>
                <div
                  className="rn-feature-card-bg"
                  style={{ backgroundImage: `url('${item.bg}')` }}
                />
                <div className="rn-feature-card-overlay" />
                <div className="rn-feature-card-content">
                  <span className="rn-feature-card-tag">{item.tag}</span>
                  <h3 className="rn-feature-card-title">{item.title}</h3>
                  <p className="rn-feature-card-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS SECTION (Rich Color Combination in Background) ── */}
      <section className="rn-how-section" id="how-it-works">
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="section-tag-blue">SEAMLESS WORKFLOW</span>
          <h2 className="section-heading-dark">How RideNexa Works</h2>
          <p className="section-desc-center">
            From discovering nearby verified rental shops to receiving your keys at your doorstep, experience our 5-step seamless flow.
          </p>
        </div>

        {/* Continuous Right-to-Left Infinite Marquee */}
        <div className="rn-marquee-container">
          <div className="rn-marquee-track">
            {[...workflowSteps, ...workflowSteps].map((step, idx) => (
              <div className="rn-workflow-card" key={idx}>
                <div
                  className="rn-workflow-card-bg"
                  style={{ backgroundImage: `url('${step.bg}')` }}
                />
                <div className="rn-workflow-card-overlay" />
                <div className="rn-workflow-card-content">
                  <span className="rn-workflow-number">{step.step}</span>
                  <h3 className="rn-workflow-title">{step.title}</h3>
                  <p className="rn-workflow-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. ABOUT US SECTION ── */}
      <section className="rn-about-section" id="about">
        <div className="container">
          <div className="rn-about-grid">
            <div>
              <span className="section-tag-blue">ABOUT RIDENEXA</span>
              <h2 className="section-heading-dark">Empowering Mobility Across India</h2>
              <p style={{ color: 'var(--gray-mid)', fontSize: '1.05rem', lineHeight: '1.7' }}>
                RideNexa is India's premier multi-vendor vehicle rental marketplace connecting everyday customers with verified, independent rental businesses. We make vehicle rental completely effortless and transparent.
              </p>

              <div className="rn-checklist">
                <div className="rn-checklist-item">
                  <div className="rn-check-icon">
                    <Icon name="check" size={16} />
                  </div>
                  <div className="rn-checklist-text">
                    <strong>Direct Rental Shop Marketplace:</strong> Connect directly with local licensed vehicle providers with zero hidden middleman fees.
                  </div>
                </div>

                <div className="rn-checklist-item">
                  <div className="rn-check-icon">
                    <Icon name="check" size={16} />
                  </div>
                  <div className="rn-checklist-text">
                    <strong>Guaranteed Doorstep Delivery:</strong> Have your vehicle delivered to your doorstep and picked up when your journey concludes.
                  </div>
                </div>

                <div className="rn-checklist-item">
                  <div className="rn-check-icon">
                    <Icon name="check" size={16} />
                  </div>
                  <div className="rn-checklist-text">
                    <strong>Real-time Transparent Pricing:</strong> Pay strictly per hour or per day with live damage deposit tracking and digital inspection.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '36px' }}>
                <Link to="/register" className="btn-hero-primary">
                  Start Your Rental Journey <Icon name="arrow-right" size={18} color="#ffffff" />
                </Link>
              </div>
            </div>

            {/* Right Callout Box */}
            <div>
              <div className="rn-callout-box">
                <div className="rn-callout-icon">
                  <Icon name="shield" size={24} color="#ffffff" />
                </div>
                <div>
                  <h3 className="rn-callout-title">Private & Secure Rental Record</h3>
                  <p className="rn-callout-desc">
                    Your driving licenses, identity verifications, booking payments, and personal trip records are fully isolated and securely encrypted in MySQL.
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: '24px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  height: '240px',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80"
                  alt="Verified fleet"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FOOTER SECTION ── */}
      <footer className="rn-footer">
        <div className="container">
          <div className="rn-footer-grid">
            <div>
              <BrandLogo subtitle="Rent. Ride. Return." white={true} />
              <p className="rn-footer-desc">
                Rent Smarter. Ride Better. Achieve More. An intelligent multi-vendor vehicle rental marketplace generating transparent hourly plans, verified fleets, and doorstep deliveries.
              </p>
            </div>

            <div className="rn-footer-col">
              <h4>Navigation</h4>
              <div className="rn-footer-links">
                <a href="#home" className="rn-footer-link">Home</a>
                <a href="#features" className="rn-footer-link">Features</a>
                <a href="#how-it-works" className="rn-footer-link">How It Works</a>
                <a href="#about" className="rn-footer-link">About Us</a>
              </div>
            </div>

            <div className="rn-footer-col">
              <h4>Vehicle Fleets</h4>
              <div className="rn-footer-links">
                <Link to="/login" className="rn-footer-link">City Commuter Bikes</Link>
                <Link to="/login" className="rn-footer-link">Comfort Sedans</Link>
                <Link to="/login" className="rn-footer-link">Family SUVs & Vans</Link>
                <Link to="/login" className="rn-footer-link">Luxury Chauffeur</Link>
              </div>
            </div>

            {/* ONLY in footer: Rental Owner Register/Login & Admin Login */}
            <div className="rn-footer-col">
              <h4>Partners & Management</h4>
              <div className="rn-footer-links" style={{ gap: '10px' }}>
                <Link to="/owner/register" className="rn-partner-link">
                  <Icon name="key" size={16} /> Register as Rental Shop
                </Link>
                <Link to="/owner/login" className="rn-partner-link">
                  <Icon name="user" size={16} /> Rental Shop Login
                </Link>
                <Link to="/admin/login" className="rn-partner-link" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}>
                  <Icon name="settings" size={16} color="#fbbf24" /> Admin Portal
                </Link>
              </div>
            </div>
          </div>

          <div className="rn-footer-bottom">
            <span>© 2026 RideNexa – Your Multi-Vendor Vehicle Rental Marketplace. All rights reserved.</span>
            <span>Doorstep Delivery Excellence · Verified Fleet Marketplace</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
