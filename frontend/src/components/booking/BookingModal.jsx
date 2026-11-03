import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import api from '../../api/client';
import { CloseIcon, ShieldCheckIcon, ClockIcon } from '../icons/Icons';

export default function BookingModal({ vehicle, onClose, onBooked }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    startAt: defaultStart,
    endAt: defaultEnd,
    pickupAddress: user?.city ? `${user.city} City Center` : '',
    destinationAddress: '',
    deliveryMethod: 'DOORSTEP',
    returnMethod: 'DOORSTEP_PICKUP',
    driverRequired: false,
  });

  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-calculate quote whenever dates or delivery methods change
  useEffect(() => {
    if (!vehicle || !form.startAt || !form.endAt) return;
    setLoadingQuote(true);
    api.post('/bookings/quote', {
      vehicleId: vehicle.id,
      startAt: form.startAt,
      endAt: form.endAt,
      deliveryMethod: form.deliveryMethod,
      driverRequired: form.driverRequired
    })
      .then((res) => setQuote(res.data))
      .catch(() => setQuote(null))
      .finally(() => setLoadingQuote(false));
  }, [vehicle, form.startAt, form.endAt, form.deliveryMethod, form.driverRequired]);

  if (!vehicle) return null;

  const formatInr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'CUSTOMER') {
      setError('Only registered customers can book vehicles.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/customer/bookings', {
        vehicleId: vehicle.id,
        startAt: form.startAt,
        endAt: form.endAt,
        deliveryMethod: form.deliveryMethod,
        returnMethod: form.returnMethod,
        rentalMode: form.driverRequired ? 'WITH_DRIVER' : 'SELF_DRIVE',
        pickupAddress: form.pickupAddress,
        destinationAddress: form.destinationAddress || form.pickupAddress,
        driverRequired: form.driverRequired
      });

      onBooked();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit booking request. Please check availability.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="modal-eyebrow">RESERVATION REQUEST</span>
            <h2>Book {vehicle.make} {vehicle.model}</h2>
            <p className="modal-subtitle">
              Listed by <strong>{vehicle.business_name || 'Verified Partner'}</strong> in {vehicle.city}
            </p>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="booking-form-grid">
          <div className="form-column">
            <div className="input-group">
              <label>Pickup / Delivery Address (Street / Landmark)</label>
              <input
                required
                value={form.pickupAddress}
                onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                placeholder="e.g. 14-2-12, Gandhi Road, Tirupati"
              />
            </div>

            <div className="input-group">
              <label>Destination / Area of Travel</label>
              <input
                required
                value={form.destinationAddress}
                onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })}
                placeholder="e.g. Tirumala / Local City Travel"
              />
            </div>

            <div className="time-grid">
              <div className="input-group">
                <label>Rental Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Rental End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                />
              </div>
            </div>

            <div className="selection-row">
              <div className="input-group">
                <label>Handover Method</label>
                <select
                  value={form.deliveryMethod}
                  onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
                >
                  <option value="DOORSTEP">Doorstep Delivery (We bring vehicle to you)</option>
                  <option value="SHOP_PICKUP">Collect from Rental Shop</option>
                </select>
              </div>

              <div className="input-group">
                <label>Preferred Return Method</label>
                <select
                  value={form.returnMethod}
                  onChange={(e) => setForm({ ...form, returnMethod: e.target.value })}
                >
                  <option value="DOORSTEP_PICKUP">Doorstep Pickup (Worker collects vehicle)</option>
                  <option value="SHOP_RETURN">Return to Rental Shop</option>
                </select>
              </div>
            </div>

            {vehicle.driver_supported && (
              <label className="checkbox-control">
                <input
                  type="checkbox"
                  checked={form.driverRequired}
                  onChange={(e) => setForm({ ...form, driverRequired: e.target.checked })}
                />
                <span>Request Professional Chauffeur Driver (+₹400/hr)</span>
              </label>
            )}
          </div>

          <div className="quote-summary-column">
            <h4>Live Transparent Quote</h4>
            {loadingQuote ? (
              <div className="quote-loading">Calculating all-inclusive quote...</div>
            ) : quote ? (
              <div className="quote-breakdown">
                <div className="quote-row">
                  <span>Base Rental ({quote.totalHours} hrs / {quote.totalDays} days)</span>
                  <strong>{formatInr(quote.rentalAmount)}</strong>
                </div>
                <div className="quote-row muted">
                  <span>Included GST (18%)</span>
                  <span>{formatInr(quote.includedGst)} (Included)</span>
                </div>
                <div className="quote-row muted">
                  <span>Included FASTag / Toll Allocation</span>
                  <span>{formatInr(quote.includedToll)} (Included)</span>
                </div>
                {Number(quote.deliveryFee) > 0 && (
                  <div className="quote-row">
                    <span>Doorstep Delivery Charge</span>
                    <span>{formatInr(quote.deliveryFee)}</span>
                  </div>
                )}
                {Number(quote.driverFee) > 0 && (
                  <div className="quote-row">
                    <span>Chauffeur Service</span>
                    <span>{formatInr(quote.driverFee)}</span>
                  </div>
                )}
                {Number(quote.securityDeposit) > 0 && (
                  <div className="quote-row deposit-row">
                    <span>Refundable Security Deposit</span>
                    <span>{formatInr(quote.securityDeposit)}</span>
                  </div>
                )}
                <div className="quote-divider"></div>
                <div className="quote-total-row">
                  <div>
                    <strong>Total Handover Payable</strong>
                    <small>Pay via Razorpay / UPI when vehicle arrives</small>
                  </div>
                  <strong className="total-number">{formatInr(quote.totalPayableAtHandover)}</strong>
                </div>
              </div>
            ) : (
              <div className="quote-placeholder">Select rental dates to calculate exact price</div>
            )}

            <div className="handover-reassurance">
              <ShieldCheckIcon className="w-4 h-4 text-emerald" />
              <span>Physical driving licence inspected at vehicle handover. No licence upload required now.</span>
            </div>

            {error && <p className="form-error-banner">{error}</p>}

            <button type="submit" className="btn-confirm-booking" disabled={submitting}>
              {submitting ? 'Submitting Request...' : user ? 'Confirm Booking Request →' : 'Sign In to Request Ride →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
