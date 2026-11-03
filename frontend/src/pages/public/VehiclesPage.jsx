import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import VehicleCard from '../../components/vehicle/VehicleCard';
import BookingModal from '../../components/booking/BookingModal';
import NexaChatWidget from '../../components/ai/NexaChatWidget';
import { MapPinIcon, CarIcon, SparklesIcon } from '../../components/icons/Icons';

export default function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [start, setStart] = useState(searchParams.get('start') || '');
  const [end, setEnd] = useState(searchParams.get('end') || '');
  const [sortBy, setSortBy] = useState('recommended');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);

  const loadVehicles = async (overrideCity = city, overrideType = type) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (overrideCity) params.city = overrideCity;
      if (overrideType) params.type = overrideType;
      if (start) params.start = start;
      if (end) params.end = end;

      const res = await api.get('/public/vehicles', { params });
      let list = res.data;

      if (sortBy === 'price_asc') {
        list.sort((a, b) => Number(a.daily_rate) - Number(b.daily_rate));
      } else if (sortBy === 'price_desc') {
        list.sort((a, b) => Number(b.daily_rate) - Number(a.daily_rate));
      } else if (sortBy === 'rating') {
        list.sort((a, b) => Number(b.rating) - Number(a.rating));
      }

      setVehicles(list);
    } catch (err) {
      setError('Unable to load vehicles. Please verify system connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qCity = searchParams.get('city') || '';
    const qType = searchParams.get('type') || '';
    setCity(qCity);
    setType(qType);
    loadVehicles(qCity, qType);
  }, [searchParams]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city) p.set('city', city);
    if (type) p.set('type', type);
    if (start) p.set('start', start);
    if (end) p.set('end', end);
    setSearchParams(p);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        // Load with coords
        api.get('/public/vehicles', {
          params: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        })
          .then((res) => setVehicles(res.data))
          .catch(() => loadVehicles());
      },
      () => {
        setGeoLocating(false);
        setError('Location permission denied. Please enter your city manually.');
      }
    );
  };

  return (
    <div className="vehicles-page-layout">
      <Header />

      <main className="vehicles-main site-container">
        {/* Top Header & Search Bar */}
        <div className="browse-top-bar">
          <div>
            <span className="eyebrow">LIVE MARKETPLACE</span>
            <h1>Explore Available Fleet</h1>
            <p>Every vehicle listed is individually verified and ready for doorstep handover</p>
          </div>

          <button className="btn-use-location" onClick={handleUseLocation} disabled={geoLocating}>
            <MapPinIcon className="w-4 h-4 text-cyan" />
            {geoLocating ? 'Locating...' : 'Use My Current Location'}
          </button>
        </div>

        {/* Filter Toolbar */}
        <form className="filter-toolbar-card" onSubmit={handleFilterSubmit}>
          <div className="filter-input-wrap">
            <MapPinIcon className="w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Filter by city (e.g. Tirupati)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="filter-input-wrap">
            <CarIcon className="w-4 h-4 text-muted" />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All Categories</option>
              <option value="CAR">Cars</option>
              <option value="SUV">SUVs</option>
              <option value="SCOOTER">Scooters</option>
              <option value="BIKE">Bikes</option>
              <option value="VAN">Vans</option>
            </select>
          </div>

          <div className="filter-input-wrap">
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              title="Pickup time"
            />
          </div>

          <div className="filter-input-wrap">
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              title="Return time"
            />
          </div>

          <button type="submit" className="btn-filter-apply">
            Apply Filters
          </button>
        </form>

        {/* Sort and Count Row */}
        <div className="results-control-row">
          <div className="results-count">
            <strong>{vehicles.length}</strong> vehicles available
            {city && <span> in <strong>{city}</strong></span>}
          </div>

          <div className="sort-dropdown-wrap">
            <label>Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                loadVehicles();
              }}
            >
              <option value="recommended">AI / Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {error && <p className="form-error-banner">{error}</p>}

        {/* Grid */}
        {loading ? (
          <div className="loading-grid-skeleton">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        ) : vehicles.length > 0 ? (
          <div className="vehicles-grid">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onBook={(item) => setSelectedVehicle(item)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-results-box">
            <CarIcon className="w-16 h-16 text-muted" />
            <h3>No Available Vehicles Found</h3>
            <p>Try searching for a different city or removing date filters.</p>
            <button className="btn-secondary" onClick={() => { setCity(''); setType(''); loadVehicles('', ''); }}>
              Clear All Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
      <NexaChatWidget />

      {selectedVehicle && (
        <BookingModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onBooked={() => {
            setSelectedVehicle(null);
            navigate('/customer/dashboard');
          }}
        />
      )}
    </div>
  );
}
