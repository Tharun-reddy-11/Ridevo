import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import BookingModal from '../../components/booking/BookingModal';
import NexaChatWidget from '../../components/ai/NexaChatWidget';
import { StarIcon, MapPinIcon, ShieldCheckIcon, ClockIcon, KeyIcon } from '../../components/icons/Icons';

export default function VehicleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);

  const apiOrigin = (import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8081/api/v1`).replace('/api/v1', '');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/public/vehicles/${id}`),
      api.get(`/public/vehicles/${id}/reviews`).catch(() => ({ data: [] }))
    ])
      .then(([vRes, rRes]) => {
        setVehicle(vRes.data);
        setReviews(rRes.data);
      })
      .catch(() => setError('Vehicle listing not found or is currently unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatInr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  if (loading) {
    return (
      <div className="details-layout">
        <Header />
        <main className="site-container details-loading">Loading vehicle specifications...</main>
        <Footer />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="details-layout">
        <Header />
        <main className="site-container details-error">
          <p className="form-error-banner">{error || 'Vehicle not found.'}</p>
          <Link to="/vehicles" className="btn-primary">Browse Other Vehicles →</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const imageUrl = vehicle.image_url
    ? vehicle.image_url.startsWith('http')
      ? vehicle.image_url
      : `${apiOrigin}${vehicle.image_url}`
    : null;

  return (
    <div className="details-layout">
      <Header />

      <main className="vehicle-details-main site-container">
        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <Link to="/">Home</Link> <span>/</span>
          <Link to="/vehicles">Vehicles</Link> <span>/</span>
          <strong>{vehicle.make} {vehicle.model}</strong>
        </div>

        <div className="details-grid">
          {/* Left Column: Media & Specs */}
          <div className="details-left">
            <div className="media-hero-card">
              {imageUrl ? (
                <img src={imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="details-img" />
              ) : (
                <div className="details-img-empty">
                  <span>{vehicle.vehicle_type}</span>
                </div>
              )}
            </div>

            <div className="details-specs-card">
              <h3>Technical Specifications</h3>
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Category</span>
                  <strong>{vehicle.vehicle_type}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Transmission</span>
                  <strong>{vehicle.transmission}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Fuel Type</span>
                  <strong>{vehicle.fuel_type}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Seating Capacity</span>
                  <strong>{vehicle.seats} Passengers</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Registration</span>
                  <strong>{vehicle.registration_number}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Location</span>
                  <strong>{vehicle.city}</strong>
                </div>
              </div>

              {vehicle.description && (
                <div className="vehicle-desc-wrap">
                  <h4>Partner Notes & Condition</h4>
                  <p>{vehicle.description}</p>
                </div>
              )}
            </div>

            {/* Verified Customer Reviews */}
            <div className="details-reviews-card">
              <div className="reviews-header-row">
                <h3>Verified Customer Reviews ({reviews.length})</h3>
                <div className="rating-pill">
                  <StarIcon className="w-4 h-4 text-amber" />
                  <strong>{Number(vehicle.rating).toFixed(1)}</strong>
                  <span>out of 5</span>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map((r) => (
                    <div key={r.id} className="review-item-card">
                      <div className="review-user-row">
                        <strong>{r.customer_name}</strong>
                        <div className="review-stars">
                          {[...Array(r.rating)].map((_, i) => (
                            <StarIcon key={i} className="w-3.5 h-3.5 text-amber" />
                          ))}
                        </div>
                      </div>
                      <p>{r.comment}</p>
                      <small className="review-date">{new Date(r.created_at).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-reviews-text">No reviews yet for this vehicle. Be the first to rent and rate it!</p>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Booking Action */}
          <div className="details-right">
            <div className="sticky-booking-card">
              <div className="pricing-headline">
                <div>
                  <span className="price-tag">{formatInr(vehicle.daily_rate)}</span>
                  <span className="price-unit">/ day</span>
                </div>
                <span className="hourly-rate-sub">{formatInr(vehicle.hourly_rate)} / hour</span>
              </div>

              <div className="badges-list">
                {vehicle.delivery_supported && (
                  <div className="feature-badge doorstep">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald" />
                    <span>Eligible for Doorstep Handover</span>
                  </div>
                )}
                {vehicle.driver_supported && (
                  <div className="feature-badge driver">
                    <KeyIcon className="w-4 h-4 text-indigo" />
                    <span>Chauffeur Driver Option Available</span>
                  </div>
                )}
                <div className="feature-badge grace">
                  <ClockIcon className="w-4 h-4 text-cyan" />
                  <span>15-Minute Return Grace Period</span>
                </div>
              </div>

              <div className="partner-shop-info">
                <span className="label-tiny">HOSTED BY</span>
                <h4>{vehicle.business_name || 'Verified Rental Partner'}</h4>
                <div className="shop-city-row">
                  <MapPinIcon className="w-4 h-4 text-muted" />
                  <span>{vehicle.city}</span>
                </div>
              </div>

              <div className="inclusive-pricing-breakdown">
                <h4>What's Included:</h4>
                <ul>
                  <li>✓ 100% Applicable GST Taxes Bundled</li>
                  <li>✓ FASTag / Toll Allocation Provisions</li>
                  <li>✓ Transparent Deposit: {formatInr(vehicle.security_deposit)}</li>
                  <li>✓ Pay via Razorpay / UPI at Delivery</li>
                </ul>
              </div>

              <button className="btn-primary btn-block-lg" onClick={() => setBookingOpen(true)}>
                Book This Ride Now →
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <NexaChatWidget />

      {bookingOpen && (
        <BookingModal
          vehicle={vehicle}
          onClose={() => setBookingOpen(false)}
          onBooked={() => {
            setBookingOpen(false);
            navigate('/customer/dashboard');
          }}
        />
      )}
    </div>
  );
}
