import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { CloseIcon, ClockIcon, MapPinIcon, ShieldCheckIcon } from '../icons/Icons';

export default function ReturnModal({ booking, onClose, onUpdated }) {
  const [returnMethod, setReturnMethod] = useState(booking.return_method || 'DOORSTEP_PICKUP');
  const [returnAddress, setReturnAddress] = useState(booking.pickup_address || booking.delivery_address || '');
  const [latePreview, setLatePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!booking) return;
    api.get(`/bookings/${booking.id}/late-fee-preview`)
      .then((res) => setLatePreview(res.data))
      .catch(() => {});
  }, [booking]);

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/bookings/${booking.id}/return-choice`, {
        returnMethod,
        returnAddress,
        requestedSlot: new Date().toISOString()
      });
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update return method.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="return-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="modal-eyebrow">RETURN MANAGEMENT</span>
            <h2>Select Vehicle Return Method</h2>
            <p className="modal-subtitle">
              Rental ending at <strong>{new Date(booking.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</strong>
            </p>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="return-form">
          <div className="return-options-grid">
            <label className={`return-option-box ${returnMethod === 'DOORSTEP_PICKUP' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="returnMethod"
                value="DOORSTEP_PICKUP"
                checked={returnMethod === 'DOORSTEP_PICKUP'}
                onChange={() => setReturnMethod('DOORSTEP_PICKUP')}
              />
              <div className="option-details">
                <strong>Doorstep Pickup</strong>
                <p>Our collection staff visits your address to inspect and retrieve the vehicle.</p>
                <span className="tag-recommended">Most Convenient</span>
              </div>
            </label>

            <label className={`return-option-box ${returnMethod === 'SHOP_RETURN' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="returnMethod"
                value="SHOP_RETURN"
                checked={returnMethod === 'SHOP_RETURN'}
                onChange={() => setReturnMethod('SHOP_RETURN')}
              />
              <div className="option-details">
                <strong>Return to Rental Shop</strong>
                <p>Drive the vehicle directly back to the partner shop by your scheduled end time.</p>
                <small className="shop-loc">{booking.shop_address || 'Partner Shop City Location'}</small>
              </div>
            </label>
          </div>

          {returnMethod === 'DOORSTEP_PICKUP' && (
            <div className="input-group">
              <label>Vehicle Handover Location for Collection</label>
              <input
                required
                value={returnAddress}
                onChange={(e) => setReturnAddress(e.target.value)}
                placeholder="Enter exact street address where vehicle is parked"
              />
            </div>
          )}

          <div className="grace-period-notice">
            <ClockIcon className="w-5 h-5 text-cyan" />
            <div>
              <strong>15-Minute Grace Period Included</strong>
              <p>
                You are granted a 15-minute grace period past your scheduled end time. If you request doorstep collection, you will never be charged for staff travel or arrival delays as long as the vehicle is ready at your selected time!
              </p>
            </div>
          </div>

          {latePreview && Number(latePreview.estimatedLateFee) > 0 && (
            <div className="late-fee-warning">
              <strong>Notice: Rental is past scheduled end time</strong>
              <p>
                Delay: {latePreview.delayMinutes} mins ({latePreview.billableHours} billable hrs). Estimated late fee: ₹{latePreview.estimatedLateFee}.
              </p>
            </div>
          )}

          {error && <p className="form-error-banner">{error}</p>}

          <div className="modal-actions-bar">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm-return" disabled={submitting}>
              {submitting ? 'Confirming...' : 'Confirm Return Arrangement →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
