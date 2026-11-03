import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, MapPinIcon, ShieldCheckIcon } from '../icons/Icons';

export default function VehicleCard({ vehicle, onBook }) {
  const apiOrigin = (import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8081/api/v1`).replace('/api/v1', '');
  const imageUrl = vehicle.image_url
    ? vehicle.image_url.startsWith('http')
      ? vehicle.image_url
      : `${apiOrigin}${vehicle.image_url}`
    : null;

  const pretty = (val) => String(val || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const formatInr = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);

  return (
    <article className="vehicle-card-modern">
      <div className="card-media-wrapper">
        {imageUrl ? (
          <img src={imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="vehicle-img" />
        ) : (
          <div className="vehicle-img-empty">
            <span>{pretty(vehicle.vehicle_type)}</span>
          </div>
        )}
        <div className="card-top-badges">
          <span className="badge-category">{pretty(vehicle.vehicle_type)}</span>
          {vehicle.delivery_supported && (
            <span className="badge-delivery">Doorstep Delivery</span>
          )}
        </div>
      </div>

      <div className="card-content">
        <div className="card-header-row">
          <h3 className="vehicle-title">{vehicle.make} {vehicle.model}</h3>
          <div className="vehicle-rating">
            <StarIcon className="w-4 h-4 text-amber" />
            <span>{Number(vehicle.review_count) > 0 ? Number(vehicle.rating).toFixed(1) : 'New'}</span>
            {Number(vehicle.review_count) > 0 && (
              <span className="review-count">({vehicle.review_count})</span>
            )}
          </div>
        </div>

        <div className="vehicle-specs-row">
          <span>{pretty(vehicle.transmission)}</span>
          <span className="dot">•</span>
          <span>{pretty(vehicle.fuel_type)}</span>
          <span className="dot">•</span>
          <span>{vehicle.seats} Seats</span>
          {vehicle.driver_supported && (
            <>
              <span className="dot">•</span>
              <span className="chauffeur-tag">Driver Available</span>
            </>
          )}
        </div>

        <div className="shop-location-row">
          <div className="shop-name">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald" />
            <span>{vehicle.business_name || 'Verified Rental Shop'}</span>
          </div>
          <div className="shop-city">
            <MapPinIcon className="w-3.5 h-3.5 text-muted" />
            <span>{vehicle.city}</span>
          </div>
        </div>

        <div className="card-footer-pricing">
          <div className="price-stack">
            <div className="price-main">
              <strong>{formatInr(vehicle.daily_rate)}</strong>
              <span>/ day</span>
            </div>
            <div className="price-sub">
              {formatInr(vehicle.hourly_rate)} / hr · Dep: {formatInr(vehicle.security_deposit)}
            </div>
          </div>

          <div className="card-actions">
            <Link to={`/vehicles/${vehicle.id}`} className="btn-view-details">
              Specs
            </Link>
            <button
              className="btn-book-ride"
              onClick={() => onBook ? onBook(vehicle) : null}
            >
              Book Now →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
