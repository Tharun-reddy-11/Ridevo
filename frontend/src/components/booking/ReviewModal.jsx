import React, { useState } from 'react';
import api from '../../api/client';
import { CloseIcon, StarIcon } from '../icons/Icons';

export default function ReviewModal({ booking, onClose, onReviewed }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide a brief review describing your rental experience.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/reviews', {
        bookingId: booking.id,
        rating,
        comment: comment.trim()
      });
      onReviewed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="modal-eyebrow">VERIFIED CUSTOMER REVIEW</span>
            <h2>Rate Your Experience with {booking.make} {booking.model}</h2>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          <div className="star-picker-container">
            <label>Rating</label>
            <div className="stars-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <StarIcon className="w-7 h-7" />
                </button>
              ))}
              <span className="rating-label-text">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : 'Poor'}
              </span>
            </div>
          </div>

          <div className="input-group">
            <label>Your Review</label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the vehicle condition, delivery punctuality, and handover process?"
              maxLength={1000}
            />
          </div>

          {error && <p className="form-error-banner">{error}</p>}

          <div className="modal-actions-bar">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-review" disabled={submitting}>
              {submitting ? 'Submitting Review...' : 'Publish Verified Review →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
